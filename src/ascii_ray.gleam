//// ASCII → m×n height grid → pseudo-3D raycast paths for the canvas.

import gleam/float
import gleam/int
import gleam/list
import gleam/string
import shape.{type Path, ColorLine, Path, Point}

/// Default city / block map shown when the ASCII panel is empty.
pub const default_ascii = "....##....
...####...
..######..
.########.
####..####
###....###
####..####
.########.
..######..
...####...
"

const screen_columns = 140
const max_steps = 48
const cell_size = 1.0
const wall_scale = 55.0
const fov = 1.0471975512
const tau = 6.283185307179586

@external(javascript, "./render_ffi.mjs", "cos")
fn cos(x: Float) -> Float

@external(javascript, "./render_ffi.mjs", "sin")
fn sin(x: Float) -> Float

type Hit {
  Hit(distance: Float, height: Int, side: Int)
}

type Maybe(a) {
  Just(a)
  Nothing
}

/// Split `text` on newlines into an m×n grid of heights (m rows, n columns).
/// Shorter rows are padded with 0 so every row has width n = max line length.
pub fn string_to_grid(text: String) -> List(List(Int)) {
  let rows =
    string.split(text, "\n")
    |> list.map(fn(line) {
      string.to_graphemes(line)
      |> list.map(char_height)
    })
  let width = list.fold(rows, 0, fn(w, row) { int.max(w, list.length(row)) })
  case width {
    0 -> [[0]]
    _ -> list.map(rows, fn(row) { pad_row(row, width) })
  }
}

fn pad_row(row: List(Int), width: Int) -> List(Int) {
  let missing = width - list.length(row)
  case missing <= 0 {
    True -> list.take(row, width)
    False -> list.append(row, list.repeat(0, missing))
  }
}

/// Map one character to a cell height. Digits 1–9 are that tall; `#` is a tall
/// wall; other non-space marks are medium; space / `.` are empty.
pub fn char_height(ch: String) -> Int {
  case ch {
    " " | "." -> 0
    "1" -> 1
    "2" -> 2
    "3" -> 3
    "4" -> 4
    "5" -> 5
    "6" -> 6
    "7" -> 7
    "8" -> 8
    "9" -> 9
    "#" | "@" | "*" -> 8
    "=" | "-" | "_" -> 3
    _ -> 5
  }
}

/// Raycast the height grid. `angle_slider` in 0..100 spins the camera.
pub fn raycast(grid: List(List(Int)), angle_slider: Int) -> List(Path) {
  let rows = list.length(grid)
  let cols = case grid {
    [row, ..] -> list.length(row)
    [] -> 1
  }
  let cam_x = int.to_float(cols) *. cell_size /. 2.0
  let cam_y = int.to_float(rows) *. cell_size /. 2.0
  let yaw = int.to_float(angle_slider) /. 100.0 *. tau +. 0.35
  columns(0, screen_columns - 1, fn(i) {
    let u = int.to_float(i) /. int.to_float(screen_columns - 1)
    let ray_angle = yaw -. fov /. 2.0 +. u *. fov
    case cast_ray(grid, cols, rows, cam_x, cam_y, ray_angle) {
      Nothing -> []
      Just(hit) -> [column_path(i, hit)]
    }
  })
  |> list.flatten
}

fn columns(from: Int, to: Int, f: fn(Int) -> List(Path)) -> List(List(Path)) {
  case from > to {
    True -> []
    False -> [f(from), ..columns(from + 1, to, f)]
  }
}

fn cast_ray(
  grid: List(List(Int)),
  cols: Int,
  rows: Int,
  ox: Float,
  oy: Float,
  angle: Float,
) -> Maybe(Hit) {
  let dx = cos(angle)
  let dy = sin(angle)
  cast_loop(grid, cols, rows, ox, oy, dx, dy, 0.0, 0)
}

