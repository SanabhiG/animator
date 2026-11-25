//// Animator -- an application for program-generated drawings.

import ascii_ray
import builtins
import data.{Library}
import drawing
import editor
import errors
import gleam/float
import gleam/int
import gleam/list
import gleam/result
import lustre
import lustre/attribute as attr
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import parser
import render
import shape.{type Path}

/// Your app's public address, once you've deployed it in Problem 13, such as
/// "https://your-username.github.io/animator/".
pub const public_url = "https://sanabhig.github.io/animator/"

/// Set to True if you would like your app's URL included in the course gallery.
pub const include_app_in_gallery = False

/// A link to your video from Problem 14, which anyone with the link can watch.
pub const video_url = ""

/// Set to True if you would like your video included in the course gallery.
pub const include_video_in_gallery = False

const ascii_storage_key = "animator-ascii-map"

// ── Model ──────────────────────────────────────────────────────────────────────

pub type Model {
  Model(
    source: String,
    code_open: Bool,
    error: String,
    shape_slider: Int,
    speed: Float,
    drawings: List(#(String, String)),
    current: String,
    ascii_mode: Bool,
    ascii_text: String,
  )
}

pub type Msg {
  SetCode(String)
  ToggleCode
  SetShapeSlider(Int)
  SetSpeed(Float)
  SelectDrawing(String)
  ResetAnim
  PauseAnim
  PlayAnim
  ToggleAscii
  SetAscii(String)
}

// ── Init ───────────────────────────────────────────────────────────────────────

pub fn init(_flags: Nil) -> #(Model, Effect(Msg)) {
  let lib = data.load_library()
  let source = data.current_source(lib)
  let ascii_text = case data.storage_get(ascii_storage_key) {
    Ok(text) if text != "" -> text
    _ -> ascii_ray.default_ascii
  }
  let model =
    Model(
      source:,
      code_open: True,
      error: "",
      shape_slider: 50,
      speed: 1.0,
      drawings: lib.drawings,
      current: lib.current,
      ascii_mode: False,
      ascii_text:,
    )
  #(
    model,
    effect.batch([
      editor.mount(source, SetCode),
      effect.from(fn(dispatch) { dispatch(SetCode(source)) }),
      effect.from(fn(_) { render.set_speed(1.0) }),
    ]),
  )
}

fn run_source(shape_slider: Int, source: String) -> Result(List(Path), String) {
  case parser.parse_program(source, builtins.global_frame()) {
    Error(msg) -> Error(msg)
    Ok(program) ->
      drawing.try_draw(shape_slider, program)
      |> result.map_error(errors.error_message)
  }
}

fn persist(model: Model) -> Nil {
  data.save_library(Library(model.drawings, model.current))
}

fn persist_ascii(text: String) -> Nil {
  data.storage_set(ascii_storage_key, text)
}

fn animate(paths: List(Path), reset: Bool) -> Effect(Msg) {
  effect.from(fn(_) {
    case reset {
      True -> render.reset_clock()
      False -> Nil
    }
    render.set_drawing(render.render_paths(paths))
  })
}

fn clear_drawing() -> Effect(Msg) {
  effect.from(fn(_) {
    render.reset_clock()
    render.set_drawing([])
  })
}

fn refresh(model: Model, reset: Bool) -> #(Model, Effect(Msg)) {
  case model.ascii_mode {
    True -> {
      let paths =
        ascii_ray.render_ascii(model.ascii_text, model.shape_slider)
      #(Model(..model, error: ""), animate(paths, reset))
    }
    False ->
      case run_source(model.shape_slider, model.source) {
        Ok(paths) -> #(Model(..model, error: ""), animate(paths, reset))
        Error(msg) -> #(Model(..model, error: msg), clear_drawing())
      }
  }
}

fn apply_source(model: Model, text: String, reset: Bool) -> #(Model, Effect(Msg)) {
  let drawings = data.update_drawing(model.drawings, model.current, text)
  let next = Model(..model, source: text, drawings:)
  persist(next)
  refresh(next, reset)
}

