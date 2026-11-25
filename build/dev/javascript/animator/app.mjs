//# sourceMappingURL=app.mjs.map
import * as $float from "../gleam_stdlib/gleam/float.mjs";
import * as $int from "../gleam_stdlib/gleam/int.mjs";
import * as $list from "../gleam_stdlib/gleam/list.mjs";
import * as $result from "../gleam_stdlib/gleam/result.mjs";
import * as $lustre from "../lustre/lustre.mjs";
import * as $attr from "../lustre/lustre/attribute.mjs";
import * as $effect from "../lustre/lustre/effect.mjs";
import * as $element from "../lustre/lustre/element.mjs";
import * as $html from "../lustre/lustre/element/html.mjs";
import * as $event from "../lustre/lustre/event.mjs";
import * as $builtins from "./builtins.mjs";
import * as $data from "./data.mjs";
import { Library } from "./data.mjs";
import * as $drawing from "./drawing.mjs";
import * as $editor from "./editor.mjs";
import * as $errors from "./errors.mjs";
import {
  Ok,
  List$Empty$const as $List$Empty$const,
  prepend as listPrepend,
  CustomType as $CustomType,
  makeError,
} from "./gleam.mjs";
import * as $parser from "./parser.mjs";
import * as $render from "./render.mjs";
import * as $shape from "./shape.mjs";

const FILEPATH = "src/app.gleam";

export class Model extends $CustomType {
  constructor(source, code_open, error, shape_slider, speed, drawings, current) {
    super();
    this.source = source;
    this.code_open = code_open;
    this.error = error;
    this.shape_slider = shape_slider;
    this.speed = speed;
    this.drawings = drawings;
    this.current = current;
  }
}
export const Model$Model = (source, code_open, error, shape_slider, speed, drawings, current) =>
  new Model(source, code_open, error, shape_slider, speed, drawings, current);
export const Model$isModel = (value) => value instanceof Model;
export const Model$Model$source = (value) => value.source;
export const Model$Model$0 = (value) => value.source;
export const Model$Model$code_open = (value) => value.code_open;
export const Model$Model$1 = (value) => value.code_open;
export const Model$Model$error = (value) => value.error;
export const Model$Model$2 = (value) => value.error;
export const Model$Model$shape_slider = (value) => value.shape_slider;
export const Model$Model$3 = (value) => value.shape_slider;
export const Model$Model$speed = (value) => value.speed;
export const Model$Model$4 = (value) => value.speed;
export const Model$Model$drawings = (value) => value.drawings;
export const Model$Model$5 = (value) => value.drawings;
export const Model$Model$current = (value) => value.current;
export const Model$Model$6 = (value) => value.current;

export class SetCode extends $CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
export const Msg$SetCode = ($0) => new SetCode($0);
export const Msg$isSetCode = (value) => value instanceof SetCode;
export const Msg$SetCode$0 = (value) => value[0];

export class ToggleCode extends $CustomType {}
export const Msg$ToggleCode$const = new ToggleCode();
export const Msg$ToggleCode = () => Msg$ToggleCode$const;
export const Msg$isToggleCode = (value) => value instanceof ToggleCode;

export class SetShapeSlider extends $CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
export const Msg$SetShapeSlider = ($0) => new SetShapeSlider($0);
export const Msg$isSetShapeSlider = (value) => value instanceof SetShapeSlider;
export const Msg$SetShapeSlider$0 = (value) => value[0];

export class SetSpeed extends $CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
export const Msg$SetSpeed = ($0) => new SetSpeed($0);
export const Msg$isSetSpeed = (value) => value instanceof SetSpeed;
export const Msg$SetSpeed$0 = (value) => value[0];

export class SelectDrawing extends $CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
export const Msg$SelectDrawing = ($0) => new SelectDrawing($0);
export const Msg$isSelectDrawing = (value) => value instanceof SelectDrawing;
export const Msg$SelectDrawing$0 = (value) => value[0];

export class ResetAnim extends $CustomType {}
export const Msg$ResetAnim$const = new ResetAnim();
export const Msg$ResetAnim = () => Msg$ResetAnim$const;
export const Msg$isResetAnim = (value) => value instanceof ResetAnim;

export class PauseAnim extends $CustomType {}
export const Msg$PauseAnim$const = new PauseAnim();
export const Msg$PauseAnim = () => Msg$PauseAnim$const;
export const Msg$isPauseAnim = (value) => value instanceof PauseAnim;

