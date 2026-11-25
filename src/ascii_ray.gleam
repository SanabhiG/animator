//// Top-down maze (`_ . | E`) → explorable lidar raycast.
//// Distances use fisheye-corrected perpendicular depth so strip lengths stay smooth.

import gleam/float
import gleam/int
import gleam/list
import gleam/string
import shape.{type Path, ColorLine, Path, Point}

/// `.` floor, `|`/`_` walls, `E` exit (green).
pub const default_ascii = "___________________
|.................|
|.___._______.___.|
|...|.........|...|
|_|_|.___.___.|_|_|
|...|...|...|...|.|
|_|_|_|_|_|_|_|_|_|
|.......|.........|
|.___.__|__.___.__|
|..............E..|
|_________________|
"

const screen_columns = 160
const max_ray_dist = 14.0
const step_eps = 0.02
const wall_scale = 68.0
const fov = 1.0
const tau = 6.283185307179586
const move_step = 0.18
const turn_step = 0.12
const mouse_sens = 0.0025

@external(javascript, "./render_ffi.mjs", "cos")
fn cos(x: Float) -> Float

@external(javascript, "./render_ffi.mjs", "sin")
fn sin(x: Float) -> Float

@external(javascript, "./render_ffi.mjs", "atan2")
fn atan2_ffi(y: Float, x: Float) -> Float

pub type Cell {
  Open
  Wall
  Exit
}

pub type Maze {
  Maze(cells: List(List(Cell)), cols: Int, rows: Int)
}

pub type Player {
  Player(x: Float, y: Float, angle: Float)
}

pub type ScanPoint {
  ScanPoint(x: Float, y: Float, strength: Float, is_exit: Bool)
}

type Maybe(a) {
  Just(a)
  Nothing
}

type Hit {
  Hit(distance: Float, wx: Float, wy: Float, side: Int, is_exit: Bool)
}

// ── Maze parse ────────────────────────────────────────────────────────────────

pub fn parse_maze(text: String) -> Maze {
  let rows =
    string.split(text, "\n")
    |> list.map(fn(line) {
      string.to_graphemes(line)
      |> list.map(parse_cell)
    })
  let width = list.fold(rows, 0, fn(w, row) { int.max(w, list.length(row)) })
  let cells = case width {
    0 -> [[Wall]]
    _ -> list.map(rows, fn(row) { pad_row(row, width) })
  }
  let rows_n = list.length(cells)
  let cols_n = case cells {
    [r, ..] -> list.length(r)
    [] -> 1
  }
  Maze(cells:, cols: cols_n, rows: rows_n)
}

fn parse_cell(ch: String) -> Cell {
  case ch {
    "|" | "_" -> Wall
    "E" | "e" -> Exit
    _ -> Open
  }
}

fn pad_row(row: List(Cell), width: Int) -> List(Cell) {
  let missing = width - list.length(row)
  case missing <= 0 {
    True -> list.take(row, width)
    False -> list.append(row, list.repeat(Open, missing))
  }
}

pub fn maze_dims(maze: Maze) -> #(Int, Int) {
  #(maze.rows, maze.cols)
}