// ── Update ─────────────────────────────────────────────────────────────────────

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    ToggleCode -> #(Model(..model, code_open: !model.code_open), effect.none())

    SetCode(text) -> apply_source(model, text, True)

    SetShapeSlider(value) -> refresh(Model(..model, shape_slider: value), False)

    SetSpeed(rate) -> #(
      Model(..model, speed: rate),
      effect.from(fn(_) { render.set_speed(rate) }),
    )

    ToggleAscii -> {
      let next = Model(..model, ascii_mode: !model.ascii_mode, error: "")
      refresh(next, True)
    }

    SetAscii(text) -> {
      persist_ascii(text)
      let next = Model(..model, ascii_text: text)
      case next.ascii_mode {
        True -> refresh(next, True)
        False -> #(next, effect.none())
      }
    }

    SelectDrawing("") -> {
      let name = data.prompt_drawing_name()
      case name == "" {
        True -> #(
          model,
          effect.from(fn(dispatch) { dispatch(SelectDrawing(model.current)) }),
        )
        False ->
          case list.key_find(model.drawings, name) {
            Ok(source) -> {
              let next = Model(..model, current: name, source:)
              persist(next)
              #(
                next,
                effect.batch([
                  editor.mount(source, SetCode),
                  effect.from(fn(dispatch) { dispatch(SetCode(source)) }),
                ]),
              )
            }
            Error(_) -> {
              let source = data.default_new_source()
              let drawings = list.append(model.drawings, [#(name, source)])
              let next =
                Model(..model, drawings:, current: name, source:, error: "")
              persist(next)
              #(
                next,
                effect.batch([
                  editor.mount(source, SetCode),
                  effect.from(fn(dispatch) { dispatch(SetCode(source)) }),
                ]),
              )
            }
          }
      }
    }

    SelectDrawing(name) -> {
      case list.key_find(model.drawings, name) {
        Error(_) -> #(model, effect.none())
        Ok(source) -> {
          let next = Model(..model, current: name, source:)
          persist(next)
          #(
            next,
            effect.batch([
              editor.mount(source, SetCode),
              effect.from(fn(dispatch) { dispatch(SetCode(source)) }),
            ]),
          )
        }
      }
    }

    ResetAnim -> #(model, effect.from(fn(_) { render.reset_clock() }))

    PauseAnim -> #(
      Model(..model, speed: 0.0),
      effect.from(fn(_) { render.set_speed(0.0) }),
    )

    PlayAnim -> #(
      Model(..model, speed: 1.0),
      effect.from(fn(_) { render.set_speed(1.0) }),
    )
  }
}

// ── View ──────────────────────────────────────────────────────────────────

pub fn view(model: Model) -> Element(Msg) {
  let app_class = case model.code_open {
    True -> "app"
    False -> "app code-hidden"
  }
  html.div([attr.class(app_class)], [
    html.div([attr.class("code-col")], [
      editor.view_panel(ToggleCode),
      view_ascii_panel(model),
    ]),
    view_anim(model),
  ])
}

fn view_ascii_panel(model: Model) -> Element(Msg) {
  let mode_label = case model.ascii_mode {
    True -> "ASCII raycast: ON"
    False -> "ASCII raycast: OFF"
  }
  let grid = ascii_ray.string_to_grid(model.ascii_text)
  let rows = list.length(grid)
  let cols = case grid {
    [row, ..] -> list.length(row)
    [] -> 0
  }
  let dim = int.to_string(rows) <> " × " <> int.to_string(cols) <> " height grid"
  html.div([attr.class("ascii-panel")], [
    html.div([attr.class("ascii-header")], [
      html.button(
        [
          attr.class(case model.ascii_mode {
            True -> "icon-btn ascii-toggle on"
            False -> "icon-btn ascii-toggle"
          }),
          attr.attribute("title", "Toggle ASCII → 3D raycast mode"),
          event.on_click(ToggleAscii),
        ],
        [html.text(mode_label)],
      ),
      html.span([attr.class("ascii-dim")], [html.text(dim)]),
    ]),
    html.p([attr.class("ascii-hint")], [
      html.text(
        "Type ASCII (# = tall, digits 1–9 = height, . = empty). Shape spins the camera.",
      ),
    ]),
    html.textarea(
      [
        attr.class("ascii-input"),
        attr.attribute("spellcheck", "false"),
        attr.rows(8),
        event.on_input(SetAscii),
      ],
      model.ascii_text,
    ),
  ])
}