export class PlayAnim extends $CustomType {}
export const Msg$PlayAnim$const = new PlayAnim();
export const Msg$PlayAnim = () => Msg$PlayAnim$const;
export const Msg$isPlayAnim = (value) => value instanceof PlayAnim;

/**
 * Your app's public address, once you've deployed it in Problem 13, such as
 * "https://your-username.github.io/animator/".
 */
export const public_url = "https://sanabhig.github.io/animator/";

/**
 * Set to True if you would like your app's URL included in the course gallery.
 */
export const include_app_in_gallery = false;

/**
 * A link to your video from Problem 14, which anyone with the link can watch.
 */
export const video_url = "";

/**
 * Set to True if you would like your video included in the course gallery.
 */
export const include_video_in_gallery = false;

export function init(_) {
  let lib = $data.load_library();
  let source = $data.current_source(lib);
  let model = new Model(source, true, "", 50, 1.0, lib.drawings, lib.current);
  return [
    model,
    $effect.batch(
      listPrepend(
        $editor.mount(source, (var0) => { return new SetCode(var0); }),
        listPrepend(
          $effect.from((dispatch) => { return dispatch(new SetCode(source)); }),
          listPrepend(
            $effect.from((_) => { return $render.set_speed(1.0); }),
            $List$Empty$const,
          ),
        ),
      ),
    ),
  ];
}

function run_source(shape_slider, source) {
  let $ = $parser.parse_program(source, $builtins.global_frame());
  if ($ instanceof Ok) {
    let program = $[0];
    let _pipe = $drawing.try_draw(shape_slider, program);
    return $result.map_error(_pipe, $errors.error_message);
  } else {
    return $;
  }
}

function persist(model) {
  return $data.save_library(new Library(model.drawings, model.current));
}

function animate(paths, reset) {
  return $effect.from(
    (_) => {
      if (reset) {
        $render.reset_clock();
      } else {
        undefined;
      }
      return $render.set_drawing($render.render_paths(paths));
    },
  );
}

function clear_drawing() {
  return $effect.from(
    (_) => {
      $render.reset_clock();
      return $render.set_drawing($List$Empty$const);
    },
  );
}

function apply_source(model, text, reset) {
  let drawings = $data.update_drawing(model.drawings, model.current, text);
  let next = new Model(
    text,
    model.code_open,
    model.error,
    model.shape_slider,
    model.speed,
    drawings,
    model.current,
  );
  persist(next);
  let $ = run_source(next.shape_slider, text);
  if ($ instanceof Ok) {
    let paths = $[0];
    return [
      new Model(
        next.source,
        next.code_open,
        "",
        next.shape_slider,
        next.speed,
        next.drawings,
        next.current,
      ),
      animate(paths, reset),
    ];
  } else {
    let msg = $[0];
    return [
      new Model(
        next.source,
        next.code_open,
        msg,
        next.shape_slider,
        next.speed,
        next.drawings,
        next.current,
      ),
      clear_drawing(),
    ];
  }
}

