//// The library of saved drawings. A drawing is a name and the source of its draw
//// function.

import examples
import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result

// ── localStorage (data_ffi.mjs) ───────────────────────────────────────────────

/// The string stored in localStorage under key, or an Error if there isn't one.
@external(javascript, "./data_ffi.mjs", "storageGet")
pub fn storage_get(key: String) -> Result(String, Nil)

/// Store value in localStorage under key, replacing anything already there. If that
/// isn't possible, this logs the reason to the browser console.
@external(javascript, "./data_ffi.mjs", "storageSet")
pub fn storage_set(key: String, value: String) -> Nil

// ── The new-drawing prompt (data_ffi.mjs) ─────────────────────────────────────

/// Prompt the user to name a new drawing; "" (empty string) means they
/// cancelled or left it blank.
@external(javascript, "./data_ffi.mjs", "promptDrawingName")
pub fn prompt_drawing_name() -> String

const storage_key = "animator-library"

/// Named drawings plus which one is open in the editor.
pub type Library {
  Library(drawings: List(#(String, String)), current: String)
}

/// Load the library from localStorage, or the starter examples if none is saved.
pub fn load_library() -> Library {
  case storage_get(storage_key) {
    Error(_) -> default_library()
    Ok(raw) ->
      case parse_library(raw) {
        Ok(lib) -> lib
        Error(_) -> default_library()
      }
  }
}

/// Persist the full library (every drawing's source plus the open name).
pub fn save_library(lib: Library) -> Nil {
  storage_set(storage_key, encode_library(lib))
}

/// Source of the currently open drawing, or a tiny default if the name is missing.
pub fn current_source(lib: Library) -> String {
  list.key_find(lib.drawings, lib.current)
  |> result.unwrap(default_new_source())
}

/// Replace the source of `name` (or leave the list unchanged if `name` is unknown).
pub fn update_drawing(
  drawings: List(#(String, String)),
  name: String,
  source: String,
) -> List(#(String, String)) {
  list.map(drawings, fn(pair) {
    case pair.0 == name {
      True -> #(name, source)
      False -> pair
    }
  })
}

pub fn default_new_source() -> String {
  "fn draw(shape_slider: Int) -> List(Path) {\n  [Path(Line(Point(0, 0), Point(100, 100)), 0, 10, 2)]\n}\n"
}

fn default_library() -> Library {
  let drawings = examples.all
  let current = case drawings {
    [#(name, _), ..] -> name
    [] -> "untitled"
  }
  Library(drawings:, current:)
}

fn encode_library(lib: Library) -> String {
  let drawings_json =
    list.map(lib.drawings, fn(pair) {
      json.object([
        #("name", json.string(pair.0)),
        #("source", json.string(pair.1)),
      ])
    })
  json.object([
    #("current", json.string(lib.current)),
    #("drawings", json.preprocessed_array(drawings_json)),
  ])
  |> json.to_string
}

fn parse_library(raw: String) -> Result(Library, Nil) {
  let drawing_decoder = {
    use name <- decode.field("name", decode.string)
    use source <- decode.field("source", decode.string)
    decode.success(#(name, source))
  }
  let decoder = {
    use current <- decode.field("current", decode.string)
    use drawings <- decode.field("drawings", decode.list(drawing_decoder))
    decode.success(Library(drawings:, current:))
  }
  case json.parse(raw, decoder) {
    Ok(Library(drawings: [], ..)) -> Error(Nil)
    Ok(lib) -> {
      // Keep the open drawing if it still exists; otherwise open the first one.
      let current = case list.key_find(lib.drawings, lib.current) {
        Ok(_) -> lib.current
        Error(_) ->
          case lib.drawings {
            [#(name, _), ..] -> name
            [] -> lib.current
          }
      }
      Ok(Library(..lib, current:))
    }
    Error(_) -> Error(Nil)
  }
}