fn view_anim(model: Model) -> Element(Msg) {
  html.div([attr.class("canvas-area")], [
    view_reveal_code(model),
    html.canvas([attr.id("animation-canvas"), attr.class("canvas")]),
    view_error(model),
    view_controls(model),
  ])
}

fn view_error(model: Model) -> Element(Msg) {
  case model.error {
    "" -> element.none()
    msg -> html.pre([attr.class("error-banner")], [html.text(msg)])
  }
}

fn view_controls(model: Model) -> Element(Msg) {
  let shape_label = case model.ascii_mode {
    True -> "Camera"
    False -> "Shape"
  }
  html.div([attr.class("controls")], [
    view_drawing_select(model),
    view_slider(
      shape_label,
      "shape-slider",
      int.to_string(model.shape_slider),
      "0",
      "100",
      "1",
      fn(v) {
        SetShapeSlider(result.unwrap(int.parse(v), model.shape_slider))
      },
    ),
    view_slider(
      "Speed",
      "speed-slider",
      float.to_string(model.speed),
      "-2",
      "3",
      "0.1",
      fn(v) { SetSpeed(result.unwrap(float.parse(v), model.speed)) },
    ),
    html.div([attr.class("playback")], [
      html.button(
        [
          attr.class("icon-btn"),
          attr.attribute("title", "Play"),
          event.on_click(PlayAnim),
        ],
        [html.text("▶")],
      ),
      html.button(
        [
          attr.class("icon-btn"),
          attr.attribute("title", "Pause"),
          event.on_click(PauseAnim),
        ],
        [html.text("❚❚")],
      ),
      html.button(
        [
          attr.class("icon-btn"),
          attr.attribute("title", "Reset"),
          event.on_click(ResetAnim),
        ],
        [html.text("↺")],
      ),
    ]),
  ])
}

fn view_slider(
  label: String,
  test_id: String,
  value: String,
  min: String,
  max: String,
  step: String,
  on_input: fn(String) -> Msg,
) -> Element(Msg) {
  html.label([attr.class("control")], [
    html.span([attr.class("control-label")], [html.text(label)]),
    html.input([
      attr.type_("range"),
      attr.min(min),
      attr.max(max),
      attr.attribute("step", step),
      attr.value(value),
      attr.attribute("data-test-id", test_id),
      event.on_input(on_input),
    ]),
  ])
}

fn view_drawing_select(model: Model) -> Element(Msg) {
  let options =
    list.map(model.drawings, fn(pair) {
      let #(name, _) = pair
      html.option(
        [attr.value(name), attr.selected(name == model.current)],
        name,
      )
    })
  let new_option = html.option([attr.value("")], "＋ New drawing…")
  html.label([attr.class("control drawing-select")], [
    html.span([attr.class("control-label")], [html.text("Drawing")]),
    html.select(
      [
        attr.attribute("data-test-id", "drawing-select"),
        event.on_change(SelectDrawing),
      ],
      list.append(options, [new_option]),
    ),
  ])
}

fn view_reveal_code(model: Model) -> Element(Msg) {
  case model.code_open {
    True -> element.none()
    False ->
      html.button(
        [
          attr.class("icon-btn reveal-code"),
          attr.attribute("title", "Show code"),
          event.on_click(ToggleCode),
        ],
        [html.text("⟩")],
      )
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

pub fn main() -> Nil {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}