export function update(model, msg) {
  if (msg instanceof SetCode) {
    let text = msg[0];
    return apply_source(model, text, true);
  } else if (msg instanceof ToggleCode) {
    return [
      new Model(
        model.source,
        !model.code_open,
        model.error,
        model.shape_slider,
        model.speed,
        model.drawings,
        model.current,
      ),
      $effect.none(),
    ];
  } else if (msg instanceof SetShapeSlider) {
    let value = msg[0];
    let next = new Model(
      model.source,
      model.code_open,
      model.error,
      value,
      model.speed,
      model.drawings,
      model.current,
    );
    let $ = run_source(value, next.source);
    if ($ instanceof Ok) {
      let paths = $[0];
      return [
        new Model(
          next.source,
          next.code_open,
          "",
          next.shape_slider,
          next.speed,
          next.drawings,
          next.current,
        ),
        animate(paths, false),
      ];
    } else {
      let msg$1 = $[0];
      return [
        new Model(
          next.source,
          next.code_open,
          msg$1,
          next.shape_slider,
          next.speed,
          next.drawings,
          next.current,
        ),
        clear_drawing(),
      ];
    }
  } else if (msg instanceof SetSpeed) {
    let rate = msg[0];
    return [
      new Model(
        model.source,
        model.code_open,
        model.error,
        model.shape_slider,
        rate,
        model.drawings,
        model.current,
      ),
      $effect.from((_) => { return $render.set_speed(rate); }),
    ];
  } else if (msg instanceof SelectDrawing) {
    let $ = msg[0];
    if ($ === "") {
      let name = $data.prompt_drawing_name();
      let $1 = name === "";
      if ($1) {
        return [
          model,
          $effect.from(
            (dispatch) => { return dispatch(new SelectDrawing(model.current)); },
          ),
        ];
      } else {
        let $2 = $list.key_find(model.drawings, name);
        if ($2 instanceof Ok) {
          let source = $2[0];
          let next = new Model(
            source,
            model.code_open,
            model.error,
            model.shape_slider,
            model.speed,
            model.drawings,
            name,
          );
          persist(next);
          return [
            next,
            $effect.batch(
              listPrepend(
                $editor.mount(source, (var0) => { return new SetCode(var0); }),
                listPrepend(
                  $effect.from(
                    (dispatch) => { return dispatch(new SetCode(source)); },
                  ),
                  $List$Empty$const,
                ),
              ),
            ),
          ];
        } else {
          let source = $data.default_new_source();
          let drawings = $list.append(
            model.drawings,
            listPrepend([name, source], $List$Empty$const),
          );
          let next = new Model(
            source,
            model.code_open,
            "",
            model.shape_slider,
            model.speed,
            drawings,
            name,
          );
          persist(next);
          return [
            next,
            $effect.batch(
              listPrepend(
                $editor.mount(source, (var0) => { return new SetCode(var0); }),
                listPrepend(
                  $effect.from(
                    (dispatch) => { return dispatch(new SetCode(source)); },
                  ),
                  $List$Empty$const,
                ),
              ),
            ),
          ];
        }
      }
    } else {
      let name = $;
      let $1 = $list.key_find(model.drawings, name);
      if ($1 instanceof Ok) {
        let source = $1[0];
        let next = new Model(
          source,
          model.code_open,
          model.error,
          model.shape_slider,
          model.speed,
          model.drawings,
          name,
        );
        persist(next);
        return [
          next,
          $effect.batch(
            listPrepend(
              $editor.mount(source, (var0) => { return new SetCode(var0); }),
              listPrepend(
                $effect.from(
                  (dispatch) => { return dispatch(new SetCode(source)); },
                ),
                $List$Empty$const,
              ),
            ),
          ),
        ];
      } else {
        return [model, $effect.none()];
      }
    }
  } else if (msg instanceof ResetAnim) {
    return [model, $effect.from((_) => { return $render.reset_clock(); })];
  } else if (msg instanceof PauseAnim) {
    return [
      new Model(
        model.source,
        model.code_open,
        model.error,
        model.shape_slider,
        0.0,
        model.drawings,
        model.current,
      ),
      $effect.from((_) => { return $render.set_speed(0.0); }),
    ];
  } else {
    return [
      new Model(
        model.source,
        model.code_open,
        model.error,
        model.shape_slider,
        1.0,
        model.drawings,
        model.current,
      ),
      $effect.from((_) => { return $render.set_speed(1.0); }),
    ];
  }
}

