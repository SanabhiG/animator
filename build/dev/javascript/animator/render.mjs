//# sourceMappingURL=render.mjs.map
import * as $float from "../gleam_stdlib/gleam/float.mjs";
import * as $int from "../gleam_stdlib/gleam/int.mjs";
import * as $list from "../gleam_stdlib/gleam/list.mjs";
import {
  setDrawing as set_drawing,
  setSpeed as set_speed,
  resetClock as reset_clock,
} from "./canvas.mjs";
import {
  Ok,
  List$Empty$const as $List$Empty$const,
  prepend as listPrepend,
  CustomType as $CustomType,
  makeError,
  divideFloat,
} from "./gleam.mjs";
import { sin, cos } from "./render_ffi.mjs";
import * as $shape from "./shape.mjs";
import { Circle, ColorCircle, ColorLine, Line, Point } from "./shape.mjs";

export { reset_clock, set_drawing, set_speed };

const FILEPATH = "src/render.gleam";

export class RenderPath extends $CustomType {
  constructor(points, thickness, color, start, end) {
    super();
    this.points = points;
    this.thickness = thickness;
    this.color = color;
    this.start = start;
    this.end = end;
  }
}
export const RenderPath$RenderPath = (points, thickness, color, start, end) =>
  new RenderPath(points, thickness, color, start, end);
export const RenderPath$isRenderPath = (value) => value instanceof RenderPath;
export const RenderPath$RenderPath$points = (value) => value.points;
export const RenderPath$RenderPath$0 = (value) => value.points;
export const RenderPath$RenderPath$thickness = (value) => value.thickness;
export const RenderPath$RenderPath$1 = (value) => value.thickness;
export const RenderPath$RenderPath$color = (value) => value.color;
export const RenderPath$RenderPath$2 = (value) => value.color;
export const RenderPath$RenderPath$start = (value) => value.start;
export const RenderPath$RenderPath$3 = (value) => value.start;
export const RenderPath$RenderPath$end = (value) => value.end;
export const RenderPath$RenderPath$4 = (value) => value.end;

/**
 * Pastel palette used when a shape does not carry its own RGB color.
 */
export const palette = /* @__PURE__ */ listPrepend(
  "#e8d8b0",
  listPrepend(
    "#89ddff",
    listPrepend(
      "#c3e88d",
      listPrepend(
        "#f78c6c",
        listPrepend(
          "#c792ea",
          listPrepend(
            "#ffcb6b",
            listPrepend("#82aaff", listPrepend("#f07178", $List$Empty$const)),
          ),
        ),
      ),
    ),
  ),
);

const tau = 6.283185307179586;

const circle_segments = 48;

export function palette_color(index) {
  let len = $list.length(palette);
  let _block;
  if (len === 0) {
    _block = len;
  } else {
    let $ = $int.modulo(index, len);
    if ($ instanceof Ok) {
      let n = $[0];
      _block = n;
    } else {
      _block = 0;
    }
  }
  let i = _block;
  let _block$1;
  let _pipe = $list.drop(palette, i);
  _block$1 = $list.first(_pipe);
  let $ = _block$1;
  let color;
  if ($ instanceof Ok) {
    color = $[0];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "render",
      61,
      "palette_color",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 2189,
        end: 2247,
        pattern_start: 2200,
        pattern_end: 2209
      }
    )
  }
  return color;
}

function clamp_byte(n) {
  let $ = n < 0;
  if ($) {
    return 0;
  } else {
    let $1 = n > 255;
    if ($1) {
      return 255;
    } else {
      return n;
    }
  }
}

export function rgb_css(r, g, b) {
  return ((((("rgb(" + $int.to_string(clamp_byte(r))) + ", ") + $int.to_string(
    clamp_byte(g),
  )) + ", ") + $int.to_string(clamp_byte(b))) + ")";
}

function circle_points_loop(loop$center, loop$radius, loop$i, loop$acc) {
  while (true) {
    let center = loop$center;
    let radius = loop$radius;
    let i = loop$i;
    let acc = loop$acc;
    let $ = i > circle_segments;
    if ($) {
      return $list.reverse(acc);
    } else {
      let t = (divideFloat($int.to_float(i), $int.to_float(circle_segments))) * tau;
      let point = new Point(
        center.x + (radius * cos(t)),
        center.y + (radius * sin(t)),
      );
      loop$center = center;
      loop$radius = radius;
      loop$i = i + 1;
      loop$acc = listPrepend(point, acc);
    }
  }
}

function circle_points(center, radius) {
  let r = $float.absolute_value(radius);
  return circle_points_loop(center, r, 0, $List$Empty$const);
}

export function render_path(path, color) {
  let $ = path.shape;
  if ($ instanceof Line) {
    let a = $.start;
    let b = $.end;
    return new RenderPath(
      listPrepend(a, listPrepend(b, $List$Empty$const)),
      path.thickness,
      color,
      path.start,
      path.end,
    );
  } else if ($ instanceof ColorLine) {
    let a = $.start;
    let b = $.end;
    let r = $.r;
    let g = $.g;
    let bl = $.b;
    return new RenderPath(
      listPrepend(a, listPrepend(b, $List$Empty$const)),
      path.thickness,
      rgb_css(r, g, bl),
      path.start,
      path.end,
    );
  } else if ($ instanceof Circle) {
    let center = $.center;
    let radius = $.radius;
    return new RenderPath(
      circle_points(center, radius),
      path.thickness,
      color,
      path.start,
      path.end,
    );
  } else {
    let center = $.center;
    let radius = $.radius;
    let r = $.r;
    let g = $.g;
    let bl = $.b;
    return new RenderPath(
      circle_points(center, radius),
      path.thickness,
      rgb_css(r, g, bl),
      path.start,
      path.end,
    );
  }
}

/**
 * Convert a list of paths, assigning palette colors to uncolored shapes by index.
 */
export function render_paths(paths) {
  return $list.index_map(
    paths,
    (path, i) => { return render_path(path, palette_color(i)); },
  );
}
