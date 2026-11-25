//# sourceMappingURL=shape.mjs.map
import { CustomType as $CustomType } from "./gleam.mjs";

export class Point extends $CustomType {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }
}
export const Point$Point = (x, y) => new Point(x, y);
export const Point$isPoint = (value) => value instanceof Point;
export const Point$Point$x = (value) => value.x;
export const Point$Point$0 = (value) => value.x;
export const Point$Point$y = (value) => value.y;
export const Point$Point$1 = (value) => value.y;

export class Line extends $CustomType {
  constructor(start, end) {
    super();
    this.start = start;
    this.end = end;
  }
}
export const Shape$Line = (start, end) => new Line(start, end);
export const Shape$isLine = (value) => value instanceof Line;
export const Shape$Line$start = (value) => value.start;
export const Shape$Line$0 = (value) => value.start;
export const Shape$Line$end = (value) => value.end;
export const Shape$Line$1 = (value) => value.end;

/**
 * Straight line with explicit RGB color components in 0..255.
 */
export class ColorLine extends $CustomType {
  constructor(start, end, r, g, b) {
    super();
    this.start = start;
    this.end = end;
    this.r = r;
    this.g = g;
    this.b = b;
  }
}
export const Shape$ColorLine = (start, end, r, g, b) =>
  new ColorLine(start, end, r, g, b);
export const Shape$isColorLine = (value) => value instanceof ColorLine;
export const Shape$ColorLine$start = (value) => value.start;
export const Shape$ColorLine$0 = (value) => value.start;
export const Shape$ColorLine$end = (value) => value.end;
export const Shape$ColorLine$1 = (value) => value.end;
export const Shape$ColorLine$r = (value) => value.r;
export const Shape$ColorLine$2 = (value) => value.r;
export const Shape$ColorLine$g = (value) => value.g;
export const Shape$ColorLine$3 = (value) => value.g;
export const Shape$ColorLine$b = (value) => value.b;
export const Shape$ColorLine$4 = (value) => value.b;

/**
 * Circle approximated as a closed polyline when rendered.
 */
export class Circle extends $CustomType {
  constructor(center, radius) {
    super();
    this.center = center;
    this.radius = radius;
  }
}
export const Shape$Circle = (center, radius) => new Circle(center, radius);
export const Shape$isCircle = (value) => value instanceof Circle;
export const Shape$Circle$center = (value) => value.center;
export const Shape$Circle$0 = (value) => value.center;
export const Shape$Circle$radius = (value) => value.radius;
export const Shape$Circle$1 = (value) => value.radius;

/**
 * Colored circle with RGB components in 0..255.
 */
export class ColorCircle extends $CustomType {
  constructor(center, radius, r, g, b) {
    super();
    this.center = center;
    this.radius = radius;
    this.r = r;
    this.g = g;
    this.b = b;
  }
}
export const Shape$ColorCircle = (center, radius, r, g, b) =>
  new ColorCircle(center, radius, r, g, b);
export const Shape$isColorCircle = (value) => value instanceof ColorCircle;
export const Shape$ColorCircle$center = (value) => value.center;
export const Shape$ColorCircle$0 = (value) => value.center;
export const Shape$ColorCircle$radius = (value) => value.radius;
export const Shape$ColorCircle$1 = (value) => value.radius;
export const Shape$ColorCircle$r = (value) => value.r;
export const Shape$ColorCircle$2 = (value) => value.r;
export const Shape$ColorCircle$g = (value) => value.g;
export const Shape$ColorCircle$3 = (value) => value.g;
export const Shape$ColorCircle$b = (value) => value.b;
export const Shape$ColorCircle$4 = (value) => value.b;

export class Path extends $CustomType {
  constructor(shape, start, end, thickness) {
    super();
    this.shape = shape;
    this.start = start;
    this.end = end;
    this.thickness = thickness;
  }
}
export const Path$Path = (shape, start, end, thickness) =>
  new Path(shape, start, end, thickness);
export const Path$isPath = (value) => value instanceof Path;
export const Path$Path$shape = (value) => value.shape;
export const Path$Path$0 = (value) => value.shape;
export const Path$Path$start = (value) => value.start;
export const Path$Path$1 = (value) => value.start;
export const Path$Path$end = (value) => value.end;
export const Path$Path$2 = (value) => value.end;
export const Path$Path$thickness = (value) => value.thickness;
export const Path$Path$3 = (value) => value.thickness;