function view_slider(label, test_id, value, min, max, step, on_input) {
  return $html.label(
    listPrepend($attr.class$("control"), $List$Empty$const),
    listPrepend(
      $html.span(
        listPrepend($attr.class$("control-label"), $List$Empty$const),
        listPrepend($html.text(label), $List$Empty$const),
      ),
      listPrepend(
        $html.input(
          listPrepend(
            $attr.type_("range"),
            listPrepend(
              $attr.min(min),
              listPrepend(
                $attr.max(max),
                listPrepend(
                  $attr.attribute("step", step),
                  listPrepend(
                    $attr.value(value),
                    listPrepend(
                      $attr.attribute("data-test-id", test_id),
                      listPrepend($event.on_input(on_input), $List$Empty$const),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        $List$Empty$const,
      ),
    ),
  );
}

function view_drawing_select(model) {
  let options = $list.map(
    model.drawings,
    (pair) => {
      let name = pair[0];
      return $html.option(
        listPrepend(
          $attr.value(name),
          listPrepend($attr.selected(name === model.current), $List$Empty$const),
        ),
        name,
      );
    },
  );
  let new_option = $html.option(
    listPrepend($attr.value(""), $List$Empty$const),
    "＋ New drawing…",
  );
  return $html.label(
    listPrepend($attr.class$("control drawing-select"), $List$Empty$const),
    listPrepend(
      $html.span(
        listPrepend($attr.class$("control-label"), $List$Empty$const),
        listPrepend($html.text("Drawing"), $List$Empty$const),
      ),
      listPrepend(
        $html.select(
          listPrepend(
            $attr.attribute("data-test-id", "drawing-select"),
            listPrepend(
              $event.on_change((var0) => { return new SelectDrawing(var0); }),
              $List$Empty$const,
            ),
          ),
          $list.append(options, listPrepend(new_option, $List$Empty$const)),
        ),
        $List$Empty$const,
      ),
    ),
  );
}

function view_controls(model) {
  return $html.div(
    listPrepend($attr.class$("controls"), $List$Empty$const),
    listPrepend(
      view_drawing_select(model),
      listPrepend(
        view_slider(
          "Shape",
          "shape-slider",
          $int.to_string(model.shape_slider),
          "0",
          "100",
          "1",
          (v) => {
            return new SetShapeSlider(
              $result.unwrap($int.parse(v), model.shape_slider),
            );
          },
        ),
        listPrepend(
          view_slider(
            "Speed",
            "speed-slider",
            $float.to_string(model.speed),
            "-2",
            "3",
            "0.1",
            (v) => {
              return new SetSpeed($result.unwrap($float.parse(v), model.speed));
            },
          ),
          listPrepend(
            $html.div(
              listPrepend($attr.class$("playback"), $List$Empty$const),
              listPrepend(
                $html.button(
                  listPrepend(
                    $attr.class$("icon-btn"),
                    listPrepend(
                      $attr.attribute("title", "Play"),
                      listPrepend(
                        $event.on_click(Msg$PlayAnim$const),
                        $List$Empty$const,
                      ),
                    ),
                  ),
                  listPrepend($html.text("▶"), $List$Empty$const),
                ),
                listPrepend(
                  $html.button(
                    listPrepend(
                      $attr.class$("icon-btn"),
                      listPrepend(
                        $attr.attribute("title", "Pause"),
                        listPrepend(
                          $event.on_click(Msg$PauseAnim$const),
                          $List$Empty$const,
                        ),
                      ),
                    ),
                    listPrepend($html.text("❚❚"), $List$Empty$const),
                  ),
                  listPrepend(
                    $html.button(
                      listPrepend(
                        $attr.class$("icon-btn"),
                        listPrepend(
                          $attr.attribute("title", "Reset"),
                          listPrepend(
                            $event.on_click(Msg$ResetAnim$const),
                            $List$Empty$const,
                          ),
                        ),
                      ),
                      listPrepend($html.text("↺"), $List$Empty$const),
                    ),
                    $List$Empty$const,
                  ),
                ),
              ),
            ),
            $List$Empty$const,
          ),
        ),
      ),
    ),
  );
}

function view_error(model) {
  let $ = model.error;
  if ($ === "") {
    return $element.none();
  } else {
    let msg = $;
    return $html.pre(
      listPrepend($attr.class$("error-banner"), $List$Empty$const),
      listPrepend($html.text(msg), $List$Empty$const),
    );
  }
}

function view_reveal_code(model) {
  let $ = model.code_open;
  if ($) {
    return $element.none();
  } else {
    return $html.button(
      listPrepend(
        $attr.class$("icon-btn reveal-code"),
        listPrepend(
          $attr.attribute("title", "Show code"),
          listPrepend($event.on_click(Msg$ToggleCode$const), $List$Empty$const),
        ),
      ),
      listPrepend($html.text("⟩"), $List$Empty$const),
    );
  }
}

function view_anim(model) {
  return $html.div(
    listPrepend($attr.class$("canvas-area"), $List$Empty$const),
    listPrepend(
      view_reveal_code(model),
      listPrepend(
        $html.canvas(
          listPrepend(
            $attr.id("animation-canvas"),
            listPrepend($attr.class$("canvas"), $List$Empty$const),
          ),
        ),
        listPrepend(
          view_error(model),
          listPrepend(view_controls(model), $List$Empty$const),
        ),
      ),
    ),
  );
}

export function view(model) {
  let _block;
  let $ = model.code_open;
  if ($) {
    _block = "app";
  } else {
    _block = "app code-hidden";
  }
  let app_class = _block;
  return $html.div(
    listPrepend($attr.class$(app_class), $List$Empty$const),
    listPrepend(
      $html.div(
        listPrepend($attr.class$("code-col"), $List$Empty$const),
        listPrepend($editor.view_panel(Msg$ToggleCode$const), $List$Empty$const),
      ),
      listPrepend(view_anim(model), $List$Empty$const),
    ),
  );
}

export function main() {
  let app = $lustre.application(init, update, view);
  let $ = $lustre.start(app, "#app", undefined);
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH,
      "app",
      350,
      "main",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 10068,
        end: 10117,
        pattern_start: 10079,
        pattern_end: 10084
      }
    )
  }
  return undefined;
}
