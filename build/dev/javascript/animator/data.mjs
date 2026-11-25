//# sourceMappingURL=data.mjs.map
import * as $json from "../gleam_json/gleam/json.mjs";
import * as $decode from "../gleam_stdlib/gleam/dynamic/decode.mjs";
import * as $list from "../gleam_stdlib/gleam/list.mjs";
import * as $result from "../gleam_stdlib/gleam/result.mjs";
import {
  storageGet as storage_get,
  storageSet as storage_set,
  promptDrawingName as prompt_drawing_name,
} from "./data_ffi.mjs";
import * as $examples from "./examples.mjs";
import {
  Ok,
  Error,
  Empty as $Empty,
  List$Empty$const as $List$Empty$const,
  prepend as listPrepend,
  CustomType as $CustomType,
} from "./gleam.mjs";

export { prompt_drawing_name, storage_get, storage_set };

export class Library extends $CustomType {
  constructor(drawings, current) {
    super();
    this.drawings = drawings;
    this.current = current;
  }
}
export const Library$Library = (drawings, current) =>
  new Library(drawings, current);
export const Library$isLibrary = (value) => value instanceof Library;
export const Library$Library$drawings = (value) => value.drawings;
export const Library$Library$0 = (value) => value.drawings;
export const Library$Library$current = (value) => value.current;
export const Library$Library$1 = (value) => value.current;

const storage_key = "animator-library";

function default_library() {
  let drawings = $examples.all;
  let _block;
  if (drawings instanceof $Empty) {
    _block = "untitled";
  } else {
    let name = drawings.head[0];
    _block = name;
  }
  let current = _block;
  return new Library(drawings, current);
}

function parse_library(raw) {
  let drawing_decoder = $decode.field(
    "name",
    $decode.string,
    (name) => {
      return $decode.field(
        "source",
        $decode.string,
        (source) => { return $decode.success([name, source]); },
      );
    },
  );
  let decoder = $decode.field(
    "current",
    $decode.string,
    (current) => {
      return $decode.field(
        "drawings",
        $decode.list(drawing_decoder),
        (drawings) => { return $decode.success(new Library(drawings, current)); },
      );
    },
  );
  let $ = $json.parse(raw, decoder);
  if ($ instanceof Ok) {
    if ($[0].drawings instanceof $Empty) {
      return new Error(undefined);
    } else {
      let lib = $[0];
      let _block;
      let $1 = $list.key_find(lib.drawings, lib.current);
      if ($1 instanceof Ok) {
        _block = lib.current;
      } else {
        let $2 = lib.drawings;
        if ($2 instanceof $Empty) {
          _block = lib.current;
        } else {
          let name = $2.head[0];
          _block = name;
        }
      }
      let current = _block;
      return new Ok(new Library(lib.drawings, current));
    }
  } else {
    return new Error(undefined);
  }
}

/**
 * Load the library from localStorage, or the starter examples if none is saved.
 */
export function load_library() {
  let $ = storage_get(storage_key);
  if ($ instanceof Ok) {
    let raw = $[0];
    let $1 = parse_library(raw);
    if ($1 instanceof Ok) {
      let lib = $1[0];
      return lib;
    } else {
      return default_library();
    }
  } else {
    return default_library();
  }
}

function encode_library(lib) {
  let drawings_json = $list.map(
    lib.drawings,
    (pair) => {
      return $json.object(
        listPrepend(
          ["name", $json.string(pair[0])],
          listPrepend(["source", $json.string(pair[1])], $List$Empty$const),
        ),
      );
    },
  );
  let _pipe = $json.object(
    listPrepend(
      ["current", $json.string(lib.current)],
      listPrepend(
        ["drawings", $json.preprocessed_array(drawings_json)],
        $List$Empty$const,
      ),
    ),
  );
  return $json.to_string(_pipe);
}

/**
 * Persist the full library (every drawing's source plus the open name).
 */
export function save_library(lib) {
  return storage_set(storage_key, encode_library(lib));
}

export function default_new_source() {
  return "fn draw(shape_slider: Int) -> List(Path) {\n  [Path(Line(Point(0, 0), Point(100, 100)), 0, 10, 2)]\n}\n";
}

/**
 * Source of the currently open drawing, or a tiny default if the name is missing.
 */
export function current_source(lib) {
  let _pipe = $list.key_find(lib.drawings, lib.current);
  return $result.unwrap(_pipe, default_new_source());
}

/**
 * Replace the source of `name` (or leave the list unchanged if `name` is unknown).
 */
export function update_drawing(drawings, name, source) {
  return $list.map(
    drawings,
    (pair) => {
      let $ = pair[0] === name;
      if ($) {
        return [name, source];
      } else {
        return pair;
      }
    },
  );
}
