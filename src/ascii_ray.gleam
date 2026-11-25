//// Top-down maze (`_ . |`) → explorable lidar raycast.
//// Wall strip lengths use continuous hit distance (not discrete cell steps).

import gleam/float
import gleam/int
import gleam/list
import gleam/string
import shape.{type Path, ColorLine, Path, Point}

/// Maze legend: `.` open floor, `|` and `_` solid walls.
pub const default_ascii = "___________________
|.................|
|.___._______.___.|
|...|.........|...|
|_|_|.___.___.|_|_|
|...|...|...|...|.|
|_|_|_|_|_|_|_|_|_|
|.......|.........|
|.___.__|__.___.__|
|.................|
|_________________|
"

const screen_columns = 160
const max_ray_dist = 14.0
const step_eps = 0.02
const wall_scale = 68.0
const fov = 1.15
const tau = 6.283185307179586
const move_step = 0.18
const turn_step = 0.12

@external(javascript, "./render_ffi.mjs", "cos")
fn cos(x: Float) -> Float

@external(javascript, "./render_ffi.mjs", "sin")
fn sin(x: Float) -> Float

pub type Maze {
  Maze(cells: List(List(Bool)), cols: Int, rows: Int)
}

pub type Player {
  Player(x: Float, y: Float, angle: Float)
}

pub type ScanPoint {
  /// A remembered lidar return in world space (on a wall surface).
  ScanPoint(x: Float, y: Float, strength: Float)
}

type Maybe(a) {
  Just(a)
  Nothing
}

type Hit {
  Hit(distance: Float, wx: Float, wy: Float, side: Int)
}

// ── Maze parse ────────────────────────────────────────────────────────────────

/// Split the ASCII maze into an m×n occupancy grid. `|` and `_` are walls;
/// `.` (and anything else) is open. Rows are padded to a common width.
pub fn parse_maze(text: String) -> Maze {
  let rows =
    string.split(text, "\n")
    |> list.map(fn(line) {
      string.to_graphemes(line)
      |> list.map(is_wall_char)
    })
  let width = list.fold(rows, 0, fn(w, row) { int.max(w, list.length(row)) })
  let cells = case width {
    0 -> [[True]]
    _ -> list.map(rows, fn(row) { pad_row(row, width) })
  }
  let rows_n = list.length(cells)
  let cols_n = case cells {
    [r, ..] -> list.length(r)
    [] -> 1
  }
  Maze(cells:, cols: cols_n, rows: rows_n)
}

fn is_wall_char(ch: String) -> Bool {
  case ch {
    "|" | "_" -> True
    _ -> False
  }
}

fn pad_row(row: List(Bool), width: Int) -> List(Bool) {
  let missing = width - list.length(row)
  case missing <= 0 {
    True -> list.take(row, width)
    False -> list.append(row, list.repeat(False, missing))
  }
}

pub fn maze_dims(maze: Maze) -> #(Int, Int) {
  #(maze.rows, maze.cols)
}

