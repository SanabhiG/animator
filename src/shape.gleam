//// The drawing Path types produced by the evaluator and rendered by the
//// animator.
////
//// The canvas maps a 1000-wide box centred on the origin onto its full size, and
//// x, y, and thickness are all in those units.

/// A point in world coordinates.
pub type Point {
  Point(x: Float, y: Float)
}

pub type Shape {
  Line(start: Point, end: Point)
  /// Straight line with explicit RGB color components in 0..255.
  ColorLine(start: Point, end: Point, r: Int, g: Int, b: Int)
  /// Circle approximated as a closed polyline when rendered.
  Circle(center: Point, radius: Float)
  /// Colored circle with RGB components in 0..255.
  ColorCircle(center: Point, radius: Float, r: Int, g: Int, b: Int)
}

pub type Path {
  // start and end are the times (in tenths of a second) between which the path is
  // drawn: the reveal runs linearly from nothing at start to the complete shape at
  // end. A path with end <= start appears complete the moment it starts.
  Path(shape: Shape, start: Float, end: Float, thickness: Float)
}