pub fn spawn_player(maze: Maze) -> Player {
  let cx = int.to_float(maze.cols) /. 2.0
  let cy = int.to_float(maze.rows) /. 2.0
  case find_open(maze, float.truncate(cx), float.truncate(cy), 0) {
    Just(#(x, y)) ->
      Player(int.to_float(x) +. 0.5, int.to_float(y) +. 0.5, 0.0)
    Nothing -> Player(1.5, 1.5, 0.0)
  }
}

fn find_open(maze: Maze, x: Int, y: Int, radius: Int) -> Maybe(#(Int, Int)) {
  case radius > int.max(maze.cols, maze.rows) {
    True -> Nothing
    False ->
      case scan_ring(maze, x, y, radius) {
        Just(p) -> Just(p)
        Nothing -> find_open(maze, x, y, radius + 1)
      }
  }
}

fn scan_ring(maze: Maze, cx: Int, cy: Int, radius: Int) -> Maybe(#(Int, Int)) {
  case radius {
    0 ->
      case is_solid(maze, cx, cy) {
        False -> Just(#(cx, cy))
        True -> Nothing
      }
    _ -> {
      let coords = ring_coords(cx, cy, radius)
      list.find_map(coords, fn(p) {
        let #(x, y) = p
        case is_solid(maze, x, y) {
          False -> Ok(#(x, y))
          True -> Error(Nil)
        }
      })
      |> result_to_maybe
    }
  }
}

fn result_to_maybe(r: Result(a, Nil)) -> Maybe(a) {
  case r {
    Ok(v) -> Just(v)
    Error(_) -> Nothing
  }
}

fn ring_coords(cx: Int, cy: Int, r: Int) -> List(#(Int, Int)) {
  list.flatten([
    range_map(0 - r, r, fn(dx) { #(cx + dx, cy - r) }),
    range_map(0 - r, r, fn(dx) { #(cx + dx, cy + r) }),
    range_map(0 - r + 1, r - 1, fn(dy) { #(cx - r, cy + dy) }),
    range_map(0 - r + 1, r - 1, fn(dy) { #(cx + r, cy + dy) }),
  ])
}

fn range_map(from: Int, to: Int, f: fn(Int) -> a) -> List(a) {
  case from > to {
    True -> []
    False -> [f(from), ..range_map(from + 1, to, f)]
  }
}

fn cell_at(maze: Maze, gx: Int, gy: Int) -> Cell {
  case gx < 0 || gy < 0 || gx >= maze.cols || gy >= maze.rows {
    True -> Wall
    False ->
      case list.drop(maze.cells, gy) {
        [row, ..] ->
          case list.drop(row, gx) {
            [c, ..] -> c
            [] -> Wall
          }
        [] -> Wall
      }
  }
}

pub fn is_solid(maze: Maze, gx: Int, gy: Int) -> Bool {
  case cell_at(maze, gx, gy) {
    Open -> False
    Wall | Exit -> True
  }
}

pub fn is_exit_cell(maze: Maze, gx: Int, gy: Int) -> Bool {
  case cell_at(maze, gx, gy) {
    Exit -> True
    _ -> False
  }
}

// ── Movement ──────────────────────────────────────────────────────────────────

pub fn turn(player: Player, dir: Float) -> Player {
  Player(..player, angle: wrap_angle(player.angle +. dir *. turn_step))
}

/// Mouse look: `dx` is horizontal pixels; positive looks right.
pub fn look_mouse(player: Player, dx: Float) -> Player {
  Player(..player, angle: wrap_angle(player.angle +. dx *. mouse_sens))
}

pub fn move(player: Player, maze: Maze, forward: Float) -> Player {
  let nx = player.x +. cos(player.angle) *. forward *. move_step
  let ny = player.y +. sin(player.angle) *. forward *. move_step
  case blocked(maze, nx, ny) {
    False -> Player(..player, x: nx, y: ny)
    True ->
      case blocked(maze, nx, player.y) {
        False -> Player(..player, x: nx)
        True ->
          case blocked(maze, player.x, ny) {
            False -> Player(..player, y: ny)
            True -> player
          }
      }
  }
}

fn blocked(maze: Maze, x: Float, y: Float) -> Bool {
  let pad = 0.18
  is_solid(maze, float.truncate(x -. pad), float.truncate(y))
  || is_solid(maze, float.truncate(x +. pad), float.truncate(y))
  || is_solid(maze, float.truncate(x), float.truncate(y -. pad))
  || is_solid(maze, float.truncate(x), float.truncate(y +. pad))
}

fn wrap_angle(a: Float) -> Float {
  let a = case float.modulo(a, tau) {
    Ok(v) -> v
    Error(_) -> a
  }
  case a <. 0.0 {
    True -> a +. tau
    False -> a
  }
}

fn result_unwrap(r: Result(Float, Nil), fallback: Float) -> Float {
  case r {
    Ok(v) -> v
    Error(_) -> fallback
  }
}

/// Classic fisheye fix: use depth along the camera forward axis.
fn perp_dist(euclid: Float, ray_angle: Float, view_angle: Float) -> Float {
  let rel = ray_angle -. view_angle
  float.max(euclid *. cos(rel), 0.08)
}

// ── Continuous raycast ────────────────────────────────────────────────────────

fn cast_ray(maze: Maze, ox: Float, oy: Float, angle: Float) -> Maybe(Hit) {
  let dx = cos(angle)
  let dy = sin(angle)
  cast_loop(maze, ox, oy, dx, dy, 0.0, 0)
}

fn cast_loop(
  maze: Maze,
  x: Float,
  y: Float,
  dx: Float,
  dy: Float,
  dist: Float,
  side: Int,
) -> Maybe(Hit) {
  case dist >. max_ray_dist {
    True -> Nothing
    False -> {
      let gx = float.truncate(x)
      let gy = float.truncate(y)
      case is_solid(maze, gx, gy) && dist >. 0.08 {
        True ->
          Just(Hit(
            distance: dist,
            wx: x,
            wy: y,
            side:,
            is_exit: is_exit_cell(maze, gx, gy),
          ))
        False -> {
          let nx = x +. dx *. step_eps
          let ny = y +. dy *. step_eps
          let next_side = case float.truncate(nx) != gx {
            True -> 0
            False -> 1
          }
          cast_loop(maze, nx, ny, dx, dy, dist +. step_eps, next_side)
        }
      }
    }
  }
}

// ── Lidar scan ────────────────────────────────────────────────────────────────

pub fn scan(
  maze: Maze,
  player: Player,
  existing: List(ScanPoint),
) -> List(ScanPoint) {
  let fresh =
    range_map(0, screen_columns - 1, fn(i) {
      let u = int.to_float(i) /. int.to_float(screen_columns - 1)
      let ang = player.angle -. fov /. 2.0 +. u *. fov
      case cast_ray(maze, player.x, player.y, ang) {
        Nothing -> Nothing
        Just(hit) -> {
          let depth = perp_dist(hit.distance, ang, player.angle)
          let strength = float.max(0.15, 1.0 -. depth /. max_ray_dist)
          Just(ScanPoint(hit.wx, hit.wy, strength, hit.is_exit))
        }
      }
    })
    |> list.filter_map(fn(m) {
      case m {
        Just(p) -> Ok(p)
        Nothing -> Error(Nil)
      }
    })
  let faded =
    list.map(existing, fn(p) { ScanPoint(..p, strength: p.strength *. 0.55) })
    |> list.filter(fn(p) { p.strength >. 0.08 })
  list.append(fresh, list.take(faded, 800))
}

// ── Rendering ─────────────────────────────────────────────────────────────────

pub fn render_frame(
  maze: Maze,
  player: Player,
  points: List(ScanPoint),
  pulse: Bool,
) -> List(Path) {
  list.flatten([
    floor_plane(player),
    crosshair_paths(),
    case pulse {
      True -> scan_pulse_arcs()
      False -> []
    },
    case pulse {
      True -> live_depth_strips(maze, player)
      False -> []
    },
    project_points(player, points),
    compass_pip(player),
  ])
}

/// Warm floor under the horizon — different color from cyan wall returns.
fn floor_plane(player: Player) -> List(Path) {
  // Perspective floor lines that shift slightly with yaw so motion reads.
  let yaw_shift = sin(player.angle) *. 40.0
  let rows =
    range_map(1, 18, fn(i) {
      let t = int.to_float(i) /. 18.0
      let y = 20.0 +. t *. t *. 480.0
      let half = 80.0 +. t *. 420.0
      let shade = 28 + float.truncate(t *. 50.0)
      Path(
        ColorLine(
          Point(0.0 -. half +. yaw_shift *. { 1.0 -. t }, y),
          Point(half +. yaw_shift *. { 1.0 -. t }, y),
          shade + 20,
          shade,
          shade / 2,
        ),
        0.0,
        1.0,
        1.2,
      )
    })
  let rays =
    range_map(0, 10, fn(i) {
      let u = int.to_float(i) /. 10.0 -. 0.5
      let x1 = u *. 920.0 +. yaw_shift *. 0.3
      Path(
        ColorLine(Point(u *. 40.0, 25.0), Point(x1, 500.0), 45, 32, 18),
        0.0,
        1.0,
        1.0,
      )
    })
  list.append(rows, rays)
}

fn live_depth_strips(maze: Maze, player: Player) -> List(Path) {
  range_map(0, screen_columns - 1, fn(i) {
    let u = int.to_float(i) /. int.to_float(screen_columns - 1)
    let ang = player.angle -. fov /. 2.0 +. u *. fov
    case cast_ray(maze, player.x, player.y, ang) {
      Nothing -> []
      Just(hit) -> {
        let dist = perp_dist(hit.distance, ang, player.angle)
        let half = float.min(wall_scale /. dist, 430.0)
        let x =
          -480.0
          +. int.to_float(i) *. { 960.0 /. int.to_float(screen_columns) }
        let shade =
          int.max(30, float.truncate(220.0 *. { 1.0 -. dist /. max_ray_dist }))
        let #(r, g, b) = case hit.is_exit {
          True -> #(40, int.min(255, shade + 80), 70)
          False ->
            case hit.side {
              0 -> #(shade / 3, shade, shade)
              _ -> #(shade / 4, shade * 3 / 4, shade)
            }
        }
        [
          Path(
            ColorLine(Point(x, 0.0 -. half), Point(x, half), r, g, b),
            0.0,
            3.0,
            float.max(1.5, 4.5 -. dist *. 0.25),
          ),
        ]
      }
    }
  })
  |> list.flatten
}

fn project_points(player: Player, points: List(ScanPoint)) -> List(Path) {
  list.index_map(points, fn(p, i) {
    case project_one(player, p) {
      Nothing -> []
      Just(#(sx, half, strength)) -> {
        let bright = float.truncate(180.0 *. strength)
        let t = int.to_float(i % 40) /. 10.0
        let #(r, g, b) = case p.is_exit {
          True -> #(30, int.min(255, bright + 70), 55)
          False -> #(bright / 4, bright, bright)
        }
        [
          Path(
            ColorLine(Point(sx, 0.0 -. half), Point(sx, half), r, g, b),
            t,
            t +. 6.0,
            float.max(1.0, 3.5 *. strength),
          ),
        ]
      }
    }
  })
  |> list.flatten
}

fn project_one(
  player: Player,
  p: ScanPoint,
) -> Maybe(#(Float, Float, Float)) {
  let dx = p.x -. player.x
  let dy = p.y -. player.y
  let euclid = float.square_root(dx *. dx +. dy *. dy) |> result_unwrap(99.0)
  case euclid <. 0.05 || euclid >. max_ray_dist {
    True -> Nothing
    False -> {
      let world_ang = atan2_ffi(dy, dx)
      let rel = wrap_angle(world_ang -. player.angle +. tau /. 2.0) -. tau /. 2.0
      case float.absolute_value(rel) >. fov /. 2.0 +. 0.05 {
        True -> Nothing
        False -> {
          let u = rel /. fov +. 0.5
          let sx = -480.0 +. u *. 960.0
          let dist = perp_dist(euclid, world_ang, player.angle)
          let half =
            float.min(wall_scale /. float.max(dist, 0.12), 420.0) *. p.strength
          Just(#(sx, half, p.strength))
        }
      }
    }
  }
}

fn crosshair_paths() -> List(Path) {
  [
    Path(ColorLine(Point(-12.0, 0.0), Point(12.0, 0.0), 40, 90, 90), 0.0, 1.0, 1.5),
    Path(ColorLine(Point(0.0, -12.0), Point(0.0, 12.0), 40, 90, 90), 0.0, 1.0, 1.5),
  ]
}

fn scan_pulse_arcs() -> List(Path) {
  range_map(1, 4, fn(k) {
    let r = int.to_float(k) *. 80.0
    let a0 = 0.0 -. fov /. 2.0
    let a1 = fov /. 2.0
    let steps = 24
    range_map(0, steps - 1, fn(i) {
      let t0 = int.to_float(i) /. int.to_float(steps)
      let t1 = int.to_float(i + 1) /. int.to_float(steps)
      let ang0 = a0 +. { a1 -. a0 } *. t0
      let ang1 = a0 +. { a1 -. a0 } *. t1
      Path(
        ColorLine(
          Point(cos(ang0) *. r, sin(ang0) *. r *. 0.35),
          Point(cos(ang1) *. r, sin(ang1) *. r *. 0.35),
          20,
          120,
          120,
        ),
        0.0,
        2.0,
        1.0,
      )
    })
  })
  |> list.flatten
}

fn compass_pip(player: Player) -> List(Path) {
  let ox = -450.0
  let oy = 420.0
  let fx = ox +. cos(player.angle) *. 28.0
  let fy = oy +. sin(player.angle) *. 28.0
  [
    Path(ColorLine(Point(ox, oy), Point(fx, fy), 80, 255, 200), 0.0, 2.0, 2.5),
    Path(
      ColorLine(Point(ox -. 4.0, oy), Point(ox +. 4.0, oy), 60, 180, 160),
      0.0,
      2.0,
      2.0,
    ),
  ]
}
