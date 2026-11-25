//// ASCII lidar maze: depth-colored vertical scan lines (accumulate on rescan).

import gleam/dict
import gleam/dynamic/decode
import gleam/float
import gleam/int
import gleam/json
import gleam/list
import gleam/string
import shape.{type Path, ColorLine, Path, Point}

/// `.` floor, `|`/`_` walls, `E` exit on the outer edge (walkable; green on scan).
pub const default_ascii = "___________________
|.................|
|._____._____.___.|
|.....|.......|...|
|.___...__.__..._.|
|...|.......|.....|
|._...___._...___.|
|...|.....|.......|
|._____._...___.__|
|.................E
|_________________|
"

const min_scan_rays = 36
/// ~3× the previous cap so Density=100 sprays a very dense fan.
const max_scan_rays = 840
const max_ray_dist = 14.0
const step_eps = 0.025
const fov = 1.05
const tau = 6.283185307179586
const move_step = 0.18
const turn_step = 0.12
const mouse_sens = 0.0025
const wall_height = 1.0
const focal = 480.0
const cloud_quantize = 0.08
const max_memory_points = 8_000

@external(javascript, "./render_ffi.mjs", "cos")
fn cos(x: Float) -> Float

@external(javascript, "./render_ffi.mjs", "sin")
fn sin(x: Float) -> Float

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
  /// Wall hit in world space; rendered as a vertical depth line.
  ScanPoint(x: Float, y: Float, z: Float, depth: Float, is_exit: Bool)
}

type Maybe(a) {
  Just(a)
  Nothing
}

type Hit {
  Hit(distance: Float, wx: Float, wy: Float, is_exit: Bool)
}

// ── Maze ──────────────────────────────────────────────────────────────────────

