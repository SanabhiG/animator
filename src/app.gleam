//// Animator -- an application for program-generated drawings.

import ascii_ray.{type Maze, type Player, type ScanPoint, Player}
import builtins
import data.{Library}
import drawing
import editor
import errors
import gleam/float
import gleam/int
import gleam/list
import gleam/result
import gleam/string
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
const lidar_memory_key = "animator-lidar-memory"

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
    maze: Maze,
    player: Player,
    scan_points: List(ScanPoint),
    pulse: Bool,
    /// Lidar spray density 0..100 (maps to ray count).
    scan_density: Int,
  )
}

pub type Msg {
  SetCode(String)
  ToggleCode
  SetShapeSlider(Int)
  SetSpeed(Float)
  SetScanDensity(Int)
  SelectDrawing(String)
  ResetAnim
  PauseAnim
  PlayAnim
  ToggleAscii
  SetLidar(Bool)
  SetAscii(String)
  Key(String)
  MouseLook(Float)
  Scan
  ClearPulse
}

@external(javascript, "./app_keys_ffi.mjs", "attachKeys")
fn attach_keys(on_key: fn(String) -> Nil) -> Nil

@external(javascript, "./app_keys_ffi.mjs", "attachMouseLook")
fn attach_mouse_look(
  on_delta: fn(Float) -> Nil,
  on_scan: fn() -> Nil,
) -> Nil

@external(javascript, "./app_keys_ffi.mjs", "attachActions")
fn attach_actions(set_lidar: fn(Bool) -> Nil, on_scan: fn() -> Nil) -> Nil

// ── Init ───────────────────────────────────────────────────────────────────────

pub fn init(_flags: Nil) -> #(Model, Effect(Msg)) {
  let lib = data.load_library()
  let source = data.current_source(lib)
  let ascii_text = load_ascii_map()
  let maze = ascii_ray.parse_maze(ascii_text)
  let player = ascii_ray.spawn_player(maze)
  let scan_points = case data.storage_get(lidar_memory_key) {
    Ok(raw) -> ascii_ray.decode_memory(raw)
    Error(_) -> []
  }
  let maze_error = case ascii_ray.validate_maze(maze) {
    Ok(_) -> ""
    Error(msg) -> msg
  }
  let model =
    Model(
      source:,
      code_open: True,
      error: maze_error,
      shape_slider: 50,
      speed: 1.0,
      drawings: lib.drawings,
      current: lib.current,
      ascii_mode: False,
      ascii_text:,
      maze:,
      player:,
      scan_points:,
      pulse: False,
      scan_density: 55,
    )
  #(
    model,
    effect.batch([
      editor.mount(source, SetCode),
      effect.from(fn(dispatch) { dispatch(SetCode(source)) }),
      effect.from(fn(_) { render.set_speed(1.0) }),
      effect.from(fn(dispatch) { attach_keys(fn(k) { dispatch(Key(k)) }) }),
      effect.from(fn(dispatch) {
        attach_mouse_look(
          fn(dx) { dispatch(MouseLook(dx)) },
          fn() { dispatch(Scan) },
        )
      }),
      effect.from(fn(dispatch) {
        attach_actions(
          fn(on) { dispatch(SetLidar(on)) },
          fn() { dispatch(Scan) },
        )
      }),
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

fn load_ascii_map() -> String {
  case data.storage_get(ascii_storage_key) {
    Ok(text) if text != "" -> {
      // Drop known-broken defaults; require E on the outer edge.
      let candidate = case string.contains(text, "|_|_|_|_|_|_|_|_|_|") {
        True -> ascii_ray.default_ascii
        False -> text
      }
      let maze = ascii_ray.parse_maze(candidate)
      case ascii_ray.validate_maze(maze) {
        Ok(_) -> candidate
        Error(_) -> {
          persist_ascii(ascii_ray.default_ascii)
          ascii_ray.default_ascii
        }
      }
    }
    _ -> ascii_ray.default_ascii
  }
}

fn persist_memory(points: List(ScanPoint)) -> Nil {
  data.storage_set(lidar_memory_key, ascii_ray.encode_memory(points))
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

fn maze_frame(model: Model, reset: Bool) -> #(Model, Effect(Msg)) {
  let paths =
    ascii_ray.render_frame(
      model.maze,
      model.player,
      model.scan_points,
      model.pulse,
    )
  #(Model(..model, error: ""), animate(paths, reset))
}

fn refresh(model: Model, reset: Bool) -> #(Model, Effect(Msg)) {
  case model.ascii_mode {
    True -> maze_frame(model, reset)
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

fn do_scan(model: Model) -> #(Model, Effect(Msg)) {
  let points =
    ascii_ray.scan(
      model.maze,
      model.player,
      model.scan_points,
      model.scan_density,
    )
  persist_memory(points)
  let next = Model(..model, scan_points: points, pulse: False, speed: 1.0)
  let #(m, fx) = maze_frame(next, False)
  #(
    m,
    effect.batch([fx, effect.from(fn(_) { render.set_speed(1.0) })]),
  )
}

fn apply_lidar(model: Model, on: Bool) -> #(Model, Effect(Msg)) {
  case on == model.ascii_mode {
    True -> #(model, effect.none())
    False -> {
      let next =
        Model(
          ..model,
          ascii_mode: on,
          shape_slider: case on {
            True -> angle_to_slider(model.player.angle)
            False -> model.shape_slider
          },
          error: "",
          pulse: False,
          speed: case on {
            True -> 1.0
            False -> model.speed
          },
        )
      case on {
        True -> {
          let paths =
            ascii_ray.render_frame(
              next.maze,
              next.player,
              next.scan_points,
              False,
            )
          #(
            next,
            effect.batch([
              animate(paths, True),
              effect.from(fn(_) { render.set_speed(1.0) }),
            ]),
          )
        }
        False -> refresh(next, True)
      }
    }
  }
}