fn cast_loop(
  grid: List(List(Int)),
  cols: Int,
  rows: Int,
  x: Float,
  y: Float,
  dx: Float,
  dy: Float,
  dist: Float,
  step: Int,
) -> Maybe(Hit) {
  case step >= max_steps {
    True -> Nothing
    False -> {
      let gx = float.truncate(x /. cell_size)
      let gy = float.truncate(y /. cell_size)
      case cell_at(grid, cols, rows, gx, gy) {
        h if h > 0 && dist >. 0.15 ->
          Just(Hit(
            distance: float.max(dist, 0.35),
            height: h,
            side: step % 2,
          ))
        _ ->
          cast_loop(
            grid,
            cols,
            rows,
            x +. dx *. 0.12,
            y +. dy *. 0.12,
            dx,
            dy,
            dist +. 0.12,
            step + 1,
          )
      }
    }
  }
}

fn cell_at(
  grid: List(List(Int)),
  cols: Int,
  rows: Int,
  gx: Int,
  gy: Int,
) -> Int {
  case gx < 0 || gy < 0 || gx >= cols || gy >= rows {
    True -> 0
    False ->
      case list.drop(grid, gy) {
        [row, ..] ->
          case list.drop(row, gx) {
            [h, ..] -> h
            [] -> 0
          }
        [] -> 0
      }
  }
}

fn column_path(i: Int, hit: Hit) -> Path {
  let x =
    -480.0 +. int.to_float(i) *. { 960.0 /. int.to_float(screen_columns) }
  let dist = hit.distance
  let h =
    float.min(
      int.to_float(hit.height) *. wall_scale /. float.max(dist, 0.45),
      420.0,
    )
  let shade = int.max(40, 230 - float.truncate(dist *. 28.0))
  let #(r, g, b) = case hit.side {
    0 -> #(shade, shade * 3 / 4, shade / 2)
    _ -> #(shade * 3 / 4, shade / 2, shade)
  }
  let t0 = i / 3
  Path(
    ColorLine(Point(x, 0.0 -. h), Point(x, h), r, g, b),
    int.to_float(t0),
    int.to_float(t0 + 8),
    3.0,
  )
}

/// Sketch the m×n occupancy grid as a small top-down inset (upper-left).
pub fn grid_overlay(grid: List(List(Int))) -> List(Path) {
  let rows = list.length(grid)
  let cols = case grid {
    [row, ..] -> list.length(row)
    [] -> 0
  }
  case cols == 0 || rows == 0 {
    True -> []
    False -> {
      let scale =
        float.min(
          180.0 /. int.to_float(cols),
          180.0 /. int.to_float(rows),
        )
      let origin_x = -470.0
      let origin_y = -470.0
      list.index_map(grid, fn(row, gy) {
        list.index_map(row, fn(h, gx) {
          case h {
            0 -> []
            _ -> {
              let x0 = origin_x +. int.to_float(gx) *. scale
              let y0 = origin_y +. int.to_float(gy) *. scale
              let x1 = x0 +. scale -. 1.0
              let y1 = y0 +. scale -. 1.0
              let shade = 80 + h * 18
              [
                Path(
                  ColorLine(Point(x0, y0), Point(x1, y0), shade, 200, 255),
                  0.0,
                  4.0,
                  2.0,
                ),
                Path(
                  ColorLine(Point(x1, y0), Point(x1, y1), shade, 200, 255),
                  0.0,
                  4.0,
                  2.0,
                ),
                Path(
                  ColorLine(Point(x1, y1), Point(x0, y1), shade, 200, 255),
                  0.0,
                  4.0,
                  2.0,
                ),
                Path(
                  ColorLine(Point(x0, y1), Point(x0, y0), shade, 200, 255),
                  0.0,
                  4.0,
                  2.0,
                ),
              ]
            }
          }
        })
        |> list.flatten
      })
      |> list.flatten
    }
  }
}

pub fn render_ascii(text: String, angle_slider: Int) -> List(Path) {
  let grid = string_to_grid(text)
  list.append(grid_overlay(grid), raycast(grid, angle_slider))
}