pub fn parse_maze(text: String) -> Maze {
  let rows =
    string.split(text, "\n")
    |> list.map(fn(line) {
      string.to_graphemes(line) |> list.map(parse_cell)
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

/// `E` must exist and every exit must lie on the outer border.
pub fn validate_maze(maze: Maze) -> Result(Nil, String) {
  let exits = list_exits(maze)
  case exits {
    [] -> Error("Add an E exit on the outer edge of the map.")
    _ ->
      case list.all(exits, fn(p) { is_edge_cell(maze, p) }) {
        True -> Ok(Nil)
        False ->
          Error(
            "E must be on the map edge (first/last row or first/last column).",
          )
      }
  }
}

fn list_exits(maze: Maze) -> List(#(Int, Int)) {
  list_exits_rows(maze.cells, 0, [])
}

fn list_exits_rows(
  rows: List(List(Cell)),
  y: Int,
  acc: List(#(Int, Int)),
) -> List(#(Int, Int)) {
  case rows {
    [] -> list.reverse(acc)
    [row, ..rest] ->
      list_exits_rows(rest, y + 1, list_exits_cols(row, 0, y, acc))
  }
}

fn list_exits_cols(
  cols: List(Cell),
  x: Int,
  y: Int,
  acc: List(#(Int, Int)),
) -> List(#(Int, Int)) {
  case cols {
    [] -> acc
    [cell, ..rest] ->
      case cell {
        Exit -> list_exits_cols(rest, x + 1, y, [#(x, y), ..acc])
        _ -> list_exits_cols(rest, x + 1, y, acc)
      }
  }
}

fn is_edge_cell(maze: Maze, cell: #(Int, Int)) -> Bool {
  let #(col, row) = cell
  row == 0
  || row == maze.rows - 1
  || col == 0
  || col == maze.cols - 1
}

/// Map density slider 0..100 → ray count for one spray.
pub fn ray_count(density: Int) -> Int {
  let t = int.clamp(density, 0, 100)
  min_scan_rays + t * { max_scan_rays - min_scan_rays } / 100
}

/// Grid indices for the cell the player is standing in (col, row).
pub fn player_cell(player: Player) -> #(Int, Int) {
  #(float.truncate(player.x), float.truncate(player.y))
}

/// Character currently under the player in the maze source (`.` `|` `_` `E` …).
pub fn cell_char(maze: Maze, col: Int, row: Int) -> String {
  case cell_at(maze, col, row) {
    Open -> "."
    Wall ->
      case row == 0 || row == maze.rows - 1 {
        True -> "_"
        False -> "|"
      }
    Exit -> "E"
  }
}

/// Compact facing arrow from player angle (0 = +x / east).
pub fn facing_arrow(angle: Float) -> String {
  let a = wrap_angle(angle)
  case a <. 0.3927 {
    True -> "→"
    False ->
      case a <. 1.1781 {
        True -> "↘"
        False ->
          case a <. 1.9635 {
            True -> "↓"
            False ->
              case a <. 2.7489 {
                True -> "↙"
                False ->
                  case a <. 3.5343 {
                    True -> "←"
                    False ->
                      case a <. 4.3197 {
                        True -> "↖"
                        False ->
                          case a <. 5.1051 {
                            True -> "↑"
                            False ->
                              case a <. 5.8905 {
                                True -> "↗"
                                False -> "→"
                              }
                          }
                      }
                  }
              }
          }
      }
  }
}

/// Copy of the ASCII maze with `@` stamped on the player's cell.
pub fn map_with_player(text: String, player: Player) -> String {
  let #(col, row) = player_cell(player)
  let lines = string.split(text, "\n")
  list.index_map(lines, fn(line, y) {
    case y == row {
      False -> line
      True -> stamp_col(line, col, "@")
    }
  })
  |> string.join("\n")
}

fn stamp_col(line: String, col: Int, ch: String) -> String {
  let chars = string.to_graphemes(line)
  case col < 0 || col >= list.length(chars) {
    True -> line
    False ->
      list.index_map(chars, fn(c, i) {
        case i == col {
          True -> ch
          False -> c
        }
      })
      |> string.concat
  }
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
    _ ->
      list.find_map(ring_coords(cx, cy, radius), fn(p) {
        let #(x, y) = p
        case is_solid(maze, x, y) {
          False -> Ok(#(x, y))
          True -> Error(Nil)
        }
      })
      |> result_to_maybe
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

/// Walls (and exits) stop lidar rays so `E` still paints green.
pub fn is_solid(maze: Maze, gx: Int, gy: Int) -> Bool {
  case cell_at(maze, gx, gy) {
    Open -> False
    Wall | Exit -> True
  }
}

/// Only real walls block walking — you can step onto `E` to finish.
fn blocks_move(maze: Maze, gx: Int, gy: Int) -> Bool {
  case cell_at(maze, gx, gy) {
    Wall -> True
    Open | Exit -> False
  }
}

fn is_exit_cell(maze: Maze, gx: Int, gy: Int) -> Bool {
  case cell_at(maze, gx, gy) {
    Exit -> True
    _ -> False
  }
}

/// True when the player is standing on the exit cell.
pub fn at_exit(maze: Maze, player: Player) -> Bool {
  let #(col, row) = player_cell(player)
  is_exit_cell(maze, col, row)
}

// ── Movement ──────────────────────────────────────────────────────────────────

pub fn turn(player: Player, dir: Float) -> Player {
  Player(..player, angle: wrap_angle(player.angle +. dir *. turn_step))
}

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
  blocks_move(maze, float.truncate(x -. pad), float.truncate(y))
  || blocks_move(maze, float.truncate(x +. pad), float.truncate(y))
  || blocks_move(maze, float.truncate(x), float.truncate(y -. pad))
  || blocks_move(maze, float.truncate(x), float.truncate(y +. pad))
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

fn perp_dist(euclid: Float, ray_angle: Float, view_angle: Float) -> Float {
  float.max(euclid *. cos(ray_angle -. view_angle), 0.08)
}

// ── Raycast ───────────────────────────────────────────────────────────────────

fn cast_ray(maze: Maze, ox: Float, oy: Float, angle: Float) -> Maybe(Hit) {
  cast_loop(maze, ox, oy, cos(angle), sin(angle), 0.0)
}

fn cast_loop(
  maze: Maze,
  x: Float,
  y: Float,
  dx: Float,
  dy: Float,
  dist: Float,
) -> Maybe(Hit) {
  case dist >. max_ray_dist {
    True -> Nothing
    False -> {
      let gx = float.truncate(x)
      let gy = float.truncate(y)
      case is_solid(maze, gx, gy) && dist >. 0.08 {
        True ->
          Just(Hit(dist, x, y, is_exit_cell(maze, gx, gy)))
        False ->
          cast_loop(
            maze,
            x +. dx *. step_eps,
            y +. dy *. step_eps,
            dx,
            dy,
            dist +. step_eps,
          )
      }
    }
  }
}

// ── Scan → wall hits (one vertical line each) ─────────────────────────────────

/// Spray rays across the FOV; `density` 0..100 controls how many rays fire.
pub fn scan(
  maze: Maze,
  player: Player,
  existing: List(ScanPoint),
  density: Int,
) -> List(ScanPoint) {
  let columns = int.max(ray_count(density), 2)
  let fresh =
    range_map(0, columns - 1, fn(i) {
      let u = int.to_float(i) /. int.to_float(columns - 1)
      let jitter =
        { float.random() -. 0.5 }
        *. { fov /. int.to_float(columns) }
        *. 2.0
      let ang = player.angle -. fov /. 2.0 +. u *. fov +. jitter
      case cast_ray(maze, player.x, player.y, ang) {
        Nothing -> []
        Just(hit) -> {
          let depth = perp_dist(hit.distance, ang, player.angle)
          [ScanPoint(hit.wx, hit.wy, 0.5, depth, hit.is_exit)]
        }
      }
    })
    |> list.flatten
  merge_cloud(existing, fresh)
}

fn cloud_key(p: ScanPoint) -> String {
  let qx = float.truncate(p.x /. cloud_quantize)
  let qy = float.truncate(p.y /. cloud_quantize)
  int.to_string(qx) <> "," <> int.to_string(qy)
}

fn merge_cloud(
  existing: List(ScanPoint),
  fresh: List(ScanPoint),
) -> List(ScanPoint) {
  let start =
    list.fold(existing, dict.new(), fn(acc, p) {
      dict.insert(acc, cloud_key(p), p)
    })
  let merged =
    list.fold(fresh, start, fn(acc, p) {
      case dict.get(acc, cloud_key(p)) {
        Ok(_) -> acc
        Error(_) -> dict.insert(acc, cloud_key(p), p)
      }
    })
    |> dict.values
  case list.length(merged) > max_memory_points {
    True -> list.take(list.reverse(merged), max_memory_points)
    False -> merged
  }
}

pub fn encode_memory(points: List(ScanPoint)) -> String {
  list.map(points, fn(p) {
    json.object([
      #("x", json.float(p.x)),
      #("y", json.float(p.y)),
      #("z", json.float(p.z)),
      #("d", json.float(p.depth)),
      #("e", json.bool(p.is_exit)),
    ])
  })
  |> json.preprocessed_array
  |> json.to_string
}

pub fn decode_memory(raw: String) -> List(ScanPoint) {
  let point = {
    use x <- decode.field("x", decode.float)
    use y <- decode.field("y", decode.float)
    use z <- decode.field("z", decode.float)
    use d <- decode.field("d", decode.float)
    use e <- decode.field("e", decode.bool)
    decode.success(ScanPoint(x, y, z, d, e))
  }
  case json.parse(raw, decode.list(point)) {
    Ok(points) -> points
    Error(_) -> []
  }
}

// ── Render: vertical depth lines only (+ crosshair) ───────────────────────────

pub fn render_frame(
  _maze: Maze,
  player: Player,
  points: List(ScanPoint),
  _pulse: Bool,
) -> List(Path) {
  list.append(project_lines(player, points), crosshair())
}

fn project_lines(player: Player, points: List(ScanPoint)) -> List(Path) {
  list.map(points, fn(p) {
    case project_wall(player, p) {
      Nothing -> []
      Just(#(sx, half_h, thick)) -> {
        let #(r, g, b) = depth_color(p)
        [
          Path(
            ColorLine(Point(sx, 0.0 -. half_h), Point(sx, half_h), r, g, b),
            0.0,
            0.0,
            thick,
          ),
        ]
      }
    }
  })
  |> list.flatten
}

/// Perspective: wall hit → screen x + half-height of the vertical strip.
fn project_wall(
  player: Player,
  p: ScanPoint,
) -> Maybe(#(Float, Float, Float)) {
  let dx = p.x -. player.x
  let dy = p.y -. player.y
  let forward = dx *. cos(player.angle) +. dy *. sin(player.angle)
  case forward <. 0.12 || forward >. max_ray_dist {
    True -> Nothing
    False -> {
      let right = 0.0 -. dx *. sin(player.angle) +. dy *. cos(player.angle)
      let sx = right /. forward *. focal
      case float.absolute_value(sx) >. 520.0 {
        True -> Nothing
        False -> {
          let half_h = wall_height /. forward *. focal *. 0.5
          let thick = float.max(1.2, 4.5 /. forward)
          Just(#(sx, float.min(half_h, 480.0), thick))
        }
      }
    }
  }
}

/// Cyan near → deep blue far; exits green.
fn depth_color(p: ScanPoint) -> #(Int, Int, Int) {
  case p.is_exit {
    True -> #(40, 255, 110)
    False -> {
      let t = float.min(p.depth /. 10.0, 1.0)
      let r = float.truncate(40.0 *. { 1.0 -. t } +. 10.0 *. t)
      let g = float.truncate(220.0 *. { 1.0 -. t } +. 80.0 *. t)
      let b = float.truncate(255.0 *. { 1.0 -. 0.25 *. t })
      #(r, g, b)
    }
  }
}

fn crosshair() -> List(Path) {
  [
    Path(ColorLine(Point(-8.0, 0.0), Point(8.0, 0.0), 90, 90, 100), 0.0, 0.0, 1.2),
    Path(ColorLine(Point(0.0, -8.0), Point(0.0, 8.0), 90, 90, 100), 0.0, 0.0, 1.2),
  ]
}
