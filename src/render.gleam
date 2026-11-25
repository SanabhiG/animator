//// Convert each shape into a list of points called a RenderPath.

import gleam/float
import gleam/int
import gleam/list
import shape.{
  type Path, type Point, Circle, ColorCircle, ColorLine, Line, Point,
}

/// One path as canvas.mjs setDrawing consumes it (field by field): the
/// polyline, stroke colour/width, and the start and end times (in tenths of a second)
/// between which the reveal runs — so the renderer's clock needs no shape
/// knowledge.
pub type RenderPath {
  RenderPath(
    points: List(Point),
    thickness: Float,
    color: String,
    start: Float,
    end: Float,
  )
}

// ── The canvas (canvas.mjs) ───────────────────────────────────────────────────

/// Replace the drawing being animated in the page's
/// `<canvas id="animation-canvas">` element. If that element doesn't appear within
/// about 10 seconds, this logs an error to the browser console. This keeps the
/// current time, so a drawing that replaces a finished one appears complete. To
/// animate it from the start, also call reset_clock.
@external(javascript, "./canvas.mjs", "setDrawing")
pub fn set_drawing(paths: List(RenderPath)) -> Nil

/// Set the animation's speed, as a multiple of its normal speed: 1.0 is normal and
/// is where it starts, 0.0 pauses, and a negative rate plays it backward.
/// Time stops at the start of the drawing and when its last path finishes, so
/// playing a finished drawing again takes a call to reset_clock.
@external(javascript, "./canvas.mjs", "setSpeed")
pub fn set_speed(rate: Float) -> Nil

/// Jump the animation back to its start, where the canvas is empty.
@external(javascript, "./canvas.mjs", "resetClock")
pub fn reset_clock() -> Nil

/// Pastel palette used when a shape does not carry its own RGB color.
pub const palette = [
  "#e8d8b0", "#89ddff", "#c3e88d", "#f78c6c", "#c792ea", "#ffcb6b", "#82aaff",
  "#f07178",
]

pub fn palette_color(index: Int) -> String {
  let len = list.length(palette)
  let i = case len {
    0 -> 0
    _ ->
      case int.modulo(index, len) {
        Ok(n) -> n
        Error(_) -> 0
      }
  }
  let assert Ok(color) = list.drop(palette, i) |> list.first
  color
}

pub fn rgb_css(r: Int, g: Int, b: Int) -> String {
  "rgb("
  <> int.to_string(clamp_byte(r))
  <> ", "
  <> int.to_string(clamp_byte(g))
  <> ", "
  <> int.to_string(clamp_byte(b))
  <> ")"
}

fn clamp_byte(n: Int) -> Int {
  case n < 0 {
    True -> 0
    False ->
      case n > 255 {
        True -> 255
        False -> n
      }
  }
}

pub fn render_path(path: Path, color: String) -> RenderPath {
  case path.shape {
    Line(a, b) ->
      RenderPath([a, b], path.thickness, color, path.start, path.end)
    ColorLine(a, b, r, g, bl) ->
      RenderPath(
        [a, b],
        path.thickness,
        rgb_css(r, g, bl),
        path.start,
        path.end,
      )
    Circle(center, radius) ->
      RenderPath(
        circle_points(center, radius),
        path.thickness,
        color,
        path.start,
        path.end,
      )
    ColorCircle(center, radius, r, g, bl) ->
      RenderPath(
        circle_points(center, radius),
        path.thickness,
        rgb_css(r, g, bl),
        path.start,
        path.end,
      )
  }
}

/// Convert a list of paths, assigning palette colors to uncolored shapes by index.
pub fn render_paths(paths: List(Path)) -> List(RenderPath) {
  list.index_map(paths, fn(path, i) { render_path(path, palette_color(i)) })
}

const circle_segments = 48

const tau = 6.283185307179586

@external(javascript, "./render_ffi.mjs", "cos")
fn cos(x: Float) -> Float

@external(javascript, "./render_ffi.mjs", "sin")
fn sin(x: Float) -> Float

fn circle_points(center: Point, radius: Float) -> List(Point) {
  let r = float.absolute_value(radius)
  // Include the starting point again at the end so the polyline closes.
  circle_points_loop(center, r, 0, [])
}

fn circle_points_loop(
  center: Point,
  radius: Float,
  i: Int,
  acc: List(Point),
) -> List(Point) {
  case i > circle_segments {
    True -> list.reverse(acc)
    False -> {
      let t = int.to_float(i) /. int.to_float(circle_segments) *. tau
      let point = Point(center.x +. radius *. cos(t), center.y +. radius *. sin(t))
      circle_points_loop(center, radius, i + 1, [point, ..acc])
    }
  }
}