/// Spawn on the first open cell nearest the center.
pub fn spawn_player(maze: Maze) -> Player {
  let cx = int.to_float(maze.cols) /. 2.0
  let cy = int.to_float(maze.rows) /. 2.0
  case find_open(maze, float.truncate(cx), float.truncate(cy), 0) {
    Just(#(x, y)) ->
      Player(int.to_float(x) +. 0.5, int.to_float(y) +. 0.5, 0.0)
    Nothing -> Player(1.5, 1.5, 0.0)
  }
}

fn find_open(
  maze: Maze,
  x: Int,
  y: Int,
  radius: Int,
) -> Maybe(#(Int, Int)) {
  case radius > int.max(maze.cols, maze.rows) {
    True -> Nothing
    False ->
      case scan_ring(maze, x, y, radius) {
        Just(p) -> Just(p)
        Nothing -> find_open(maze, x, y, radius + 1)
      }
  }
}

fn scan_ring(
  maze: Maze,
  cx: Int,
  cy: Int,
  radius: Int,
) -> Maybe(#(Int, Int)) {
  case radius {
    0 ->
      case is_wall(maze, cx, cy) {
        False -> Just(#(cx, cy))
        True -> Nothing
      }
    _ -> {
      let coords = ring_coords(cx, cy, radius)
      list.find_map(coords, fn(p) {
        let #(x, y) = p
        case is_wall(maze, x, y) {
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

pub fn is_wall(maze: Maze, gx: Int, gy: Int) -> Bool {
  case gx < 0 || gy < 0 || gx >= maze.cols || gy >= maze.rows {
    True -> True
    False ->
      case list.drop(maze.cells, gy) {
        [row, ..] ->
          case list.drop(row, gx) {
            [w, ..] -> w
            [] -> True
          }
        [] -> True
      }
  }
}

// ── Movement ──────────────────────────────────────────────────────────────────

pub fn turn(player: Player, dir: Float) -> Player {
  Player(..player, angle: wrap_angle(player.angle +. dir *. turn_step))
}

pub fn move(player: Player, maze: Maze, forward: Float) -> Player {
  let nx = player.x +. cos(player.angle) *. forward *. move_step
  let ny = player.y +. sin(player.angle) *. forward *. move_step
  // Slide along walls: try full, then x-only, then y-only.
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
  is_wall(maze, float.truncate(x -. pad), float.truncate(y))
  || is_wall(maze, float.truncate(x +. pad), float.truncate(y))
  || is_wall(maze, float.truncate(x), float.truncate(y -. pad))
  || is_wall(maze, float.truncate(x), float.truncate(y +. pad))
}

fn wrap_angle(a: Float) -> Float {
  let a = float.modulo(a, tau) |> result_unwrap(a)
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

// ── Continuous raycast ────────────────────────────────────────────────────────

/// Fine-step ray march so hit distance (and thus strip length) varies smoothly
/// as the player moves — not snapped to cell boundaries.
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
      case is_wall(maze, gx, gy) && dist >. 0.08 {
        True -> Just(Hit(distance: dist, wx: x, wy: y, side:))
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

/// Fire a dense fan of rays and keep continuous hit points (lidar returns).
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
          // Falloff by distance; closer hits read stronger.
          let strength = float.max(0.15, 1.0 -. hit.distance /. max_ray_dist)
          Just(ScanPoint(hit.wx, hit.wy, strength))
        }
      }
    })
    |> list.filter_map(fn(m) {
      case m {
        Just(p) -> Ok(p)
        Nothing -> Error(Nil)
      }
    })
  // Keep a trail of older pings (faded) so the map accumulates like a lidar game.
  let faded =
    list.map(existing, fn(p) {
      ScanPoint(..p, strength: p.strength *. 0.55)
    })
    |> list.filter(fn(p) { p.strength >. 0.08 })
  list.append(fresh, list.take(faded, 800))
}

// ── Rendering ─────────────────────────────────────────────────────────────────

/// Build the frame: almost nothing visible until you scan. Known lidar points
/// project into view as short stubs whose length scales continuously with range.
pub fn render_frame(
  maze: Maze,
  player: Player,
  points: List(ScanPoint),
  pulse: Bool,
) -> List(Path) {
  let view = project_points(player, points)
  let crosshair = crosshair_paths()
  let pulse_arcs = case pulse {
    True -> scan_pulse_arcs(player)
    False -> []
  }
  // Live continuous depth strips only during/just after a scan flash — otherwise
  // the world stays dark and you navigate from remembered returns.
  let live = case pulse {
    True -> live_depth_strips(maze, player)
    False -> []
  }
  list.flatten([crosshair, pulse_arcs, live, view, compass_pip(player)])
}

fn live_depth_strips(maze: Maze, player: Player) -> List(Path) {
  range_map(0, screen_columns - 1, fn(i) {
    let u = int.to_float(i) /. int.to_float(screen_columns - 1)
    let ang = player.angle -. fov /. 2.0 +. u *. fov
    case cast_ray(maze, player.x, player.y, ang) {
      Nothing -> []
      Just(hit) -> {
        // Continuous distance → continuous strip half-length (no height buckets).
        let dist = float.max(hit.distance, 0.12)
        let half = float.min(wall_scale /. dist, 430.0)
        let x =
          -480.0
          +. int.to_float(i) *. { 960.0 /. int.to_float(screen_columns) }
        let shade =
          int.max(30, float.truncate(220.0 *. { 1.0 -. dist /. max_ray_dist }))
        let #(r, g, b) = case hit.side {
          0 -> #(shade / 3, shade, shade)
          _ -> #(shade / 4, shade * 3 / 4, shade)
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
        [
          Path(
            ColorLine(
              Point(sx, 0.0 -. half),
              Point(sx, half),
              bright / 4,
              bright,
              bright,
            ),
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
  let dist = float.square_root(dx *. dx +. dy *. dy) |> result_unwrap(99.0)
  case dist <. 0.05 || dist >. max_ray_dist {
    True -> Nothing
    False -> {
      let world_ang = atan2(dy, dx)
      let rel = wrap_angle(world_ang -. player.angle +. tau /. 2.0) -. tau /. 2.0
      case float.absolute_value(rel) >. fov /. 2.0 +. 0.05 {
        True -> Nothing
        False -> {
          let u = rel /. fov +. 0.5
          let sx = -480.0 +. u *. 960.0
          let half =
            float.min(wall_scale /. float.max(dist, 0.12), 420.0) *. p.strength
          Just(#(sx, half, p.strength))
        }
      }
    }
  }
}

fn atan2(y: Float, x: Float) -> Float {
  // Two-arg arctangent via FFI.
  atan2_ffi(y, x)
}

@external(javascript, "./render_ffi.mjs", "atan2")
fn atan2_ffi(y: Float, x: Float) -> Float

fn crosshair_paths() -> List(Path) {
  [
    Path(ColorLine(Point(-12.0, 0.0), Point(12.0, 0.0), 40, 90, 90), 0.0, 1.0, 1.5),
    Path(ColorLine(Point(0.0, -12.0), Point(0.0, 12.0), 40, 90, 90), 0.0, 1.0, 1.5),
  ]
}

fn scan_pulse_arcs(_player: Player) -> List(Path) {
  // Expanding faint arc in view space to sell the ping.
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
      let x0 = cos(ang0) *. r
      let y0 = sin(ang0) *. r *. 0.35
      let x1 = cos(ang1) *. r
      let y1 = sin(ang1) *. r *. 0.35
      Path(
        ColorLine(Point(x0, y0), Point(x1, y1), 20, 120, 120),
        0.0,
        2.0,
        1.0,
      )
    })
  })
  |> list.flatten
}

fn compass_pip(player: Player) -> List(Path) {
  // Tiny top-down pip: player facing (maze-local), not a full map reveal.
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