// ── Update ─────────────────────────────────────────────────────────────────────

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    ToggleCode -> #(Model(..model, code_open: !model.code_open), effect.none())

    SetCode(text) ->
      case text == model.source {
        // CodeMirror can re-emit the same text after a Lustre patch; ignore it
        // or clicks never land (DOM thrash).
        True -> #(model, effect.none())
        False -> apply_source(model, text, True)
      }

    SetShapeSlider(value) ->
      case value == model.shape_slider {
        True -> #(model, effect.none())
        False -> {
          let next = Model(..model, shape_slider: value)
          case next.ascii_mode {
            True -> {
              let ang = int.to_float(value) /. 100.0 *. 6.283185307179586
              maze_frame(
                Model(..next, player: Player(..next.player, angle: ang)),
                False,
              )
            }
            False -> refresh(next, False)
          }
        }
      }

    SetSpeed(rate) ->
      case rate == model.speed {
        True -> #(model, effect.none())
        False -> #(
          Model(..model, speed: rate),
          effect.from(fn(_) { render.set_speed(rate) }),
        )
      }

    SetScanDensity(value) ->
      case value == model.scan_density {
        True -> #(model, effect.none())
        False -> #(Model(..model, scan_density: int.clamp(value, 0, 100)), effect.none())
      }

    ToggleAscii -> apply_lidar(model, !model.ascii_mode)

    SetLidar(on) -> apply_lidar(model, on)

    SetAscii(text) -> {
      persist_ascii(text)
      let maze = ascii_ray.parse_maze(text)
      let player = ascii_ray.spawn_player(maze)
      // New maze → wipe memory so stale walls don't linger.
      persist_memory([])
      let maze_error = case ascii_ray.validate_maze(maze) {
        Ok(_) -> ""
        Error(msg) -> msg
      }
      let next =
        Model(
          ..model,
          ascii_text: text,
          maze:,
          player:,
          scan_points: [],
          pulse: False,
          error: maze_error,
        )
      case next.ascii_mode {
        True -> maze_frame(next, True)
        False -> #(next, effect.none())
      }
    }

    Scan ->
      case model.ascii_mode {
        False -> #(model, effect.none())
        True ->
          case ascii_ray.validate_maze(model.maze) {
            Error(msg) -> #(Model(..model, error: msg), effect.none())
            Ok(_) -> do_scan(model)
          }
      }

    ClearPulse -> {
      let next = Model(..model, pulse: False)
      case next.ascii_mode {
        True -> maze_frame(next, False)
        False -> #(next, effect.none())
      }
    }

    Key(k) ->
      case k {
        // Mode toggle works even when lidar is off.
        "l" | "L" -> handle_key(model, k)
        _ ->
          case model.ascii_mode {
            False -> #(model, effect.none())
            True -> handle_key(model, k)
          }
      }

    MouseLook(dx) ->
      case model.ascii_mode {
        False -> #(model, effect.none())
        True -> {
          let player = ascii_ray.look_mouse(model.player, dx)
          let slider = angle_to_slider(player.angle)
          maze_frame(
            Model(..model, player:, shape_slider: slider, pulse: False),
            False,
          )
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
            Ok(source) -> open_drawing(model, name, source)
            Error(_) -> {
              let source = data.default_new_source()
              let drawings = list.append(model.drawings, [#(name, source)])
              open_drawing(
                Model(..model, drawings:, current: name, source:, error: ""),
                name,
                source,
              )
            }
          }
      }
    }

    SelectDrawing(name) -> {
      case list.key_find(model.drawings, name) {
        Error(_) -> #(model, effect.none())
        Ok(source) -> open_drawing(model, name, source)
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

fn open_drawing(
  model: Model,
  name: String,
  source: String,
) -> #(Model, Effect(Msg)) {
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

fn handle_key(model: Model, k: String) -> #(Model, Effect(Msg)) {
  case k {
    "l" | "L" -> apply_lidar(model, !model.ascii_mode)
    " " -> do_scan(model)
    "ArrowUp" | "w" | "W" -> {
      let player = ascii_ray.move(model.player, model.maze, 1.0)
      maze_frame(Model(..model, player:, pulse: False), False)
    }
    "ArrowDown" | "s" | "S" -> {
      let player = ascii_ray.move(model.player, model.maze, -1.0)
      maze_frame(Model(..model, player:, pulse: False), False)
    }
    "ArrowLeft" | "a" | "A" -> {
      let player = ascii_ray.turn(model.player, -1.0)
      let slider = angle_to_slider(player.angle)
      maze_frame(
        Model(..model, player:, shape_slider: slider, pulse: False),
        False,
      )
    }
    "ArrowRight" | "d" | "D" -> {
      let player = ascii_ray.turn(model.player, 1.0)
      let slider = angle_to_slider(player.angle)
      maze_frame(
        Model(..model, player:, shape_slider: slider, pulse: False),
        False,
      )
    }
    _ -> #(model, effect.none())
  }
}

fn angle_to_slider(angle: Float) -> Int {
  let t = angle /. 6.283185307179586 *. 100.0
  let n = float.truncate(t) % 100
  case n < 0 {
    True -> n + 100
    False -> n
  }
}

// ── View ──────────────────────────────────────────────────────────────────

pub fn view(model: Model) -> Element(Msg) {
  let app_class = case model.code_open {
    True -> "app"
    False -> "app code-hidden"
  }
  html.div(
    [
      attr.class(app_class),
      attr.attribute(
        "data-lidar",
        case model.ascii_mode {
          True -> "on"
          False -> "off"
        },
      ),
    ],
    [
    html.div([attr.class("code-col")], [
      editor.view_panel(ToggleCode),
      view_ascii_panel(model),
    ]),
    view_anim(model),
  ])
}

fn view_ascii_panel(model: Model) -> Element(Msg) {
  let mode_label = case model.ascii_mode {
    True -> "Lidar maze: ON"
    False -> "Lidar maze: OFF"
  }
  let #(rows, cols) = ascii_ray.maze_dims(model.maze)
  let dim = int.to_string(rows) <> " × " <> int.to_string(cols) <> " maze"
  html.div([attr.class("ascii-panel")], [
    html.div([attr.class("ascii-header")], [
      html.button(
        [
          attr.class(case model.ascii_mode {
            True -> "icon-btn ascii-toggle on"
            False -> "icon-btn ascii-toggle"
          }),
          attr.attribute("title", "Toggle explorable lidar maze"),
          attr.attribute("data-action", "lidar-toggle"),
        ],
        [html.text(mode_label)],
      ),
      html.span([attr.class("ascii-dim")], [html.text(dim)]),
    ]),
    view_player_hud(model),
    html.p([attr.class("ascii-hint")], [
      html.text(
        "E must sit on the outer edge. Density slider = rays per spray. You are @. L · WASD · look · Scan/Space.",
      ),
    ]),
    html.div([attr.class("ascii-actions")], [
      html.button(
        [
          attr.class("icon-btn scan-btn"),
          attr.attribute("title", "Lidar scan"),
          attr.attribute("data-action", "lidar-scan"),
        ],
        [html.text("Scan")],
      ),
    ]),
    case model.ascii_mode {
      True ->
        html.pre([attr.class("ascii-map"), attr.attribute("aria-label", "Live maze with player")], [
          html.text(ascii_ray.map_with_player(model.ascii_text, model.player)),
        ])
      False -> element.none()
    },
    html.textarea(
      [
        attr.class("ascii-input"),
        attr.attribute("spellcheck", "false"),
        attr.rows(case model.ascii_mode {
          True -> 4
          False -> 8
        }),
        event.on_input(SetAscii),
      ],
      model.ascii_text,
    ),
  ])
}

fn view_player_hud(model: Model) -> Element(Msg) {
  let #(col, row) = ascii_ray.player_cell(model.player)
  let ch = ascii_ray.cell_char(model.maze, col, row)
  let face = ascii_ray.facing_arrow(model.player.angle)
  let won = ascii_ray.at_exit(model.maze, model.player)
  let label = case won {
    True ->
      "ESCAPED · array["
      <> int.to_string(row)
      <> "]["
      <> int.to_string(col)
      <> "] = 'E'"
    False ->
      "array["
      <> int.to_string(row)
      <> "]["
      <> int.to_string(col)
      <> "] = '"
      <> ch
      <> "'  "
      <> face
      <> "  ("
      <> float_str(model.player.x)
      <> ", "
      <> float_str(model.player.y)
      <> ")"
  }
  html.div(
    [
      attr.class(case model.ascii_mode {
        True ->
          case won {
            True -> "ascii-hud on win"
            False -> "ascii-hud on"
          }
        False -> "ascii-hud"
      }),
      attr.attribute("title", "Your cell in maze[row][col]"),
    ],
    [html.text(label)],
  )
}

fn float_str(x: Float) -> String {
  let n = float.truncate(x *. 10.0)
  let whole = n / 10
  let frac = int.absolute_value(n % 10)
  int.to_string(whole) <> "." <> int.to_string(frac)
}

fn view_anim(model: Model) -> Element(Msg) {
  html.div([attr.class("canvas-area")], [
    view_reveal_code(model),
    html.canvas([attr.id("animation-canvas"), attr.class("canvas")]),
    case model.ascii_mode {
      True -> view_canvas_pos(model)
      False -> element.none()
    },
    view_error(model),
    view_controls(model),
  ])
}

fn view_canvas_pos(model: Model) -> Element(Msg) {
  let #(col, row) = ascii_ray.player_cell(model.player)
  let ch = ascii_ray.cell_char(model.maze, col, row)
  let face = ascii_ray.facing_arrow(model.player.angle)
  let won = ascii_ray.at_exit(model.maze, model.player)
  html.div(
    [
      attr.class(case won {
        True -> "canvas-pos win"
        False -> "canvas-pos"
      }),
    ],
    [
      html.text(case won {
        True ->
          "ESCAPED [" <> int.to_string(row) <> "][" <> int.to_string(col) <> "]"
        False ->
          "["
          <> int.to_string(row)
          <> "]["
          <> int.to_string(col)
          <> "] '"
          <> ch
          <> "' "
          <> face
      }),
    ],
  )
}

fn view_error(model: Model) -> Element(Msg) {
  case model.error {
    "" -> element.none()
    msg -> html.pre([attr.class("error-banner")], [html.text(msg)])
  }
}

fn view_controls(model: Model) -> Element(Msg) {
  let shape_label = case model.ascii_mode {
    True -> "Look"
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
    case model.ascii_mode {
      True ->
        view_slider(
          "Density",
          "density-slider",
          int.to_string(model.scan_density),
          "0",
          "100",
          "1",
          fn(v) {
            SetScanDensity(result.unwrap(int.parse(v), model.scan_density))
          },
        )
      False -> element.none()
    },
    view_slider(
      "Speed",
      "speed-slider",
      float.to_string(model.speed),
      "-2",
      "3",
      "0.1",
      fn(v) { SetSpeed(parse_speed(v, model.speed)) },
    ),
    html.div([attr.class("playback")], [
      html.button(
        [
          attr.class("icon-btn scan-btn"),
          attr.attribute("title", "Lidar scan"),
          attr.attribute("data-action", "lidar-scan"),
          attr.attribute(
            "style",
            case model.ascii_mode {
              True -> ""
              False -> "opacity:0.4"
            },
          ),
        ],
        [html.text("Scan")],
      ),
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

/// Browser range inputs often emit "-2" / "3" without a decimal; Gleam's
/// `float.parse` rejects those, so fall back through `int.parse`.
fn parse_speed(raw: String, fallback: Float) -> Float {
  case float.parse(raw) {
    Ok(n) -> n
    Error(_) ->
      case int.parse(raw) {
        Ok(n) -> int.to_float(n)
        Error(_) -> fallback
      }
  }
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
