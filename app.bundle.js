// ../prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    return toList(array3, tail);
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  countLength() {
    let current = this;
    let length3 = 0;
    while (current) {
      current = current.tail;
      length3++;
    }
    return length3 - 1;
  }
};
function prepend(element4, tail) {
  return new NonEmpty(element4, tail);
}
function toList(elements, tail) {
  let t = tail || List$Empty$const;
  for (let i = elements.length - 1; i >= 0; --i) {
    t = new NonEmpty(elements[i], t);
  }
  return t;
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var List$Empty$const = new Empty();
var List$Empty = () => List$Empty$const;
var List$isEmpty = (value2) => value2 instanceof Empty;
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var List$NonEmpty = (head, tail) => new NonEmpty(head, tail);
var List$isNonEmpty = (value2) => value2 instanceof NonEmpty;
var List$NonEmpty$first = (value2) => value2.head;
var List$NonEmpty$rest = (value2) => value2.tail;
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index4) {
    if (index4 < 0 || index4 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index4);
  }
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated
   *
   * @returns {number}
   */
  get length() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index4) {
  if (bitOffset === 0) {
    return buffer[index4] ?? 0;
  } else {
    const a = buffer[index4] << bitOffset & 255;
    const b = buffer[index4 + 1] >> 8 - bitOffset;
    return a | b;
  }
}
var UtfCodepoint = class {
  constructor(value2) {
    this.value = value2;
  }
};
var Result = class _Result extends CustomType {
  static isResult(data2) {
    return data2 instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value2) {
    super();
    this[0] = value2;
  }
  isOk() {
    return true;
  }
};
var Result$Ok = (value2) => new Ok(value2);
var Result$isOk = (value2) => value2 instanceof Ok;
var Result$Ok$0 = (value2) => value2[0];
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  isOk() {
    return false;
  }
};
var Result$Error = (detail) => new Error(detail);
var Result$isError = (value2) => value2 instanceof Error;
function isEqual(x, y) {
  let values3 = [x, y];
  while (values3.length) {
    let a = values3.pop();
    let b = values3.pop();
    if (a === b) continue;
    if (!isObject(a) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys2, get4] = getters(a);
    const ka = keys2(a);
    const kb = keys2(b);
    if (ka.length !== kb.length) return false;
    for (let k of ka) {
      values3.push(get4(a, k), get4(b, k));
    }
  }
  return true;
}
function getters(object4) {
  if (object4 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object4 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return !(a instanceof BitArray) && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c)) return false;
  return a.constructor === b.constructor;
}
function remainderInt(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a % b;
  }
}
function divideInt(a, b) {
  return Math.trunc(divideFloat(a, b));
}
function divideFloat(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a / b;
  }
}
function makeError(variant, file, module2, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.file = file;
  error.module = module2;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra) error[k] = extra[k];
  return error;
}

// ../gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Order$Lt$const = new Lt();
var Order$Lt = () => Order$Lt$const;
var Eq = class extends CustomType {
};
var Order$Eq$const = new Eq();
var Order$Eq = () => Order$Eq$const;
var Gt = class extends CustomType {
};
var Order$Gt$const = new Gt();
var Order$Gt = () => Order$Gt$const;

// ../gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var None = class extends CustomType {
};
var Option$None$const = new None();

// ../gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = /* @__PURE__ */ new DataView(
  /* @__PURE__ */ new ArrayBuffer(8)
);
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code2 = o.hashCode(o);
      if (typeof code2 === "number") {
        return code2;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null) return 1108378658;
  if (u === void 0) return 1108378659;
  if (u === true) return 1108378657;
  if (u === false) return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var Dict = class {
  constructor(size3, root2) {
    this.size = size3;
    this.root = root2;
  }
};
var bits = 5;
var mask = (1 << bits) - 1;
var noElementMarker = /* @__PURE__ */ Symbol();
var generationKey = /* @__PURE__ */ Symbol();
var emptyNode = /* @__PURE__ */ newNode(0);
var emptyDict = /* @__PURE__ */ new Dict(0, emptyNode);
var errorNil = /* @__PURE__ */ Result$Error(void 0);
function makeNode(generation, datamap, nodemap, data2) {
  return {
    // A node is a high-arity (32 in practice) hybrid tree node.
    // Hybrid means that it stores data directly as well as pointers to child nodes.
    //
    // Each node contains 2 bitmaps:
    // - The datamap has a bit set if that slot in the node contains direct data
    // - The nodemap has a bit set if that slot in the node contains another node.
    //
    // Both are exclusive to on another, so datamap & nodemap == 0.
    //
    // Every key/hash value directly correlates to a specific bit by using a trie
    // suffix (least significant bits first) encoding.
    // For example, if the last 5 bits of the hash are 1101, the bit to check for
    // that value is the 13th bit.
    datamap,
    nodemap,
    // The slots itself are stored in a single contiguous array that contains
    // both direct k/v-pairs and child nodes.
    //
    // The direct children come first, followed by the child nodes in _reverse order_:
    //
    //              7654321
    //     datamap: 1000100
    //     nodemap:   10011
    //     data: [key3, value3, key7, value7, child5, child2, child1]
    //            ------------------------->  <---------------------
    //                     datamap                    nodemap
    //
    // Every `1` bit in the datamap corresponds to a pair of [key, value] entries,
    // and every `1` bit in the nodemap corresponds to a child node entry.
    //
    // Children are stored in reverse order to avoid having to store or calculate an
    // "offset" value to skip over the direct children.
    data: data2,
    // The generation is used to track which nodes need to be copied during transient updates.
    // Using a symbol here makes `isEqual` ignore this field.
    [generationKey]: generation
  };
}
function newNode(generation) {
  return makeNode(generation, 0, 0, []);
}
function copyNode(node, generation) {
  if (node[generationKey] === generation) {
    return node;
  }
  const newData = node.data.slice(0);
  return makeNode(generation, node.datamap, node.nodemap, newData);
}
function copyAndSet(node, generation, idx, val) {
  if (node.data[idx] === val) {
    return node;
  }
  node = copyNode(node, generation);
  node.data[idx] = val;
  return node;
}
function copyAndInsertPair(node, generation, bit, idx, key, val) {
  const data2 = node.data;
  const length3 = data2.length;
  const newData = new Array(length3 + 2);
  let readIndex = 0;
  let writeIndex = 0;
  while (readIndex < idx) newData[writeIndex++] = data2[readIndex++];
  newData[writeIndex++] = key;
  newData[writeIndex++] = val;
  while (readIndex < length3) newData[writeIndex++] = data2[readIndex++];
  return makeNode(generation, node.datamap | bit, node.nodemap, newData);
}
function make() {
  return emptyDict;
}
function size(dict3) {
  return dict3.size;
}
function get(dict3, key) {
  const result = lookup(dict3.root, key, getHash(key));
  return result !== noElementMarker ? Result$Ok(result) : errorNil;
}
function lookup(node, key, hash) {
  for (let shift = 0; shift < 32; shift += bits) {
    const data2 = node.data;
    const bit = hashbit(hash, shift);
    if (node.nodemap & bit) {
      node = data2[data2.length - 1 - index(node.nodemap, bit)];
    } else if (node.datamap & bit) {
      const dataidx = Math.imul(index(node.datamap, bit), 2);
      return isEqual(key, data2[dataidx]) ? data2[dataidx + 1] : noElementMarker;
    } else {
      return noElementMarker;
    }
  }
  const overflow = node.data;
  for (let i = 0; i < overflow.length; i += 2) {
    if (isEqual(key, overflow[i])) {
      return overflow[i + 1];
    }
  }
  return noElementMarker;
}
function toTransient(dict3) {
  return {
    generation: nextGeneration(dict3),
    root: dict3.root,
    size: dict3.size,
    dict: dict3
  };
}
function fromTransient(transient) {
  if (transient.root === transient.dict.root) {
    return transient.dict;
  }
  return new Dict(transient.size, transient.root);
}
function nextGeneration(dict3) {
  const root2 = dict3.root;
  if (root2[generationKey] < Number.MAX_SAFE_INTEGER) {
    return root2[generationKey] + 1;
  }
  const queue = [root2];
  while (queue.length) {
    const node = queue.pop();
    node[generationKey] = 0;
    const nodeStart = data.length - popcount(node.nodemap);
    for (let i = nodeStart; i < node.data.length; ++i) {
      queue.push(node.data[i]);
    }
  }
  return 1;
}
function destructiveTransientInsert(key, value2, transient) {
  const hash = getHash(key);
  transient.root = insertIntoNode(transient, transient.root, key, value2, hash, 0);
  return transient;
}
function destructiveTransientUpdateWith(key, fun, value2, transient) {
  const hash = getHash(key);
  const existing = lookup(transient.root, key, hash);
  if (existing !== noElementMarker) {
    value2 = fun(existing);
  }
  transient.root = insertIntoNode(transient, transient.root, key, value2, hash, 0);
  return transient;
}
function insertIntoNode(transient, node, key, value2, hash, shift) {
  const data2 = node.data;
  const generation = transient.generation;
  if (shift > 32) {
    for (let i = 0; i < data2.length; i += 2) {
      if (isEqual(key, data2[i])) {
        return copyAndSet(node, generation, i + 1, value2);
      }
    }
    transient.size += 1;
    return copyAndInsertPair(node, generation, 0, data2.length, key, value2);
  }
  const bit = hashbit(hash, shift);
  if (node.nodemap & bit) {
    const nodeidx2 = data2.length - 1 - index(node.nodemap, bit);
    let child3 = data2[nodeidx2];
    child3 = insertIntoNode(transient, child3, key, value2, hash, shift + bits);
    return copyAndSet(node, generation, nodeidx2, child3);
  }
  const dataidx = Math.imul(index(node.datamap, bit), 2);
  if ((node.datamap & bit) === 0) {
    transient.size += 1;
    return copyAndInsertPair(node, generation, bit, dataidx, key, value2);
  }
  if (isEqual(key, data2[dataidx])) {
    return copyAndSet(node, generation, dataidx + 1, value2);
  }
  const childShift = shift + bits;
  let child2 = emptyNode;
  child2 = insertIntoNode(transient, child2, key, value2, hash, childShift);
  const key2 = data2[dataidx];
  const value22 = data2[dataidx + 1];
  const hash2 = getHash(key2);
  child2 = insertIntoNode(transient, child2, key2, value22, hash2, childShift);
  transient.size -= 1;
  const length3 = data2.length;
  const nodeidx = length3 - 1 - index(node.nodemap, bit);
  const newData = new Array(length3 - 1);
  let readIndex = 0;
  let writeIndex = 0;
  while (readIndex < dataidx) newData[writeIndex++] = data2[readIndex++];
  readIndex += 2;
  while (readIndex <= nodeidx) newData[writeIndex++] = data2[readIndex++];
  newData[writeIndex++] = child2;
  while (readIndex < length3) newData[writeIndex++] = data2[readIndex++];
  return makeNode(generation, node.datamap ^ bit, node.nodemap | bit, newData);
}
function fold(dict3, state, fun) {
  const queue = [dict3.root];
  while (queue.length) {
    const node = queue.pop();
    const data2 = node.data;
    const edgesStart = data2.length - popcount(node.nodemap);
    for (let i = 0; i < edgesStart; i += 2) {
      state = fun(state, data2[i], data2[i + 1]);
    }
    for (let i = edgesStart; i < data2.length; ++i) {
      queue.push(data2[i]);
    }
  }
  return state;
}
function popcount(n) {
  n -= n >>> 1 & 1431655765;
  n = (n & 858993459) + (n >>> 2 & 858993459);
  return Math.imul(n + (n >>> 4) & 252645135, 16843009) >>> 24;
}
function index(bitmap, bit) {
  return popcount(bitmap & bit - 1);
}
function hashbit(hash, shift) {
  return 1 << (hash >>> shift & mask);
}

// ../gleam_stdlib/gleam/dict.mjs
function from_list_loop(loop$transient, loop$list) {
  while (true) {
    let transient = loop$transient;
    let list5 = loop$list;
    if (list5 instanceof Empty) {
      return fromTransient(transient);
    } else {
      let rest = list5.tail;
      let key = list5.head[0];
      let value2 = list5.head[1];
      loop$transient = destructiveTransientInsert(key, value2, transient);
      loop$list = rest;
    }
  }
}
function from_list(list5) {
  return from_list_loop(toTransient(make()), list5);
}
function do_combine(combine2, left, right) {
  let _block;
  let $1 = size(left) >= size(right);
  if ($1) {
    _block = [left, right, combine2];
  } else {
    _block = [right, left, (k, l, r) => {
      return combine2(k, r, l);
    }];
  }
  let $ = _block;
  let big = $[0];
  let small = $[1];
  let combine$1 = $[2];
  let _pipe = toTransient(big);
  let _pipe$1 = fold(
    small,
    _pipe,
    (transient, key, value2) => {
      let update3 = (existing) => {
        return combine$1(key, existing, value2);
      };
      return destructiveTransientUpdateWith(key, update3, value2, transient);
    }
  );
  return fromTransient(_pipe$1);
}
function combine(dict3, other, fun) {
  return do_combine((_, l, r) => {
    return fun(l, r);
  }, dict3, other);
}
function merge(dict3, new_entries) {
  return combine(dict3, new_entries, (_, new_entry) => {
    return new_entry;
  });
}
function each(dict3, fun) {
  return fold(
    dict3,
    void 0,
    (nil, k, v) => {
      fun(k, v);
      return nil;
    }
  );
}

// ../gleam_stdlib/gleam/int.mjs
function absolute_value(x) {
  let $ = x >= 0;
  if ($) {
    return x;
  } else {
    return x * -1;
  }
}
function compare(a, b) {
  let $ = a === b;
  if ($) {
    return Order$Eq$const;
  } else {
    let $1 = a < b;
    if ($1) {
      return Order$Lt$const;
    } else {
      return Order$Gt$const;
    }
  }
}
function modulo(dividend, divisor) {
  if (divisor === 0) {
    return new Error(void 0);
  } else {
    let remainder$1 = remainderInt(dividend, divisor);
    let $ = remainder$1 * divisor < 0;
    if ($) {
      return new Ok(remainder$1 + divisor);
    } else {
      return new Ok(remainder$1);
    }
  }
}

// ../gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Sorting$Ascending$const = new Ascending();
var Descending = class extends CustomType {
};
var Sorting$Descending$const = new Descending();
function length_loop(loop$list, loop$count) {
  while (true) {
    let list5 = loop$list;
    let count2 = loop$count;
    if (list5 instanceof Empty) {
      return count2;
    } else {
      let list$1 = list5.tail;
      loop$list = list$1;
      loop$count = count2 + 1;
    }
  }
}
function length(list5) {
  return length_loop(list5, 0);
}
function count_loop(loop$list, loop$predicate, loop$acc) {
  while (true) {
    let list5 = loop$list;
    let predicate = loop$predicate;
    let acc = loop$acc;
    if (list5 instanceof Empty) {
      return acc;
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      let $ = predicate(first$1);
      if ($) {
        loop$list = rest$1;
        loop$predicate = predicate;
        loop$acc = acc + 1;
      } else {
        loop$list = rest$1;
        loop$predicate = predicate;
        loop$acc = acc;
      }
    }
  }
}
function count(list5, predicate) {
  return count_loop(list5, predicate, 0);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list5) {
  return reverse_and_prepend(list5, List$Empty$const);
}
function contains(loop$list, loop$elem) {
  while (true) {
    let list5 = loop$list;
    let elem = loop$elem;
    if (list5 instanceof Empty) {
      return false;
    } else {
      let first$1 = list5.head;
      if (isEqual(first$1, elem)) {
        return true;
      } else {
        let rest$1 = list5.tail;
        loop$list = rest$1;
        loop$elem = elem;
      }
    }
  }
}
function first(list5) {
  if (list5 instanceof Empty) {
    return new Error(void 0);
  } else {
    let first$1 = list5.head;
    return new Ok(first$1);
  }
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list5 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list5 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      let _block;
      let $ = fun(first$1);
      if ($) {
        _block = prepend(first$1, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list5, predicate) {
  return filter_loop(list5, predicate, List$Empty$const);
}
function filter_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list5 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list5 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      let _block;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        let first$2 = $[0];
        _block = prepend(first$2, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter_map(list5, fun) {
  return filter_map_loop(list5, fun, List$Empty$const);
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list5 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list5 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list5, fun) {
  return map_loop(list5, fun, List$Empty$const);
}
function index_map_loop(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list5 = loop$list;
    let fun = loop$fun;
    let index4 = loop$index;
    let acc = loop$acc;
    if (list5 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      let acc$1 = prepend(fun(first$1, index4), acc);
      loop$list = rest$1;
      loop$fun = fun;
      loop$index = index4 + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list5, fun) {
  return index_map_loop(list5, fun, 0, List$Empty$const);
}
function try_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list5 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list5 instanceof Empty) {
      return new Ok(reverse(acc));
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        let first$2 = $[0];
        loop$list = rest$1;
        loop$fun = fun;
        loop$acc = prepend(first$2, acc);
      } else {
        return $;
      }
    }
  }
}
function try_map(list5, fun) {
  return try_map_loop(list5, fun, List$Empty$const);
}
function drop(loop$list, loop$n) {
  while (true) {
    let list5 = loop$list;
    let n = loop$n;
    let $ = n <= 0;
    if ($) {
      return list5;
    } else {
      if (list5 instanceof Empty) {
        return list5;
      } else {
        let rest$1 = list5.tail;
        loop$list = rest$1;
        loop$n = n - 1;
      }
    }
  }
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first2 = loop$first;
    let second = loop$second;
    if (first2 instanceof Empty) {
      return second;
    } else {
      let first$1 = first2.head;
      let rest$1 = first2.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first2, second) {
  return append_loop(reverse(first2), second);
}
function prepend2(list5, item) {
  return prepend(item, list5);
}
function flatten_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists instanceof Empty) {
      return reverse(acc);
    } else {
      let list5 = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list5, acc);
    }
  }
}
function flatten(lists) {
  return flatten_loop(lists, List$Empty$const);
}
function flat_map(list5, fun) {
  return flatten(map2(list5, fun));
}
function fold2(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list5 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list5 instanceof Empty) {
      return initial;
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function try_fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list5 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list5 instanceof Empty) {
      return new Ok(initial);
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      let $ = fun(initial, first$1);
      if ($ instanceof Ok) {
        let result = $[0];
        loop$list = rest$1;
        loop$initial = result;
        loop$fun = fun;
      } else {
        return $;
      }
    }
  }
}
function find(loop$list, loop$is_desired) {
  while (true) {
    let list5 = loop$list;
    let is_desired = loop$is_desired;
    if (list5 instanceof Empty) {
      return new Error(void 0);
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      let $ = is_desired(first$1);
      if ($) {
        return new Ok(first$1);
      } else {
        loop$list = rest$1;
        loop$is_desired = is_desired;
      }
    }
  }
}
function find_map(loop$list, loop$fun) {
  while (true) {
    let list5 = loop$list;
    let fun = loop$fun;
    if (list5 instanceof Empty) {
      return new Error(void 0);
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        return $;
      } else {
        loop$list = rest$1;
        loop$fun = fun;
      }
    }
  }
}
function any(loop$list, loop$predicate) {
  while (true) {
    let list5 = loop$list;
    let predicate = loop$predicate;
    if (list5 instanceof Empty) {
      return false;
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      let $ = predicate(first$1);
      if ($) {
        return $;
      } else {
        loop$list = rest$1;
        loop$predicate = predicate;
      }
    }
  }
}
function zip_loop(loop$one, loop$other, loop$acc) {
  while (true) {
    let one = loop$one;
    let other = loop$other;
    let acc = loop$acc;
    if (one instanceof Empty) {
      return reverse(acc);
    } else if (other instanceof Empty) {
      return reverse(acc);
    } else {
      let first_one = one.head;
      let rest_one = one.tail;
      let first_other = other.head;
      let rest_other = other.tail;
      loop$one = rest_one;
      loop$other = rest_other;
      loop$acc = prepend([first_one, first_other], acc);
    }
  }
}
function zip(list5, other) {
  return zip_loop(list5, other, List$Empty$const);
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list5 = list22;
      return reverse_and_prepend(list5, acc);
    } else if (list22 instanceof Empty) {
      let list5 = list1;
      return reverse_and_prepend(list5, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let descending1 = sequences2.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(
          descending1,
          descending2,
          compare4,
          List$Empty$const
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list5 = list22;
      return reverse_and_prepend(list5, acc);
    } else if (list22 instanceof Empty) {
      let list5 = list1;
      return reverse_and_prepend(list5, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let ascending1 = sequences2.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(
          ascending1,
          ascending2,
          compare4,
          List$Empty$const
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare4 = loop$compare;
    if (sequences2 instanceof Empty) {
      return sequences2;
    } else if (direction instanceof Ascending) {
      if (sequences2.tail instanceof Empty) {
        let sequence = sequences2.head;
        return sequence;
      } else {
        let sequences$1 = merge_ascending_pairs(
          sequences2,
          compare4,
          List$Empty$const
        );
        loop$sequences = sequences$1;
        loop$direction = Sorting$Descending$const;
        loop$compare = compare4;
      }
    } else if (sequences2.tail instanceof Empty) {
      let sequence = sequences2.head;
      return reverse(sequence);
    } else {
      let sequences$1 = merge_descending_pairs(
        sequences2,
        compare4,
        List$Empty$const
      );
      loop$sequences = sequences$1;
      loop$direction = Sorting$Ascending$const;
      loop$compare = compare4;
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list5 = loop$list;
    let compare4 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list5 instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list5.head;
      let rest$1 = list5.tail;
      let $ = compare4(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(prepend(new$1, List$Empty$const), acc$1);
          } else {
            let next2 = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare4(new$1, next2);
            if ($1 instanceof Lt) {
              _block$1 = Sorting$Ascending$const;
            } else if ($1 instanceof Eq) {
              _block$1 = Sorting$Ascending$const;
            } else {
              _block$1 = Sorting$Descending$const;
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare4;
            loop$growing = prepend(new$1, List$Empty$const);
            loop$direction = direction$1;
            loop$prev = next2;
            loop$acc = acc$1;
          }
        }
      } else if ($ instanceof Lt) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(prepend(new$1, List$Empty$const), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next2);
          if ($1 instanceof Lt) {
            _block$1 = Sorting$Ascending$const;
          } else if ($1 instanceof Eq) {
            _block$1 = Sorting$Ascending$const;
          } else {
            _block$1 = Sorting$Descending$const;
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = prepend(new$1, List$Empty$const);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Eq) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(prepend(new$1, List$Empty$const), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next2);
          if ($1 instanceof Lt) {
            _block$1 = Sorting$Ascending$const;
          } else if ($1 instanceof Eq) {
            _block$1 = Sorting$Ascending$const;
          } else {
            _block$1 = Sorting$Descending$const;
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = prepend(new$1, List$Empty$const);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      }
    }
  }
}
function sort(list5, compare4) {
  if (list5 instanceof Empty) {
    return list5;
  } else {
    let $ = list5.tail;
    if ($ instanceof Empty) {
      return list5;
    } else {
      let x = list5.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare4(x, y);
      if ($1 instanceof Lt) {
        _block = Sorting$Ascending$const;
      } else if ($1 instanceof Eq) {
        _block = Sorting$Ascending$const;
      } else {
        _block = Sorting$Descending$const;
      }
      let direction = _block;
      let sequences$1 = sequences(
        rest$1,
        compare4,
        prepend(x, List$Empty$const),
        direction,
        y,
        List$Empty$const
      );
      return merge_all(sequences$1, Sorting$Ascending$const, compare4);
    }
  }
}
function split_while_loop(loop$list, loop$f, loop$acc) {
  while (true) {
    let list5 = loop$list;
    let f = loop$f;
    let acc = loop$acc;
    if (list5 instanceof Empty) {
      return [reverse(acc), List$Empty$const];
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      let $ = f(first$1);
      if ($) {
        loop$list = rest$1;
        loop$f = f;
        loop$acc = prepend(first$1, acc);
      } else {
        return [reverse(acc), list5];
      }
    }
  }
}
function split_while(list5, predicate) {
  return split_while_loop(list5, predicate, List$Empty$const);
}
function key_find(keyword_list, desired_key) {
  return find_map(
    keyword_list,
    (keyword) => {
      let key = keyword[0];
      let value2 = keyword[1];
      let $ = isEqual(key, desired_key);
      if ($) {
        return new Ok(value2);
      } else {
        return new Error(void 0);
      }
    }
  );
}
function each2(loop$list, loop$f) {
  while (true) {
    let list5 = loop$list;
    let f = loop$f;
    if (list5 instanceof Empty) {
      return void 0;
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      f(first$1);
      loop$list = rest$1;
      loop$f = f;
    }
  }
}
function try_each(loop$list, loop$fun) {
  while (true) {
    let list5 = loop$list;
    let fun = loop$fun;
    if (list5 instanceof Empty) {
      return new Ok(void 0);
    } else {
      let first$1 = list5.head;
      let rest$1 = list5.tail;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        loop$list = rest$1;
        loop$fun = fun;
      } else {
        return $;
      }
    }
  }
}

// ../gleam_stdlib/gleam/string_tree.mjs
var All = class extends CustomType {
};
var Direction$All$const = new All();

// ../gleam_stdlib/gleam/string.mjs
var Leading = class extends CustomType {
};
var Direction$Leading$const = new Leading();
var Trailing = class extends CustomType {
};
var Direction$Trailing$const = new Trailing();
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map2(_pipe$2, identity);
  }
}
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string5 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string5;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}
function inspect2(term) {
  let _pipe = term;
  let _pipe$1 = inspect(_pipe);
  return identity(_pipe$1);
}

// ../gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
var DecodeError$DecodeError = (expected, found, path) => new DecodeError(expected, found, path);
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
var float2 = /* @__PURE__ */ new Decoder(decode_float);
var int2 = /* @__PURE__ */ new Decoder(decode_int);
var string2 = /* @__PURE__ */ new Decoder(decode_string);
function run(data2, decoder) {
  let $ = decoder.function(data2);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors instanceof Empty) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function run_dynamic_function(data2, name2, f) {
  let $ = f(data2);
  if ($ instanceof Ok) {
    let data$1 = $[0];
    return [data$1, List$Empty$const];
  } else {
    let placeholder = $[0];
    return [
      placeholder,
      prepend(
        new DecodeError(name2, classify_dynamic(data2), List$Empty$const),
        List$Empty$const
      )
    ];
  }
}
function decode_float(data2) {
  return run_dynamic_function(data2, "Float", float);
}
function map3(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data2 = $[0];
      let errors = $[1];
      return [transformer(data2), errors];
    }
  );
}
function decode_int(data2) {
  return run_dynamic_function(data2, "Int", int);
}
function decode_string(data2) {
  return run_dynamic_function(data2, "String", string);
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data2 = loop$data;
    let failure2 = loop$failure;
    let decoders = loop$decoders;
    if (decoders instanceof Empty) {
      return failure2;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data2);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        loop$data = data2;
        loop$failure = failure2;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first2, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first2.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function path_segment_to_string(key) {
  let decoder = one_of(
    string2,
    prepend(
      (() => {
        let _pipe = int2;
        return map3(_pipe, to_string);
      })(),
      prepend(
        (() => {
          let _pipe = float2;
          return map3(_pipe, float_to_string);
        })(),
        List$Empty$const
      )
    )
  );
  let $ = run(key, decoder);
  if ($ instanceof Ok) {
    let key$1 = $[0];
    return key$1;
  } else {
    return "<" + classify_dynamic(key) + ">";
  }
}
function push_path(layer, path) {
  let path$1 = map2(
    path,
    (key) => {
      let _pipe = key;
      let _pipe$1 = identity(_pipe);
      return path_segment_to_string(_pipe$1);
    }
  );
  let errors = map2(
    layer[1],
    (error) => {
      return new DecodeError(
        error.expected,
        error.found,
        append(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function list2(inner) {
  return new Decoder(
    (data2) => {
      return list(
        data2,
        inner.function,
        (p, k) => {
          return push_path(p, prepend(k, List$Empty$const));
        },
        0,
        List$Empty$const
      );
    }
  );
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data2 = loop$data;
    let handle_miss = loop$handle_miss;
    if (path instanceof Empty) {
      let _pipe = data2;
      let _pipe$1 = inner(_pipe);
      return push_path(_pipe$1, reverse(position));
    } else {
      let key = path.head;
      let path$1 = path.tail;
      let $ = index2(data2, key);
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 instanceof Some) {
          let data$1 = $1[0];
          loop$path = path$1;
          loop$position = prepend(key, position);
          loop$inner = inner;
          loop$data = data$1;
          loop$handle_miss = handle_miss;
        } else {
          return handle_miss(data2, prepend(key, position));
        }
      } else {
        let kind = $[0];
        let $1 = inner(data2);
        let default$ = $1[0];
        let _pipe = [
          default$,
          prepend(
            new DecodeError(kind, classify_dynamic(data2), List$Empty$const),
            List$Empty$const
          )
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next2) {
  return new Decoder(
    (data2) => {
      let $ = index3(
        field_path,
        List$Empty$const,
        field_decoder.function,
        data2,
        (data3, position) => {
          let $12 = field_decoder.function(data3);
          let default$ = $12[0];
          let _pipe = [
            default$,
            prepend(
              new DecodeError("Field", "Nothing", List$Empty$const),
              List$Empty$const
            )
          ];
          return push_path(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next2(out).function(data2);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}
function success(data2) {
  return new Decoder((_) => {
    return [data2, List$Empty$const];
  });
}
function field(field_name, field_decoder, next2) {
  return subfield(
    prepend(field_name, List$Empty$const),
    field_decoder,
    next2
  );
}

// ../gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
function identity(x) {
  return x;
}
function parse_int(value2) {
  if (/^[-+]?(\d+)$/.test(value2)) {
    return Result$Ok(parseInt(value2));
  } else {
    return Result$Error(Nil);
  }
}
function parse_float(value2) {
  if (/^[-+]?(\d+)\.(\d+)([eE][-+]?\d+)?$/.test(value2)) {
    return Result$Ok(parseFloat(value2));
  } else {
    return Result$Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function graphemes(string5) {
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    return arrayToList(Array.from(iterator).map((item) => item.segment));
  } else {
    return arrayToList(string5.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string5) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string5)[Symbol.iterator]();
  }
}
function pop_grapheme(string5) {
  let first2;
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    first2 = iterator.next().value?.segment;
  } else {
    first2 = string5.match(/./su)?.[0];
  }
  if (first2) {
    return Result$Ok([first2, string5.slice(first2.length)]);
  } else {
    return Result$Error(Nil);
  }
}
function split(xs, pattern2) {
  return arrayToList(xs.split(pattern2));
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function trim_end(string5) {
  return string5.replace(trim_end_regex, "");
}
function truncate(float3) {
  return Math.trunc(float3);
}
function random_uniform() {
  const random_uniform_result = Math.random();
  if (random_uniform_result === 1) {
    return random_uniform();
  }
  return random_uniform_result;
}
function classify_dynamic(data2) {
  if (typeof data2 === "string") {
    return "String";
  } else if (typeof data2 === "boolean") {
    return "Bool";
  } else if (isResult(data2)) {
    return "Result";
  } else if (isList(data2)) {
    return "List";
  } else if (data2 instanceof BitArray) {
    return "BitArray";
  } else if (data2 instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data2)) {
    return "Int";
  } else if (Array.isArray(data2)) {
    return `Array`;
  } else if (typeof data2 === "number") {
    return "Float";
  } else if (data2 === null) {
    return "Nil";
  } else if (data2 === void 0) {
    return "Nil";
  } else {
    const type = typeof data2;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function byte_size(string5) {
  return new TextEncoder().encode(string5).length;
}
var MIN_I32 = -(2 ** 31);
var MAX_I32 = 2 ** 31 - 1;
var U32 = 2 ** 32;
var MAX_SAFE = Number.MAX_SAFE_INTEGER;
var MIN_SAFE = Number.MIN_SAFE_INTEGER;
function inspect(v) {
  return new Inspector().inspect(v);
}
function float_to_string(float3) {
  const string5 = float3.toString().replace("+", "");
  if (string5.indexOf(".") >= 0) {
    return string5;
  } else {
    const index4 = string5.indexOf("e");
    if (index4 >= 0) {
      return string5.slice(0, index4) + ".0" + string5.slice(index4);
    } else {
      return string5 + ".0";
    }
  }
}
var Inspector = class {
  #references = /* @__PURE__ */ new Set();
  inspect(v) {
    const t = typeof v;
    if (v === true) return "True";
    if (v === false) return "False";
    if (v === null) return "//js(null)";
    if (v === void 0) return "Nil";
    if (t === "string") return this.#string(v);
    if (t === "bigint" || Number.isInteger(v)) return v.toString();
    if (t === "number") return float_to_string(v);
    if (v instanceof UtfCodepoint) return this.#utfCodepoint(v);
    if (v instanceof BitArray) return this.#bit_array(v);
    if (v instanceof RegExp) return `//js(${v})`;
    if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
    if (v instanceof globalThis.Error) return `//js(${v.toString()})`;
    if (v instanceof Function) {
      const args = [];
      for (const i of Array(v.length).keys())
        args.push(String.fromCharCode(i + 97));
      return `//fn(${args.join(", ")}) { ... }`;
    }
    if (this.#references.size === this.#references.add(v).size) {
      return "//js(circular reference)";
    }
    let printed;
    if (Array.isArray(v)) {
      printed = `#(${v.map((v2) => this.inspect(v2)).join(", ")})`;
    } else if (isList(v)) {
      printed = this.#list(v);
    } else if (v instanceof CustomType) {
      printed = this.#customType(v);
    } else if (v instanceof Dict) {
      printed = this.#dict(v);
    } else if (v instanceof Set) {
      return `//js(Set(${[...v].map((v2) => this.inspect(v2)).join(", ")}))`;
    } else {
      printed = this.#object(v);
    }
    this.#references.delete(v);
    return printed;
  }
  #object(v) {
    const name2 = Object.getPrototypeOf(v)?.constructor?.name || "Object";
    const props = [];
    for (const k of Object.keys(v)) {
      props.push(`${this.inspect(k)}: ${this.inspect(v[k])}`);
    }
    const body = props.length ? " " + props.join(", ") + " " : "";
    const head = name2 === "Object" ? "" : name2 + " ";
    return `//js(${head}{${body}})`;
  }
  #dict(map7) {
    let body = "dict.from_list([";
    let first2 = true;
    body = fold(map7, body, (body2, key, value2) => {
      if (!first2) body2 = body2 + ", ";
      first2 = false;
      return body2 + "#(" + this.inspect(key) + ", " + this.inspect(value2) + ")";
    });
    return body + "])";
  }
  #customType(record) {
    const props = Object.keys(record).map((label2) => {
      const value2 = this.inspect(record[label2]);
      return isNaN(parseInt(label2)) ? `${label2}: ${value2}` : value2;
    }).join(", ");
    return props ? `${record.constructor.name}(${props})` : record.constructor.name;
  }
  #list(list5) {
    if (List$isEmpty(list5)) {
      return "[]";
    }
    let char_out = 'charlist.from_string("';
    let list_out = "[";
    let current = list5;
    while (List$isNonEmpty(current)) {
      let element4 = current.head;
      current = current.tail;
      if (list_out !== "[") {
        list_out += ", ";
      }
      list_out += this.inspect(element4);
      if (char_out) {
        if (Number.isInteger(element4) && element4 >= 32 && element4 <= 126) {
          char_out += String.fromCharCode(element4);
        } else {
          char_out = null;
        }
      }
    }
    if (char_out) {
      return char_out + '")';
    } else {
      return list_out + "]";
    }
  }
  #string(str) {
    let new_str = '"';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      switch (char) {
        case "\n":
          new_str += "\\n";
          break;
        case "\r":
          new_str += "\\r";
          break;
        case "	":
          new_str += "\\t";
          break;
        case "\f":
          new_str += "\\f";
          break;
        case "\\":
          new_str += "\\\\";
          break;
        case '"':
          new_str += '\\"';
          break;
        default:
          if (char < " " || char > "~" && char < "\xA0") {
            new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
          } else {
            new_str += char;
          }
      }
    }
    new_str += '"';
    return new_str;
  }
  #utfCodepoint(codepoint2) {
    return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
  }
  #bit_array(bits2) {
    if (bits2.bitSize === 0) {
      return "<<>>";
    }
    let acc = "<<";
    for (let i = 0; i < bits2.byteSize - 1; i++) {
      acc += bits2.byteAt(i).toString();
      acc += ", ";
    }
    if (bits2.byteSize * 8 === bits2.bitSize) {
      acc += bits2.byteAt(bits2.byteSize - 1).toString();
    } else {
      const trailingBitsCount = bits2.bitSize % 8;
      acc += bits2.byteAt(bits2.byteSize - 1) >> 8 - trailingBitsCount;
      acc += `:size(${trailingBitsCount})`;
    }
    acc += ">>";
    return acc;
  }
};
function index2(data2, key) {
  if (data2 instanceof Dict) {
    const result = get(data2, key);
    return Result$Ok(result.isOk() ? new Some(result[0]) : new None());
  }
  if (data2 instanceof WeakMap || data2 instanceof Map) {
    const token2 = {};
    const entry = data2.get(key, token2);
    if (entry === token2) return Result$Ok(new None());
    return Result$Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key);
  if (key_is_int && key >= 0 && key < 8 && isList(data2)) {
    let i = 0;
    for (const value2 of data2) {
      if (i === key) return Result$Ok(new Some(value2));
      i++;
    }
    return Result$Error("Indexable");
  }
  if (key_is_int && Array.isArray(data2) || data2 && typeof data2 === "object" || data2 && Object.getPrototypeOf(data2) === Object.prototype) {
    if (key in data2) return Result$Ok(new Some(data2[key]));
    return Result$Ok(new None());
  }
  return Result$Error(key_is_int ? "Indexable" : "Dict");
}
function list(data2, decode3, pushPath, index4, emptyList) {
  if (!(isList(data2) || Array.isArray(data2))) {
    const error = DecodeError$DecodeError("List", classify_dynamic(data2), emptyList);
    return [emptyList, arrayToList([error])];
  }
  const decoded = [];
  for (const element4 of data2) {
    const layer = decode3(element4);
    const [out, errors] = layer;
    if (List$isNonEmpty(errors)) {
      const [_, errors2] = pushPath(layer, index4.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index4++;
  }
  return [arrayToList(decoded), emptyList];
}
function float(data2) {
  if (typeof data2 === "number") return Result$Ok(data2);
  return Result$Error(0);
}
function int(data2) {
  if (Number.isInteger(data2)) return Result$Ok(data2);
  return Result$Error(0);
}
function string(data2) {
  if (typeof data2 === "string") return Result$Ok(data2);
  return Result$Error("");
}
function arrayToList(array3) {
  let list5 = List$Empty();
  let i = array3.length;
  while (i--) {
    list5 = List$NonEmpty(array3[i], list5);
  }
  return list5;
}
function isList(data2) {
  return List$isEmpty(data2) || List$isNonEmpty(data2);
}
function isResult(data2) {
  return Result$isOk(data2) || Result$isError(data2);
}

// ../gleam_stdlib/gleam/float.mjs
function absolute_value2(x) {
  let $ = x >= 0;
  if ($) {
    return x;
  } else {
    return 0 - x;
  }
}

// ../gleam_stdlib/gleam/result.mjs
function map4(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    return result;
  }
}
function map_error(result, fun) {
  if (result instanceof Ok) {
    return result;
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return fun(x);
  } else {
    return result;
  }
}
function unwrap(result, default$) {
  if (result instanceof Ok) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}

// ../gleam_erlang/gleam/erlang/process.mjs
var Normal = class extends CustomType {
};
var ExitReason$Normal$const = new Normal();
var Killed = class extends CustomType {
};
var ExitReason$Killed$const = new Killed();
var Anything = class extends CustomType {
};
var AnythingSelectorTag$Anything$const = new Anything();
var Process = class extends CustomType {
};
var ProcessMonitorFlag$Process$const = new Process();
var TimerNotFound = class extends CustomType {
};
var Cancelled$TimerNotFound$const = new TimerNotFound();
var Kill = class extends CustomType {
};
var KillFlag$Kill$const = new Kill();

// ../gleam_otp/gleam/otp/system.mjs
var Running = class extends CustomType {
};
var Mode$Running$const = new Running();
var Suspended = class extends CustomType {
};
var Mode$Suspended$const = new Suspended();
var NoDebug = class extends CustomType {
};
var DebugOption$NoDebug$const = new NoDebug();

// ../gleam_otp/gleam/otp/actor.mjs
var InitTimeout = class extends CustomType {
};
var StartError$InitTimeout$const = new InitTimeout();

// ../gleam_otp/gleam/otp/supervision.mjs
var Permanent = class extends CustomType {
};
var Restart$Permanent$const = new Permanent();
var Transient = class extends CustomType {
};
var Restart$Transient$const = new Transient();
var Temporary = class extends CustomType {
};
var Restart$Temporary$const = new Temporary();
var Supervisor = class extends CustomType {
};
var ChildType$Supervisor$const = new Supervisor();

// ../gleam_otp/gleam/otp/factory_supervisor.mjs
var SimpleOneForOne = class extends CustomType {
};
var Strategy$SimpleOneForOne$const = new SimpleOneForOne();

// ../gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// ../gleam_stdlib/gleam/function.mjs
function identity2(x) {
  return x;
}

// ../gleam_json/gleam_json_ffi.mjs
function json_to_string(json2) {
  return JSON.stringify(json2);
}
function object(entries) {
  return Object.fromEntries(entries);
}
function identity3(x) {
  return x;
}
function array(list5) {
  const array3 = [];
  while (List$isNonEmpty(list5)) {
    array3.push(List$NonEmpty$first(list5));
    list5 = List$NonEmpty$rest(list5);
  }
  return array3;
}
function decode(string5) {
  try {
    const result = JSON.parse(string5);
    return Result$Ok(result);
  } catch (err) {
    return Result$Error(getJsonDecodeError(err, string5));
  }
}
function getJsonDecodeError(stdErr, json2) {
  if (isUnexpectedEndOfInput(stdErr)) return DecodeError$UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json2);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json2) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json2);
    if (result) return result;
  }
  return DecodeError$UnexpectedByte("");
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[1]);
  return DecodeError$UnexpectedByte(byte);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[1]);
  return DecodeError$UnexpectedByte(byte);
}
function spidermonkeyUnexpectedByteError(err, json2) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json2);
  const byte = toHex(json2[position]);
  return DecodeError$UnexpectedByte(byte);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[2]);
  return DecodeError$UnexpectedByte(byte);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string5) {
  if (line === 1) return column - 1;
  let currentLn = 1;
  let position = 0;
  string5.split("").find((char, idx) => {
    if (char === "\n") currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// ../gleam_json/gleam/json.mjs
var UnexpectedEndOfInput = class extends CustomType {
};
var DecodeError$UnexpectedEndOfInput$const = new UnexpectedEndOfInput();
var DecodeError$UnexpectedEndOfInput = () => DecodeError$UnexpectedEndOfInput$const;
var UnexpectedByte = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DecodeError$UnexpectedByte = ($0) => new UnexpectedByte($0);
var UnableToDecode = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
function do_parse(json2, decoder) {
  return try$(
    decode(json2),
    (dynamic_value) => {
      let _pipe = run(dynamic_value, decoder);
      return map_error(
        _pipe,
        (var0) => {
          return new UnableToDecode(var0);
        }
      );
    }
  );
}
function parse(json2, decoder) {
  return do_parse(json2, decoder);
}
function to_string2(json2) {
  return json_to_string(json2);
}
function string3(input2) {
  return identity3(input2);
}
function bool(input2) {
  return identity3(input2);
}
function object2(entries) {
  return object(entries);
}
function preprocessed_array(from3) {
  return array(from3);
}

// ../houdini/houdini.ffi.mjs
function escape(string5) {
  return string5.replaceAll(/[><&"']/g, (replaced) => {
    switch (replaced) {
      case ">":
        return "&gt;";
      case "<":
        return "&lt;";
      case "'":
        return "&#39;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      default:
        return replaced;
    }
  });
}

// ../lustre/lustre/internals/constants.mjs
var empty_list = List$Empty$const;
var error_nil = /* @__PURE__ */ new Error(void 0);
function singleton_list(item) {
  return prepend(item, empty_list);
}

// ../lustre/lustre/vdom/vattr.ffi.mjs
var GT = /* @__PURE__ */ Order$Gt();
var LT = /* @__PURE__ */ Order$Lt();
var EQ = /* @__PURE__ */ Order$Eq();
function compare3(a, b) {
  if (a.name === b.name) {
    return EQ;
  } else if (a.name < b.name) {
    return LT;
  } else {
    return GT;
  }
}

// ../lustre/lustre/vdom/vattr.mjs
var Attribute = class extends CustomType {
  constructor(kind, name2, value2) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value2;
  }
};
var Property = class extends CustomType {
  constructor(kind, name2, value2) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value2;
  }
};
var Event2 = class extends CustomType {
  constructor(kind, name2, handler, include, prevent_default, stop_propagation, debounce, throttle) {
    super();
    this.kind = kind;
    this.name = name2;
    this.handler = handler;
    this.include = include;
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.debounce = debounce;
    this.throttle = throttle;
  }
};
var Handler = class extends CustomType {
  constructor(prevent_default, stop_propagation, message) {
    super();
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.message = message;
  }
};
var Never = class extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
  }
};
var attribute_kind = 0;
var property_kind = 1;
var event_kind = 2;
var never_kind = 0;
var never = /* @__PURE__ */ new Never(never_kind);
var always_kind = 2;
function attribute(name2, value2) {
  return new Attribute(attribute_kind, name2, value2);
}
function property(name2, value2) {
  return new Property(property_kind, name2, value2);
}
function event(name2, handler, include, prevent_default, stop_propagation, debounce, throttle) {
  return new Event2(
    event_kind,
    name2,
    handler,
    include,
    prevent_default,
    stop_propagation,
    debounce,
    throttle
  );
}
function merge2(loop$attributes, loop$merged) {
  while (true) {
    let attributes2 = loop$attributes;
    let merged = loop$merged;
    if (attributes2 instanceof Empty) {
      return merged;
    } else {
      let $ = attributes2.head;
      if ($ instanceof Attribute) {
        let $1 = $.name;
        if ($1 === "") {
          let rest = attributes2.tail;
          loop$attributes = rest;
          loop$merged = merged;
        } else if ($1 === "class") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes2.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes2.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute && $4.name === "class") {
                let kind = $.kind;
                let class1 = $2;
                let rest = $3.tail;
                let class2 = $4.value;
                let value2 = class1 + " " + class2;
                let attribute$1 = new Attribute(kind, "class", value2);
                loop$attributes = prepend(attribute$1, rest);
                loop$merged = merged;
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else if ($1 === "style") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes2.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes2.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute && $4.name === "style") {
                let kind = $.kind;
                let style1 = $2;
                let rest = $3.tail;
                let style2 = $4.value;
                let value2 = style1 + ";" + style2;
                let attribute$1 = new Attribute(kind, "style", value2);
                loop$attributes = prepend(attribute$1, rest);
                loop$merged = merged;
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else {
          let attribute$1 = $;
          let rest = attributes2.tail;
          loop$attributes = rest;
          loop$merged = prepend(attribute$1, merged);
        }
      } else {
        let attribute$1 = $;
        let rest = attributes2.tail;
        loop$attributes = rest;
        loop$merged = prepend(attribute$1, merged);
      }
    }
  }
}
function prepare(attributes2) {
  if (attributes2 instanceof Empty) {
    return attributes2;
  } else if (attributes2.tail instanceof Empty) {
    return attributes2;
  } else {
    let _pipe = attributes2;
    let _pipe$1 = sort(_pipe, (a, b) => {
      return compare3(b, a);
    });
    return merge2(_pipe$1, empty_list);
  }
}

// ../lustre/lustre/attribute.mjs
function attribute2(name2, value2) {
  return attribute(name2, value2);
}
function property2(name2, value2) {
  return property(name2, value2);
}
function boolean_attribute(name2, value2) {
  if (value2) {
    return attribute2(name2, "");
  } else {
    return property2(name2, bool(false));
  }
}
function class$(name2) {
  return attribute2("class", name2);
}
function id(value2) {
  return attribute2("id", value2);
}
function max2(value2) {
  return attribute2("max", value2);
}
function min2(value2) {
  return attribute2("min", value2);
}
function selected(is_selected) {
  return boolean_attribute("selected", is_selected);
}
function type_(control_type) {
  return attribute2("type", control_type);
}
function value(control_value) {
  return attribute2("value", control_value);
}

// ../lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(synchronous, before_paint2, after_paint) {
    super();
    this.synchronous = synchronous;
    this.before_paint = before_paint2;
    this.after_paint = after_paint;
  }
};
var empty = /* @__PURE__ */ new Effect(
  empty_list,
  empty_list,
  empty_list
);
function none() {
  return empty;
}
function from2(effect) {
  let task = (actions) => {
    let dispatch2 = actions.dispatch;
    return effect(dispatch2);
  };
  return new Effect(
    singleton_list(task),
    empty.before_paint,
    empty.after_paint
  );
}
function batch(effects) {
  return fold2(
    effects,
    empty,
    (acc, eff) => {
      return new Effect(
        fold2(eff.synchronous, acc.synchronous, prepend2),
        fold2(eff.before_paint, acc.before_paint, prepend2),
        fold2(eff.after_paint, acc.after_paint, prepend2)
      );
    }
  );
}

// ../lustre/lustre/internals/mutable_map.ffi.mjs
function empty2() {
  return null;
}
function get2(map7, key) {
  return map7?.get(key);
}
function get_or_compute(map7, key, compute) {
  return map7?.get(key) ?? compute();
}
function has_key(map7, key) {
  return map7 && map7.has(key);
}
function insert2(map7, key, value2) {
  map7 ??= /* @__PURE__ */ new Map();
  map7.set(key, value2);
  return map7;
}
function remove(map7, key) {
  map7?.delete(key);
  return map7;
}

// ../lustre/lustre/internals/ref.ffi.mjs
function sameValueZero(x, y) {
  if (typeof x === "number" && typeof y === "number") {
    return x === y || x !== x && y !== y;
  }
  return x === y;
}

// ../lustre/lustre/internals/ref.mjs
function equal_lists(loop$xs, loop$ys) {
  while (true) {
    let xs = loop$xs;
    let ys = loop$ys;
    if (xs instanceof Empty) {
      if (ys instanceof Empty) {
        return true;
      } else {
        return false;
      }
    } else if (ys instanceof Empty) {
      return false;
    } else {
      let x = xs.head;
      let xs$1 = xs.tail;
      let y = ys.head;
      let ys$1 = ys.tail;
      let $ = sameValueZero(x, y);
      if ($) {
        loop$xs = xs$1;
        loop$ys = ys$1;
      } else {
        return $;
      }
    }
  }
}

// ../lustre/lustre/vdom/vnode.mjs
var Fragment = class extends CustomType {
  constructor(kind, key, children, keyed_children) {
    super();
    this.kind = kind;
    this.key = key;
    this.children = children;
    this.keyed_children = keyed_children;
  }
};
var Element = class extends CustomType {
  constructor(kind, key, namespace, tag, attributes2, children, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes2;
    this.children = children;
    this.keyed_children = keyed_children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Text = class extends CustomType {
  constructor(kind, key, content) {
    super();
    this.kind = kind;
    this.key = key;
    this.content = content;
  }
};
var UnsafeInnerHtml = class extends CustomType {
  constructor(kind, key, namespace, tag, attributes2, inner_html) {
    super();
    this.kind = kind;
    this.key = key;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes2;
    this.inner_html = inner_html;
  }
};
var Map2 = class extends CustomType {
  constructor(kind, key, mapper, child2) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.child = child2;
  }
};
var Memo = class extends CustomType {
  constructor(kind, key, dependencies, view2) {
    super();
    this.kind = kind;
    this.key = key;
    this.dependencies = dependencies;
    this.view = view2;
  }
};
var fragment_kind = 0;
var element_kind = 1;
var text_kind = 2;
var unsafe_inner_html_kind = 3;
var map_kind = 4;
var memo_kind = 5;
function fragment(key, children, keyed_children) {
  return new Fragment(fragment_kind, key, children, keyed_children);
}
function element(key, namespace, tag, attributes2, children, keyed_children, self_closing, void$) {
  return new Element(
    element_kind,
    key,
    namespace,
    tag,
    prepare(attributes2),
    children,
    keyed_children,
    self_closing,
    void$
  );
}
function is_void_html_element(tag, namespace) {
  if (namespace === "") {
    if (tag === "area") {
      return true;
    } else if (tag === "base") {
      return true;
    } else if (tag === "br") {
      return true;
    } else if (tag === "col") {
      return true;
    } else if (tag === "embed") {
      return true;
    } else if (tag === "hr") {
      return true;
    } else if (tag === "img") {
      return true;
    } else if (tag === "input") {
      return true;
    } else if (tag === "link") {
      return true;
    } else if (tag === "meta") {
      return true;
    } else if (tag === "param") {
      return true;
    } else if (tag === "source") {
      return true;
    } else if (tag === "track") {
      return true;
    } else if (tag === "wbr") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function text(key, content) {
  return new Text(text_kind, key, content);
}
function unsafe_inner_html(key, namespace, tag, attributes2, inner_html) {
  return new UnsafeInnerHtml(
    unsafe_inner_html_kind,
    key,
    namespace,
    tag,
    prepare(attributes2),
    inner_html
  );
}
function map5(element4, mapper) {
  if (element4 instanceof Map2) {
    let child_mapper = element4.mapper;
    return new Map2(
      map_kind,
      element4.key,
      (handler) => {
        return identity2(mapper)(child_mapper(handler));
      },
      identity2(element4.child)
    );
  } else {
    return new Map2(map_kind, element4.key, identity2(mapper), identity2(element4));
  }
}
function memo(key, dependencies, view2) {
  return new Memo(memo_kind, key, dependencies, view2);
}
function to_keyed(key, node) {
  if (node instanceof Fragment) {
    return new Fragment(node.kind, key, node.children, node.keyed_children);
  } else if (node instanceof Element) {
    return new Element(
      node.kind,
      key,
      node.namespace,
      node.tag,
      node.attributes,
      node.children,
      node.keyed_children,
      node.self_closing,
      node.void
    );
  } else if (node instanceof Text) {
    return new Text(node.kind, key, node.content);
  } else if (node instanceof UnsafeInnerHtml) {
    return new UnsafeInnerHtml(
      node.kind,
      key,
      node.namespace,
      node.tag,
      node.attributes,
      node.inner_html
    );
  } else if (node instanceof Map2) {
    let child2 = node.child;
    return new Map2(node.kind, key, node.mapper, to_keyed(key, child2));
  } else {
    let view2 = node.view;
    return new Memo(
      node.kind,
      key,
      node.dependencies,
      () => {
        return to_keyed(key, view2());
      }
    );
  }
}

// ../lustre/lustre/element.mjs
var Html = class extends CustomType {
};
var DocumentType$Html$const = new Html();
var HeadOnly = class extends CustomType {
};
var DocumentType$HeadOnly$const = new HeadOnly();
var BodyOnly = class extends CustomType {
};
var DocumentType$BodyOnly$const = new BodyOnly();
var HeadAndBody = class extends CustomType {
};
var DocumentType$HeadAndBody$const = new HeadAndBody();
var Other = class extends CustomType {
};
var DocumentType$Other$const = new Other();
function element2(tag, attributes2, children) {
  return element(
    "",
    "",
    tag,
    attributes2,
    children,
    empty2(),
    false,
    is_void_html_element(tag, "")
  );
}
function text2(content) {
  return text("", content);
}
function none2() {
  return text("", "");
}
function unsafe_raw_html(namespace, tag, attributes2, inner_html) {
  return unsafe_inner_html("", namespace, tag, attributes2, inner_html);
}
function memo2(dependencies, view2) {
  return memo("", dependencies, view2);
}
function ref(value2) {
  return identity2(value2);
}
function map6(element4, f) {
  return map5(element4, f);
}

// ../lustre/lustre/element/html.mjs
function text3(content) {
  return text2(content);
}
function div(attrs, children) {
  return element2("div", attrs, children);
}
function pre(attrs, children) {
  return element2("pre", attrs, children);
}
function code(attrs, children) {
  return element2("code", attrs, children);
}
function span(attrs, children) {
  return element2("span", attrs, children);
}
function canvas(attrs) {
  return element2("canvas", attrs, empty_list);
}
function button(attrs, children) {
  return element2("button", attrs, children);
}
function input(attrs) {
  return element2("input", attrs, empty_list);
}
function label(attrs, children) {
  return element2("label", attrs, children);
}
function option(attrs, label2) {
  return element2(
    "option",
    attrs,
    prepend(text2(label2), List$Empty$const)
  );
}
function select(attrs, children) {
  return element2("select", attrs, children);
}
function details(attrs, children) {
  return element2("details", attrs, children);
}
function summary(attrs, children) {
  return element2("summary", attrs, children);
}

// ../lustre/lustre/vdom/patch.mjs
var Patch = class extends CustomType {
  constructor(index4, path, removed, changes, children) {
    super();
    this.index = index4;
    this.path = path;
    this.removed = removed;
    this.changes = changes;
    this.children = children;
  }
};
var ReplaceText = class extends CustomType {
  constructor(kind, content) {
    super();
    this.kind = kind;
    this.content = content;
  }
};
var ReplaceInnerHtml = class extends CustomType {
  constructor(kind, inner_html) {
    super();
    this.kind = kind;
    this.inner_html = inner_html;
  }
};
var Update = class extends CustomType {
  constructor(kind, added, removed) {
    super();
    this.kind = kind;
    this.added = added;
    this.removed = removed;
  }
};
var Move = class extends CustomType {
  constructor(kind, key, before) {
    super();
    this.kind = kind;
    this.key = key;
    this.before = before;
  }
};
var Replace = class extends CustomType {
  constructor(kind, index4, with$) {
    super();
    this.kind = kind;
    this.index = index4;
    this.with = with$;
  }
};
var Remove = class extends CustomType {
  constructor(kind, index4) {
    super();
    this.kind = kind;
    this.index = index4;
  }
};
var Insert = class extends CustomType {
  constructor(kind, children, before) {
    super();
    this.kind = kind;
    this.children = children;
    this.before = before;
  }
};
var replace_text_kind = 0;
var replace_inner_html_kind = 1;
var update_kind = 2;
var move_kind = 3;
var remove_kind = 4;
var replace_kind = 5;
var insert_kind = 6;
function new$3(index4, removed, changes, children) {
  return new Patch(index4, empty_list, removed, changes, children);
}
function replace_text(content) {
  return new ReplaceText(replace_text_kind, content);
}
function replace_inner_html(inner_html) {
  return new ReplaceInnerHtml(replace_inner_html_kind, inner_html);
}
function update(added, removed) {
  return new Update(update_kind, added, removed);
}
function move(key, before) {
  return new Move(move_kind, key, before);
}
function remove2(index4) {
  return new Remove(remove_kind, index4);
}
function replace2(index4, with$) {
  return new Replace(replace_kind, index4, with$);
}
function insert3(children, before) {
  return new Insert(insert_kind, children, before);
}
function add_parent(child2, index4) {
  return new Patch(
    index4,
    prepend(child2.index, child2.path),
    child2.removed,
    child2.changes,
    child2.children
  );
}

// ../lustre/lustre/vdom/path.mjs
var Root = class extends CustomType {
};
var Path$Root$const = new Root();
var Key = class extends CustomType {
  constructor(key, parent) {
    super();
    this.key = key;
    this.parent = parent;
  }
};
var Index = class extends CustomType {
  constructor(index4, parent) {
    super();
    this.index = index4;
    this.parent = parent;
  }
};
var Subtree = class extends CustomType {
  constructor(parent) {
    super();
    this.parent = parent;
  }
};
var separator_subtree = "\r";
var separator_element = "	";
var separator_event = "\n";
var root = Path$Root$const;
function finish_to_string(acc) {
  if (acc instanceof Empty) {
    return "";
  } else {
    let segments = acc.tail;
    return concat2(segments);
  }
}
function do_to_string(loop$full, loop$path, loop$acc) {
  while (true) {
    let full = loop$full;
    let path = loop$path;
    let acc = loop$acc;
    if (path instanceof Root) {
      return finish_to_string(acc);
    } else if (path instanceof Key) {
      let key = path.key;
      let parent = path.parent;
      loop$full = full;
      loop$path = parent;
      loop$acc = prepend(separator_element, prepend(key, acc));
    } else if (path instanceof Index) {
      let index4 = path.index;
      let parent = path.parent;
      let acc$1 = prepend(
        separator_element,
        prepend(to_string(index4), acc)
      );
      loop$full = full;
      loop$path = parent;
      loop$acc = acc$1;
    } else if (!full) {
      return finish_to_string(acc);
    } else {
      let parent = path.parent;
      if (acc instanceof Empty) {
        loop$full = full;
        loop$path = parent;
        loop$acc = acc;
      } else {
        let acc$1 = acc.tail;
        loop$full = full;
        loop$path = parent;
        loop$acc = prepend(separator_subtree, acc$1);
      }
    }
  }
}
function to_string4(path) {
  return do_to_string(true, path, empty_list);
}
function do_matches(loop$path, loop$candidates) {
  while (true) {
    let path = loop$path;
    let candidates = loop$candidates;
    if (candidates instanceof Empty) {
      return false;
    } else {
      let candidate = candidates.head;
      let rest = candidates.tail;
      let $ = starts_with(path, candidate);
      if ($) {
        return $;
      } else {
        loop$path = path;
        loop$candidates = rest;
      }
    }
  }
}
function matches(path, candidates) {
  if (candidates instanceof Empty) {
    return false;
  } else {
    return do_matches(to_string4(path), candidates);
  }
}
function split_subtree_path(path) {
  return split2(path, separator_subtree);
}
function add2(parent, index4, key) {
  if (key === "") {
    return new Index(index4, parent);
  } else {
    return new Key(key, parent);
  }
}
function subtree(path) {
  return new Subtree(path);
}
function event2(path, event4) {
  return do_to_string(
    false,
    path,
    prepend(separator_event, prepend(event4, empty_list))
  );
}
function child(path) {
  return do_to_string(false, path, empty_list);
}

// ../lustre/lustre/vdom/cache.mjs
var Cache = class extends CustomType {
  constructor(events2, vdoms, old_vdoms, dispatched_paths, next_dispatched_paths) {
    super();
    this.events = events2;
    this.vdoms = vdoms;
    this.old_vdoms = old_vdoms;
    this.dispatched_paths = dispatched_paths;
    this.next_dispatched_paths = next_dispatched_paths;
  }
};
var Events = class extends CustomType {
  constructor(handlers, children) {
    super();
    this.handlers = handlers;
    this.children = children;
  }
};
var Child = class extends CustomType {
  constructor(mapper, events2) {
    super();
    this.mapper = mapper;
    this.events = events2;
  }
};
var AddedChildren = class extends CustomType {
  constructor(handlers, children, vdoms) {
    super();
    this.handlers = handlers;
    this.children = children;
    this.vdoms = vdoms;
  }
};
var DecodedEvent = class extends CustomType {
  constructor(path, handler) {
    super();
    this.path = path;
    this.handler = handler;
  }
};
var DispatchedEvent = class extends CustomType {
  constructor(path) {
    super();
    this.path = path;
  }
};
function compose_mapper(mapper, child_mapper) {
  return (message) => {
    return mapper(child_mapper(message));
  };
}
function new_events() {
  return new Events(empty2(), empty2());
}
function new$4() {
  return new Cache(
    new_events(),
    empty2(),
    empty2(),
    empty_list,
    empty_list
  );
}
function do_add_event(handlers, path, name2, handler) {
  return insert2(handlers, event2(path, name2), handler);
}
function add_attributes(handlers, path, attributes2) {
  return fold2(
    attributes2,
    handlers,
    (events2, attribute4) => {
      if (attribute4 instanceof Event2) {
        let name2 = attribute4.name;
        let handler = attribute4.handler;
        return do_add_event(events2, path, name2, handler);
      } else {
        return events2;
      }
    }
  );
}
function do_add_children(loop$handlers, loop$children, loop$vdoms, loop$parent, loop$child_index, loop$nodes) {
  while (true) {
    let handlers = loop$handlers;
    let children = loop$children;
    let vdoms = loop$vdoms;
    let parent = loop$parent;
    let child_index = loop$child_index;
    let nodes = loop$nodes;
    let next2 = child_index + 1;
    if (nodes instanceof Empty) {
      return new AddedChildren(handlers, children, vdoms);
    } else {
      let $ = nodes.head;
      if ($ instanceof Fragment) {
        let rest = nodes.tail;
        let key = $.key;
        let nodes$1 = $.children;
        let path = add2(parent, child_index, key);
        let $1 = do_add_children(handlers, children, vdoms, path, 0, nodes$1);
        let handlers$1 = $1.handlers;
        let children$1 = $1.children;
        let vdoms$1 = $1.vdoms;
        loop$handlers = handlers$1;
        loop$children = children$1;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next2;
        loop$nodes = rest;
      } else if ($ instanceof Element) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes2 = $.attributes;
        let nodes$1 = $.children;
        let path = add2(parent, child_index, key);
        let handlers$1 = add_attributes(handlers, path, attributes2);
        let $1 = do_add_children(handlers$1, children, vdoms, path, 0, nodes$1);
        let handlers$2 = $1.handlers;
        let children$1 = $1.children;
        let vdoms$1 = $1.vdoms;
        loop$handlers = handlers$2;
        loop$children = children$1;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next2;
        loop$nodes = rest;
      } else if ($ instanceof Text) {
        let rest = nodes.tail;
        loop$handlers = handlers;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$child_index = next2;
        loop$nodes = rest;
      } else if ($ instanceof UnsafeInnerHtml) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes2 = $.attributes;
        let path = add2(parent, child_index, key);
        let handlers$1 = add_attributes(handlers, path, attributes2);
        loop$handlers = handlers$1;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$child_index = next2;
        loop$nodes = rest;
      } else if ($ instanceof Map2) {
        let rest = nodes.tail;
        let key = $.key;
        let mapper = $.mapper;
        let child2 = $.child;
        let path = add2(parent, child_index, key);
        let added = do_add_children(
          empty2(),
          empty2(),
          vdoms,
          subtree(path),
          0,
          singleton_list(child2)
        );
        let vdoms$1 = added.vdoms;
        let child_events = new Events(added.handlers, added.children);
        let child$1 = new Child(mapper, child_events);
        let children$1 = insert2(
          children,
          child(path),
          child$1
        );
        loop$handlers = handlers;
        loop$children = children$1;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next2;
        loop$nodes = rest;
      } else {
        let rest = nodes.tail;
        let view2 = $.view;
        let child_node = view2();
        let vdoms$1 = insert2(vdoms, view2, child_node);
        let next$1 = child_index;
        let rest$1 = prepend(child_node, rest);
        loop$handlers = handlers;
        loop$children = children;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next$1;
        loop$nodes = rest$1;
      }
    }
  }
}
function add_children(cache, events2, path, child_index, nodes) {
  let vdoms = cache.vdoms;
  let handlers = events2.handlers;
  let children = events2.children;
  let $ = do_add_children(handlers, children, vdoms, path, child_index, nodes);
  let handlers$1 = $.handlers;
  let children$1 = $.children;
  let vdoms$1 = $.vdoms;
  return [
    new Cache(
      cache.events,
      vdoms$1,
      cache.old_vdoms,
      cache.dispatched_paths,
      cache.next_dispatched_paths
    ),
    new Events(handlers$1, children$1)
  ];
}
function add_child(cache, events2, parent, index4, child2) {
  let children = singleton_list(child2);
  return add_children(cache, events2, parent, index4, children);
}
function tick(cache) {
  return new Cache(
    cache.events,
    empty2(),
    cache.vdoms,
    cache.next_dispatched_paths,
    empty_list
  );
}
function events(cache) {
  return cache.events;
}
function update_events(cache, events2) {
  return new Cache(
    events2,
    cache.vdoms,
    cache.old_vdoms,
    cache.dispatched_paths,
    cache.next_dispatched_paths
  );
}
function memos(cache) {
  return cache.vdoms;
}
function get_old_memo(cache, old, new$8) {
  return get_or_compute(cache.old_vdoms, old, new$8);
}
function keep_memo(cache, old, new$8) {
  let node = get_or_compute(cache.old_vdoms, old, new$8);
  let vdoms = insert2(cache.vdoms, new$8, node);
  return new Cache(
    cache.events,
    vdoms,
    cache.old_vdoms,
    cache.dispatched_paths,
    cache.next_dispatched_paths
  );
}
function add_memo(cache, new$8, node) {
  let vdoms = insert2(cache.vdoms, new$8, node);
  return new Cache(
    cache.events,
    vdoms,
    cache.old_vdoms,
    cache.dispatched_paths,
    cache.next_dispatched_paths
  );
}
function get_subtree(events2, path, old_mapper) {
  let child2 = get_or_compute(
    events2.children,
    path,
    () => {
      return new Child(old_mapper, new_events());
    }
  );
  return child2.events;
}
function update_subtree(parent, path, mapper, events2) {
  let new_child = new Child(mapper, events2);
  let children = insert2(parent.children, path, new_child);
  return new Events(parent.handlers, children);
}
function add_event(events2, path, name2, handler) {
  let handlers = do_add_event(events2.handlers, path, name2, handler);
  return new Events(handlers, events2.children);
}
function do_remove_event(handlers, path, name2) {
  return remove(handlers, event2(path, name2));
}
function remove_event(events2, path, name2) {
  let handlers = do_remove_event(events2.handlers, path, name2);
  return new Events(handlers, events2.children);
}
function remove_attributes(handlers, path, attributes2) {
  return fold2(
    attributes2,
    handlers,
    (events2, attribute4) => {
      if (attribute4 instanceof Event2) {
        let name2 = attribute4.name;
        return do_remove_event(events2, path, name2);
      } else {
        return events2;
      }
    }
  );
}
function do_remove_children(loop$handlers, loop$children, loop$vdoms, loop$parent, loop$index, loop$nodes) {
  while (true) {
    let handlers = loop$handlers;
    let children = loop$children;
    let vdoms = loop$vdoms;
    let parent = loop$parent;
    let index4 = loop$index;
    let nodes = loop$nodes;
    let next2 = index4 + 1;
    if (nodes instanceof Empty) {
      return new Events(handlers, children);
    } else {
      let $ = nodes.head;
      if ($ instanceof Fragment) {
        let rest = nodes.tail;
        let key = $.key;
        let nodes$1 = $.children;
        let path = add2(parent, index4, key);
        let $1 = do_remove_children(handlers, children, vdoms, path, 0, nodes$1);
        let handlers$1 = $1.handlers;
        let children$1 = $1.children;
        loop$handlers = handlers$1;
        loop$children = children$1;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next2;
        loop$nodes = rest;
      } else if ($ instanceof Element) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes2 = $.attributes;
        let nodes$1 = $.children;
        let path = add2(parent, index4, key);
        let handlers$1 = remove_attributes(handlers, path, attributes2);
        let $1 = do_remove_children(
          handlers$1,
          children,
          vdoms,
          path,
          0,
          nodes$1
        );
        let handlers$2 = $1.handlers;
        let children$1 = $1.children;
        loop$handlers = handlers$2;
        loop$children = children$1;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next2;
        loop$nodes = rest;
      } else if ($ instanceof Text) {
        let rest = nodes.tail;
        loop$handlers = handlers;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next2;
        loop$nodes = rest;
      } else if ($ instanceof UnsafeInnerHtml) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes2 = $.attributes;
        let path = add2(parent, index4, key);
        let handlers$1 = remove_attributes(handlers, path, attributes2);
        loop$handlers = handlers$1;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next2;
        loop$nodes = rest;
      } else if ($ instanceof Map2) {
        let rest = nodes.tail;
        let key = $.key;
        let path = add2(parent, index4, key);
        let children$1 = remove(children, child(path));
        loop$handlers = handlers;
        loop$children = children$1;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next2;
        loop$nodes = rest;
      } else {
        let rest = nodes.tail;
        let view2 = $.view;
        let $1 = has_key(vdoms, view2);
        if ($1) {
          let child2 = get2(vdoms, view2);
          let nodes$1 = prepend(child2, rest);
          loop$handlers = handlers;
          loop$children = children;
          loop$vdoms = vdoms;
          loop$parent = parent;
          loop$index = index4;
          loop$nodes = nodes$1;
        } else {
          loop$handlers = handlers;
          loop$children = children;
          loop$vdoms = vdoms;
          loop$parent = parent;
          loop$index = next2;
          loop$nodes = rest;
        }
      }
    }
  }
}
function remove_child(cache, events2, parent, child_index, child2) {
  return do_remove_children(
    events2.handlers,
    events2.children,
    cache.old_vdoms,
    parent,
    child_index,
    singleton_list(child2)
  );
}
function replace_child(cache, events2, parent, child_index, prev, next2) {
  let events$1 = remove_child(cache, events2, parent, child_index, prev);
  return add_child(cache, events$1, parent, child_index, next2);
}
function get_handler(loop$events, loop$path, loop$mapper) {
  while (true) {
    let events2 = loop$events;
    let path = loop$path;
    let mapper = loop$mapper;
    if (path instanceof Empty) {
      return error_nil;
    } else {
      let $ = path.tail;
      if ($ instanceof Empty) {
        let key = path.head;
        let $1 = has_key(events2.handlers, key);
        if ($1) {
          let handler = get2(events2.handlers, key);
          return new Ok(
            map3(
              handler,
              (handler2) => {
                return new Handler(
                  handler2.prevent_default,
                  handler2.stop_propagation,
                  identity2(mapper)(handler2.message)
                );
              }
            )
          );
        } else {
          return error_nil;
        }
      } else {
        let key = path.head;
        let path$1 = $;
        let $1 = has_key(events2.children, key);
        if ($1) {
          let child2 = get2(events2.children, key);
          let mapper$1 = compose_mapper(mapper, child2.mapper);
          loop$events = child2.events;
          loop$path = path$1;
          loop$mapper = mapper$1;
        } else {
          return error_nil;
        }
      }
    }
  }
}
function decode2(cache, path, name2, event4) {
  let parts = split_subtree_path(path + separator_event + name2);
  let $ = get_handler(cache.events, parts, identity2);
  if ($ instanceof Ok) {
    let handler = $[0];
    let $1 = run(event4, handler);
    if ($1 instanceof Ok) {
      let handler$1 = $1[0];
      return new DecodedEvent(path, handler$1);
    } else {
      return new DispatchedEvent(path);
    }
  } else {
    return new DispatchedEvent(path);
  }
}
function dispatch(cache, event4) {
  let next_dispatched_paths = prepend(
    event4.path,
    cache.next_dispatched_paths
  );
  let cache$1 = new Cache(
    cache.events,
    cache.vdoms,
    cache.old_vdoms,
    cache.dispatched_paths,
    next_dispatched_paths
  );
  if (event4 instanceof DecodedEvent) {
    let handler = event4.handler;
    return [cache$1, new Ok(handler)];
  } else {
    return [cache$1, error_nil];
  }
}
function has_dispatched_events(cache, path) {
  return matches(path, cache.dispatched_paths);
}

// ../lustre/lustre/runtime/server/runtime.mjs
var EffectDispatchedMessage = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var Message$isEffectDispatchedMessage = (value2) => value2 instanceof EffectDispatchedMessage;
var EffectEmitEvent = class extends CustomType {
  constructor(name2, data2) {
    super();
    this.name = name2;
    this.data = data2;
  }
};
var Message$isEffectEmitEvent = (value2) => value2 instanceof EffectEmitEvent;
var SystemRequestedShutdown = class extends CustomType {
};
var Message$SystemRequestedShutdown$const = new SystemRequestedShutdown();
var Message$isSystemRequestedShutdown = (value2) => value2 instanceof SystemRequestedShutdown;

// ../lustre/lustre/runtime/app.mjs
var App = class extends CustomType {
  constructor(name2, init2, update3, view2, config) {
    super();
    this.name = name2;
    this.init = init2;
    this.update = update3;
    this.view = view2;
    this.config = config;
  }
};
var Config2 = class extends CustomType {
  constructor(open_shadow_root, adopt_styles, delegates_focus, attributes2, properties, contexts, is_form_associated, on_form_autofill, on_form_reset, on_form_restore, on_form_disabled, on_connect, on_adopt, on_disconnect) {
    super();
    this.open_shadow_root = open_shadow_root;
    this.adopt_styles = adopt_styles;
    this.delegates_focus = delegates_focus;
    this.attributes = attributes2;
    this.properties = properties;
    this.contexts = contexts;
    this.is_form_associated = is_form_associated;
    this.on_form_autofill = on_form_autofill;
    this.on_form_reset = on_form_reset;
    this.on_form_restore = on_form_restore;
    this.on_form_disabled = on_form_disabled;
    this.on_connect = on_connect;
    this.on_adopt = on_adopt;
    this.on_disconnect = on_disconnect;
  }
};
var default_config = /* @__PURE__ */ new Config2(
  true,
  true,
  false,
  empty_list,
  empty_list,
  empty_list,
  false,
  Option$None$const,
  Option$None$const,
  Option$None$const,
  Option$None$const,
  Option$None$const,
  Option$None$const,
  Option$None$const
);

// ../lustre/lustre/internals/equals.ffi.mjs
var isEqual2 = (a, b) => {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  const type = typeof a;
  if (type !== typeof b) {
    return false;
  }
  if (type !== "object") {
    return false;
  }
  const ctor = a.constructor;
  if (ctor !== b.constructor) {
    return false;
  }
  if (Array.isArray(a)) {
    return areArraysEqual(a, b);
  }
  return areObjectsEqual(a, b);
};
var areArraysEqual = (a, b) => {
  let index4 = a.length;
  if (index4 !== b.length) {
    return false;
  }
  while (index4--) {
    if (!isEqual2(a[index4], b[index4])) {
      return false;
    }
  }
  return true;
};
var areObjectsEqual = (a, b) => {
  const properties = Object.keys(a);
  let index4 = properties.length;
  if (Object.keys(b).length !== index4) {
    return false;
  }
  while (index4--) {
    const property3 = properties[index4];
    if (!Object.hasOwn(b, property3)) {
      return false;
    }
    if (!isEqual2(a[property3], b[property3])) {
      return false;
    }
  }
  return true;
};

// ../lustre/lustre/vdom/diff.mjs
var Diff = class extends CustomType {
  constructor(patch, cache) {
    super();
    this.patch = patch;
    this.cache = cache;
  }
};
var PartialDiff = class extends CustomType {
  constructor(patch, cache, events2) {
    super();
    this.patch = patch;
    this.cache = cache;
    this.events = events2;
  }
};
var AttributeChange = class extends CustomType {
  constructor(added, removed, events2) {
    super();
    this.added = added;
    this.removed = removed;
    this.events = events2;
  }
};
function diff_attributes(loop$controlled, loop$path, loop$events, loop$old, loop$new, loop$added, loop$removed) {
  while (true) {
    let controlled = loop$controlled;
    let path = loop$path;
    let events2 = loop$events;
    let old = loop$old;
    let new$8 = loop$new;
    let added = loop$added;
    let removed = loop$removed;
    if (old instanceof Empty) {
      if (new$8 instanceof Empty) {
        return new AttributeChange(added, removed, events2);
      } else {
        let $ = new$8.head;
        if ($ instanceof Event2) {
          let next2 = $;
          let new$1 = new$8.tail;
          let name2 = $.name;
          let handler = $.handler;
          let events$1 = add_event(events2, path, name2, handler);
          let added$1 = prepend(next2, added);
          loop$controlled = controlled;
          loop$path = path;
          loop$events = events$1;
          loop$old = old;
          loop$new = new$1;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let next2 = $;
          let new$1 = new$8.tail;
          let added$1 = prepend(next2, added);
          loop$controlled = controlled;
          loop$path = path;
          loop$events = events2;
          loop$old = old;
          loop$new = new$1;
          loop$added = added$1;
          loop$removed = removed;
        }
      }
    } else if (new$8 instanceof Empty) {
      let $ = old.head;
      if ($ instanceof Event2) {
        let prev = $;
        let old$1 = old.tail;
        let name2 = $.name;
        let events$1 = remove_event(events2, path, name2);
        let removed$1 = prepend(prev, removed);
        loop$controlled = controlled;
        loop$path = path;
        loop$events = events$1;
        loop$old = old$1;
        loop$new = new$8;
        loop$added = added;
        loop$removed = removed$1;
      } else {
        let prev = $;
        let old$1 = old.tail;
        let removed$1 = prepend(prev, removed);
        loop$controlled = controlled;
        loop$path = path;
        loop$events = events2;
        loop$old = old$1;
        loop$new = new$8;
        loop$added = added;
        loop$removed = removed$1;
      }
    } else {
      let prev = old.head;
      let remaining_old = old.tail;
      let next2 = new$8.head;
      let remaining_new = new$8.tail;
      let $ = compare3(prev, next2);
      if ($ instanceof Lt) {
        if (prev instanceof Event2) {
          let name2 = prev.name;
          loop$controlled = controlled;
          loop$path = path;
          loop$events = remove_event(events2, path, name2);
          loop$old = remaining_old;
          loop$new = new$8;
          loop$added = added;
          loop$removed = prepend(prev, removed);
        } else {
          loop$controlled = controlled;
          loop$path = path;
          loop$events = events2;
          loop$old = remaining_old;
          loop$new = new$8;
          loop$added = added;
          loop$removed = prepend(prev, removed);
        }
      } else if ($ instanceof Eq) {
        if (prev instanceof Attribute) {
          if (next2 instanceof Attribute) {
            let _block;
            let $1 = next2.name;
            if ($1 === "value") {
              _block = controlled || prev.value !== next2.value;
            } else if ($1 === "checked") {
              _block = controlled || prev.value !== next2.value;
            } else if ($1 === "selected") {
              _block = controlled || prev.value !== next2.value;
            } else {
              _block = prev.value !== next2.value;
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next2, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (next2 instanceof Event2) {
            let name2 = next2.name;
            let handler = next2.handler;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = add_event(events2, path, name2, handler);
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next2, added);
            loop$removed = prepend(prev, removed);
          } else {
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next2, added);
            loop$removed = prepend(prev, removed);
          }
        } else if (prev instanceof Property) {
          if (next2 instanceof Property) {
            let _block;
            let $1 = next2.name;
            if ($1 === "scrollLeft") {
              _block = true;
            } else if ($1 === "scrollRight") {
              _block = true;
            } else if ($1 === "value") {
              _block = controlled || !isEqual2(
                prev.value,
                next2.value
              );
            } else if ($1 === "checked") {
              _block = controlled || !isEqual2(
                prev.value,
                next2.value
              );
            } else if ($1 === "selected") {
              _block = controlled || !isEqual2(
                prev.value,
                next2.value
              );
            } else {
              _block = !isEqual2(prev.value, next2.value);
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next2, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (next2 instanceof Event2) {
            let name2 = next2.name;
            let handler = next2.handler;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = add_event(events2, path, name2, handler);
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next2, added);
            loop$removed = prepend(prev, removed);
          } else {
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next2, added);
            loop$removed = prepend(prev, removed);
          }
        } else if (next2 instanceof Event2) {
          let name2 = next2.name;
          let handler = next2.handler;
          let has_changes = prev.prevent_default.kind !== next2.prevent_default.kind || prev.stop_propagation.kind !== next2.stop_propagation.kind || prev.debounce !== next2.debounce || prev.throttle !== next2.throttle;
          let _block;
          if (has_changes) {
            _block = prepend(next2, added);
          } else {
            _block = added;
          }
          let added$1 = _block;
          loop$controlled = controlled;
          loop$path = path;
          loop$events = add_event(events2, path, name2, handler);
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let name2 = prev.name;
          loop$controlled = controlled;
          loop$path = path;
          loop$events = remove_event(events2, path, name2);
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = prepend(next2, added);
          loop$removed = prepend(prev, removed);
        }
      } else if (next2 instanceof Event2) {
        let name2 = next2.name;
        let handler = next2.handler;
        loop$controlled = controlled;
        loop$path = path;
        loop$events = add_event(events2, path, name2, handler);
        loop$old = old;
        loop$new = remaining_new;
        loop$added = prepend(next2, added);
        loop$removed = removed;
      } else {
        loop$controlled = controlled;
        loop$path = path;
        loop$events = events2;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = prepend(next2, added);
        loop$removed = removed;
      }
    }
  }
}
function is_controlled(cache, namespace, tag, path) {
  if (tag === "input" && namespace === "") {
    return has_dispatched_events(cache, path);
  } else if (tag === "select" && namespace === "") {
    return has_dispatched_events(cache, path);
  } else if (tag === "textarea" && namespace === "") {
    return has_dispatched_events(cache, path);
  } else {
    return false;
  }
}
function do_diff(loop$old, loop$old_keyed, loop$new, loop$new_keyed, loop$moved, loop$moved_offset, loop$removed, loop$node_index, loop$patch_index, loop$changes, loop$children, loop$path, loop$cache, loop$events) {
  while (true) {
    let old = loop$old;
    let old_keyed = loop$old_keyed;
    let new$8 = loop$new;
    let new_keyed = loop$new_keyed;
    let moved = loop$moved;
    let moved_offset = loop$moved_offset;
    let removed = loop$removed;
    let node_index = loop$node_index;
    let patch_index = loop$patch_index;
    let changes = loop$changes;
    let children = loop$children;
    let path = loop$path;
    let cache = loop$cache;
    let events2 = loop$events;
    if (old instanceof Empty) {
      if (new$8 instanceof Empty) {
        let _block;
        let $ = is_browser();
        if (changes instanceof Empty) {
          if (children instanceof Empty) {
            _block = new$3(patch_index, removed, changes, children);
          } else if (!$ && children.tail instanceof Empty && removed === 0) {
            let child2 = children.head;
            _block = add_parent(child2, patch_index);
          } else {
            _block = new$3(patch_index, removed, changes, children);
          }
        } else {
          _block = new$3(patch_index, removed, changes, children);
        }
        let patch = _block;
        return new PartialDiff(patch, cache, events2);
      } else {
        let $ = add_children(cache, events2, path, node_index, new$8);
        let cache$1 = $[0];
        let events$1 = $[1];
        let insert5 = insert3(new$8, node_index - moved_offset);
        let changes$1 = prepend(insert5, changes);
        let patch = new$3(patch_index, removed, changes$1, children);
        return new PartialDiff(patch, cache$1, events$1);
      }
    } else if (new$8 instanceof Empty) {
      let prev = old.head;
      let old$1 = old.tail;
      let $ = prev.key === "" || !has_key(moved, prev.key);
      if ($) {
        let events$1 = remove_child(
          cache,
          events2,
          path,
          node_index,
          prev
        );
        loop$old = old$1;
        loop$old_keyed = old_keyed;
        loop$new = new$8;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset;
        loop$removed = removed + 1;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$changes = changes;
        loop$children = children;
        loop$path = path;
        loop$cache = cache;
        loop$events = events$1;
      } else {
        loop$old = old$1;
        loop$old_keyed = old_keyed;
        loop$new = new$8;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset;
        loop$removed = removed;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$changes = changes;
        loop$children = children;
        loop$path = path;
        loop$cache = cache;
        loop$events = events2;
      }
    } else {
      let prev = old.head;
      let next2 = new$8.head;
      if (prev.key !== next2.key) {
        let old_remaining = old.tail;
        let new_remaining = new$8.tail;
        let next_did_exist = has_key(old_keyed, next2.key);
        let prev_does_exist = has_key(new_keyed, prev.key);
        if (prev_does_exist) {
          if (next_did_exist) {
            let $ = has_key(moved, prev.key);
            if ($) {
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new$8;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - 1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            } else {
              let match = get2(old_keyed, next2.key);
              let before = node_index - moved_offset;
              let changes$1 = prepend(
                move(next2.key, before),
                changes
              );
              let moved$1 = insert2(moved, next2.key, void 0);
              loop$old = prepend(match, old);
              loop$old_keyed = old_keyed;
              loop$new = new$8;
              loop$new_keyed = new_keyed;
              loop$moved = moved$1;
              loop$moved_offset = moved_offset + 1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$changes = changes$1;
              loop$children = children;
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            }
          } else {
            let before = node_index - moved_offset;
            let $ = add_child(cache, events2, path, node_index, next2);
            let cache$1 = $[0];
            let events$1 = $[1];
            let insert5 = insert3(singleton_list(next2), before);
            let changes$1 = prepend(insert5, changes);
            loop$old = old;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset + 1;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes$1;
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if (next_did_exist) {
          let index4 = node_index - moved_offset;
          let changes$1 = prepend(remove2(index4), changes);
          let events$1 = remove_child(
            cache,
            events2,
            path,
            node_index,
            prev
          );
          loop$old = old_remaining;
          loop$old_keyed = old_keyed;
          loop$new = new$8;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset - 1;
          loop$removed = removed;
          loop$node_index = node_index;
          loop$patch_index = patch_index;
          loop$changes = changes$1;
          loop$children = children;
          loop$path = path;
          loop$cache = cache;
          loop$events = events$1;
        } else {
          let change = replace2(node_index - moved_offset, next2);
          let $ = replace_child(
            cache,
            events2,
            path,
            node_index,
            prev,
            next2
          );
          let cache$1 = $[0];
          let events$1 = $[1];
          loop$old = old_remaining;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset;
          loop$removed = removed;
          loop$node_index = node_index + 1;
          loop$patch_index = patch_index;
          loop$changes = prepend(change, changes);
          loop$children = children;
          loop$path = path;
          loop$cache = cache$1;
          loop$events = events$1;
        }
      } else {
        let $ = old.head;
        if ($ instanceof Fragment) {
          let $1 = new$8.head;
          if ($1 instanceof Fragment) {
            let prev$1 = $;
            let old$1 = old.tail;
            let next$1 = $1;
            let new$1 = new$8.tail;
            let $2 = do_diff(
              prev$1.children,
              prev$1.keyed_children,
              next$1.children,
              next$1.keyed_children,
              empty2(),
              0,
              0,
              0,
              node_index,
              empty_list,
              empty_list,
              add2(path, node_index, next$1.key),
              cache,
              events2
            );
            let patch = $2.patch;
            let cache$1 = $2.cache;
            let events$1 = $2.events;
            let _block;
            if (patch.changes instanceof Empty && patch.children instanceof Empty && patch.removed === 0) {
              _block = children;
            } else {
              _block = prepend(patch, children);
            }
            let children$1 = _block;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes;
            loop$children = children$1;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          } else {
            let prev$1 = $;
            let old_remaining$1 = old.tail;
            let next$1 = $1;
            let new_remaining$1 = new$8.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let $2 = replace_child(
              cache,
              events2,
              path,
              node_index,
              prev$1,
              next$1
            );
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining$1;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof Element) {
          let $1 = new$8.head;
          if ($1 instanceof Element) {
            let prev$1 = $;
            let next$1 = $1;
            if (prev$1.namespace === next$1.namespace && prev$1.tag === next$1.tag) {
              let old$1 = old.tail;
              let new$1 = new$8.tail;
              let child_path = add2(path, node_index, next$1.key);
              let controlled = is_controlled(
                cache,
                next$1.namespace,
                next$1.tag,
                child_path
              );
              let $2 = diff_attributes(
                controlled,
                child_path,
                events2,
                prev$1.attributes,
                next$1.attributes,
                empty_list,
                empty_list
              );
              let added_attrs = $2.added;
              let removed_attrs = $2.removed;
              let events$1 = $2.events;
              let _block;
              if (added_attrs instanceof Empty && removed_attrs instanceof Empty) {
                _block = empty_list;
              } else {
                _block = singleton_list(
                  update(added_attrs, removed_attrs)
                );
              }
              let initial_child_changes = _block;
              let $3 = do_diff(
                prev$1.children,
                prev$1.keyed_children,
                next$1.children,
                next$1.keyed_children,
                empty2(),
                0,
                0,
                0,
                node_index,
                initial_child_changes,
                empty_list,
                child_path,
                cache,
                events$1
              );
              let patch = $3.patch;
              let cache$1 = $3.cache;
              let events$2 = $3.events;
              let _block$1;
              if (patch.changes instanceof Empty && patch.children instanceof Empty && patch.removed === 0) {
                _block$1 = children;
              } else {
                _block$1 = prepend(patch, children);
              }
              let children$1 = _block$1;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children$1;
              loop$path = path;
              loop$cache = cache$1;
              loop$events = events$2;
            } else {
              let prev$2 = $;
              let old_remaining$1 = old.tail;
              let next$2 = $1;
              let new_remaining$1 = new$8.tail;
              let change = replace2(node_index - moved_offset, next$2);
              let $4 = replace_child(
                cache,
                events2,
                path,
                node_index,
                prev$2,
                next$2
              );
              let cache$2 = $4[0];
              let events$3 = $4[1];
              loop$old = old_remaining$1;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$path = path;
              loop$cache = cache$2;
              loop$events = events$3;
            }
          } else {
            let prev$1 = $;
            let old_remaining$1 = old.tail;
            let next$1 = $1;
            let new_remaining$1 = new$8.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let $2 = replace_child(
              cache,
              events2,
              path,
              node_index,
              prev$1,
              next$1
            );
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining$1;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof Text) {
          let $1 = new$8.head;
          if ($1 instanceof Text) {
            let prev$1 = $;
            let next$1 = $1;
            if (prev$1.content === next$1.content) {
              let old$1 = old.tail;
              let new$1 = new$8.tail;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            } else {
              let old$2 = old.tail;
              let next$2 = $1;
              let new$22 = new$8.tail;
              let child2 = new$3(
                node_index,
                0,
                singleton_list(replace_text(next$2.content)),
                empty_list
              );
              loop$old = old$2;
              loop$old_keyed = old_keyed;
              loop$new = new$22;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = prepend(child2, children);
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            }
          } else {
            let prev$1 = $;
            let old_remaining$1 = old.tail;
            let next$1 = $1;
            let new_remaining$1 = new$8.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let $2 = replace_child(
              cache,
              events2,
              path,
              node_index,
              prev$1,
              next$1
            );
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining$1;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof UnsafeInnerHtml) {
          let $1 = new$8.head;
          if ($1 instanceof UnsafeInnerHtml) {
            let prev$1 = $;
            let old$1 = old.tail;
            let next$1 = $1;
            let new$1 = new$8.tail;
            let child_path = add2(path, node_index, next$1.key);
            let $2 = diff_attributes(
              false,
              child_path,
              events2,
              prev$1.attributes,
              next$1.attributes,
              empty_list,
              empty_list
            );
            let added_attrs = $2.added;
            let removed_attrs = $2.removed;
            let events$1 = $2.events;
            let _block;
            if (added_attrs instanceof Empty && removed_attrs instanceof Empty) {
              _block = empty_list;
            } else {
              _block = singleton_list(
                update(added_attrs, removed_attrs)
              );
            }
            let child_changes = _block;
            let _block$1;
            let $3 = prev$1.inner_html === next$1.inner_html;
            if ($3) {
              _block$1 = child_changes;
            } else {
              _block$1 = prepend(
                replace_inner_html(next$1.inner_html),
                child_changes
              );
            }
            let child_changes$1 = _block$1;
            let _block$2;
            if (child_changes$1 instanceof Empty) {
              _block$2 = children;
            } else {
              _block$2 = prepend(
                new$3(
                  node_index,
                  0,
                  child_changes$1,
                  empty_list
                ),
                children
              );
            }
            let children$1 = _block$2;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes;
            loop$children = children$1;
            loop$path = path;
            loop$cache = cache;
            loop$events = events$1;
          } else {
            let prev$1 = $;
            let old_remaining$1 = old.tail;
            let next$1 = $1;
            let new_remaining$1 = new$8.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let $2 = replace_child(
              cache,
              events2,
              path,
              node_index,
              prev$1,
              next$1
            );
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining$1;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof Map2) {
          let $1 = new$8.head;
          if ($1 instanceof Map2) {
            let prev$1 = $;
            let old$1 = old.tail;
            let next$1 = $1;
            let new$1 = new$8.tail;
            let child_path = add2(path, node_index, next$1.key);
            let child_key = child(child_path);
            let $2 = do_diff(
              singleton_list(prev$1.child),
              empty2(),
              singleton_list(next$1.child),
              empty2(),
              empty2(),
              0,
              0,
              0,
              node_index,
              empty_list,
              empty_list,
              subtree(child_path),
              cache,
              get_subtree(events2, child_key, prev$1.mapper)
            );
            let patch = $2.patch;
            let cache$1 = $2.cache;
            let child_events = $2.events;
            let events$1 = update_subtree(
              events2,
              child_key,
              next$1.mapper,
              child_events
            );
            let _block;
            if (patch.changes instanceof Empty && patch.children instanceof Empty && patch.removed === 0) {
              _block = children;
            } else {
              _block = prepend(patch, children);
            }
            let children$1 = _block;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes;
            loop$children = children$1;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          } else {
            let prev$1 = $;
            let old_remaining$1 = old.tail;
            let next$1 = $1;
            let new_remaining$1 = new$8.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let $2 = replace_child(
              cache,
              events2,
              path,
              node_index,
              prev$1,
              next$1
            );
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining$1;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else {
          let $1 = new$8.head;
          if ($1 instanceof Memo) {
            let prev$1 = $;
            let old$1 = old.tail;
            let next$1 = $1;
            let new$1 = new$8.tail;
            let $2 = equal_lists(prev$1.dependencies, next$1.dependencies);
            if ($2) {
              let cache$1 = keep_memo(cache, prev$1.view, next$1.view);
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache$1;
              loop$events = events2;
            } else {
              let prev_node = get_old_memo(
                cache,
                prev$1.view,
                prev$1.view
              );
              let next_node = next$1.view();
              let cache$1 = add_memo(cache, next$1.view, next_node);
              loop$old = prepend(prev_node, old$1);
              loop$old_keyed = old_keyed;
              loop$new = prepend(next_node, new$1);
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache$1;
              loop$events = events2;
            }
          } else {
            let prev$1 = $;
            let old_remaining$1 = old.tail;
            let next$1 = $1;
            let new_remaining$1 = new$8.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let $2 = replace_child(
              cache,
              events2,
              path,
              node_index,
              prev$1,
              next$1
            );
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining$1;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        }
      }
    }
  }
}
function diff(cache, old, new$8) {
  let cache$1 = tick(cache);
  let $ = do_diff(
    singleton_list(old),
    empty2(),
    singleton_list(new$8),
    empty2(),
    empty2(),
    0,
    0,
    0,
    0,
    empty_list,
    empty_list,
    root,
    cache$1,
    events(cache$1)
  );
  let patch = $.patch;
  let cache$2 = $.cache;
  let events2 = $.events;
  return new Diff(patch, update_events(cache$2, events2));
}

// ../lustre/lustre/internals/list.ffi.mjs
var iterate = (list5, callback) => {
  if (Array.isArray(list5)) {
    for (let i = 0; i < list5.length; i++) {
      callback(list5[i]);
    }
  } else if (list5) {
    for (list5; List$NonEmpty$rest(list5); list5 = List$NonEmpty$rest(list5)) {
      callback(List$NonEmpty$first(list5));
    }
  }
};
var append4 = (a, b) => {
  if (!List$NonEmpty$rest(a)) {
    return b;
  } else if (!List$NonEmpty$rest(b)) {
    return a;
  } else {
    return append(a, b);
  }
};

// ../lustre/lustre/internals/constants.ffi.mjs
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// ../lustre/lustre/vdom/reconciler.ffi.mjs
var setTimeout = globalThis.setTimeout;
var clearTimeout = globalThis.clearTimeout;
var createElementNS = (ns, name2) => globalThis.document.createElementNS(ns, name2);
var createTextNode = (data2) => globalThis.document.createTextNode(data2);
var createComment = (data2) => globalThis.document.createComment(data2);
var createDocumentFragment = () => globalThis.document.createDocumentFragment();
var insertBefore = (parent, node, reference) => parent.insertBefore(node, reference);
var moveBefore = SUPPORTS_MOVE_BEFORE ? (parent, node, reference) => parent.moveBefore(node, reference) : insertBefore;
var removeChild = (parent, child2) => parent.removeChild(child2);
var getAttribute = (node, name2) => node.getAttribute(name2);
var setAttribute = (node, name2, value2) => node.setAttribute(name2, value2);
var removeAttribute = (node, name2) => node.removeAttribute(name2);
var addEventListener = (node, name2, handler, options) => node.addEventListener(name2, handler, options);
var removeEventListener = (node, name2, handler) => node.removeEventListener(name2, handler);
var setInnerHtml = (node, innerHtml) => node.innerHTML = innerHtml;
var setData = (node, data2) => node.data = data2;
var meta = /* @__PURE__ */ Symbol("lustre");
var MetadataNode = class {
  constructor(kind, parent, node, key) {
    this.kind = kind;
    this.key = key;
    this.parent = parent;
    this.children = [];
    this.node = node;
    this.endNode = null;
    this.handlers = /* @__PURE__ */ new Map();
    this.throttles = /* @__PURE__ */ new Map();
    this.debouncers = /* @__PURE__ */ new Map();
  }
  get isVirtual() {
    return this.kind === fragment_kind || this.kind === map_kind;
  }
  get parentNode() {
    return this.isVirtual ? this.node.parentNode : this.node;
  }
};
var insertMetadataChild = (kind, parent, node, index4, key) => {
  const child2 = new MetadataNode(kind, parent, node, key);
  node[meta] = child2;
  parent?.children.splice(index4, 0, child2);
  return child2;
};
var getPath = (node) => {
  let path = "";
  for (let current = node[meta]; current.parent; current = current.parent) {
    const separator = current.parent && current.parent.kind === map_kind ? separator_subtree : separator_element;
    if (current.key) {
      path = `${separator}${current.key}${path}`;
    } else {
      const index4 = current.parent.children.indexOf(current);
      path = `${separator}${index4}${path}`;
    }
  }
  return path.slice(1);
};
var Reconciler = class {
  #root = null;
  #decodeEvent;
  #dispatch;
  #debug = false;
  constructor(root2, decodeEvent, dispatch2, { debug = false } = {}) {
    this.#root = root2;
    this.#decodeEvent = decodeEvent;
    this.#dispatch = dispatch2;
    this.#debug = debug;
  }
  mount(vdom) {
    insertMetadataChild(element_kind, null, this.#root, 0, null);
    this.#insertChild(this.#root, null, this.#root[meta], 0, vdom);
  }
  push(patch, memos2 = null) {
    this.#memos = memos2;
    this.#stack.push({ node: this.#root[meta], patch });
    this.#reconcile();
  }
  // PATCHING ------------------------------------------------------------------
  #memos;
  #stack = [];
  #reconcile() {
    const stack = this.#stack;
    while (stack.length) {
      let { node, patch } = stack.pop();
      const { path, changes, removed, children: childPatches } = patch;
      iterate(path, (index4) => {
        node = node.children[index4];
      });
      const { children: childNodes } = node;
      iterate(changes, (change) => this.#patch(node, change));
      if (removed) {
        this.#removeChildren(node, childNodes.length - removed, removed);
      }
      iterate(childPatches, (childPatch) => {
        const child2 = childNodes[childPatch.index | 0];
        this.#stack.push({ node: child2, patch: childPatch });
      });
    }
  }
  #patch(node, change) {
    switch (change.kind) {
      case replace_text_kind:
        this.#replaceText(node, change);
        break;
      case replace_inner_html_kind:
        this.#replaceInnerHtml(node, change);
        break;
      case update_kind:
        this.#update(node, change);
        break;
      case move_kind:
        this.#move(node, change);
        break;
      case remove_kind:
        this.#remove(node, change);
        break;
      case replace_kind:
        this.#replace(node, change);
        break;
      case insert_kind:
        this.#insert(node, change);
        break;
    }
  }
  // CHANGES -------------------------------------------------------------------
  #insert(parent, { children, before }) {
    const fragment3 = createDocumentFragment();
    const beforeEl = this.#getReference(parent, before);
    this.#insertChildren(fragment3, null, parent, before | 0, children);
    insertBefore(parent.parentNode, fragment3, beforeEl);
  }
  #replace(parent, { index: index4, with: child2 }) {
    this.#removeChildren(parent, index4 | 0, 1);
    const beforeEl = this.#getReference(parent, index4);
    this.#insertChild(parent.parentNode, beforeEl, parent, index4 | 0, child2);
  }
  #getReference(node, index4) {
    index4 = index4 | 0;
    const { children } = node;
    const childCount = children.length;
    if (index4 < childCount) return children[index4].node;
    if (node.endNode) return node.endNode;
    if (!node.isVirtual) return null;
    while (node.isVirtual && node.children.length) {
      if (node.endNode) return node.endNode.nextSibling;
      node = node.children[node.children.length - 1];
    }
    return node.node.nextSibling;
  }
  #move(parent, { key, before }) {
    before = before | 0;
    const { children, parentNode } = parent;
    const beforeEl = children[before].node;
    let prev = children[before];
    for (let i = before + 1; i < children.length; ++i) {
      const next2 = children[i];
      children[i] = prev;
      prev = next2;
      if (next2.key === key) {
        children[before] = next2;
        break;
      }
    }
    this.#moveChild(parentNode, prev, beforeEl);
  }
  #moveChildren(domParent, children, beforeEl) {
    for (let i = 0; i < children.length; ++i) {
      this.#moveChild(domParent, children[i], beforeEl);
    }
  }
  #moveChild(domParent, child2, beforeEl) {
    moveBefore(domParent, child2.node, beforeEl);
    if (child2.isVirtual) {
      this.#moveChildren(domParent, child2.children, beforeEl);
    }
    if (child2.endNode) {
      moveBefore(domParent, child2.endNode, beforeEl);
    }
  }
  #remove(parent, { index: index4 }) {
    this.#removeChildren(parent, index4, 1);
  }
  #removeChildren(parent, index4, count2) {
    const { children, parentNode } = parent;
    const deleted = children.splice(index4, count2);
    for (let i = 0; i < deleted.length; ++i) {
      const child2 = deleted[i];
      const { node, endNode, isVirtual, children: nestedChildren } = child2;
      removeChild(parentNode, node);
      if (endNode) {
        removeChild(parentNode, endNode);
      }
      this.#removeDebouncers(child2);
      if (isVirtual) {
        deleted.push(...nestedChildren);
      }
    }
  }
  #removeDebouncers(node) {
    const { debouncers, children } = node;
    for (const { timeout } of debouncers.values()) {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    debouncers.clear();
    iterate(children, (child2) => this.#removeDebouncers(child2));
  }
  #update({ node, handlers, throttles, debouncers }, { added, removed }) {
    iterate(removed, ({ name: name2 }) => {
      if (handlers.delete(name2)) {
        removeEventListener(node, name2, handleEvent);
        this.#updateDebounceThrottle(throttles, name2, 0);
        this.#updateDebounceThrottle(debouncers, name2, 0);
      } else {
        removeAttribute(node, name2);
        SYNCED_ATTRIBUTES[name2]?.removed?.(node, name2);
      }
    });
    iterate(added, (attribute4) => this.#createAttribute(node, attribute4));
  }
  #replaceText({ node }, { content }) {
    setData(node, content ?? "");
  }
  #replaceInnerHtml({ node }, { inner_html }) {
    setInnerHtml(node, inner_html ?? "");
  }
  // INSERT --------------------------------------------------------------------
  #insertChildren(domParent, beforeEl, metaParent, index4, children) {
    iterate(
      children,
      (child2) => this.#insertChild(domParent, beforeEl, metaParent, index4++, child2)
    );
  }
  #insertChild(domParent, beforeEl, metaParent, index4, vnode) {
    switch (vnode.kind) {
      case element_kind: {
        const node = this.#createElement(metaParent, index4, vnode);
        this.#insertChildren(node, null, node[meta], 0, vnode.children);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case text_kind: {
        const node = this.#createTextNode(metaParent, index4, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case fragment_kind: {
        const marker = "lustre:fragment";
        const head = this.#createHead(marker, metaParent, index4, vnode);
        insertBefore(domParent, head, beforeEl);
        this.#insertChildren(
          domParent,
          beforeEl,
          head[meta],
          0,
          vnode.children
        );
        if (this.#debug) {
          head[meta].endNode = createComment(` /${marker} `);
          insertBefore(domParent, head[meta].endNode, beforeEl);
        }
        break;
      }
      case unsafe_inner_html_kind: {
        const node = this.#createElement(metaParent, index4, vnode);
        this.#replaceInnerHtml({ node }, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case map_kind: {
        const head = this.#createHead("lustre:map", metaParent, index4, vnode);
        insertBefore(domParent, head, beforeEl);
        this.#insertChild(domParent, beforeEl, head[meta], 0, vnode.child);
        break;
      }
      case memo_kind: {
        const child2 = this.#memos?.get(vnode.view) ?? vnode.view();
        this.#insertChild(domParent, beforeEl, metaParent, index4, child2);
        break;
      }
    }
  }
  #createElement(parent, index4, { kind, key, tag, namespace, attributes: attributes2 }) {
    const node = createElementNS(namespace || NAMESPACE_HTML, tag);
    insertMetadataChild(kind, parent, node, index4, key);
    if (this.#debug && key) {
      setAttribute(node, "data-lustre-key", key);
    }
    iterate(attributes2, (attribute4) => this.#createAttribute(node, attribute4));
    return node;
  }
  #createTextNode(parent, index4, { kind, key, content }) {
    const node = createTextNode(content ?? "");
    insertMetadataChild(kind, parent, node, index4, key);
    return node;
  }
  #createHead(marker, parent, index4, { kind, key }) {
    const node = this.#debug ? createComment(markerComment(marker, key)) : createTextNode("");
    insertMetadataChild(kind, parent, node, index4, key);
    return node;
  }
  #createAttribute(node, attribute4) {
    const { debouncers, handlers, throttles } = node[meta];
    const {
      kind,
      name: name2,
      value: value2,
      prevent_default: prevent,
      debounce: debounceDelay,
      throttle: throttleDelay
    } = attribute4;
    switch (kind) {
      case attribute_kind: {
        const valueOrDefault = value2 ?? "";
        if (name2 === "virtual:defaultValue") {
          node.defaultValue = valueOrDefault;
          return;
        } else if (name2 === "virtual:defaultChecked") {
          node.defaultChecked = true;
          return;
        } else if (name2 === "virtual:defaultSelected") {
          node.defaultSelected = true;
          return;
        }
        if (valueOrDefault !== getAttribute(node, name2)) {
          setAttribute(node, name2, valueOrDefault);
        }
        SYNCED_ATTRIBUTES[name2]?.added?.(node, valueOrDefault);
        break;
      }
      case property_kind:
        node[name2] = value2;
        break;
      case event_kind: {
        if (handlers.has(name2)) {
          removeEventListener(node, name2, handleEvent);
        }
        const passive = prevent.kind === never_kind;
        addEventListener(node, name2, handleEvent, { passive });
        this.#updateDebounceThrottle(throttles, name2, throttleDelay);
        this.#updateDebounceThrottle(debouncers, name2, debounceDelay);
        handlers.set(name2, (event4) => this.#handleEvent(attribute4, event4));
        break;
      }
    }
  }
  #updateDebounceThrottle(map7, name2, delay) {
    const debounceOrThrottle = map7.get(name2);
    if (delay > 0) {
      if (debounceOrThrottle) {
        debounceOrThrottle.delay = delay;
      } else {
        map7.set(name2, { delay });
      }
    } else if (debounceOrThrottle) {
      const { timeout } = debounceOrThrottle;
      if (timeout) {
        clearTimeout(timeout);
      }
      map7.delete(name2);
    }
  }
  #handleEvent(attribute4, event4) {
    const { currentTarget, type } = event4;
    const { debouncers, throttles } = currentTarget[meta];
    const path = getPath(currentTarget);
    const {
      prevent_default: prevent,
      stop_propagation: stop,
      include
    } = attribute4;
    if (prevent.kind === always_kind) event4.preventDefault();
    if (stop.kind === always_kind) event4.stopPropagation();
    if (type === "submit") {
      event4.detail ??= {};
      event4.detail.formData = [
        ...new FormData(event4.target, event4.submitter).entries()
      ];
    }
    const data2 = this.#decodeEvent(event4, path, type, include);
    const throttle = throttles.get(type);
    if (throttle) {
      const now = Date.now();
      const last = throttle.last || 0;
      if (now > last + throttle.delay) {
        throttle.last = now;
        throttle.lastEvent = event4;
        this.#dispatch(event4, data2);
      }
    }
    const debounce = debouncers.get(type);
    if (debounce) {
      clearTimeout(debounce.timeout);
      debounce.timeout = setTimeout(() => {
        if (event4 === throttles.get(type)?.lastEvent) return;
        this.#dispatch(event4, data2);
      }, debounce.delay);
    }
    if (!throttle && !debounce) {
      this.#dispatch(event4, data2);
    }
  }
};
var markerComment = (marker, key) => {
  if (key) {
    return ` ${marker} key="${escape(key)}" `;
  } else {
    return ` ${marker} `;
  }
};
var handleEvent = (event4) => {
  const { currentTarget, type } = event4;
  const handler = currentTarget[meta].handlers.get(type);
  handler(event4);
};
var syncedBooleanAttribute = /* @__NO_SIDE_EFFECTS__ */ (name2) => {
  return {
    added(node) {
      node[name2] = true;
    },
    removed(node) {
      node[name2] = false;
    }
  };
};
var syncedAttribute = /* @__NO_SIDE_EFFECTS__ */ (name2) => {
  return {
    added(node, value2) {
      node[name2] = value2;
    }
  };
};
var SYNCED_ATTRIBUTES = {
  checked: /* @__PURE__ */ syncedBooleanAttribute("checked"),
  selected: /* @__PURE__ */ syncedBooleanAttribute("selected"),
  value: /* @__PURE__ */ syncedAttribute("value"),
  autofocus: {
    added(node) {
      queueMicrotask(() => {
        node.focus?.();
      });
    }
  },
  autoplay: {
    added(node) {
      try {
        node.play?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

// ../lustre/lustre/element/keyed.mjs
function do_extract_keyed_children(loop$key_children_pairs, loop$keyed_children, loop$children) {
  while (true) {
    let key_children_pairs = loop$key_children_pairs;
    let keyed_children = loop$keyed_children;
    let children = loop$children;
    if (key_children_pairs instanceof Empty) {
      return [keyed_children, reverse(children)];
    } else {
      let rest = key_children_pairs.tail;
      let key = key_children_pairs.head[0];
      let element$1 = key_children_pairs.head[1];
      let keyed_element = to_keyed(key, element$1);
      let _block;
      if (key === "") {
        _block = keyed_children;
      } else {
        _block = insert2(keyed_children, key, keyed_element);
      }
      let keyed_children$1 = _block;
      let children$1 = prepend(keyed_element, children);
      loop$key_children_pairs = rest;
      loop$keyed_children = keyed_children$1;
      loop$children = children$1;
    }
  }
}
function extract_keyed_children(children) {
  return do_extract_keyed_children(
    children,
    empty2(),
    empty_list
  );
}
function element3(tag, attributes2, children) {
  let $ = extract_keyed_children(children);
  let keyed_children = $[0];
  let children$1 = $[1];
  return element(
    "",
    "",
    tag,
    attributes2,
    children$1,
    keyed_children,
    false,
    is_void_html_element(tag, "")
  );
}
function namespaced2(namespace, tag, attributes2, children) {
  let $ = extract_keyed_children(children);
  let keyed_children = $[0];
  let children$1 = $[1];
  return element(
    "",
    namespace,
    tag,
    attributes2,
    children$1,
    keyed_children,
    false,
    is_void_html_element(tag, namespace)
  );
}
function fragment2(children) {
  let $ = extract_keyed_children(children);
  let keyed_children = $[0];
  let children$1 = $[1];
  return fragment("", children$1, keyed_children);
}

// ../lustre/lustre/vdom/virtualise.ffi.mjs
var virtualise = (root2) => {
  const rootMeta = insertMetadataChild(element_kind, null, root2, 0, null);
  const { children } = virtualiseChildren(rootMeta, root2, root2.firstChild);
  if (children.length > 1) {
    const rootNodeMeta = insertMetadataChild(element_kind, null, root2, 0, null);
    rootMeta.kind = fragment_kind;
    rootMeta.node = globalThis.document.createTextNode("");
    rootMeta.parent = rootNodeMeta;
    rootNodeMeta.children.push(rootMeta);
    root2.insertBefore(rootMeta.node, root2.firstChild);
    return fragment2(toList2(children));
  }
  if (children.length === 1) {
    return children[0][1];
  }
  const placeholder = globalThis.document.createTextNode("");
  insertMetadataChild(text_kind, rootMeta, placeholder, 0, null);
  root2.insertBefore(placeholder, root2.firstChild);
  return none2();
};
var virtualiseChild = (meta2, domParent, child2, index4) => {
  if (child2.nodeType === COMMENT_NODE) {
    const data2 = child2.data.trim();
    if (data2.startsWith("lustre:fragment")) {
      return virtualiseFragment(meta2, domParent, child2, index4);
    }
    if (data2.startsWith("lustre:map")) {
      return virtualiseMap(meta2, domParent, child2, index4);
    }
    if (data2.startsWith("lustre:memo")) {
      return virtualiseMemo(meta2, domParent, child2, index4);
    }
    return null;
  }
  if (child2.nodeType === ELEMENT_NODE) {
    return virtualiseElement(meta2, child2, index4);
  }
  if (child2.nodeType === TEXT_NODE) {
    return virtualiseText(meta2, child2, index4);
  }
  return null;
};
var virtualiseElement = (metaParent, node, index4) => {
  const key = node.getAttribute("data-lustre-key") ?? "";
  if (key) {
    node.removeAttribute("data-lustre-key");
  }
  const meta2 = insertMetadataChild(element_kind, metaParent, node, index4, key);
  const tag = node.localName;
  const namespace = node.namespaceURI;
  const isHtmlElement = !namespace || namespace === NAMESPACE_HTML;
  if (isHtmlElement && INPUT_ELEMENTS.includes(tag)) {
    virtualiseInputEvents(tag, node);
  }
  const attributes2 = virtualiseAttributes(node);
  const { children } = virtualiseChildren(meta2, node, node.firstChild);
  const vnode = isHtmlElement ? element3(tag, attributes2, toList2(children)) : namespaced2(namespace, tag, attributes2, toList2(children));
  return childResult(key, vnode, node.nextSibling);
};
var virtualiseChildren = (meta2, domParent, childNode) => {
  const children = [];
  while (childNode && (childNode.nodeType !== COMMENT_NODE || childNode.data.trim() !== "/lustre:fragment")) {
    const child2 = virtualiseChild(meta2, domParent, childNode, children.length);
    if (child2) {
      children.push([child2.key, child2.vnode]);
      childNode = child2.next;
    } else {
      childNode = childNode.nextSibling;
    }
  }
  return { children, end: childNode };
};
var virtualiseText = (meta2, node, index4) => {
  insertMetadataChild(text_kind, meta2, node, index4, null);
  return childResult("", text2(node.data), node.nextSibling);
};
var virtualiseFragment = (metaParent, domParent, node, index4) => {
  const key = parseKey(node.data);
  const meta2 = insertMetadataChild(fragment_kind, metaParent, node, index4, key);
  const { children, end } = virtualiseChildren(meta2, domParent, node.nextSibling);
  meta2.endNode = end;
  const vnode = fragment2(toList2(children));
  return childResult(key, vnode, end?.nextSibling);
};
var virtualiseMap = (metaParent, domParent, node, index4) => {
  const key = parseKey(node.data);
  const meta2 = insertMetadataChild(map_kind, metaParent, node, index4, key);
  const child2 = virtualiseNextChild(meta2, domParent, node, 0);
  if (!child2) return null;
  const vnode = map6(child2.vnode, (x) => x);
  return childResult(key, vnode, child2.next);
};
var virtualiseMemo = (meta2, domParent, node, index4) => {
  const key = parseKey(node.data);
  const child2 = virtualiseNextChild(meta2, domParent, node, index4);
  if (!child2) return null;
  domParent.removeChild(node);
  const vnode = memo2(toList2([ref({})]), () => child2.vnode);
  return childResult(key, vnode, child2.next);
};
var virtualiseNextChild = (meta2, domParent, node, index4) => {
  while (true) {
    node = node.nextSibling;
    if (!node) return null;
    const child2 = virtualiseChild(meta2, domParent, node, index4);
    if (child2) return child2;
  }
};
var childResult = (key, vnode, next2) => {
  return { key, vnode, next: next2 };
};
var virtualiseAttributes = (node) => {
  const attributes2 = [];
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    if (attr.name !== "xmlns") {
      attributes2.push(attribute2(attr.localName, attr.value));
    }
  }
  return toList2(attributes2);
};
var INPUT_ELEMENTS = ["input", "select", "textarea"];
var virtualiseInputEvents = (tag, node) => {
  const value2 = node.value;
  const checked = node.checked;
  if (tag === "input" && node.type === "checkbox" && !checked) return;
  if (tag === "input" && node.type === "radio" && !checked) return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value2) return;
  queueMicrotask(() => {
    node.value = value2;
    node.checked = checked;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    if (globalThis.document.activeElement !== node) {
      node.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
};
var parseKey = (data2) => {
  const keyMatch = data2.match(/key="([^"]*)"/);
  if (!keyMatch) return "";
  return unescapeKey(keyMatch[1]);
};
var unescapeKey = (key) => {
  return key.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'");
};
var toList2 = (arr) => arr.reduceRight((xs, x) => List$NonEmpty(x, xs), empty_list);

// ../lustre/lustre/runtime/client/runtime.ffi.mjs
var is_browser = () => !!globalThis.document;
var Runtime = class {
  constructor(root2, [model, effects], view2, update3, options) {
    this.root = root2;
    this.#model = model;
    this.#view = view2;
    this.#update = update3;
    this.root.addEventListener("context-request", (event4) => {
      if (!(event4.context && event4.callback)) return;
      if (!this.#contexts.has(event4.context)) return;
      event4.stopImmediatePropagation();
      const context = this.#contexts.get(event4.context);
      if (event4.subscribe) {
        const unsubscribe2 = () => {
          context.subscribers = context.subscribers.filter(
            (subscriber) => subscriber !== event4.callback
          );
        };
        context.subscribers.push([event4.callback, unsubscribe2]);
        event4.callback(context.value, unsubscribe2);
      } else {
        event4.callback(context.value);
      }
    });
    const decodeEvent = (event4, path, name2) => decode2(this.#cache, path, name2, event4);
    const dispatch2 = (event4, data2) => {
      const [cache, result] = dispatch(this.#cache, data2);
      this.#cache = cache;
      if (Result$isOk(result)) {
        const handler = Result$Ok$0(result);
        if (handler.stop_propagation) event4.stopPropagation();
        if (handler.prevent_default) event4.preventDefault();
        this.dispatch(handler.message, false);
      }
    };
    this.#reconciler = new Reconciler(
      this.root,
      decodeEvent,
      dispatch2,
      options
    );
    this.#vdom = virtualise(this.root);
    this.#cache = new$4();
    this.#handleEffects(effects);
    this.#render();
  }
  // PUBLIC API ----------------------------------------------------------------
  root = null;
  dispatch(message, shouldFlush = false) {
    if (this.#shouldQueue) {
      this.#queue.push(message);
    } else {
      const [model, effects] = this.#update(this.#model, message);
      this.#model = model;
      this.#scheduleRender(shouldFlush);
      this.#handleEffects(effects);
    }
  }
  emit(event4, data2) {
    const target = this.root.host ?? this.root;
    target.dispatchEvent(new LustreEvent(event4, data2));
  }
  // Provide a context value for any child nodes that request it using the given
  // key. If the key already exists, any existing subscribers will be notified
  // of the change. Otherwise, we store the value and wait for any `context-request`
  // events to come in.
  provide(key, value2) {
    if (!this.#contexts.has(key)) {
      this.#contexts.set(key, { value: value2, subscribers: [] });
    } else {
      const context = this.#contexts.get(key);
      if (isEqual2(context.value, value2)) {
        return;
      }
      context.value = value2;
      for (let i = context.subscribers.length - 1; i >= 0; i--) {
        const [subscriber, unsubscribe2] = context.subscribers[i];
        if (!subscriber) {
          context.subscribers.splice(i, 1);
          continue;
        }
        subscriber(value2, unsubscribe2);
      }
    }
  }
  subscribe(key, decoder) {
    if (!key) return;
    this.#contextSubscriptions.get(key)?.();
    const target = this.root.host ?? this.root;
    target.dispatchEvent(
      new ContextRequestEvent(
        key,
        (value2, unsubscribe2) => {
          const previousUnsubscribe = this.#contextSubscriptions.get(key);
          if (previousUnsubscribe !== unsubscribe2) {
            previousUnsubscribe?.();
          }
          const decoded = run(value2, decoder);
          this.#contextSubscriptions.set(key, unsubscribe2);
          if (Result$isOk(decoded)) {
            this.dispatch(Result$Ok$0(decoded), true);
          }
        },
        true
      )
    );
  }
  unsubscribe(key) {
    const unsubscribe2 = this.#contextSubscriptions.get(key);
    if (unsubscribe2) {
      unsubscribe2();
      this.#contextSubscriptions.delete(key);
    }
  }
  unsubscribeAll() {
    for (const [_, unsubscribe2] of this.#contextSubscriptions) {
      unsubscribe2?.();
    }
    this.#contextSubscriptions.clear();
  }
  // PRIVATE API ---------------------------------------------------------------
  #model;
  #view;
  #update;
  #vdom;
  #cache;
  #reconciler;
  #contexts = /* @__PURE__ */ new Map();
  #contextSubscriptions = /* @__PURE__ */ new Map();
  #shouldQueue = false;
  #queue = [];
  #beforePaint = empty_list;
  #afterPaint = empty_list;
  #renderTimer = null;
  #actions = {
    dispatch: (message) => this.dispatch(message),
    emit: (event4, data2) => this.emit(event4, data2),
    select: () => {
    },
    root: () => this.root,
    provide: (key, value2) => this.provide(key, value2),
    subscribe: (key, decoder) => this.subscribe(key, decoder),
    unsubscribe: (key) => this.unsubscribe(key)
  };
  #scheduleRender(shouldFlush = false) {
    if (this.#renderTimer) return;
    if (shouldFlush) {
      this.#renderTimer = "sync";
      queueMicrotask(() => this.#render());
    } else {
      this.#renderTimer = window.requestAnimationFrame(() => this.#render());
    }
  }
  // #handleEffects processes all effects, without scheduling a render.
  #handleEffects(effects) {
    this.#shouldQueue = true;
    let updateCalledDuringEffects = false;
    while (true) {
      iterate(effects.synchronous, (effect) => effect(this.#actions));
      this.#beforePaint = append4(this.#beforePaint, effects.before_paint);
      this.#afterPaint = append4(this.#afterPaint, effects.after_paint);
      if (!this.#queue.length) break;
      const message = this.#queue.shift();
      [this.#model, effects] = this.#update(this.#model, message);
      updateCalledDuringEffects = true;
    }
    this.#shouldQueue = false;
    return updateCalledDuringEffects;
  }
  // Async effects (before_paint and after_paint) can trigger without causing a
  // new model update. Here we process these effects and schedules the next
  // (synchronous) frame if required.
  #handleAsyncEffects(effects) {
    if (this.#handleEffects(effects)) {
      this.#scheduleRender(true);
    }
  }
  #render() {
    this.#renderTimer = null;
    const next2 = this.#view(this.#model);
    const { patch, cache } = diff(this.#cache, this.#vdom, next2);
    this.#cache = cache;
    this.#vdom = next2;
    this.#reconciler.push(patch, memos(cache));
    if (List$isNonEmpty(this.#beforePaint)) {
      const effects = makeEffect(this.#beforePaint);
      this.#beforePaint = empty_list;
      queueMicrotask(() => this.#handleAsyncEffects(effects));
    }
    if (List$isNonEmpty(this.#afterPaint)) {
      const effects = makeEffect(this.#afterPaint);
      this.#afterPaint = empty_list;
      window.requestAnimationFrame(() => this.#handleAsyncEffects(effects));
    }
  }
};
function makeEffect(synchronous) {
  return {
    synchronous,
    after_paint: empty_list,
    before_paint: empty_list
  };
}
var ContextRequestEvent = class extends Event {
  constructor(context, callback, subscribe2) {
    super("context-request", { bubbles: true, composed: true });
    this.context = context;
    this.callback = callback;
    this.subscribe = subscribe2;
  }
};
var LustreEvent = class extends CustomEvent {
  // We can't rely on `instanceof` checks because the server component client
  // runtime is bundled on its own and thus will have its own copy of this class.
  isLustreEvent = true;
  constructor(name2, detail) {
    super(name2, { detail, bubbles: true, composed: true });
  }
};

// ../lustre/lustre/runtime/client/spa.ffi.mjs
var Spa = class {
  #runtime;
  constructor(root2, [init2, effects], update3, view2) {
    this.#runtime = new Runtime(root2, [init2, effects], view2, update3);
  }
  send(message) {
    if (Message$isEffectDispatchedMessage(message)) {
      this.dispatch(message.message, false);
    } else if (Message$isEffectEmitEvent(message)) {
      this.emit(message.name, message.data);
    } else if (Message$isSystemRequestedShutdown(message)) {
    }
  }
  dispatch(message) {
    this.#runtime.dispatch(message);
  }
  emit(event4, data2) {
    this.#runtime.emit(event4, data2);
  }
};
var start = ({ init: init2, update: update3, view: view2 }, selector, flags) => {
  if (!is_browser()) return Result$Error(Error$NotABrowser());
  const root2 = selector instanceof HTMLElement ? selector : globalThis.document.querySelector(selector);
  if (!root2) return Result$Error(Error$ElementNotFound(selector));
  return Result$Ok(new Spa(root2, init2(flags), update3, view2));
};

// ../lustre/lustre.mjs
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var Error$ElementNotFound = (selector) => new ElementNotFound(selector);
var NotABrowser = class extends CustomType {
};
var Error$NotABrowser$const = new NotABrowser();
var Error$NotABrowser = () => Error$NotABrowser$const;
function application(init2, update3, view2) {
  return new App(
    Option$None$const,
    init2,
    update3,
    view2,
    default_config
  );
}
function start4(app, selector, arguments$) {
  return guard(
    !is_browser(),
    new Error(Error$NotABrowser$const),
    () => {
      return start(app, selector, arguments$);
    }
  );
}

// ../lustre/lustre/event.mjs
function on(name2, handler) {
  return event(
    name2,
    map3(
      handler,
      (message) => {
        return new Handler(false, false, message);
      }
    ),
    empty_list,
    never,
    never,
    0,
    0
  );
}
function on_click(message) {
  return on("click", success(message));
}
function on_input(message) {
  return on(
    "input",
    subfield(
      prepend("target", prepend("value", List$Empty$const)),
      string2,
      (value2) => {
        return success(message(value2));
      }
    )
  );
}
function on_change(message) {
  return on(
    "change",
    subfield(
      prepend("target", prepend("value", List$Empty$const)),
      string2,
      (value2) => {
        return success(message(value2));
      }
    )
  );
}

// errors.mjs
var UnboundVariable = class extends CustomType {
  constructor(name2) {
    super();
    this.name = name2;
  }
};
var TypeError = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var NoMatchingCase = class extends CustomType {
};
var EvalError$NoMatchingCase$const = new NoMatchingCase();
var RecursionLimit = class extends CustomType {
};
var EvalError$RecursionLimit$const = new RecursionLimit();
var StepLimit = class extends CustomType {
};
var EvalError$StepLimit$const = new StepLimit();
var PathLimit = class extends CustomType {
};
var EvalError$PathLimit$const = new PathLimit();
var MissingFunction = class extends CustomType {
  constructor(name2, num_args) {
    super();
    this.name = name2;
    this.num_args = num_args;
  }
};
var BadDrawing = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var NotImplemented = class extends CustomType {
  constructor(expr) {
    super();
    this.expr = expr;
  }
};
var OnLine = class extends CustomType {
  constructor(error, line) {
    super();
    this.error = error;
    this.line = line;
  }
};
function at_line(error, line) {
  if (error instanceof OnLine) {
    return error;
  } else {
    return new OnLine(error, line);
  }
}
function on_line(line) {
  return " on line " + to_string(line);
}
function error_message(error) {
  if (error instanceof UnboundVariable) {
    let name2 = error.name;
    return "unknown variable: " + name2;
  } else if (error instanceof TypeError) {
    let message = error.message;
    return "type error: " + message;
  } else if (error instanceof NoMatchingCase) {
    return "no case pattern matched the value";
  } else if (error instanceof RecursionLimit) {
    return "recursion too deep (missing base case?)";
  } else if (error instanceof StepLimit) {
    return "too many steps (drawing too complex, or infinite loop?)";
  } else if (error instanceof PathLimit) {
    return "too many paths in the drawing";
  } else if (error instanceof MissingFunction) {
    let name2 = error.name;
    let num_args = error.num_args;
    return "no function " + name2 + " that takes " + to_string(
      num_args
    ) + " argument(s)";
  } else if (error instanceof BadDrawing) {
    let message = error.message;
    return "bad drawing: " + message;
  } else if (error instanceof NotImplemented) {
    let expr = error.expr;
    return "not yet implemented: " + expr;
  } else {
    let error$1 = error.error;
    let line = error.line;
    return error_message(error$1) + on_line(line);
  }
}

// limits_ffi.mjs
var STEP_LIMIT = 25e4;
var OUT_OF_STEPS = {};
var steps = 0;
function charge(cost) {
  steps += Math.max(cost, 0);
  if (steps > STEP_LIMIT) throw OUT_OF_STEPS;
}
function guarded(evaluate, stepError, recursionError) {
  steps = 0;
  try {
    return evaluate();
  } catch (error) {
    if (error === OUT_OF_STEPS) return stepError;
    if (error instanceof RangeError || error?.name === "InternalError") {
      return recursionError;
    }
    throw error;
  }
}

// limits.mjs
var path_limit = 1e5;
function guarded2(evaluate) {
  return guarded(
    evaluate,
    new Error(EvalError$StepLimit$const),
    new Error(EvalError$RecursionLimit$const)
  );
}

// mutable_dict_ffi.mjs
function newDict() {
  return /* @__PURE__ */ new Map();
}
function get3(dict3, key) {
  return dict3.has(key) ? new Ok(dict3.get(key)) : new Error(void 0);
}
function insert4(dict3, key, value2) {
  dict3.set(key, value2);
}

// evaluator.mjs
var VBool = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var VInt = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var VList = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var VData = class extends CustomType {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
};
var VFunc = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Local = class extends CustomType {
  constructor(bindings, parent) {
    super();
    this.bindings = bindings;
    this.parent = parent;
  }
};
var Global = class extends CustomType {
  constructor(bindings) {
    super();
    this.bindings = bindings;
  }
};
var Builtin = class extends CustomType {
  constructor(name2, num_args, run3) {
    super();
    this.name = name2;
    this.num_args = num_args;
    this.run = run3;
  }
};
var UserFn = class extends CustomType {
  constructor(name2, params, body, env) {
    super();
    this.name = name2;
    this.params = params;
    this.body = body;
    this.env = env;
  }
};
var Var = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var LiteralBool = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var LiteralInt = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var LiteralList = class extends CustomType {
  constructor(elems, rest) {
    super();
    this.elems = elems;
    this.rest = rest;
  }
};
var Call = class extends CustomType {
  constructor(fn_expr, operands) {
    super();
    this.fn_expr = fn_expr;
    this.operands = operands;
  }
};
var Lambda = class extends CustomType {
  constructor(params, body) {
    super();
    this.params = params;
    this.body = body;
  }
};
var Case = class extends CustomType {
  constructor(subject, arms) {
    super();
    this.subject = subject;
    this.arms = arms;
  }
};
var Let = class extends CustomType {
  constructor(name2, value2, body) {
    super();
    this.name = name2;
    this.value = value2;
    this.body = body;
  }
};
var FieldAccess = class extends CustomType {
  constructor(record, field3) {
    super();
    this.record = record;
    this.field = field3;
  }
};
var At = class extends CustomType {
  constructor(line, expr) {
    super();
    this.line = line;
    this.expr = expr;
  }
};
var PBool = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var PInt = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var PWildcard = class extends CustomType {
};
var Pattern$PWildcard$const = new PWildcard();
var PVar = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var PList = class extends CustomType {
  constructor(elems, rest) {
    super();
    this.elems = elems;
    this.rest = rest;
  }
};
var constructors = /* @__PURE__ */ prepend(
  [
    "Point",
    /* @__PURE__ */ prepend("x", prepend("y", List$Empty$const))
  ],
  prepend(
    [
      "Line",
      /* @__PURE__ */ prepend(
        "start",
        prepend("end", List$Empty$const)
      )
    ],
    prepend(
      [
        "ColorLine",
        /* @__PURE__ */ prepend(
          "start",
          prepend(
            "end",
            prepend(
              "r",
              prepend("g", prepend("b", List$Empty$const))
            )
          )
        )
      ],
      prepend(
        [
          "Circle",
          /* @__PURE__ */ prepend(
            "center",
            prepend("radius", List$Empty$const)
          )
        ],
        prepend(
          [
            "ColorCircle",
            /* @__PURE__ */ prepend(
              "center",
              prepend(
                "radius",
                prepend(
                  "r",
                  prepend("g", prepend("b", List$Empty$const))
                )
              )
            )
          ],
          prepend(
            [
              "Path",
              /* @__PURE__ */ prepend(
                "shape",
                prepend(
                  "start",
                  prepend(
                    "end",
                    prepend("thickness", List$Empty$const)
                  )
                )
              )
            ],
            List$Empty$const
          )
        )
      )
    )
  )
);
function describe(v) {
  if (v instanceof VList) {
    return "a list";
  } else if (v instanceof VData) {
    let tag = v.tag;
    return "a " + tag + " record";
  } else if (v instanceof VFunc) {
    let f = v[0];
    return "the function " + f.name;
  } else {
    return inspect2(v);
  }
}
function get_field(v, field3) {
  if (v instanceof VData) {
    let tag = v.tag;
    let values3 = v.fields;
    let names = unwrap(
      key_find(constructors, tag),
      List$Empty$const
    );
    let $ = key_find(zip(names, values3), field3);
    if ($ instanceof Ok) {
      return $;
    } else {
      return new Error(new TypeError("a " + tag + " has no ." + field3));
    }
  } else {
    return new Error(
      new TypeError("." + field3 + " expects a record, got " + describe(v))
    );
  }
}
function extend(env, new$8) {
  if (env instanceof Local) {
    let existing = env.bindings;
    let parent = env.parent;
    return new Local(merge(existing, from_list(new$8)), parent);
  } else {
    return env;
  }
}
function match_list(elems, rest, vs) {
  if (elems instanceof Empty) {
    if (rest instanceof Some) {
      let x = rest[0];
      return new Ok(prepend([x, new VList(vs)], List$Empty$const));
    } else if (vs instanceof Empty) {
      return new Ok(List$Empty$const);
    } else {
      return new Error(void 0);
    }
  } else if (vs instanceof Empty) {
    return new Error(void 0);
  } else {
    let p = elems.head;
    let ps = elems.tail;
    let v = vs.head;
    let vs_rest = vs.tail;
    let $ = match_pattern(p, v);
    let $1 = match_list(ps, rest, vs_rest);
    if ($ instanceof Ok && $1 instanceof Ok) {
      let b1 = $[0];
      let b2 = $1[0];
      return new Ok(append(b1, b2));
    } else {
      return new Error(void 0);
    }
  }
}
function match_pattern(pattern2, value2) {
  if (pattern2 instanceof PBool) {
    if (value2 instanceof VBool) {
      let b1 = pattern2[0];
      let b2 = value2[0];
      if (b1 === b2) {
        return new Ok(List$Empty$const);
      } else {
        return new Error(void 0);
      }
    } else {
      return new Error(void 0);
    }
  } else if (pattern2 instanceof PInt) {
    if (value2 instanceof VInt) {
      let n1 = pattern2[0];
      let n2 = value2[0];
      if (n1 === n2) {
        return new Ok(List$Empty$const);
      } else {
        return new Error(void 0);
      }
    } else {
      return new Error(void 0);
    }
  } else if (pattern2 instanceof PWildcard) {
    return new Ok(List$Empty$const);
  } else if (pattern2 instanceof PVar) {
    let name2 = pattern2[0];
    return new Ok(prepend([name2, value2], List$Empty$const));
  } else if (value2 instanceof VList) {
    let elems = pattern2.elems;
    let rest = pattern2.rest;
    let vs = value2[0];
    return match_list(elems, rest, vs);
  } else {
    return new Error(void 0);
  }
}
function find_arm(loop$value, loop$arms) {
  while (true) {
    let value2 = loop$value;
    let arms = loop$arms;
    if (arms instanceof Empty) {
      return new Error(void 0);
    } else {
      let rest = arms.tail;
      let pattern2 = arms.head[0];
      let body = arms.head[1];
      let $ = match_pattern(pattern2, value2);
      if ($ instanceof Ok) {
        let bindings = $[0];
        return new Ok([bindings, body]);
      } else {
        loop$value = value2;
        loop$arms = rest;
      }
    }
  }
}
function wrong_num_args(function_name, wanted, got) {
  return new TypeError(
    function_name + " takes " + to_string(wanted) + " argument(s) but was given " + to_string(
      got
    )
  );
}
function num_params(callable) {
  if (callable instanceof Builtin) {
    let num_args = callable.num_args;
    return num_args;
  } else {
    let params = callable.params;
    return length(params);
  }
}
function lookup2(loop$env, loop$name) {
  while (true) {
    let env = loop$env;
    let name2 = loop$name;
    if (env instanceof Local) {
      let bindings = env.bindings;
      let parent = env.parent;
      let $ = get(bindings, name2);
      if ($ instanceof Ok) {
        return $;
      } else {
        loop$env = parent;
        loop$name = name2;
      }
    } else {
      let bindings = env.bindings;
      let $ = get3(bindings, name2);
      if ($ instanceof Ok) {
        return $;
      } else {
        return new Error(new UnboundVariable(name2));
      }
    }
  }
}
function apply(f, args) {
  charge(1);
  if (f instanceof VFunc) {
    let callable = f[0];
    let wanted = num_params(callable);
    let $ = length(args) === wanted;
    if ($) {
      if (callable instanceof Builtin) {
        let run$1 = callable.run;
        return run$1(args);
      } else {
        let params = callable.params;
        let body = callable.body;
        let parent = callable.env;
        return eval$(
          body,
          new Local(from_list(zip(params, args)), parent)
        );
      }
    } else {
      return new Error(
        wrong_num_args(callable.name, wanted, length(args))
      );
    }
  } else {
    return new Error(new TypeError("calling a value that is not a function"));
  }
}
function eval_list(elems, rest, env) {
  let $ = try_map(elems, (e) => {
    return eval$(e, env);
  });
  if ($ instanceof Ok) {
    if (rest instanceof Some) {
      let head = $[0];
      let r = rest[0];
      let $1 = eval$(r, env);
      if ($1 instanceof Ok) {
        let $2 = $1[0];
        if ($2 instanceof VList) {
          let tail = $2[0];
          return new Ok(new VList(append(head, tail)));
        } else {
          let other = $2;
          return new Error(
            new TypeError("`..` expects a list, got " + describe(other))
          );
        }
      } else {
        return $1;
      }
    } else {
      let head = $[0];
      return new Ok(new VList(head));
    }
  } else {
    return $;
  }
}
function eval$(loop$expr, loop$env) {
  while (true) {
    let expr = loop$expr;
    let env = loop$env;
    charge(1);
    if (expr instanceof Var) {
      let name2 = expr[0];
      return lookup2(env, name2);
    } else if (expr instanceof LiteralBool) {
      let b = expr[0];
      return new Ok(new VBool(b));
    } else if (expr instanceof LiteralInt) {
      let n = expr[0];
      return new Ok(new VInt(n));
    } else if (expr instanceof LiteralList) {
      let elems = expr.elems;
      let rest = expr.rest;
      return eval_list(elems, rest, env);
    } else if (expr instanceof Call) {
      let fn_expr = expr.fn_expr;
      let operands = expr.operands;
      let $ = eval$(fn_expr, env);
      let $1 = try_map(operands, (x) => {
        return eval$(x, env);
      });
      if ($ instanceof Ok) {
        if ($1 instanceof Ok) {
          let fn_val = $[0];
          let args = $1[0];
          return apply(fn_val, args);
        } else {
          let e = $1[0];
          return new Error(e);
        }
      } else {
        let e = $[0];
        return new Error(e);
      }
    } else if (expr instanceof Lambda) {
      let params = expr.params;
      let body = expr.body;
      return new Ok(new VFunc(new UserFn("lambda", params, body, env)));
    } else if (expr instanceof Case) {
      let subject = expr.subject;
      let arms = expr.arms;
      let $ = eval$(subject, env);
      if ($ instanceof Ok) {
        let val = $[0];
        let $1 = find_arm(val, arms);
        if ($1 instanceof Ok) {
          let body = $1[0][0];
          let bindings = $1[0][1];
          loop$expr = bindings;
          loop$env = extend(env, body);
        } else {
          return new Error(EvalError$NoMatchingCase$const);
        }
      } else {
        return $;
      }
    } else if (expr instanceof Let) {
      let name2 = expr.name;
      let v = expr.value;
      let body = expr.body;
      let $ = eval$(v, env);
      if ($ instanceof Ok) {
        let value2 = $[0];
        loop$expr = body;
        loop$env = extend(env, prepend([name2, value2], List$Empty$const));
      } else {
        return $;
      }
    } else if (expr instanceof FieldAccess) {
      let record = expr.record;
      let field3 = expr.field;
      let $ = eval$(record, env);
      if ($ instanceof Ok) {
        let v = $[0];
        return get_field(v, field3);
      } else {
        return $;
      }
    } else {
      let line = expr.line;
      let expr$1 = expr.expr;
      return map_error(
        eval$(expr$1, env),
        (_capture) => {
          return at_line(_capture, line);
        }
      );
    }
  }
}
function run2(function$, args, global) {
  return guarded2(
    () => {
      let $ = get3(global, function$);
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 instanceof VFunc) {
          let $2 = $1[0];
          if ($2 instanceof UserFn) {
            let params = $2.params;
            let body = $2.body;
            let env = $2.env;
            let $3 = length(params) === length(args);
            if ($3) {
              return eval$(
                body,
                new Local(from_list(zip(params, args)), env)
              );
            } else {
              return new Error(
                new MissingFunction(function$, length(args))
              );
            }
          } else {
            return new Error(new MissingFunction(function$, length(args)));
          }
        } else {
          return new Error(new MissingFunction(function$, length(args)));
        }
      } else {
        return new Error(new MissingFunction(function$, length(args)));
      }
    }
  );
}

// builtins.mjs
function expects(name2, what) {
  return new Error(new TypeError(name2 + " expects " + what));
}
function builtin(name2, num_args, run3) {
  return [name2, new VFunc(new Builtin(name2, num_args, run3))];
}
function list_builtins() {
  return prepend(
    builtin(
      "list.map",
      2,
      (args) => {
        if (args instanceof Empty) {
          return expects("list.map", "a list and a function");
        } else {
          let $ = args.tail;
          if ($ instanceof Empty) {
            return expects("list.map", "a list and a function");
          } else if ($.tail instanceof Empty) {
            let $1 = args.head;
            if ($1 instanceof VList) {
              let f = $.head;
              let xs = $1[0];
              return map4(
                try_map(
                  xs,
                  (x) => {
                    return apply(f, prepend(x, List$Empty$const));
                  }
                ),
                (var0) => {
                  return new VList(var0);
                }
              );
            } else {
              return expects("list.map", "a list and a function");
            }
          } else {
            return expects("list.map", "a list and a function");
          }
        }
      }
    ),
    prepend(
      builtin(
        "list.filter",
        2,
        (args) => {
          if (args instanceof Empty) {
            return expects("list.filter", "a list and a function");
          } else {
            let $ = args.tail;
            if ($ instanceof Empty) {
              return expects("list.filter", "a list and a function");
            } else if ($.tail instanceof Empty) {
              let $1 = args.head;
              if ($1 instanceof VList) {
                let keep = $.head;
                let xs = $1[0];
                return map4(
                  try_fold(
                    xs,
                    List$Empty$const,
                    (acc, x) => {
                      let $2 = apply(keep, prepend(x, List$Empty$const));
                      if ($2 instanceof Ok) {
                        let $3 = $2[0];
                        if ($3 instanceof VBool) {
                          if ($3[0]) {
                            return new Ok(prepend(x, acc));
                          } else {
                            return new Ok(acc);
                          }
                        } else {
                          return new Error(
                            new TypeError(
                              "list.filter's function must return True or False"
                            )
                          );
                        }
                      } else {
                        return $2;
                      }
                    }
                  ),
                  (kept) => {
                    return new VList(reverse(kept));
                  }
                );
              } else {
                return expects("list.filter", "a list and a function");
              }
            } else {
              return expects("list.filter", "a list and a function");
            }
          }
        }
      ),
      prepend(
        builtin(
          "list.append",
          2,
          (args) => {
            if (args instanceof Empty) {
              return expects("list.append", "two lists");
            } else {
              let $ = args.tail;
              if ($ instanceof Empty) {
                return expects("list.append", "two lists");
              } else if ($.tail instanceof Empty) {
                let $1 = args.head;
                if ($1 instanceof VList) {
                  let $2 = $.head;
                  if ($2 instanceof VList) {
                    let xs = $1[0];
                    let ys = $2[0];
                    charge(length(xs));
                    return new Ok(new VList(append(xs, ys)));
                  } else {
                    return expects("list.append", "two lists");
                  }
                } else {
                  return expects("list.append", "two lists");
                }
              } else {
                return expects("list.append", "two lists");
              }
            }
          }
        ),
        prepend(
          builtin(
            "list.length",
            1,
            (args) => {
              if (args instanceof Empty) {
                return expects("list.length", "a list");
              } else if (args.tail instanceof Empty) {
                let $ = args.head;
                if ($ instanceof VList) {
                  let xs = $[0];
                  let length3 = length(xs);
                  charge(length3);
                  return new Ok(new VInt(length3));
                } else {
                  return expects("list.length", "a list");
                }
              } else {
                return expects("list.length", "a list");
              }
            }
          ),
          prepend(
            builtin(
              "list.flatten",
              1,
              (args) => {
                if (args instanceof Empty) {
                  return expects("list.flatten", "a list of lists");
                } else if (args.tail instanceof Empty) {
                  let $ = args.head;
                  if ($ instanceof VList) {
                    let xss = $[0];
                    return try$(
                      try_map(
                        xss,
                        (xs) => {
                          if (xs instanceof VList) {
                            let elements = xs[0];
                            return new Ok(elements);
                          } else {
                            return expects("list.flatten", "a list");
                          }
                        }
                      ),
                      (lists) => {
                        let total = fold2(
                          lists,
                          0,
                          (n, l) => {
                            return n + length(l);
                          }
                        );
                        charge(length(lists) + total);
                        return new Ok(new VList(flatten(lists)));
                      }
                    );
                  } else {
                    return expects("list.flatten", "a list of lists");
                  }
                } else {
                  return expects("list.flatten", "a list of lists");
                }
              }
            ),
            List$Empty$const
          )
        )
      )
    )
  );
}
function constructors2() {
  return map2(
    constructors,
    (entry) => {
      let tag = entry[0];
      let fields = entry[1];
      return builtin(
        tag,
        length(fields),
        (args) => {
          return new Ok(new VData(tag, args));
        }
      );
    }
  );
}
function int_cmp(name2, op) {
  return builtin(
    name2,
    2,
    (args) => {
      if (args instanceof Empty) {
        return expects(name2, "two ints");
      } else {
        let $ = args.tail;
        if ($ instanceof Empty) {
          return expects(name2, "two ints");
        } else if ($.tail instanceof Empty) {
          let $1 = args.head;
          if ($1 instanceof VInt) {
            let $2 = $.head;
            if ($2 instanceof VInt) {
              let x = $1[0];
              let y = $2[0];
              return new Ok(new VBool(op(x, y)));
            } else {
              return expects(name2, "two ints");
            }
          } else {
            return expects(name2, "two ints");
          }
        } else {
          return expects(name2, "two ints");
        }
      }
    }
  );
}
function int_op(name2, op) {
  return builtin(
    name2,
    2,
    (args) => {
      if (args instanceof Empty) {
        return expects(name2, "two ints");
      } else {
        let $ = args.tail;
        if ($ instanceof Empty) {
          return expects(name2, "two ints");
        } else if ($.tail instanceof Empty) {
          let $1 = args.head;
          if ($1 instanceof VInt) {
            let $2 = $.head;
            if ($2 instanceof VInt) {
              let x = $1[0];
              let y = $2[0];
              return new Ok(new VInt(op(x, y)));
            } else {
              return expects(name2, "two ints");
            }
          } else {
            return expects(name2, "two ints");
          }
        } else {
          return expects(name2, "two ints");
        }
      }
    }
  );
}
function bool_op(name2, op) {
  return builtin(
    name2,
    2,
    (args) => {
      if (args instanceof Empty) {
        return expects(name2, "two Bools");
      } else {
        let $ = args.tail;
        if ($ instanceof Empty) {
          return expects(name2, "two Bools");
        } else if ($.tail instanceof Empty) {
          let $1 = args.head;
          if ($1 instanceof VBool) {
            let $2 = $.head;
            if ($2 instanceof VBool) {
              let x = $1[0];
              let y = $2[0];
              return new Ok(new VBool(op(x, y)));
            } else {
              return expects(name2, "two Bools");
            }
          } else {
            return expects(name2, "two Bools");
          }
        } else {
          return expects(name2, "two Bools");
        }
      }
    }
  );
}
function value_equal_lists(loop$xs, loop$ys) {
  while (true) {
    let xs = loop$xs;
    let ys = loop$ys;
    if (xs instanceof Empty) {
      if (ys instanceof Empty) {
        return new Ok(true);
      } else {
        return new Ok(false);
      }
    } else if (ys instanceof Empty) {
      return new Ok(false);
    } else {
      let x = xs.head;
      let rx = xs.tail;
      let y = ys.head;
      let ry = ys.tail;
      let $ = value_equal(x, y);
      if ($ instanceof Ok && $[0]) {
        loop$xs = rx;
        loop$ys = ry;
      } else {
        return $;
      }
    }
  }
}
function value_equal(a, b) {
  charge(1);
  if (a instanceof VBool && b instanceof VBool) {
    let x = a[0];
    let y = b[0];
    return new Ok(x === y);
  } else if (a instanceof VInt && b instanceof VInt) {
    let x = a[0];
    let y = b[0];
    return new Ok(x === y);
  } else if (a instanceof VList && b instanceof VList) {
    let xs = a[0];
    let ys = b[0];
    return value_equal_lists(xs, ys);
  } else if (a instanceof VData && b instanceof VData) {
    let t1 = a.tag;
    let xs = a.fields;
    let t2 = b.tag;
    let ys = b.fields;
    let $ = t1 === t2;
    if ($) {
      return value_equal_lists(xs, ys);
    } else {
      return new Ok(false);
    }
  } else {
    return new Ok(false);
  }
}
function builtin_not_eq(args) {
  if (args instanceof Empty) {
    return expects("!=", "two values");
  } else {
    let $ = args.tail;
    if ($ instanceof Empty) {
      return expects("!=", "two values");
    } else if ($.tail instanceof Empty) {
      let a = args.head;
      let b = $.head;
      return map4(
        value_equal(a, b),
        (equal) => {
          return new VBool(!equal);
        }
      );
    } else {
      return expects("!=", "two values");
    }
  }
}
function builtin_eq(args) {
  if (args instanceof Empty) {
    return expects("==", "two values");
  } else {
    let $ = args.tail;
    if ($ instanceof Empty) {
      return expects("==", "two values");
    } else if ($.tail instanceof Empty) {
      let a = args.head;
      let b = $.head;
      return map4(
        value_equal(a, b),
        (var0) => {
          return new VBool(var0);
        }
      );
    } else {
      return expects("==", "two values");
    }
  }
}
function builtin_abs(args) {
  if (args instanceof Empty) {
    return expects("abs", "one int");
  } else if (args.tail instanceof Empty) {
    let $ = args.head;
    if ($ instanceof VInt) {
      let n = $[0];
      return new Ok(new VInt(absolute_value(n)));
    } else {
      return expects("abs", "one int");
    }
  } else {
    return expects("abs", "one int");
  }
}
function builtin_random(args) {
  if (args instanceof Empty) {
    return expects("random", "two ints");
  } else {
    let $ = args.tail;
    if ($ instanceof Empty) {
      return expects("random", "two ints");
    } else if ($.tail instanceof Empty) {
      let $1 = args.head;
      if ($1 instanceof VInt) {
        let $2 = $.head;
        if ($2 instanceof VInt) {
          let min3 = $1[0];
          let max3 = $2[0];
          let $3 = max3 <= min3;
          if ($3) {
            return new Ok(new VInt(min3));
          } else {
            return new Ok(
              new VInt(
                min3 + truncate(
                  random_uniform() * identity(max3 - min3)
                )
              )
            );
          }
        } else {
          return expects("random", "two ints");
        }
      } else {
        return expects("random", "two ints");
      }
    } else {
      return expects("random", "two ints");
    }
  }
}
function builtins() {
  return from_list(
    prepend(
      builtin("random", 2, builtin_random),
      prepend(
        builtin("abs", 1, builtin_abs),
        prepend(
          builtin("==", 2, builtin_eq),
          prepend(
            builtin("!=", 2, builtin_not_eq),
            prepend(
              bool_op("&&", (x, y) => {
                return x && y;
              }),
              prepend(
                bool_op("||", (x, y) => {
                  return x || y;
                }),
                prepend(
                  int_op("+", (x, y) => {
                    return x + y;
                  }),
                  prepend(
                    int_op("-", (x, y) => {
                      return x - y;
                    }),
                    prepend(
                      int_op("*", (x, y) => {
                        return x * y;
                      }),
                      prepend(
                        int_op("/", (x, y) => {
                          return divideInt(x, y);
                        }),
                        prepend(
                          int_op("%", (x, y) => {
                            return remainderInt(x, y);
                          }),
                          prepend(
                            int_cmp("<", (x, y) => {
                              return x < y;
                            }),
                            prepend(
                              int_cmp(">", (x, y) => {
                                return x > y;
                              }),
                              prepend(
                                int_cmp("<=", (x, y) => {
                                  return x <= y;
                                }),
                                prepend(
                                  int_cmp(">=", (x, y) => {
                                    return x >= y;
                                  }),
                                  append(constructors2(), list_builtins())
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}
function global_frame() {
  let frame2 = newDict();
  let bind = (name2, value2) => {
    return insert4(frame2, name2, value2);
  };
  each(builtins(), bind);
  return frame2;
}

// data_ffi.mjs
function storageGet(key) {
  try {
    const value2 = globalThis.localStorage.getItem(key);
    return value2 === null ? Result$Error(void 0) : Result$Ok(value2);
  } catch {
    return Result$Error(void 0);
  }
}
function storageSet(key, value2) {
  try {
    globalThis.localStorage.setItem(key, value2);
  } catch (error) {
    console.error(`Couldn't save: ${error.message}`);
  }
}
function promptDrawingName() {
  const name2 = window.prompt("Name for the new drawing:");
  return name2 === null ? "" : name2;
}

// examples.mjs
var all = /* @__PURE__ */ prepend(
  [
    "fan",
    "fn draw(shape_slider: Int) -> List(Path) {\n  fan(30, Point(-200, -200))\n}\n\nfn fan(n: Int, start: Point) -> List(Path) {\n  case n > 0 {\n    True -> [Path(Line(start, Point(n * 10, 200)), 0, 30, 3), ..fan(n - 1, start)]\n    False -> []\n  }\n}\n"
  ],
  prepend(
    [
      "square_spiral",
      "fn draw(shape_slider: Int) -> List(Path) {\n  let turns = 20 + shape_slider / 4\n  spiral(Point(0, 0), Point(1, 0), 0, turns)\n}\n\nfn spiral(p: Point, d: Point, i: Int, n: Int) -> List(Path) {\n  case i == n {\n    True -> []\n    False -> {\n      let len = { i / 2 + 1 } * 24\n      let q = Point(p.x + d.x * len, p.y + d.y * len)\n      [\n        Path(Line(p, q), i * 3, i * 3 + 3, 3),\n        ..spiral(q, Point(0 - d.y, d.x), i + 1, n)\n      ]\n    }\n  }\n}\n"
    ],
    prepend(
      [
        "string_art",
        "fn draw(shape_slider: Int) -> List(Path) {\n  let n = 8 + shape_slider / 10\n  list.flatten([\n    quadrant(1, 1, n, 0),\n    quadrant(-1, 1, n, n + 1),\n    quadrant(-1, -1, n, { n + 1 } * 2),\n    quadrant(1, -1, n, { n + 1 } * 3),\n  ])\n}\n\nfn quadrant(sx: Int, sy: Int, n: Int, base: Int) -> List(Path) {\n  strings(0, sx, sy, n, base)\n}\n\nfn strings(i: Int, sx: Int, sy: Int, n: Int, base: Int) -> List(Path) {\n  case i > n {\n    True -> []\n    False -> {\n      let a = Point(sx * 420 * i / n, 0)\n      let b = Point(0, sy * 420 * { n - i } / n)\n      let t = { base + i } * 2\n      [Path(Line(a, b), t, t + 8, 2), ..strings(i + 1, sx, sy, n, base)]\n    }\n  }\n}\n"
      ],
      prepend(
        [
          "tree",
          "fn draw(shape_slider: Int) -> List(Path) {\n  let depth = 4 + shape_slider / 20\n  branch(Point(0, 420), Point(0, -220), 0, depth)\n}\n\nfn branch(p: Point, d: Point, level: Int, depth: Int) -> List(Path) {\n  case level == depth {\n    True -> []\n    False -> {\n      let q = Point(p.x + d.x, p.y + d.y)\n      let left = Point({ d.x - d.y } / 2, { d.y + d.x } / 2)\n      let right = Point({ d.x + d.y } / 2, { d.y - d.x } / 2)\n      [\n        Path(Line(p, q), level * 4, level * 4 + 4, depth - level),\n        ..list.append(\n          branch(q, left, level + 1, depth),\n          branch(q, right, level + 1, depth),\n        )\n      ]\n    }\n  }\n}\n"
        ],
        prepend(
          [
            "colored_orbits",
            "fn draw(shape_slider: Int) -> List(Path) {\n  let n = 4 + shape_slider / 20\n  orbits(n, 40, 0)\n}\n\nfn orbits(n: Int, radius: Int, i: Int) -> List(Path) {\n  case i >= n {\n    True -> []\n    False -> {\n      let r = 40 + i * 55\n      let hue = i * 40\n      [\n        Path(ColorCircle(Point(0, 0), r, hue, 120, 220 - hue), i * 4, i * 4 + 8, 3),\n        Path(ColorLine(Point(0 - r, 0), Point(r, 0), 255 - hue, 180, hue), i * 4 + 2, i * 4 + 10, 2),\n        ..orbits(n, radius, i + 1)\n      ]\n    }\n  }\n}\n"
          ],
          List$Empty$const
        )
      )
    )
  )
);

// data.mjs
var Library = class extends CustomType {
  constructor(drawings, current) {
    super();
    this.drawings = drawings;
    this.current = current;
  }
};
var storage_key = "animator-library";
function default_library() {
  let drawings = all;
  let _block;
  if (drawings instanceof Empty) {
    _block = "untitled";
  } else {
    let name2 = drawings.head[0];
    _block = name2;
  }
  let current = _block;
  return new Library(drawings, current);
}
function parse_library(raw) {
  let drawing_decoder = field(
    "name",
    string2,
    (name2) => {
      return field(
        "source",
        string2,
        (source) => {
          return success([name2, source]);
        }
      );
    }
  );
  let decoder = field(
    "current",
    string2,
    (current) => {
      return field(
        "drawings",
        list2(drawing_decoder),
        (drawings) => {
          return success(new Library(drawings, current));
        }
      );
    }
  );
  let $ = parse(raw, decoder);
  if ($ instanceof Ok) {
    if ($[0].drawings instanceof Empty) {
      return new Error(void 0);
    } else {
      let lib = $[0];
      let _block;
      let $1 = key_find(lib.drawings, lib.current);
      if ($1 instanceof Ok) {
        _block = lib.current;
      } else {
        let $2 = lib.drawings;
        if ($2 instanceof Empty) {
          _block = lib.current;
        } else {
          let name2 = $2.head[0];
          _block = name2;
        }
      }
      let current = _block;
      return new Ok(new Library(lib.drawings, current));
    }
  } else {
    return new Error(void 0);
  }
}
function load_library() {
  let $ = storageGet(storage_key);
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
  let drawings_json = map2(
    lib.drawings,
    (pair) => {
      return object2(
        prepend(
          ["name", string3(pair[0])],
          prepend(["source", string3(pair[1])], List$Empty$const)
        )
      );
    }
  );
  let _pipe = object2(
    prepend(
      ["current", string3(lib.current)],
      prepend(
        ["drawings", preprocessed_array(drawings_json)],
        List$Empty$const
      )
    )
  );
  return to_string2(_pipe);
}
function save_library(lib) {
  return storageSet(storage_key, encode_library(lib));
}
function default_new_source() {
  return "fn draw(shape_slider: Int) -> List(Path) {\n  [Path(Line(Point(0, 0), Point(100, 100)), 0, 10, 2)]\n}\n";
}
function current_source(lib) {
  let _pipe = key_find(lib.drawings, lib.current);
  return unwrap(_pipe, default_new_source());
}
function update_drawing(drawings, name2, source) {
  return map2(
    drawings,
    (pair) => {
      let $ = pair[0] === name2;
      if ($) {
        return [name2, source];
      } else {
        return pair;
      }
    }
  );
}

// shape.mjs
var Point = class extends CustomType {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }
};
var Line = class extends CustomType {
  constructor(start5, end) {
    super();
    this.start = start5;
    this.end = end;
  }
};
var ColorLine = class extends CustomType {
  constructor(start5, end, r, g, b) {
    super();
    this.start = start5;
    this.end = end;
    this.r = r;
    this.g = g;
    this.b = b;
  }
};
var Circle = class extends CustomType {
  constructor(center, radius) {
    super();
    this.center = center;
    this.radius = radius;
  }
};
var ColorCircle = class extends CustomType {
  constructor(center, radius, r, g, b) {
    super();
    this.center = center;
    this.radius = radius;
    this.r = r;
    this.g = g;
    this.b = b;
  }
};
var Path = class extends CustomType {
  constructor(shape, start5, end, thickness) {
    super();
    this.shape = shape;
    this.start = start5;
    this.end = end;
    this.thickness = thickness;
  }
};

// drawing.mjs
function to_point(v) {
  if (v instanceof VData) {
    let $ = v.fields;
    if ($ instanceof Empty) {
      return new Error(new BadDrawing("expected a Point"));
    } else {
      let $1 = $.tail;
      if ($1 instanceof Empty) {
        return new Error(new BadDrawing("expected a Point"));
      } else if ($1.tail instanceof Empty) {
        let $2 = $.head;
        if ($2 instanceof VInt) {
          let $3 = $1.head;
          if ($3 instanceof VInt && v.tag === "Point") {
            let x = $2[0];
            let y = $3[0];
            return new Ok(new Point(identity(x), identity(y)));
          } else {
            return new Error(new BadDrawing("expected a Point"));
          }
        } else {
          return new Error(new BadDrawing("expected a Point"));
        }
      } else {
        return new Error(new BadDrawing("expected a Point"));
      }
    }
  } else {
    return new Error(new BadDrawing("expected a Point"));
  }
}
function to_shape(v) {
  if (v instanceof VData) {
    let $ = v.fields;
    if ($ instanceof Empty) {
      return new Error(
        new BadDrawing("a Path's shape must be a recognized shape")
      );
    } else {
      let $1 = $.tail;
      if ($1 instanceof Empty) {
        return new Error(
          new BadDrawing("a Path's shape must be a recognized shape")
        );
      } else {
        let $2 = $1.tail;
        if ($2 instanceof Empty) {
          let $3 = v.tag;
          if ($3 === "Line") {
            let start5 = $.head;
            let end = $1.head;
            return try$(
              to_point(start5),
              (a) => {
                return try$(
                  to_point(end),
                  (b) => {
                    return new Ok(new Line(a, b));
                  }
                );
              }
            );
          } else if ($3 === "Circle") {
            let $4 = $1.head;
            if ($4 instanceof VInt) {
              let center = $.head;
              let radius = $4[0];
              return try$(
                to_point(center),
                (c) => {
                  return new Ok(new Circle(c, identity(radius)));
                }
              );
            } else {
              return new Error(
                new BadDrawing("a Path's shape must be a recognized shape")
              );
            }
          } else {
            return new Error(
              new BadDrawing("a Path's shape must be a recognized shape")
            );
          }
        } else {
          let $3 = $2.tail;
          if ($3 instanceof Empty) {
            return new Error(
              new BadDrawing("a Path's shape must be a recognized shape")
            );
          } else {
            let $4 = $3.tail;
            if ($4 instanceof Empty) {
              return new Error(
                new BadDrawing("a Path's shape must be a recognized shape")
              );
            } else if ($4.tail instanceof Empty) {
              let $5 = $2.head;
              if ($5 instanceof VInt) {
                let $6 = $3.head;
                if ($6 instanceof VInt) {
                  let $7 = $4.head;
                  if ($7 instanceof VInt) {
                    let $8 = v.tag;
                    if ($8 === "ColorLine") {
                      let start5 = $.head;
                      let end = $1.head;
                      let r = $5[0];
                      let g = $6[0];
                      let b = $7[0];
                      return try$(
                        to_point(start5),
                        (a) => {
                          return try$(
                            to_point(end),
                            (c) => {
                              return new Ok(new ColorLine(a, c, r, g, b));
                            }
                          );
                        }
                      );
                    } else if ($8 === "ColorCircle") {
                      let $9 = $1.head;
                      if ($9 instanceof VInt) {
                        let center = $.head;
                        let r = $5[0];
                        let g = $6[0];
                        let b = $7[0];
                        let radius = $9[0];
                        return try$(
                          to_point(center),
                          (c) => {
                            return new Ok(
                              new ColorCircle(c, identity(radius), r, g, b)
                            );
                          }
                        );
                      } else {
                        return new Error(
                          new BadDrawing(
                            "a Path's shape must be a recognized shape"
                          )
                        );
                      }
                    } else {
                      return new Error(
                        new BadDrawing(
                          "a Path's shape must be a recognized shape"
                        )
                      );
                    }
                  } else {
                    return new Error(
                      new BadDrawing(
                        "a Path's shape must be a recognized shape"
                      )
                    );
                  }
                } else {
                  return new Error(
                    new BadDrawing("a Path's shape must be a recognized shape")
                  );
                }
              } else {
                return new Error(
                  new BadDrawing("a Path's shape must be a recognized shape")
                );
              }
            } else {
              return new Error(
                new BadDrawing("a Path's shape must be a recognized shape")
              );
            }
          }
        }
      }
    }
  } else {
    return new Error(
      new BadDrawing("a Path's shape must be a recognized shape")
    );
  }
}
function to_path(v) {
  if (v instanceof VData) {
    let $ = v.fields;
    if ($ instanceof Empty) {
      return new Error(new BadDrawing("some element is not a well-formed path"));
    } else {
      let $1 = $.tail;
      if ($1 instanceof Empty) {
        return new Error(
          new BadDrawing("some element is not a well-formed path")
        );
      } else {
        let $2 = $1.tail;
        if ($2 instanceof Empty) {
          return new Error(
            new BadDrawing("some element is not a well-formed path")
          );
        } else {
          let $3 = $2.tail;
          if ($3 instanceof Empty) {
            return new Error(
              new BadDrawing("some element is not a well-formed path")
            );
          } else if ($3.tail instanceof Empty) {
            let $4 = $1.head;
            if ($4 instanceof VInt) {
              let $5 = $2.head;
              if ($5 instanceof VInt) {
                let $6 = $3.head;
                if ($6 instanceof VInt && v.tag === "Path") {
                  let shape = $.head;
                  let start5 = $4[0];
                  let end = $5[0];
                  let thickness = $6[0];
                  return try$(
                    to_shape(shape),
                    (s) => {
                      return new Ok(
                        new Path(
                          s,
                          identity(start5),
                          identity(end),
                          identity(thickness)
                        )
                      );
                    }
                  );
                } else {
                  return new Error(
                    new BadDrawing("some element is not a well-formed path")
                  );
                }
              } else {
                return new Error(
                  new BadDrawing("some element is not a well-formed path")
                );
              }
            } else {
              return new Error(
                new BadDrawing("some element is not a well-formed path")
              );
            }
          } else {
            return new Error(
              new BadDrawing("some element is not a well-formed path")
            );
          }
        }
      }
    }
  } else {
    return new Error(new BadDrawing("some element is not a well-formed path"));
  }
}
function try_draw(shape_slider, global) {
  let $ = run2(
    "draw",
    prepend(new VInt(shape_slider), List$Empty$const),
    global
  );
  if ($ instanceof Ok) {
    let $1 = $[0];
    if ($1 instanceof VList) {
      let items = $1[0];
      let $2 = length(items) > path_limit;
      if ($2) {
        return new Error(EvalError$PathLimit$const);
      } else {
        return try_map(items, to_path);
      }
    } else {
      return new Error(new BadDrawing("return value of draw is not a list"));
    }
  } else {
    return $;
  }
}

// editor_ffi.mjs
var cmView = null;
var cmOnChange = null;
var cmModulePromise = null;
var cmObserver = null;
function defineGleam(StreamLanguage) {
  const keywords = /* @__PURE__ */ new Set([
    "fn",
    "case",
    "let",
    "const",
    "import",
    "use",
    "type",
    "pub",
    "as",
    "if",
    "todo",
    "panic",
    "assert"
  ]);
  return StreamLanguage.define({
    token(stream) {
      if (stream.eatSpace()) return null;
      if (stream.match(/^\/\/.*/)) return "comment";
      if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) return "string";
      if (stream.match(/^[0-9]+\.[0-9]+/) || stream.match(/^[0-9]+/)) return "number";
      if (stream.match(/^(True|False|Nil|Ok|Error)\b/)) return "atom";
      const word = stream.match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (word) {
        if (keywords.has(word[0])) return "keyword";
        if (/^[A-Z]/.test(word[0])) return "typeName";
        return "variableName";
      }
      if (stream.match(/^(\+\.|-\.|\*\.|\/\.|<=\.|>=\.|<\.|>\.|==|!=|->|<-|\|>|=)/))
        return "operator";
      stream.next();
      return null;
    },
    languageData: { commentTokens: { line: "//" } }
  });
}
function loadCodeMirror() {
  if (cmModulePromise) return cmModulePromise;
  const V = "6";
  cmModulePromise = Promise.all([
    import(`https://esm.sh/@codemirror/view@${V}`),
    import(`https://esm.sh/@codemirror/state@${V}`),
    import(`https://esm.sh/@codemirror/commands@${V}`),
    import(`https://esm.sh/@codemirror/language@${V}`),
    import(`https://esm.sh/@codemirror/autocomplete@${V}`),
    import("https://esm.sh/@lezer/highlight@1")
  ]).then(([view2, state, commands, language, autocomplete, highlight]) => {
    const { tags: t } = highlight;
    const theme = view2.EditorView.theme(
      {
        "&": { color: "#d4c5a0", backgroundColor: "#0d0d1a", height: "100%" },
        ".cm-content": {
          fontFamily: "monospace",
          fontSize: "13px",
          padding: "16px 0"
        },
        ".cm-gutters": {
          backgroundColor: "#0d0d1a",
          color: "#3a3a5e",
          border: "none"
        },
        ".cm-activeLine": { backgroundColor: "#16162c" },
        ".cm-activeLineGutter": { backgroundColor: "#16162c" },
        "&.cm-focused .cm-matchingBracket": {
          backgroundColor: "#2a4a3a",
          color: "#fff"
        },
        ".cm-scroller": { overflow: "auto" },
        "&.cm-focused": { outline: "1px solid #6a6aaa" }
      },
      { dark: true }
    );
    const highlightStyle = language.HighlightStyle.define([
      { tag: t.keyword, color: "#c792ea" },
      { tag: t.comment, color: "#6a7a6a", fontStyle: "italic" },
      { tag: t.string, color: "#c3e88d" },
      { tag: t.number, color: "#f78c6c" },
      { tag: [t.atom, t.bool], color: "#82aaff" },
      { tag: t.typeName, color: "#ffcb6b" },
      { tag: t.variableName, color: "#d4c5a0" },
      { tag: t.operator, color: "#89ddff" }
    ]);
    const gleam = defineGleam(language.StreamLanguage);
    function create(parent, doc, onChange) {
      const updateListener = view2.EditorView.updateListener.of((u) => {
        if (u.docChanged) onChange(u.state.doc.toString());
      });
      const startState = state.EditorState.create({
        doc,
        extensions: [
          view2.lineNumbers(),
          view2.highlightActiveLine(),
          view2.highlightActiveLineGutter(),
          commands.history(),
          view2.drawSelection(),
          language.indentOnInput(),
          language.indentUnit.of("  "),
          language.bracketMatching(),
          autocomplete.closeBrackets(),
          language.syntaxHighlighting(highlightStyle),
          gleam,
          view2.keymap.of([
            ...autocomplete.closeBracketsKeymap,
            ...commands.defaultKeymap,
            ...commands.historyKeymap,
            commands.indentWithTab
          ]),
          theme,
          view2.EditorView.lineWrapping,
          updateListener
        ]
      });
      return new view2.EditorView({ state: startState, parent });
    }
    return { create };
  });
  return cmModulePromise;
}
function waitForElement(id2, maxFrames) {
  return new Promise((resolve) => {
    let tries = 0;
    const check = () => {
      const el = document.getElementById(id2);
      if (el) return resolve(el);
      if (tries++ >= maxFrames) return resolve(null);
      requestAnimationFrame(check);
    };
    check();
  });
}
function reattachEditor() {
  if (!cmView || cmView.dom.isConnected) return;
  const el = document.getElementById("code-editor");
  if (!el) return;
  el.replaceChildren(cmView.dom);
  cmView.requestMeasure();
  if (document.activeElement === document.body) cmView.focus();
}
function mountEditor(initialText, onChange) {
  if (cmView) {
    cmView.destroy();
    cmView = null;
  }
  cmOnChange = onChange;
  if (!cmObserver) {
    cmObserver = new MutationObserver(reattachEditor);
    cmObserver.observe(document.body, { childList: true, subtree: true });
  }
  waitForElement("code-editor", 120).then((mount3) => {
    if (!mount3) return;
    loadCodeMirror().then((CM) => {
      const el = document.getElementById("code-editor");
      if (!el) return;
      el.innerHTML = "";
      cmView = CM.create(el, initialText, (t) => {
        if (cmOnChange) cmOnChange(t);
      });
    }).catch((e) => console.error("CodeMirror failed to load:", e));
  });
}

// editor.mjs
var RefEntry = class extends CustomType {
  constructor(signature, description) {
    super();
    this.signature = signature;
    this.description = description;
  }
};
function mount2(text4, on_change2) {
  return from2(
    (dispatch2) => {
      return mountEditor(text4, (t) => {
        return dispatch2(on_change2(t));
      });
    }
  );
}
function list_functions() {
  return prepend(
    new RefEntry(
      "list.map(list, fn(a) -> b) -> List(b)",
      "each element through `fn`"
    ),
    prepend(
      new RefEntry(
        "list.filter(list, fn(a) -> Bool) -> List(a)",
        "only the elements `fn` says True to"
      ),
      prepend(
        new RefEntry(
          "list.append(list, list) -> List(a)",
          "one list after the other"
        ),
        prepend(
          new RefEntry("list.length(list) -> Int", "the number of elements"),
          prepend(
            new RefEntry(
              "list.flatten(List(List(a))) -> List(a)",
              "the inner lists, end to end"
            ),
            List$Empty$const
          )
        )
      )
    )
  );
}
function ref_group(title, entries) {
  return div(
    prepend(class$("reference-group"), List$Empty$const),
    prepend(
      div(
        prepend(class$("reference-group-title"), List$Empty$const),
        prepend(text3(title), List$Empty$const)
      ),
      prepend(
        div(
          prepend(class$("reference-rows"), List$Empty$const),
          map2(
            entries,
            (e) => {
              return div(
                prepend(class$("reference-row"), List$Empty$const),
                prepend(
                  code(
                    prepend(
                      class$("reference-sig"),
                      List$Empty$const
                    ),
                    prepend(text3(e.signature), List$Empty$const)
                  ),
                  prepend(
                    span(
                      prepend(
                        class$("reference-desc"),
                        List$Empty$const
                      ),
                      prepend(text3(e.description), List$Empty$const)
                    ),
                    List$Empty$const
                  )
                )
              );
            }
          )
        ),
        List$Empty$const
      )
    )
  );
}
function functions() {
  return prepend(
    new RefEntry(
      "random(min: Int, max: Int) -> Int",
      "a random int in [min, max)"
    ),
    prepend(
      new RefEntry("abs(n: Int) -> Int", "the absolute value of `n`"),
      prepend(
        new RefEntry(
          "Point(x: Int, y: Int)",
          "a point on the canvas: (0, 0) is the center, x and y run from -500 to 500, and y grows downward"
        ),
        prepend(
          new RefEntry(
            "Line(start: Point, end: Point)",
            "a straight-line shape (palette color)"
          ),
          prepend(
            new RefEntry(
              "ColorLine(start, end, r, g, b)",
              "a straight line colored with RGB values in 0..255"
            ),
            prepend(
              new RefEntry(
                "Circle(center, radius)",
                "a circle (palette color), radius in canvas units"
              ),
              prepend(
                new RefEntry(
                  "ColorCircle(center, radius, r, g, b)",
                  "a circle colored with RGB values in 0..255"
                ),
                prepend(
                  new RefEntry(
                    "Path(shape, start: Int, end: Int, thickness: Int)",
                    "draws a shape between times `start` and `end`, in 1/10 s (end <= start draws it instantly)"
                  ),
                  List$Empty$const
                )
              )
            )
          )
        )
      )
    )
  );
}
function inputs() {
  return prepend(
    new RefEntry("shape_slider: Int", "the shape slider value, in [0, 100]"),
    List$Empty$const
  );
}
function view_reference_panel() {
  return details(
    prepend(class$("reference"), List$Empty$const),
    prepend(
      summary(
        prepend(class$("reference-summary"), List$Empty$const),
        prepend(text3("Built-ins"), List$Empty$const)
      ),
      prepend(
        div(
          prepend(class$("reference-body"), List$Empty$const),
          prepend(
            ref_group("Inputs", inputs()),
            prepend(
              ref_group("Functions", functions()),
              prepend(
                ref_group("Lists", list_functions()),
                List$Empty$const
              )
            )
          )
        ),
        List$Empty$const
      )
    )
  );
}
function view_panel(on_collapse) {
  return div(
    prepend(class$("code-panel"), List$Empty$const),
    prepend(
      div(
        prepend(class$("code-header"), List$Empty$const),
        prepend(
          span(
            prepend(class$("code-title"), List$Empty$const),
            prepend(text3("draw code"), List$Empty$const)
          ),
          prepend(
            button(
              prepend(
                class$("icon-btn"),
                prepend(
                  attribute2("title", "Hide code"),
                  prepend(on_click(on_collapse), List$Empty$const)
                )
              ),
              prepend(text3("\u27E8"), List$Empty$const)
            ),
            List$Empty$const
          )
        )
      ),
      prepend(
        div(
          prepend(class$("code-editor-wrap"), List$Empty$const),
          prepend(
            unsafe_raw_html(
              "",
              "div",
              prepend(
                id("code-editor"),
                prepend(class$("code-editor"), List$Empty$const)
              ),
              ""
            ),
            List$Empty$const
          )
        ),
        prepend(view_reference_panel(), List$Empty$const)
      )
    )
  );
}

// ../splitter/splitter_ffi.mjs
function make2(patterns) {
  let pattern2 = "";
  let cursor = patterns;
  while (cursor.tail) {
    if (pattern2 !== "") pattern2 += "|";
    pattern2 += escapeRegExp(cursor.head);
    cursor = cursor.tail;
  }
  return new RegExp(pattern2);
}
function split_before(splitter, string5) {
  const match = string5.match(splitter);
  if (!match) return [string5, ""];
  const split_point = match.index;
  return [string5.slice(0, split_point), string5.slice(split_point)];
}
function escapeRegExp(string5) {
  return string5.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ../splitter/splitter.mjs
function new$6(substrings) {
  let _pipe = substrings;
  let _pipe$1 = filter(_pipe, (x) => {
    return x !== "";
  });
  return make2(_pipe$1);
}

// ../glexer/glexer.ffi.mjs
function slice_bytes(string5, start5, size3) {
  return string5.slice(start5, start5 + size3);
}
function drop_byte(string5) {
  return string5.slice(1);
}
function string_length2(string5) {
  return string5.length;
}

// ../glexer/glexer/token.mjs
var Name = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UpperName = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DiscardName = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Int = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Float = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var String2 = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var CommentDoc = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var CommentNormal = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var CommentModule = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var As = class extends CustomType {
};
var Token$As$const = new As();
var Assert = class extends CustomType {
};
var Token$Assert$const = new Assert();
var Auto = class extends CustomType {
};
var Token$Auto$const = new Auto();
var Case2 = class extends CustomType {
};
var Token$Case$const = new Case2();
var Const = class extends CustomType {
};
var Token$Const$const = new Const();
var Delegate = class extends CustomType {
};
var Token$Delegate$const = new Delegate();
var Derive = class extends CustomType {
};
var Token$Derive$const = new Derive();
var Echo = class extends CustomType {
};
var Token$Echo$const = new Echo();
var Else = class extends CustomType {
};
var Token$Else$const = new Else();
var Fn = class extends CustomType {
};
var Token$Fn$const = new Fn();
var If = class extends CustomType {
};
var Token$If$const = new If();
var Implement = class extends CustomType {
};
var Token$Implement$const = new Implement();
var Import = class extends CustomType {
};
var Token$Import$const = new Import();
var Let2 = class extends CustomType {
};
var Token$Let$const = new Let2();
var Macro = class extends CustomType {
};
var Token$Macro$const = new Macro();
var Opaque = class extends CustomType {
};
var Token$Opaque$const = new Opaque();
var Panic = class extends CustomType {
};
var Token$Panic$const = new Panic();
var Pub = class extends CustomType {
};
var Token$Pub$const = new Pub();
var Test = class extends CustomType {
};
var Token$Test$const = new Test();
var Todo = class extends CustomType {
};
var Token$Todo$const = new Todo();
var Type = class extends CustomType {
};
var Token$Type$const = new Type();
var Use = class extends CustomType {
};
var Token$Use$const = new Use();
var LeftParen = class extends CustomType {
};
var Token$LeftParen$const = new LeftParen();
var RightParen = class extends CustomType {
};
var Token$RightParen$const = new RightParen();
var LeftBrace = class extends CustomType {
};
var Token$LeftBrace$const = new LeftBrace();
var RightBrace = class extends CustomType {
};
var Token$RightBrace$const = new RightBrace();
var LeftSquare = class extends CustomType {
};
var Token$LeftSquare$const = new LeftSquare();
var RightSquare = class extends CustomType {
};
var Token$RightSquare$const = new RightSquare();
var Plus = class extends CustomType {
};
var Token$Plus$const = new Plus();
var Minus = class extends CustomType {
};
var Token$Minus$const = new Minus();
var Star = class extends CustomType {
};
var Token$Star$const = new Star();
var Slash = class extends CustomType {
};
var Token$Slash$const = new Slash();
var Less = class extends CustomType {
};
var Token$Less$const = new Less();
var Greater = class extends CustomType {
};
var Token$Greater$const = new Greater();
var LessEqual = class extends CustomType {
};
var Token$LessEqual$const = new LessEqual();
var GreaterEqual = class extends CustomType {
};
var Token$GreaterEqual$const = new GreaterEqual();
var Percent = class extends CustomType {
};
var Token$Percent$const = new Percent();
var PlusDot = class extends CustomType {
};
var Token$PlusDot$const = new PlusDot();
var MinusDot = class extends CustomType {
};
var Token$MinusDot$const = new MinusDot();
var StarDot = class extends CustomType {
};
var Token$StarDot$const = new StarDot();
var SlashDot = class extends CustomType {
};
var Token$SlashDot$const = new SlashDot();
var LessDot = class extends CustomType {
};
var Token$LessDot$const = new LessDot();
var GreaterDot = class extends CustomType {
};
var Token$GreaterDot$const = new GreaterDot();
var LessEqualDot = class extends CustomType {
};
var Token$LessEqualDot$const = new LessEqualDot();
var GreaterEqualDot = class extends CustomType {
};
var Token$GreaterEqualDot$const = new GreaterEqualDot();
var LessGreater = class extends CustomType {
};
var Token$LessGreater$const = new LessGreater();
var At2 = class extends CustomType {
};
var Token$At$const = new At2();
var Colon = class extends CustomType {
};
var Token$Colon$const = new Colon();
var Comma = class extends CustomType {
};
var Token$Comma$const = new Comma();
var Hash = class extends CustomType {
};
var Token$Hash$const = new Hash();
var Bang = class extends CustomType {
};
var Token$Bang$const = new Bang();
var Equal = class extends CustomType {
};
var Token$Equal$const = new Equal();
var EqualEqual = class extends CustomType {
};
var Token$EqualEqual$const = new EqualEqual();
var NotEqual = class extends CustomType {
};
var Token$NotEqual$const = new NotEqual();
var VBar = class extends CustomType {
};
var Token$VBar$const = new VBar();
var VBarVBar = class extends CustomType {
};
var Token$VBarVBar$const = new VBarVBar();
var AmperAmper = class extends CustomType {
};
var Token$AmperAmper$const = new AmperAmper();
var LessLess = class extends CustomType {
};
var Token$LessLess$const = new LessLess();
var GreaterGreater = class extends CustomType {
};
var Token$GreaterGreater$const = new GreaterGreater();
var Pipe = class extends CustomType {
};
var Token$Pipe$const = new Pipe();
var Dot = class extends CustomType {
};
var Token$Dot$const = new Dot();
var DotDot = class extends CustomType {
};
var Token$DotDot$const = new DotDot();
var LeftArrow = class extends CustomType {
};
var Token$LeftArrow$const = new LeftArrow();
var RightArrow = class extends CustomType {
};
var Token$RightArrow$const = new RightArrow();
var EndOfFile = class extends CustomType {
};
var Token$EndOfFile$const = new EndOfFile();
var Space = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UnterminatedString = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UnexpectedGrapheme = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
function to_source(tok) {
  if (tok instanceof Name) {
    let str = tok[0];
    return str;
  } else if (tok instanceof UpperName) {
    let str = tok[0];
    return str;
  } else if (tok instanceof DiscardName) {
    let str = tok[0];
    return "_" + str;
  } else if (tok instanceof Int) {
    let str = tok[0];
    return str;
  } else if (tok instanceof Float) {
    let str = tok[0];
    return str;
  } else if (tok instanceof String2) {
    let str = tok[0];
    return '"' + str + '"';
  } else if (tok instanceof CommentDoc) {
    let str = tok[0];
    return "///" + str;
  } else if (tok instanceof CommentNormal) {
    let str = tok[0];
    return "//" + str;
  } else if (tok instanceof CommentModule) {
    let str = tok[0];
    return "////" + str;
  } else if (tok instanceof As) {
    return "as";
  } else if (tok instanceof Assert) {
    return "assert";
  } else if (tok instanceof Auto) {
    return "auto";
  } else if (tok instanceof Case2) {
    return "case";
  } else if (tok instanceof Const) {
    return "const";
  } else if (tok instanceof Delegate) {
    return "delegate";
  } else if (tok instanceof Derive) {
    return "derive";
  } else if (tok instanceof Echo) {
    return "echo";
  } else if (tok instanceof Else) {
    return "else";
  } else if (tok instanceof Fn) {
    return "fn";
  } else if (tok instanceof If) {
    return "if";
  } else if (tok instanceof Implement) {
    return "implement";
  } else if (tok instanceof Import) {
    return "import";
  } else if (tok instanceof Let2) {
    return "let";
  } else if (tok instanceof Macro) {
    return "macro";
  } else if (tok instanceof Opaque) {
    return "opaque";
  } else if (tok instanceof Panic) {
    return "panic";
  } else if (tok instanceof Pub) {
    return "pub";
  } else if (tok instanceof Test) {
    return "test";
  } else if (tok instanceof Todo) {
    return "todo";
  } else if (tok instanceof Type) {
    return "type";
  } else if (tok instanceof Use) {
    return "use";
  } else if (tok instanceof LeftParen) {
    return "(";
  } else if (tok instanceof RightParen) {
    return ")";
  } else if (tok instanceof LeftBrace) {
    return "{";
  } else if (tok instanceof RightBrace) {
    return "}";
  } else if (tok instanceof LeftSquare) {
    return "[";
  } else if (tok instanceof RightSquare) {
    return "]";
  } else if (tok instanceof Plus) {
    return "+";
  } else if (tok instanceof Minus) {
    return "-";
  } else if (tok instanceof Star) {
    return "*";
  } else if (tok instanceof Slash) {
    return "/";
  } else if (tok instanceof Less) {
    return "<";
  } else if (tok instanceof Greater) {
    return ">";
  } else if (tok instanceof LessEqual) {
    return "<=";
  } else if (tok instanceof GreaterEqual) {
    return ">=";
  } else if (tok instanceof Percent) {
    return "%";
  } else if (tok instanceof PlusDot) {
    return "+.";
  } else if (tok instanceof MinusDot) {
    return "-.";
  } else if (tok instanceof StarDot) {
    return "*.";
  } else if (tok instanceof SlashDot) {
    return "/.";
  } else if (tok instanceof LessDot) {
    return "<.";
  } else if (tok instanceof GreaterDot) {
    return ">.";
  } else if (tok instanceof LessEqualDot) {
    return "<=.";
  } else if (tok instanceof GreaterEqualDot) {
    return ">=.";
  } else if (tok instanceof LessGreater) {
    return "<>";
  } else if (tok instanceof At2) {
    return "@";
  } else if (tok instanceof Colon) {
    return ":";
  } else if (tok instanceof Comma) {
    return ",";
  } else if (tok instanceof Hash) {
    return "#";
  } else if (tok instanceof Bang) {
    return "!";
  } else if (tok instanceof Equal) {
    return "=";
  } else if (tok instanceof EqualEqual) {
    return "==";
  } else if (tok instanceof NotEqual) {
    return "!=";
  } else if (tok instanceof VBar) {
    return "|";
  } else if (tok instanceof VBarVBar) {
    return "||";
  } else if (tok instanceof AmperAmper) {
    return "&&";
  } else if (tok instanceof LessLess) {
    return "<<";
  } else if (tok instanceof GreaterGreater) {
    return ">>";
  } else if (tok instanceof Pipe) {
    return "|>";
  } else if (tok instanceof Dot) {
    return ".";
  } else if (tok instanceof DotDot) {
    return "..";
  } else if (tok instanceof LeftArrow) {
    return "<-";
  } else if (tok instanceof RightArrow) {
    return "->";
  } else if (tok instanceof EndOfFile) {
    return "";
  } else if (tok instanceof Space) {
    let str = tok[0];
    return str;
  } else if (tok instanceof UnterminatedString) {
    let str = tok[0];
    return '"' + str;
  } else {
    let str = tok[0];
    return str;
  }
}

// ../glexer/glexer.mjs
var Lexer = class extends CustomType {
  constructor(original_source, source, byte_offset, preserve_whitespace, preserve_comments, mode, newlines) {
    super();
    this.original_source = original_source;
    this.source = source;
    this.byte_offset = byte_offset;
    this.preserve_whitespace = preserve_whitespace;
    this.preserve_comments = preserve_comments;
    this.mode = mode;
    this.newlines = newlines;
  }
};
var Normal2 = class extends CustomType {
};
var LexerMode$Normal$const = new Normal2();
var CheckForMinus = class extends CustomType {
};
var LexerMode$CheckForMinus$const = new CheckForMinus();
var CheckForNestedDot = class extends CustomType {
};
var LexerMode$CheckForNestedDot$const = new CheckForNestedDot();
var CheckForNestedDotOrMinus = class extends CustomType {
};
var LexerMode$CheckForNestedDotOrMinus$const = new CheckForNestedDotOrMinus();
var HasNestedDot = class extends CustomType {
};
var LexerMode$HasNestedDot$const = new HasNestedDot();
var Position = class extends CustomType {
  constructor(byte_offset) {
    super();
    this.byte_offset = byte_offset;
  }
};
var RegularComment = class extends CustomType {
};
var CommentKind$RegularComment$const = new RegularComment();
var DocComment = class extends CustomType {
};
var CommentKind$DocComment$const = new DocComment();
var ModuleComment = class extends CustomType {
};
var CommentKind$ModuleComment$const = new ModuleComment();
var LexInt = class extends CustomType {
};
var LexNumberMode$LexInt$const = new LexInt();
var LexFloat = class extends CustomType {
};
var LexNumberMode$LexFloat$const = new LexFloat();
var LexFloatExponent = class extends CustomType {
};
var LexNumberMode$LexFloatExponent$const = new LexFloatExponent();
function new$7(source) {
  return new Lexer(
    source,
    source,
    0,
    true,
    true,
    LexerMode$Normal$const,
    new$6(prepend("\r\n", prepend("\n", List$Empty$const)))
  );
}
function discard_whitespace(lexer) {
  return new Lexer(
    lexer.original_source,
    lexer.source,
    lexer.byte_offset,
    false,
    lexer.preserve_comments,
    lexer.mode,
    lexer.newlines
  );
}
function discard_comments(lexer) {
  return new Lexer(
    lexer.original_source,
    lexer.source,
    lexer.byte_offset,
    lexer.preserve_whitespace,
    false,
    lexer.mode,
    lexer.newlines
  );
}
function some_token(result) {
  let lexer = result[0];
  let token$1 = result[1];
  return [lexer, new Some(token$1)];
}
function advance(lexer, source, offset) {
  return new Lexer(
    lexer.original_source,
    source,
    lexer.byte_offset + offset,
    lexer.preserve_whitespace,
    lexer.preserve_comments,
    lexer.mode,
    lexer.newlines
  );
}
function advanced(token2, lexer, source, offset) {
  return [advance(lexer, source, offset), token2];
}
function token(lexer, token2, source, offset) {
  let _pipe = [token2, new Position(lexer.byte_offset)];
  let _pipe$1 = advanced(_pipe, lexer, source, offset);
  return some_token(_pipe$1);
}
function lex_uppercase_name(loop$lexer, loop$start, loop$slice_size) {
  while (true) {
    let lexer = loop$lexer;
    let start5 = loop$start;
    let slice_size = loop$slice_size;
    let $ = lexer.source;
    let $1 = $.charCodeAt(0);
    if ($1 === 97) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 98) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 99) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 100) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 101) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 102) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 103) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 104) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 105) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 106) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 107) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 108) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 109) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 110) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 111) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 112) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 113) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 114) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 115) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 116) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 117) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 118) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 119) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 120) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 121) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 122) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 65) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 66) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 67) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 68) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 69) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 70) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 71) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 72) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 73) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 74) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 75) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 76) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 77) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 78) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 79) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 80) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 81) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 82) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 83) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 84) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 85) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 86) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 87) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 88) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 89) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 90) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 48) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 49) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 50) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 51) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 52) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 53) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 54) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 55) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 56) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 57) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else {
      let name2 = slice_bytes(lexer.original_source, start5, slice_size);
      return [lexer, name2];
    }
  }
}
function lex_lowercase_name(loop$lexer, loop$start, loop$slice_size) {
  while (true) {
    let lexer = loop$lexer;
    let start5 = loop$start;
    let slice_size = loop$slice_size;
    let $ = lexer.source;
    let $1 = $.charCodeAt(0);
    if ($1 === 97) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 98) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 99) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 100) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 101) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 102) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 103) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 104) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 105) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 106) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 107) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 108) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 109) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 110) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 111) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 112) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 113) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 114) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 115) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 116) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 117) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 118) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 119) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 120) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 121) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 122) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 48) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 49) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 50) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 51) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 52) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 53) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 54) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 55) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 56) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 57) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 95) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else {
      let name2 = slice_bytes(lexer.original_source, start5, slice_size);
      return [lexer, name2];
    }
  }
}
function lex_string(loop$lexer, loop$start, loop$slice_size) {
  while (true) {
    let lexer = loop$lexer;
    let start5 = loop$start;
    let slice_size = loop$slice_size;
    let $ = lexer.source;
    let $1 = $.charCodeAt(0);
    if ($1 === 34) {
      let source = $.slice(1);
      let content = slice_bytes(lexer.original_source, start5 + 1, slice_size);
      let _pipe = [new String2(content), new Position(start5)];
      let _pipe$1 = advanced(_pipe, lexer, source, 1);
      return some_token(_pipe$1);
    } else if ($1 === 92) {
      let source = $.slice(1);
      let $2 = pop_grapheme(source);
      if ($2 instanceof Ok) {
        let grapheme = $2[0][0];
        let source$1 = $2[0][1];
        let offset = 1 + string_length2(grapheme);
        let _pipe = advance(lexer, source$1, offset);
        loop$lexer = _pipe;
        loop$start = start5;
        loop$slice_size = slice_size + offset;
      } else {
        let _pipe = advance(lexer, source, 1);
        loop$lexer = _pipe;
        loop$start = start5;
        loop$slice_size = slice_size + 1;
      }
    } else if ($ === "") {
      let content = slice_bytes(lexer.original_source, start5 + 1, slice_size);
      return [
        lexer,
        new Some([new UnterminatedString(content), new Position(start5)])
      ];
    } else {
      let _pipe = advance(lexer, drop_byte(lexer.source), 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    }
  }
}
function lex_number(loop$lexer, loop$mode, loop$start, loop$slice_size) {
  while (true) {
    let lexer = loop$lexer;
    let mode = loop$mode;
    let start5 = loop$start;
    let slice_size = loop$slice_size;
    let $ = lexer.source;
    let $1 = $.charCodeAt(0);
    if ($1 === 95) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$mode = mode;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 48) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$mode = mode;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 49) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$mode = mode;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 50) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$mode = mode;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 51) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$mode = mode;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 52) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$mode = mode;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 53) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$mode = mode;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 54) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$mode = mode;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 55) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$mode = mode;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 56) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$mode = mode;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 57) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$mode = mode;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 46) {
      if (mode instanceof LexInt) {
        let source = $.slice(1);
        let _pipe = advance(lexer, source, 1);
        loop$lexer = _pipe;
        loop$mode = LexNumberMode$LexFloat$const;
        loop$start = start5;
        loop$slice_size = slice_size + 1;
      } else if (mode instanceof LexFloat) {
        let lexer$1 = new Lexer(
          lexer.original_source,
          lexer.source,
          lexer.byte_offset,
          lexer.preserve_whitespace,
          lexer.preserve_comments,
          LexerMode$CheckForMinus$const,
          lexer.newlines
        );
        let content = slice_bytes(lexer$1.original_source, start5, slice_size);
        return [
          lexer$1,
          new Some([new Float(content), new Position(start5)])
        ];
      } else {
        let lexer$1 = new Lexer(
          lexer.original_source,
          lexer.source,
          lexer.byte_offset,
          lexer.preserve_whitespace,
          lexer.preserve_comments,
          LexerMode$CheckForMinus$const,
          lexer.newlines
        );
        let content = slice_bytes(lexer$1.original_source, start5, slice_size);
        return [
          lexer$1,
          new Some([new Float(content), new Position(start5)])
        ];
      }
    } else if ($.startsWith("e-")) {
      if (mode instanceof LexInt) {
        let lexer$1 = new Lexer(
          lexer.original_source,
          lexer.source,
          lexer.byte_offset,
          lexer.preserve_whitespace,
          lexer.preserve_comments,
          LexerMode$CheckForMinus$const,
          lexer.newlines
        );
        let content = slice_bytes(lexer$1.original_source, start5, slice_size);
        return [
          lexer$1,
          new Some([new Int(content), new Position(start5)])
        ];
      } else if (mode instanceof LexFloat) {
        let source = $.slice(2);
        let _pipe = advance(lexer, source, 2);
        loop$lexer = _pipe;
        loop$mode = LexNumberMode$LexFloatExponent$const;
        loop$start = start5;
        loop$slice_size = slice_size + 2;
      } else {
        let lexer$1 = new Lexer(
          lexer.original_source,
          lexer.source,
          lexer.byte_offset,
          lexer.preserve_whitespace,
          lexer.preserve_comments,
          LexerMode$CheckForMinus$const,
          lexer.newlines
        );
        let content = slice_bytes(lexer$1.original_source, start5, slice_size);
        return [
          lexer$1,
          new Some([new Float(content), new Position(start5)])
        ];
      }
    } else if ($1 === 101) {
      if (mode instanceof LexInt) {
        let lexer$1 = new Lexer(
          lexer.original_source,
          lexer.source,
          lexer.byte_offset,
          lexer.preserve_whitespace,
          lexer.preserve_comments,
          LexerMode$CheckForMinus$const,
          lexer.newlines
        );
        let content = slice_bytes(lexer$1.original_source, start5, slice_size);
        return [
          lexer$1,
          new Some([new Int(content), new Position(start5)])
        ];
      } else if (mode instanceof LexFloat) {
        let source = $.slice(1);
        let _pipe = advance(lexer, source, 1);
        loop$lexer = _pipe;
        loop$mode = LexNumberMode$LexFloatExponent$const;
        loop$start = start5;
        loop$slice_size = slice_size + 1;
      } else {
        let lexer$1 = new Lexer(
          lexer.original_source,
          lexer.source,
          lexer.byte_offset,
          lexer.preserve_whitespace,
          lexer.preserve_comments,
          LexerMode$CheckForMinus$const,
          lexer.newlines
        );
        let content = slice_bytes(lexer$1.original_source, start5, slice_size);
        return [
          lexer$1,
          new Some([new Float(content), new Position(start5)])
        ];
      }
    } else if (mode instanceof LexInt) {
      let lexer$1 = new Lexer(
        lexer.original_source,
        lexer.source,
        lexer.byte_offset,
        lexer.preserve_whitespace,
        lexer.preserve_comments,
        LexerMode$CheckForMinus$const,
        lexer.newlines
      );
      let content = slice_bytes(lexer$1.original_source, start5, slice_size);
      return [lexer$1, new Some([new Int(content), new Position(start5)])];
    } else if (mode instanceof LexFloat) {
      let lexer$1 = new Lexer(
        lexer.original_source,
        lexer.source,
        lexer.byte_offset,
        lexer.preserve_whitespace,
        lexer.preserve_comments,
        LexerMode$CheckForMinus$const,
        lexer.newlines
      );
      let content = slice_bytes(lexer$1.original_source, start5, slice_size);
      return [
        lexer$1,
        new Some([new Float(content), new Position(start5)])
      ];
    } else {
      let lexer$1 = new Lexer(
        lexer.original_source,
        lexer.source,
        lexer.byte_offset,
        lexer.preserve_whitespace,
        lexer.preserve_comments,
        LexerMode$CheckForMinus$const,
        lexer.newlines
      );
      let content = slice_bytes(lexer$1.original_source, start5, slice_size);
      return [
        lexer$1,
        new Some([new Float(content), new Position(start5)])
      ];
    }
  }
}
function lex_hexadecimal(loop$lexer, loop$start, loop$slice_size) {
  while (true) {
    let lexer = loop$lexer;
    let start5 = loop$start;
    let slice_size = loop$slice_size;
    let $ = lexer.source;
    let $1 = $.charCodeAt(0);
    if ($1 === 95) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 48) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 49) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 50) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 51) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 52) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 53) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 54) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 55) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 56) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 57) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 97) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 65) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 98) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 66) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 99) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 67) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 100) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 68) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 101) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 69) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 102) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 70) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else {
      let content = slice_bytes(lexer.original_source, start5, slice_size);
      return [lexer, new Some([new Int(content), new Position(start5)])];
    }
  }
}
function lex_octal(loop$lexer, loop$start, loop$slice_size) {
  while (true) {
    let lexer = loop$lexer;
    let start5 = loop$start;
    let slice_size = loop$slice_size;
    let $ = lexer.source;
    let $1 = $.charCodeAt(0);
    if ($1 === 95) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 48) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 49) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 50) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 51) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 52) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 53) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 54) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 55) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else {
      let content = slice_bytes(lexer.original_source, start5, slice_size);
      return [lexer, new Some([new Int(content), new Position(start5)])];
    }
  }
}
function lex_binary(loop$lexer, loop$start, loop$slice_size) {
  while (true) {
    let lexer = loop$lexer;
    let start5 = loop$start;
    let slice_size = loop$slice_size;
    let $ = lexer.source;
    let $1 = $.charCodeAt(0);
    if ($1 === 95) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 48) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 49) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else {
      let content = slice_bytes(lexer.original_source, start5, slice_size);
      return [lexer, new Some([new Int(content), new Position(start5)])];
    }
  }
}
function comment(lexer, kind, start5) {
  let $ = split_before(lexer.newlines, lexer.source);
  let prefix = $[0];
  let suffix = $[1];
  let eaten = string_length2(prefix);
  let lexer$1 = advance(lexer, suffix, eaten);
  let _block;
  if (kind instanceof RegularComment) {
    _block = new CommentNormal(prefix);
  } else if (kind instanceof DocComment) {
    _block = new CommentDoc(prefix);
  } else {
    _block = new CommentModule(prefix);
  }
  let token$1 = _block;
  return [lexer$1, new Some([token$1, new Position(start5)])];
}
function skip_comment(lexer) {
  let $ = split_before(lexer.newlines, lexer.source);
  let prefix = $[0];
  let suffix = $[1];
  let eaten = string_length2(prefix);
  let lexer$1 = advance(lexer, suffix, eaten);
  return [lexer$1, Option$None$const];
}
function whitespace(loop$lexer, loop$start, loop$slice_size) {
  while (true) {
    let lexer = loop$lexer;
    let start5 = loop$start;
    let slice_size = loop$slice_size;
    let $ = lexer.source;
    let $1 = $.charCodeAt(0);
    if ($1 === 32) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 9) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 10) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 13) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else {
      let $2 = lexer.preserve_whitespace;
      if ($2) {
        let content = slice_bytes(lexer.original_source, start5, slice_size);
        return [
          lexer,
          new Some([new Space(content), new Position(start5)])
        ];
      } else {
        return [lexer, Option$None$const];
      }
    }
  }
}
function lex_digits(loop$lexer, loop$start, loop$slice_size) {
  while (true) {
    let lexer = loop$lexer;
    let start5 = loop$start;
    let slice_size = loop$slice_size;
    let $ = lexer.source;
    let $1 = $.charCodeAt(0);
    if ($1 === 48) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 49) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 50) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 51) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 52) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 53) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 54) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 55) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 56) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else if ($1 === 57) {
      let source = $.slice(1);
      let _pipe = advance(lexer, source, 1);
      loop$lexer = _pipe;
      loop$start = start5;
      loop$slice_size = slice_size + 1;
    } else {
      let digits = slice_bytes(lexer.original_source, start5, slice_size);
      return [lexer, digits];
    }
  }
}
function check_for_minus(lexer) {
  let $ = lexer.source;
  if ($.charCodeAt(0) === 45) {
    let source = $.slice(1);
    let $1 = token(lexer, Token$Minus$const, source, 1);
    let lexer$1 = $1[0];
    let token$1 = $1[1];
    return new Ok(
      [
        new Lexer(
          lexer$1.original_source,
          lexer$1.source,
          lexer$1.byte_offset,
          lexer$1.preserve_whitespace,
          lexer$1.preserve_comments,
          LexerMode$Normal$const,
          lexer$1.newlines
        ),
        token$1
      ]
    );
  } else {
    return new Error(void 0);
  }
}
function check_for_nested_dot(lexer) {
  let $ = lexer.source;
  if ($.startsWith("..")) {
    let source = $.slice(2);
    return new Ok(token(lexer, Token$DotDot$const, source, 2));
  } else if ($.charCodeAt(0) === 46) {
    let source = $.slice(1);
    let $1 = source.charCodeAt(0);
    if ($1 === 48) {
      let $2 = token(lexer, Token$Dot$const, source, 1);
      let lexer$1 = $2[0];
      let token$1 = $2[1];
      return new Ok(
        [
          new Lexer(
            lexer$1.original_source,
            lexer$1.source,
            lexer$1.byte_offset,
            lexer$1.preserve_whitespace,
            lexer$1.preserve_comments,
            LexerMode$HasNestedDot$const,
            lexer$1.newlines
          ),
          token$1
        ]
      );
    } else if ($1 === 49) {
      let $2 = token(lexer, Token$Dot$const, source, 1);
      let lexer$1 = $2[0];
      let token$1 = $2[1];
      return new Ok(
        [
          new Lexer(
            lexer$1.original_source,
            lexer$1.source,
            lexer$1.byte_offset,
            lexer$1.preserve_whitespace,
            lexer$1.preserve_comments,
            LexerMode$HasNestedDot$const,
            lexer$1.newlines
          ),
          token$1
        ]
      );
    } else if ($1 === 50) {
      let $2 = token(lexer, Token$Dot$const, source, 1);
      let lexer$1 = $2[0];
      let token$1 = $2[1];
      return new Ok(
        [
          new Lexer(
            lexer$1.original_source,
            lexer$1.source,
            lexer$1.byte_offset,
            lexer$1.preserve_whitespace,
            lexer$1.preserve_comments,
            LexerMode$HasNestedDot$const,
            lexer$1.newlines
          ),
          token$1
        ]
      );
    } else if ($1 === 51) {
      let $2 = token(lexer, Token$Dot$const, source, 1);
      let lexer$1 = $2[0];
      let token$1 = $2[1];
      return new Ok(
        [
          new Lexer(
            lexer$1.original_source,
            lexer$1.source,
            lexer$1.byte_offset,
            lexer$1.preserve_whitespace,
            lexer$1.preserve_comments,
            LexerMode$HasNestedDot$const,
            lexer$1.newlines
          ),
          token$1
        ]
      );
    } else if ($1 === 52) {
      let $2 = token(lexer, Token$Dot$const, source, 1);
      let lexer$1 = $2[0];
      let token$1 = $2[1];
      return new Ok(
        [
          new Lexer(
            lexer$1.original_source,
            lexer$1.source,
            lexer$1.byte_offset,
            lexer$1.preserve_whitespace,
            lexer$1.preserve_comments,
            LexerMode$HasNestedDot$const,
            lexer$1.newlines
          ),
          token$1
        ]
      );
    } else if ($1 === 53) {
      let $2 = token(lexer, Token$Dot$const, source, 1);
      let lexer$1 = $2[0];
      let token$1 = $2[1];
      return new Ok(
        [
          new Lexer(
            lexer$1.original_source,
            lexer$1.source,
            lexer$1.byte_offset,
            lexer$1.preserve_whitespace,
            lexer$1.preserve_comments,
            LexerMode$HasNestedDot$const,
            lexer$1.newlines
          ),
          token$1
        ]
      );
    } else if ($1 === 54) {
      let $2 = token(lexer, Token$Dot$const, source, 1);
      let lexer$1 = $2[0];
      let token$1 = $2[1];
      return new Ok(
        [
          new Lexer(
            lexer$1.original_source,
            lexer$1.source,
            lexer$1.byte_offset,
            lexer$1.preserve_whitespace,
            lexer$1.preserve_comments,
            LexerMode$HasNestedDot$const,
            lexer$1.newlines
          ),
          token$1
        ]
      );
    } else if ($1 === 55) {
      let $2 = token(lexer, Token$Dot$const, source, 1);
      let lexer$1 = $2[0];
      let token$1 = $2[1];
      return new Ok(
        [
          new Lexer(
            lexer$1.original_source,
            lexer$1.source,
            lexer$1.byte_offset,
            lexer$1.preserve_whitespace,
            lexer$1.preserve_comments,
            LexerMode$HasNestedDot$const,
            lexer$1.newlines
          ),
          token$1
        ]
      );
    } else if ($1 === 56) {
      let $2 = token(lexer, Token$Dot$const, source, 1);
      let lexer$1 = $2[0];
      let token$1 = $2[1];
      return new Ok(
        [
          new Lexer(
            lexer$1.original_source,
            lexer$1.source,
            lexer$1.byte_offset,
            lexer$1.preserve_whitespace,
            lexer$1.preserve_comments,
            LexerMode$HasNestedDot$const,
            lexer$1.newlines
          ),
          token$1
        ]
      );
    } else if ($1 === 57) {
      let $2 = token(lexer, Token$Dot$const, source, 1);
      let lexer$1 = $2[0];
      let token$1 = $2[1];
      return new Ok(
        [
          new Lexer(
            lexer$1.original_source,
            lexer$1.source,
            lexer$1.byte_offset,
            lexer$1.preserve_whitespace,
            lexer$1.preserve_comments,
            LexerMode$HasNestedDot$const,
            lexer$1.newlines
          ),
          token$1
        ]
      );
    } else {
      return new Ok(token(lexer, Token$Dot$const, source, 1));
    }
  } else {
    return new Error(void 0);
  }
}
function next(lexer) {
  let $ = lexer.mode;
  if ($ instanceof Normal2) {
    let $1 = lexer.source;
    let $2 = $1.charCodeAt(0);
    if ($2 === 32) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return whitespace(_pipe, lexer.byte_offset, 1);
    } else if ($2 === 10) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return whitespace(_pipe, lexer.byte_offset, 1);
    } else if ($2 === 13) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return whitespace(_pipe, lexer.byte_offset, 1);
    } else if ($2 === 9) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return whitespace(_pipe, lexer.byte_offset, 1);
    } else if ($1.startsWith("////")) {
      let source = $1.slice(4);
      let $3 = lexer.preserve_comments;
      if ($3) {
        let _pipe = advance(lexer, source, 4);
        return comment(
          _pipe,
          CommentKind$ModuleComment$const,
          lexer.byte_offset
        );
      } else {
        return skip_comment(lexer);
      }
    } else if ($1.startsWith("///")) {
      let source = $1.slice(3);
      let $3 = lexer.preserve_comments;
      if ($3) {
        let _pipe = advance(lexer, source, 3);
        return comment(_pipe, CommentKind$DocComment$const, lexer.byte_offset);
      } else {
        return skip_comment(lexer);
      }
    } else if ($1.startsWith("//")) {
      let source = $1.slice(2);
      let $3 = lexer.preserve_comments;
      if ($3) {
        let _pipe = advance(lexer, source, 2);
        return comment(
          _pipe,
          CommentKind$RegularComment$const,
          lexer.byte_offset
        );
      } else {
        return skip_comment(lexer);
      }
    } else if ($2 === 40) {
      let source = $1.slice(1);
      return token(lexer, Token$LeftParen$const, source, 1);
    } else if ($2 === 41) {
      let source = $1.slice(1);
      return token(lexer, Token$RightParen$const, source, 1);
    } else if ($2 === 123) {
      let source = $1.slice(1);
      return token(lexer, Token$LeftBrace$const, source, 1);
    } else if ($2 === 125) {
      let source = $1.slice(1);
      return token(lexer, Token$RightBrace$const, source, 1);
    } else if ($2 === 91) {
      let source = $1.slice(1);
      return token(lexer, Token$LeftSquare$const, source, 1);
    } else if ($2 === 93) {
      let source = $1.slice(1);
      return token(lexer, Token$RightSquare$const, source, 1);
    } else if ($2 === 64) {
      let source = $1.slice(1);
      return token(lexer, Token$At$const, source, 1);
    } else if ($2 === 58) {
      let source = $1.slice(1);
      return token(lexer, Token$Colon$const, source, 1);
    } else if ($2 === 44) {
      let source = $1.slice(1);
      return token(lexer, Token$Comma$const, source, 1);
    } else if ($1.startsWith("..")) {
      let source = $1.slice(2);
      return token(lexer, Token$DotDot$const, source, 2);
    } else if ($2 === 46) {
      let source = $1.slice(1);
      return token(lexer, Token$Dot$const, source, 1);
    } else if ($2 === 35) {
      let source = $1.slice(1);
      return token(lexer, Token$Hash$const, source, 1);
    } else if ($1.startsWith("!=")) {
      let source = $1.slice(2);
      return token(lexer, Token$NotEqual$const, source, 2);
    } else if ($2 === 33) {
      let source = $1.slice(1);
      return token(lexer, Token$Bang$const, source, 1);
    } else if ($1.startsWith("==")) {
      let source = $1.slice(2);
      return token(lexer, Token$EqualEqual$const, source, 2);
    } else if ($2 === 61) {
      let source = $1.slice(1);
      return token(lexer, Token$Equal$const, source, 1);
    } else if ($1.startsWith("|>")) {
      let source = $1.slice(2);
      return token(lexer, Token$Pipe$const, source, 2);
    } else if ($1.startsWith("||")) {
      let source = $1.slice(2);
      return token(lexer, Token$VBarVBar$const, source, 2);
    } else if ($2 === 124) {
      let source = $1.slice(1);
      return token(lexer, Token$VBar$const, source, 1);
    } else if ($1.startsWith("&&")) {
      let source = $1.slice(2);
      return token(lexer, Token$AmperAmper$const, source, 2);
    } else if ($1.startsWith("<<")) {
      let source = $1.slice(2);
      return token(lexer, Token$LessLess$const, source, 2);
    } else if ($1.startsWith(">>")) {
      let source = $1.slice(2);
      return token(lexer, Token$GreaterGreater$const, source, 2);
    } else if ($1.startsWith("<-")) {
      let source = $1.slice(2);
      return token(lexer, Token$LeftArrow$const, source, 2);
    } else if ($1.startsWith("->")) {
      let source = $1.slice(2);
      return token(lexer, Token$RightArrow$const, source, 2);
    } else if ($1.startsWith("<>")) {
      let source = $1.slice(2);
      return token(lexer, Token$LessGreater$const, source, 2);
    } else if ($1.startsWith("+.")) {
      let source = $1.slice(2);
      return token(lexer, Token$PlusDot$const, source, 2);
    } else if ($1.startsWith("-.")) {
      let source = $1.slice(2);
      return token(lexer, Token$MinusDot$const, source, 2);
    } else if ($1.startsWith("*.")) {
      let source = $1.slice(2);
      return token(lexer, Token$StarDot$const, source, 2);
    } else if ($1.startsWith("/.")) {
      let source = $1.slice(2);
      return token(lexer, Token$SlashDot$const, source, 2);
    } else if ($1.startsWith("<=.")) {
      let source = $1.slice(3);
      return token(lexer, Token$LessEqualDot$const, source, 3);
    } else if ($1.startsWith("<.")) {
      let source = $1.slice(2);
      return token(lexer, Token$LessDot$const, source, 2);
    } else if ($1.startsWith(">=.")) {
      let source = $1.slice(3);
      return token(lexer, Token$GreaterEqualDot$const, source, 3);
    } else if ($1.startsWith(">.")) {
      let source = $1.slice(2);
      return token(lexer, Token$GreaterDot$const, source, 2);
    } else if ($1.startsWith("0b")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_binary(_pipe, lexer.byte_offset, 2);
    } else if ($1.startsWith("0o")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_octal(_pipe, lexer.byte_offset, 2);
    } else if ($1.startsWith("0x")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_hexadecimal(_pipe, lexer.byte_offset, 2);
    } else if ($2 === 48) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 1);
    } else if ($2 === 49) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 1);
    } else if ($2 === 50) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 1);
    } else if ($2 === 51) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 1);
    } else if ($2 === 52) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 1);
    } else if ($2 === 53) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 1);
    } else if ($2 === 54) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 1);
    } else if ($2 === 55) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 1);
    } else if ($2 === 56) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 1);
    } else if ($2 === 57) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 1);
    } else if ($1.startsWith("-0")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 2);
    } else if ($1.startsWith("-1")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 2);
    } else if ($1.startsWith("-2")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 2);
    } else if ($1.startsWith("-3")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 2);
    } else if ($1.startsWith("-4")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 2);
    } else if ($1.startsWith("-5")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 2);
    } else if ($1.startsWith("-6")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 2);
    } else if ($1.startsWith("-7")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 2);
    } else if ($1.startsWith("-8")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 2);
    } else if ($1.startsWith("-9")) {
      let source = $1.slice(2);
      let _pipe = advance(lexer, source, 2);
      return lex_number(_pipe, LexNumberMode$LexInt$const, lexer.byte_offset, 2);
    } else if ($2 === 43) {
      let source = $1.slice(1);
      return token(lexer, Token$Plus$const, source, 1);
    } else if ($2 === 45) {
      let source = $1.slice(1);
      return token(lexer, Token$Minus$const, source, 1);
    } else if ($2 === 42) {
      let source = $1.slice(1);
      return token(lexer, Token$Star$const, source, 1);
    } else if ($2 === 47) {
      let source = $1.slice(1);
      return token(lexer, Token$Slash$const, source, 1);
    } else if ($1.startsWith("<=")) {
      let source = $1.slice(2);
      return token(lexer, Token$LessEqual$const, source, 2);
    } else if ($2 === 60) {
      let source = $1.slice(1);
      return token(lexer, Token$Less$const, source, 1);
    } else if ($1.startsWith(">=")) {
      let source = $1.slice(2);
      return token(lexer, Token$GreaterEqual$const, source, 2);
    } else if ($2 === 62) {
      let source = $1.slice(1);
      return token(lexer, Token$Greater$const, source, 1);
    } else if ($2 === 37) {
      let source = $1.slice(1);
      return token(lexer, Token$Percent$const, source, 1);
    } else if ($2 === 34) {
      let source = $1.slice(1);
      let _pipe = advance(lexer, source, 1);
      return lex_string(_pipe, lexer.byte_offset, 0);
    } else if ($2 === 95) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset + 1, 0);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new DiscardName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 97) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 98) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 99) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 100) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 101) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 102) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 103) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 104) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 105) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 106) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 107) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 108) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 109) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 110) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 111) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 112) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 113) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 114) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 115) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 116) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 117) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 118) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 119) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 120) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 121) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 122) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_lowercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      let _block$1;
      if (name2 === "as") {
        _block$1 = Token$As$const;
      } else if (name2 === "assert") {
        _block$1 = Token$Assert$const;
      } else if (name2 === "auto") {
        _block$1 = Token$Auto$const;
      } else if (name2 === "case") {
        _block$1 = Token$Case$const;
      } else if (name2 === "const") {
        _block$1 = Token$Const$const;
      } else if (name2 === "delegate") {
        _block$1 = Token$Delegate$const;
      } else if (name2 === "derive") {
        _block$1 = Token$Derive$const;
      } else if (name2 === "echo") {
        _block$1 = Token$Echo$const;
      } else if (name2 === "else") {
        _block$1 = Token$Else$const;
      } else if (name2 === "fn") {
        _block$1 = Token$Fn$const;
      } else if (name2 === "if") {
        _block$1 = Token$If$const;
      } else if (name2 === "implement") {
        _block$1 = Token$Implement$const;
      } else if (name2 === "import") {
        _block$1 = Token$Import$const;
      } else if (name2 === "let") {
        _block$1 = Token$Let$const;
      } else if (name2 === "macro") {
        _block$1 = Token$Macro$const;
      } else if (name2 === "opaque") {
        _block$1 = Token$Opaque$const;
      } else if (name2 === "panic") {
        _block$1 = Token$Panic$const;
      } else if (name2 === "pub") {
        _block$1 = Token$Pub$const;
      } else if (name2 === "test") {
        _block$1 = Token$Test$const;
      } else if (name2 === "todo") {
        _block$1 = Token$Todo$const;
      } else if (name2 === "type") {
        _block$1 = Token$Type$const;
      } else if (name2 === "use") {
        _block$1 = Token$Use$const;
      } else {
        _block$1 = new Name(name2);
      }
      let token$1 = _block$1;
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDotOrMinus$const,
        lexer$1.newlines
      );
      return [lexer$2, new Some([token$1, new Position(byte_offset)])];
    } else if ($2 === 65) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 66) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 67) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 68) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 69) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 70) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 71) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 72) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 73) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 74) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 75) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 76) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 77) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 78) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 79) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 80) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 81) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 82) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 83) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 84) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 85) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 86) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 87) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 88) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 89) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else if ($2 === 90) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_uppercase_name(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let name2 = $3[1];
      return [
        lexer$1,
        new Some([new UpperName(name2), new Position(byte_offset)])
      ];
    } else {
      let $3 = pop_grapheme(lexer.source);
      if ($3 instanceof Ok) {
        let grapheme = $3[0][0];
        let source = $3[0][1];
        return token(
          lexer,
          new UnexpectedGrapheme(grapheme),
          source,
          string_length2(grapheme)
        );
      } else {
        return [
          lexer,
          new Some(
            [Token$EndOfFile$const, new Position(lexer.byte_offset)]
          )
        ];
      }
    }
  } else if ($ instanceof CheckForMinus) {
    let $1 = check_for_minus(lexer);
    if ($1 instanceof Ok) {
      let result = $1[0];
      return result;
    } else {
      return [
        new Lexer(
          lexer.original_source,
          lexer.source,
          lexer.byte_offset,
          lexer.preserve_whitespace,
          lexer.preserve_comments,
          LexerMode$Normal$const,
          lexer.newlines
        ),
        Option$None$const
      ];
    }
  } else if ($ instanceof CheckForNestedDot) {
    let $1 = check_for_nested_dot(lexer);
    if ($1 instanceof Ok) {
      let result = $1[0];
      return result;
    } else {
      return [
        new Lexer(
          lexer.original_source,
          lexer.source,
          lexer.byte_offset,
          lexer.preserve_whitespace,
          lexer.preserve_comments,
          LexerMode$Normal$const,
          lexer.newlines
        ),
        Option$None$const
      ];
    }
  } else if ($ instanceof CheckForNestedDotOrMinus) {
    let $1 = check_for_nested_dot(lexer);
    if ($1 instanceof Ok) {
      let result = $1[0];
      return result;
    } else {
      let $2 = check_for_minus(lexer);
      if ($2 instanceof Ok) {
        let result = $2[0];
        return result;
      } else {
        return [
          new Lexer(
            lexer.original_source,
            lexer.source,
            lexer.byte_offset,
            lexer.preserve_whitespace,
            lexer.preserve_comments,
            LexerMode$Normal$const,
            lexer.newlines
          ),
          Option$None$const
        ];
      }
    }
  } else {
    let $1 = lexer.source;
    let $2 = $1.charCodeAt(0);
    if ($2 === 48) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_digits(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let int5 = $3[1];
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDot$const,
        lexer$1.newlines
      );
      return [
        lexer$2,
        new Some([new Int(int5), new Position(byte_offset)])
      ];
    } else if ($2 === 49) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_digits(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let int5 = $3[1];
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDot$const,
        lexer$1.newlines
      );
      return [
        lexer$2,
        new Some([new Int(int5), new Position(byte_offset)])
      ];
    } else if ($2 === 50) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_digits(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let int5 = $3[1];
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDot$const,
        lexer$1.newlines
      );
      return [
        lexer$2,
        new Some([new Int(int5), new Position(byte_offset)])
      ];
    } else if ($2 === 51) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_digits(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let int5 = $3[1];
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDot$const,
        lexer$1.newlines
      );
      return [
        lexer$2,
        new Some([new Int(int5), new Position(byte_offset)])
      ];
    } else if ($2 === 52) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_digits(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let int5 = $3[1];
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDot$const,
        lexer$1.newlines
      );
      return [
        lexer$2,
        new Some([new Int(int5), new Position(byte_offset)])
      ];
    } else if ($2 === 53) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_digits(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let int5 = $3[1];
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDot$const,
        lexer$1.newlines
      );
      return [
        lexer$2,
        new Some([new Int(int5), new Position(byte_offset)])
      ];
    } else if ($2 === 54) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_digits(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let int5 = $3[1];
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDot$const,
        lexer$1.newlines
      );
      return [
        lexer$2,
        new Some([new Int(int5), new Position(byte_offset)])
      ];
    } else if ($2 === 55) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_digits(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let int5 = $3[1];
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDot$const,
        lexer$1.newlines
      );
      return [
        lexer$2,
        new Some([new Int(int5), new Position(byte_offset)])
      ];
    } else if ($2 === 56) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_digits(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let int5 = $3[1];
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDot$const,
        lexer$1.newlines
      );
      return [
        lexer$2,
        new Some([new Int(int5), new Position(byte_offset)])
      ];
    } else if ($2 === 57) {
      let source = $1.slice(1);
      let byte_offset = lexer.byte_offset;
      let _block;
      let _pipe = advance(lexer, source, 1);
      _block = lex_digits(_pipe, byte_offset, 1);
      let $3 = _block;
      let lexer$1 = $3[0];
      let int5 = $3[1];
      let lexer$2 = new Lexer(
        lexer$1.original_source,
        lexer$1.source,
        lexer$1.byte_offset,
        lexer$1.preserve_whitespace,
        lexer$1.preserve_comments,
        LexerMode$CheckForNestedDot$const,
        lexer$1.newlines
      );
      return [
        lexer$2,
        new Some([new Int(int5), new Position(byte_offset)])
      ];
    } else {
      return [
        new Lexer(
          lexer.original_source,
          lexer.source,
          lexer.byte_offset,
          lexer.preserve_whitespace,
          lexer.preserve_comments,
          LexerMode$Normal$const,
          lexer.newlines
        ),
        Option$None$const
      ];
    }
  }
}
function do_lex(loop$lexer, loop$tokens) {
  while (true) {
    let lexer = loop$lexer;
    let tokens = loop$tokens;
    let $ = next(lexer);
    let $1 = $[1];
    if ($1 instanceof Some) {
      if ($1[0][0] instanceof EndOfFile) {
        return tokens;
      } else {
        let lexer$1 = $[0];
        let token$1 = $1[0];
        loop$lexer = lexer$1;
        loop$tokens = prepend(token$1, tokens);
      }
    } else {
      let lexer$1 = $[0];
      loop$lexer = lexer$1;
      loop$tokens = tokens;
    }
  }
}
function lex(lexer) {
  let _pipe = do_lex(lexer, List$Empty$const);
  return reverse(_pipe);
}

// ../glance/glance.mjs
var FILEPATH = "src/glance.gleam";
var Definition = class extends CustomType {
  constructor(attributes2, definition) {
    super();
    this.attributes = attributes2;
    this.definition = definition;
  }
};
var Attribute2 = class extends CustomType {
  constructor(name2, arguments$) {
    super();
    this.name = name2;
    this.arguments = arguments$;
  }
};
var Module = class extends CustomType {
  constructor(imports, custom_types, type_aliases, constants, functions2) {
    super();
    this.imports = imports;
    this.custom_types = custom_types;
    this.type_aliases = type_aliases;
    this.constants = constants;
    this.functions = functions2;
  }
};
var Function2 = class extends CustomType {
  constructor(location, name2, publicity, parameters, return$, body) {
    super();
    this.location = location;
    this.name = name2;
    this.publicity = publicity;
    this.parameters = parameters;
    this.return = return$;
    this.body = body;
  }
};
var Span = class extends CustomType {
  constructor(start5, end) {
    super();
    this.start = start5;
    this.end = end;
  }
};
var Use2 = class extends CustomType {
  constructor(location, patterns, function$) {
    super();
    this.location = location;
    this.patterns = patterns;
    this.function = function$;
  }
};
var Assignment = class extends CustomType {
  constructor(location, kind, pattern2, annotation, value2) {
    super();
    this.location = location;
    this.kind = kind;
    this.pattern = pattern2;
    this.annotation = annotation;
    this.value = value2;
  }
};
var Assert2 = class extends CustomType {
  constructor(location, expression2, message) {
    super();
    this.location = location;
    this.expression = expression2;
    this.message = message;
  }
};
var Expression = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Let3 = class extends CustomType {
};
var AssignmentKind$Let$const = new Let3();
var LetAssert = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var UsePattern = class extends CustomType {
  constructor(pattern2, annotation) {
    super();
    this.pattern = pattern2;
    this.annotation = annotation;
  }
};
var PatternInt = class extends CustomType {
  constructor(location, value2) {
    super();
    this.location = location;
    this.value = value2;
  }
};
var PatternFloat = class extends CustomType {
  constructor(location, value2) {
    super();
    this.location = location;
    this.value = value2;
  }
};
var PatternString = class extends CustomType {
  constructor(location, value2) {
    super();
    this.location = location;
    this.value = value2;
  }
};
var PatternDiscard = class extends CustomType {
  constructor(location, name2) {
    super();
    this.location = location;
    this.name = name2;
  }
};
var PatternVariable = class extends CustomType {
  constructor(location, name2) {
    super();
    this.location = location;
    this.name = name2;
  }
};
var PatternTuple = class extends CustomType {
  constructor(location, elements) {
    super();
    this.location = location;
    this.elements = elements;
  }
};
var PatternList = class extends CustomType {
  constructor(location, elements, tail) {
    super();
    this.location = location;
    this.elements = elements;
    this.tail = tail;
  }
};
var PatternAssignment = class extends CustomType {
  constructor(location, pattern2, name2) {
    super();
    this.location = location;
    this.pattern = pattern2;
    this.name = name2;
  }
};
var PatternConcatenate = class extends CustomType {
  constructor(location, prefix, prefix_name, rest_name) {
    super();
    this.location = location;
    this.prefix = prefix;
    this.prefix_name = prefix_name;
    this.rest_name = rest_name;
  }
};
var PatternBitString = class extends CustomType {
  constructor(location, segments) {
    super();
    this.location = location;
    this.segments = segments;
  }
};
var PatternVariant = class extends CustomType {
  constructor(location, module2, constructor, arguments$, with_spread) {
    super();
    this.location = location;
    this.module = module2;
    this.constructor$ = constructor;
    this.arguments = arguments$;
    this.with_spread = with_spread;
  }
};
var Int2 = class extends CustomType {
  constructor(location, value2) {
    super();
    this.location = location;
    this.value = value2;
  }
};
var Float2 = class extends CustomType {
  constructor(location, value2) {
    super();
    this.location = location;
    this.value = value2;
  }
};
var String3 = class extends CustomType {
  constructor(location, value2) {
    super();
    this.location = location;
    this.value = value2;
  }
};
var Variable = class extends CustomType {
  constructor(location, name2) {
    super();
    this.location = location;
    this.name = name2;
  }
};
var NegateInt = class extends CustomType {
  constructor(location, value2) {
    super();
    this.location = location;
    this.value = value2;
  }
};
var NegateBool = class extends CustomType {
  constructor(location, value2) {
    super();
    this.location = location;
    this.value = value2;
  }
};
var Block = class extends CustomType {
  constructor(location, statements2) {
    super();
    this.location = location;
    this.statements = statements2;
  }
};
var Panic2 = class extends CustomType {
  constructor(location, message) {
    super();
    this.location = location;
    this.message = message;
  }
};
var Todo2 = class extends CustomType {
  constructor(location, message) {
    super();
    this.location = location;
    this.message = message;
  }
};
var Tuple = class extends CustomType {
  constructor(location, elements) {
    super();
    this.location = location;
    this.elements = elements;
  }
};
var List2 = class extends CustomType {
  constructor(location, elements, rest) {
    super();
    this.location = location;
    this.elements = elements;
    this.rest = rest;
  }
};
var Fn2 = class extends CustomType {
  constructor(location, arguments$, return_annotation, body) {
    super();
    this.location = location;
    this.arguments = arguments$;
    this.return_annotation = return_annotation;
    this.body = body;
  }
};
var RecordUpdate = class extends CustomType {
  constructor(location, module2, constructor, record, fields) {
    super();
    this.location = location;
    this.module = module2;
    this.constructor$ = constructor;
    this.record = record;
    this.fields = fields;
  }
};
var FieldAccess2 = class extends CustomType {
  constructor(location, container, label2) {
    super();
    this.location = location;
    this.container = container;
    this.label = label2;
  }
};
var Call2 = class extends CustomType {
  constructor(location, function$, arguments$) {
    super();
    this.location = location;
    this.function = function$;
    this.arguments = arguments$;
  }
};
var TupleIndex = class extends CustomType {
  constructor(location, tuple, index4) {
    super();
    this.location = location;
    this.tuple = tuple;
    this.index = index4;
  }
};
var FnCapture = class extends CustomType {
  constructor(location, label2, function$, arguments_before, arguments_after) {
    super();
    this.location = location;
    this.label = label2;
    this.function = function$;
    this.arguments_before = arguments_before;
    this.arguments_after = arguments_after;
  }
};
var BitString = class extends CustomType {
  constructor(location, segments) {
    super();
    this.location = location;
    this.segments = segments;
  }
};
var Case3 = class extends CustomType {
  constructor(location, subjects, clauses) {
    super();
    this.location = location;
    this.subjects = subjects;
    this.clauses = clauses;
  }
};
var BinaryOperator = class extends CustomType {
  constructor(location, name2, left, right) {
    super();
    this.location = location;
    this.name = name2;
    this.left = left;
    this.right = right;
  }
};
var Echo2 = class extends CustomType {
  constructor(location, expression2, message) {
    super();
    this.location = location;
    this.expression = expression2;
    this.message = message;
  }
};
var Clause = class extends CustomType {
  constructor(patterns, guard2, body) {
    super();
    this.patterns = patterns;
    this.guard = guard2;
    this.body = body;
  }
};
var BytesOption = class extends CustomType {
};
var BitStringSegmentOption$BytesOption$const = new BytesOption();
var IntOption = class extends CustomType {
};
var BitStringSegmentOption$IntOption$const = new IntOption();
var FloatOption = class extends CustomType {
};
var BitStringSegmentOption$FloatOption$const = new FloatOption();
var BitsOption = class extends CustomType {
};
var BitStringSegmentOption$BitsOption$const = new BitsOption();
var Utf8Option = class extends CustomType {
};
var BitStringSegmentOption$Utf8Option$const = new Utf8Option();
var Utf16Option = class extends CustomType {
};
var BitStringSegmentOption$Utf16Option$const = new Utf16Option();
var Utf32Option = class extends CustomType {
};
var BitStringSegmentOption$Utf32Option$const = new Utf32Option();
var Utf8CodepointOption = class extends CustomType {
};
var BitStringSegmentOption$Utf8CodepointOption$const = new Utf8CodepointOption();
var Utf16CodepointOption = class extends CustomType {
};
var BitStringSegmentOption$Utf16CodepointOption$const = new Utf16CodepointOption();
var Utf32CodepointOption = class extends CustomType {
};
var BitStringSegmentOption$Utf32CodepointOption$const = new Utf32CodepointOption();
var SignedOption = class extends CustomType {
};
var BitStringSegmentOption$SignedOption$const = new SignedOption();
var UnsignedOption = class extends CustomType {
};
var BitStringSegmentOption$UnsignedOption$const = new UnsignedOption();
var BigOption = class extends CustomType {
};
var BitStringSegmentOption$BigOption$const = new BigOption();
var LittleOption = class extends CustomType {
};
var BitStringSegmentOption$LittleOption$const = new LittleOption();
var NativeOption = class extends CustomType {
};
var BitStringSegmentOption$NativeOption$const = new NativeOption();
var SizeValueOption = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var SizeOption = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UnitOption = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var And = class extends CustomType {
};
var BinaryOperator$And$const = new And();
var Or = class extends CustomType {
};
var BinaryOperator$Or$const = new Or();
var Eq2 = class extends CustomType {
};
var BinaryOperator$Eq$const = new Eq2();
var NotEq = class extends CustomType {
};
var BinaryOperator$NotEq$const = new NotEq();
var LtInt = class extends CustomType {
};
var BinaryOperator$LtInt$const = new LtInt();
var LtEqInt = class extends CustomType {
};
var BinaryOperator$LtEqInt$const = new LtEqInt();
var LtFloat = class extends CustomType {
};
var BinaryOperator$LtFloat$const = new LtFloat();
var LtEqFloat = class extends CustomType {
};
var BinaryOperator$LtEqFloat$const = new LtEqFloat();
var GtEqInt = class extends CustomType {
};
var BinaryOperator$GtEqInt$const = new GtEqInt();
var GtInt = class extends CustomType {
};
var BinaryOperator$GtInt$const = new GtInt();
var GtEqFloat = class extends CustomType {
};
var BinaryOperator$GtEqFloat$const = new GtEqFloat();
var GtFloat = class extends CustomType {
};
var BinaryOperator$GtFloat$const = new GtFloat();
var Pipe2 = class extends CustomType {
};
var BinaryOperator$Pipe$const = new Pipe2();
var AddInt = class extends CustomType {
};
var BinaryOperator$AddInt$const = new AddInt();
var AddFloat = class extends CustomType {
};
var BinaryOperator$AddFloat$const = new AddFloat();
var SubInt = class extends CustomType {
};
var BinaryOperator$SubInt$const = new SubInt();
var SubFloat = class extends CustomType {
};
var BinaryOperator$SubFloat$const = new SubFloat();
var MultInt = class extends CustomType {
};
var BinaryOperator$MultInt$const = new MultInt();
var MultFloat = class extends CustomType {
};
var BinaryOperator$MultFloat$const = new MultFloat();
var DivInt = class extends CustomType {
};
var BinaryOperator$DivInt$const = new DivInt();
var DivFloat = class extends CustomType {
};
var BinaryOperator$DivFloat$const = new DivFloat();
var RemainderInt = class extends CustomType {
};
var BinaryOperator$RemainderInt$const = new RemainderInt();
var Concatenate = class extends CustomType {
};
var BinaryOperator$Concatenate$const = new Concatenate();
var FnParameter = class extends CustomType {
  constructor(name2, type_3) {
    super();
    this.name = name2;
    this.type_ = type_3;
  }
};
var FunctionParameter = class extends CustomType {
  constructor(label2, name2, type_3) {
    super();
    this.label = label2;
    this.name = name2;
    this.type_ = type_3;
  }
};
var Named = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Discarded = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Import2 = class extends CustomType {
  constructor(location, module2, alias, unqualified_types, unqualified_values) {
    super();
    this.location = location;
    this.module = module2;
    this.alias = alias;
    this.unqualified_types = unqualified_types;
    this.unqualified_values = unqualified_values;
  }
};
var Constant = class extends CustomType {
  constructor(location, name2, publicity, annotation, value2) {
    super();
    this.location = location;
    this.name = name2;
    this.publicity = publicity;
    this.annotation = annotation;
    this.value = value2;
  }
};
var UnqualifiedImport = class extends CustomType {
  constructor(name2, alias) {
    super();
    this.name = name2;
    this.alias = alias;
  }
};
var Public = class extends CustomType {
};
var Publicity$Public$const = new Public();
var Private = class extends CustomType {
};
var Publicity$Private$const = new Private();
var TypeAlias = class extends CustomType {
  constructor(location, name2, publicity, parameters, aliased) {
    super();
    this.location = location;
    this.name = name2;
    this.publicity = publicity;
    this.parameters = parameters;
    this.aliased = aliased;
  }
};
var CustomType2 = class extends CustomType {
  constructor(location, name2, publicity, opaque_, parameters, variants2) {
    super();
    this.location = location;
    this.name = name2;
    this.publicity = publicity;
    this.opaque_ = opaque_;
    this.parameters = parameters;
    this.variants = variants2;
  }
};
var Variant = class extends CustomType {
  constructor(name2, fields, attributes2) {
    super();
    this.name = name2;
    this.fields = fields;
    this.attributes = attributes2;
  }
};
var RecordUpdateField = class extends CustomType {
  constructor(label2, item) {
    super();
    this.label = label2;
    this.item = item;
  }
};
var LabelledVariantField = class extends CustomType {
  constructor(item, label2) {
    super();
    this.item = item;
    this.label = label2;
  }
};
var UnlabelledVariantField = class extends CustomType {
  constructor(item) {
    super();
    this.item = item;
  }
};
var LabelledField = class extends CustomType {
  constructor(label2, label_location, item) {
    super();
    this.label = label2;
    this.label_location = label_location;
    this.item = item;
  }
};
var ShorthandField = class extends CustomType {
  constructor(label2, location) {
    super();
    this.label = label2;
    this.location = location;
  }
};
var UnlabelledField = class extends CustomType {
  constructor(item) {
    super();
    this.item = item;
  }
};
var NamedType = class extends CustomType {
  constructor(location, name2, module2, parameters) {
    super();
    this.location = location;
    this.name = name2;
    this.module = module2;
    this.parameters = parameters;
  }
};
var TupleType = class extends CustomType {
  constructor(location, elements) {
    super();
    this.location = location;
    this.elements = elements;
  }
};
var FunctionType = class extends CustomType {
  constructor(location, parameters, return$) {
    super();
    this.location = location;
    this.parameters = parameters;
    this.return = return$;
  }
};
var VariableType = class extends CustomType {
  constructor(location, name2) {
    super();
    this.location = location;
    this.name = name2;
  }
};
var HoleType = class extends CustomType {
  constructor(location, name2) {
    super();
    this.location = location;
    this.name = name2;
  }
};
var UnexpectedEndOfInput2 = class extends CustomType {
};
var Error$UnexpectedEndOfInput$const = new UnexpectedEndOfInput2();
var UnexpectedToken = class extends CustomType {
  constructor(token2, position) {
    super();
    this.token = token2;
    this.position = position;
  }
};
var UnqualifiedImports = class extends CustomType {
  constructor(types, values3, end, remaining_tokens) {
    super();
    this.types = types;
    this.values = values3;
    this.end = end;
    this.remaining_tokens = remaining_tokens;
  }
};
var PatternConstructorArguments = class extends CustomType {
  constructor(fields, spread, end, remaining_tokens) {
    super();
    this.fields = fields;
    this.spread = spread;
    this.end = end;
    this.remaining_tokens = remaining_tokens;
  }
};
var RegularExpressionUnit = class extends CustomType {
};
var ParseExpressionUnitContext$RegularExpressionUnit$const = new RegularExpressionUnit();
var ExpressionUnitAfterPipe = class extends CustomType {
};
var ParseExpressionUnitContext$ExpressionUnitAfterPipe$const = new ExpressionUnitAfterPipe();
var ParsedList = class extends CustomType {
  constructor(values3, spread, remaining_tokens, end) {
    super();
    this.values = values3;
    this.spread = spread;
    this.remaining_tokens = remaining_tokens;
    this.end = end;
  }
};
function precedence(operator) {
  if (operator instanceof And) {
    return 2;
  } else if (operator instanceof Or) {
    return 1;
  } else if (operator instanceof Eq2) {
    return 3;
  } else if (operator instanceof NotEq) {
    return 3;
  } else if (operator instanceof LtInt) {
    return 4;
  } else if (operator instanceof LtEqInt) {
    return 4;
  } else if (operator instanceof LtFloat) {
    return 4;
  } else if (operator instanceof LtEqFloat) {
    return 4;
  } else if (operator instanceof GtEqInt) {
    return 4;
  } else if (operator instanceof GtInt) {
    return 4;
  } else if (operator instanceof GtEqFloat) {
    return 4;
  } else if (operator instanceof GtFloat) {
    return 4;
  } else if (operator instanceof Pipe2) {
    return 6;
  } else if (operator instanceof AddInt) {
    return 7;
  } else if (operator instanceof AddFloat) {
    return 7;
  } else if (operator instanceof SubInt) {
    return 7;
  } else if (operator instanceof SubFloat) {
    return 7;
  } else if (operator instanceof MultInt) {
    return 8;
  } else if (operator instanceof MultFloat) {
    return 8;
  } else if (operator instanceof DivInt) {
    return 8;
  } else if (operator instanceof DivFloat) {
    return 8;
  } else if (operator instanceof RemainderInt) {
    return 8;
  } else {
    return 5;
  }
}
function unexpected_error(tokens) {
  if (tokens instanceof Empty) {
    return new Error(Error$UnexpectedEndOfInput$const);
  } else {
    let token2 = tokens.head[0];
    let position = tokens.head[1];
    return new Error(new UnexpectedToken(token2, position));
  }
}
function expect(expected, tokens, next2) {
  if (tokens instanceof Empty) {
    return new Error(Error$UnexpectedEndOfInput$const);
  } else {
    let token2 = tokens.head[0];
    if (isEqual(token2, expected)) {
      let tokens$1 = tokens.tail;
      let position = tokens.head[1];
      return next2(position, tokens$1);
    } else {
      let other = tokens.head[0];
      let position$1 = tokens.head[1];
      return new Error(new UnexpectedToken(other, position$1));
    }
  }
}
function list4(parser, discard, acc, tokens) {
  if (tokens instanceof Empty) {
    return try$(
      parser(tokens),
      (_use0) => {
        let element4 = _use0[0];
        let tokens$1 = _use0[1];
        let acc$1 = prepend(element4, acc);
        if (tokens$1 instanceof Empty) {
          return new Error(Error$UnexpectedEndOfInput$const);
        } else {
          let $ = tokens$1.head[0];
          if ($ instanceof RightSquare) {
            let tokens$2 = tokens$1.tail;
            let end = tokens$1.head[1].byte_offset;
            return new Ok(
              new ParsedList(
                reverse(acc$1),
                Option$None$const,
                tokens$2,
                end + 1
              )
            );
          } else if ($ instanceof Comma) {
            let $1 = tokens$1.tail;
            if ($1 instanceof Empty) {
              let tokens$2 = $1;
              return list4(parser, discard, acc$1, tokens$2);
            } else {
              let $2 = $1.head[0];
              if ($2 instanceof RightSquare) {
                let tokens$2 = $1.tail;
                let end = $1.head[1].byte_offset;
                return new Ok(
                  new ParsedList(
                    reverse(acc$1),
                    Option$None$const,
                    tokens$2,
                    end + 1
                  )
                );
              } else if ($2 instanceof DotDot) {
                let $3 = $1.tail;
                if ($3 instanceof Empty) {
                  let tokens$2 = $3;
                  return try$(
                    parser(tokens$2),
                    (_use02) => {
                      let rest = _use02[0];
                      let tokens$3 = _use02[1];
                      return expect(
                        Token$RightSquare$const,
                        tokens$3,
                        (_use03, tokens2) => {
                          let end = _use03.byte_offset;
                          return new Ok(
                            new ParsedList(
                              reverse(acc$1),
                              new Some(rest),
                              tokens2,
                              end + 1
                            )
                          );
                        }
                      );
                    }
                  );
                } else if ($3.head[0] instanceof RightSquare) {
                  let start5 = $1.head[1].byte_offset;
                  let close = $3.head;
                  let tokens$2 = $3.tail;
                  let end = $3.head[1].byte_offset;
                  if (discard instanceof Some) {
                    let discard$1 = discard[0];
                    let value2 = discard$1(new Span(start5, start5 + 1));
                    let parsed_list = new ParsedList(
                      reverse(acc$1),
                      new Some(value2),
                      tokens$2,
                      end + 1
                    );
                    return new Ok(parsed_list);
                  } else {
                    return unexpected_error(prepend(close, tokens$2));
                  }
                } else {
                  let tokens$2 = $3;
                  return try$(
                    parser(tokens$2),
                    (_use02) => {
                      let rest = _use02[0];
                      let tokens$3 = _use02[1];
                      return expect(
                        Token$RightSquare$const,
                        tokens$3,
                        (_use03, tokens2) => {
                          let end = _use03.byte_offset;
                          return new Ok(
                            new ParsedList(
                              reverse(acc$1),
                              new Some(rest),
                              tokens2,
                              end + 1
                            )
                          );
                        }
                      );
                    }
                  );
                }
              } else {
                let tokens$2 = $1;
                return list4(parser, discard, acc$1, tokens$2);
              }
            }
          } else {
            let other = $;
            let position = tokens$1.head[1];
            return new Error(new UnexpectedToken(other, position));
          }
        }
      }
    );
  } else {
    let $ = tokens.head[0];
    if ($ instanceof RightSquare) {
      let tokens$1 = tokens.tail;
      let end = tokens.head[1].byte_offset;
      return new Ok(
        new ParsedList(reverse(acc), Option$None$const, tokens$1, end + 1)
      );
    } else if ($ instanceof Comma) {
      let $1 = tokens.tail;
      if ($1 instanceof Empty) {
        return try$(
          parser(tokens),
          (_use0) => {
            let element4 = _use0[0];
            let tokens$1 = _use0[1];
            let acc$1 = prepend(element4, acc);
            if (tokens$1 instanceof Empty) {
              return new Error(Error$UnexpectedEndOfInput$const);
            } else {
              let $2 = tokens$1.head[0];
              if ($2 instanceof RightSquare) {
                let tokens$2 = tokens$1.tail;
                let end = tokens$1.head[1].byte_offset;
                return new Ok(
                  new ParsedList(
                    reverse(acc$1),
                    Option$None$const,
                    tokens$2,
                    end + 1
                  )
                );
              } else if ($2 instanceof Comma) {
                let $3 = tokens$1.tail;
                if ($3 instanceof Empty) {
                  let tokens$2 = $3;
                  return list4(parser, discard, acc$1, tokens$2);
                } else {
                  let $4 = $3.head[0];
                  if ($4 instanceof RightSquare) {
                    let tokens$2 = $3.tail;
                    let end = $3.head[1].byte_offset;
                    return new Ok(
                      new ParsedList(
                        reverse(acc$1),
                        Option$None$const,
                        tokens$2,
                        end + 1
                      )
                    );
                  } else if ($4 instanceof DotDot) {
                    let $5 = $3.tail;
                    if ($5 instanceof Empty) {
                      let tokens$2 = $5;
                      return try$(
                        parser(tokens$2),
                        (_use02) => {
                          let rest = _use02[0];
                          let tokens$3 = _use02[1];
                          return expect(
                            Token$RightSquare$const,
                            tokens$3,
                            (_use03, tokens2) => {
                              let end = _use03.byte_offset;
                              return new Ok(
                                new ParsedList(
                                  reverse(acc$1),
                                  new Some(rest),
                                  tokens2,
                                  end + 1
                                )
                              );
                            }
                          );
                        }
                      );
                    } else if ($5.head[0] instanceof RightSquare) {
                      let start5 = $3.head[1].byte_offset;
                      let close = $5.head;
                      let tokens$2 = $5.tail;
                      let end = $5.head[1].byte_offset;
                      if (discard instanceof Some) {
                        let discard$1 = discard[0];
                        let value2 = discard$1(new Span(start5, start5 + 1));
                        let parsed_list = new ParsedList(
                          reverse(acc$1),
                          new Some(value2),
                          tokens$2,
                          end + 1
                        );
                        return new Ok(parsed_list);
                      } else {
                        return unexpected_error(prepend(close, tokens$2));
                      }
                    } else {
                      let tokens$2 = $5;
                      return try$(
                        parser(tokens$2),
                        (_use02) => {
                          let rest = _use02[0];
                          let tokens$3 = _use02[1];
                          return expect(
                            Token$RightSquare$const,
                            tokens$3,
                            (_use03, tokens2) => {
                              let end = _use03.byte_offset;
                              return new Ok(
                                new ParsedList(
                                  reverse(acc$1),
                                  new Some(rest),
                                  tokens2,
                                  end + 1
                                )
                              );
                            }
                          );
                        }
                      );
                    }
                  } else {
                    let tokens$2 = $3;
                    return list4(parser, discard, acc$1, tokens$2);
                  }
                }
              } else {
                let other = $2;
                let position = tokens$1.head[1];
                return new Error(new UnexpectedToken(other, position));
              }
            }
          }
        );
      } else if ($1.head[0] instanceof RightSquare && !(acc instanceof Empty)) {
        let tokens$1 = $1.tail;
        let end = $1.head[1].byte_offset;
        return new Ok(
          new ParsedList(
            reverse(acc),
            Option$None$const,
            tokens$1,
            end + 1
          )
        );
      } else {
        return try$(
          parser(tokens),
          (_use0) => {
            let element4 = _use0[0];
            let tokens$1 = _use0[1];
            let acc$1 = prepend(element4, acc);
            if (tokens$1 instanceof Empty) {
              return new Error(Error$UnexpectedEndOfInput$const);
            } else {
              let $2 = tokens$1.head[0];
              if ($2 instanceof RightSquare) {
                let tokens$2 = tokens$1.tail;
                let end = tokens$1.head[1].byte_offset;
                return new Ok(
                  new ParsedList(
                    reverse(acc$1),
                    Option$None$const,
                    tokens$2,
                    end + 1
                  )
                );
              } else if ($2 instanceof Comma) {
                let $3 = tokens$1.tail;
                if ($3 instanceof Empty) {
                  let tokens$2 = $3;
                  return list4(parser, discard, acc$1, tokens$2);
                } else {
                  let $4 = $3.head[0];
                  if ($4 instanceof RightSquare) {
                    let tokens$2 = $3.tail;
                    let end = $3.head[1].byte_offset;
                    return new Ok(
                      new ParsedList(
                        reverse(acc$1),
                        Option$None$const,
                        tokens$2,
                        end + 1
                      )
                    );
                  } else if ($4 instanceof DotDot) {
                    let $5 = $3.tail;
                    if ($5 instanceof Empty) {
                      let tokens$2 = $5;
                      return try$(
                        parser(tokens$2),
                        (_use02) => {
                          let rest = _use02[0];
                          let tokens$3 = _use02[1];
                          return expect(
                            Token$RightSquare$const,
                            tokens$3,
                            (_use03, tokens2) => {
                              let end = _use03.byte_offset;
                              return new Ok(
                                new ParsedList(
                                  reverse(acc$1),
                                  new Some(rest),
                                  tokens2,
                                  end + 1
                                )
                              );
                            }
                          );
                        }
                      );
                    } else if ($5.head[0] instanceof RightSquare) {
                      let start5 = $3.head[1].byte_offset;
                      let close = $5.head;
                      let tokens$2 = $5.tail;
                      let end = $5.head[1].byte_offset;
                      if (discard instanceof Some) {
                        let discard$1 = discard[0];
                        let value2 = discard$1(new Span(start5, start5 + 1));
                        let parsed_list = new ParsedList(
                          reverse(acc$1),
                          new Some(value2),
                          tokens$2,
                          end + 1
                        );
                        return new Ok(parsed_list);
                      } else {
                        return unexpected_error(prepend(close, tokens$2));
                      }
                    } else {
                      let tokens$2 = $5;
                      return try$(
                        parser(tokens$2),
                        (_use02) => {
                          let rest = _use02[0];
                          let tokens$3 = _use02[1];
                          return expect(
                            Token$RightSquare$const,
                            tokens$3,
                            (_use03, tokens2) => {
                              let end = _use03.byte_offset;
                              return new Ok(
                                new ParsedList(
                                  reverse(acc$1),
                                  new Some(rest),
                                  tokens2,
                                  end + 1
                                )
                              );
                            }
                          );
                        }
                      );
                    }
                  } else {
                    let tokens$2 = $3;
                    return list4(parser, discard, acc$1, tokens$2);
                  }
                }
              } else {
                let other = $2;
                let position = tokens$1.head[1];
                return new Error(new UnexpectedToken(other, position));
              }
            }
          }
        );
      }
    } else if ($ instanceof DotDot) {
      let $1 = tokens.tail;
      if ($1 instanceof Empty) {
        let tokens$1 = $1;
        return try$(
          parser(tokens$1),
          (_use0) => {
            let rest = _use0[0];
            let tokens$2 = _use0[1];
            return expect(
              Token$RightSquare$const,
              tokens$2,
              (_use02, tokens2) => {
                let end = _use02.byte_offset;
                return new Ok(
                  new ParsedList(
                    reverse(acc),
                    new Some(rest),
                    tokens2,
                    end + 1
                  )
                );
              }
            );
          }
        );
      } else if ($1.head[0] instanceof RightSquare) {
        let start5 = tokens.head[1].byte_offset;
        let close = $1.head;
        let tokens$1 = $1.tail;
        let end = $1.head[1].byte_offset;
        if (discard instanceof Some) {
          let discard$1 = discard[0];
          let value2 = discard$1(new Span(start5, start5 + 1));
          let parsed_list = new ParsedList(
            reverse(acc),
            new Some(value2),
            tokens$1,
            end + 1
          );
          return new Ok(parsed_list);
        } else {
          return unexpected_error(prepend(close, tokens$1));
        }
      } else {
        let tokens$1 = $1;
        return try$(
          parser(tokens$1),
          (_use0) => {
            let rest = _use0[0];
            let tokens$2 = _use0[1];
            return expect(
              Token$RightSquare$const,
              tokens$2,
              (_use02, tokens2) => {
                let end = _use02.byte_offset;
                return new Ok(
                  new ParsedList(
                    reverse(acc),
                    new Some(rest),
                    tokens2,
                    end + 1
                  )
                );
              }
            );
          }
        );
      }
    } else {
      return try$(
        parser(tokens),
        (_use0) => {
          let element4 = _use0[0];
          let tokens$1 = _use0[1];
          let acc$1 = prepend(element4, acc);
          if (tokens$1 instanceof Empty) {
            return new Error(Error$UnexpectedEndOfInput$const);
          } else {
            let $1 = tokens$1.head[0];
            if ($1 instanceof RightSquare) {
              let tokens$2 = tokens$1.tail;
              let end = tokens$1.head[1].byte_offset;
              return new Ok(
                new ParsedList(
                  reverse(acc$1),
                  Option$None$const,
                  tokens$2,
                  end + 1
                )
              );
            } else if ($1 instanceof Comma) {
              let $2 = tokens$1.tail;
              if ($2 instanceof Empty) {
                let tokens$2 = $2;
                return list4(parser, discard, acc$1, tokens$2);
              } else {
                let $3 = $2.head[0];
                if ($3 instanceof RightSquare) {
                  let tokens$2 = $2.tail;
                  let end = $2.head[1].byte_offset;
                  return new Ok(
                    new ParsedList(
                      reverse(acc$1),
                      Option$None$const,
                      tokens$2,
                      end + 1
                    )
                  );
                } else if ($3 instanceof DotDot) {
                  let $4 = $2.tail;
                  if ($4 instanceof Empty) {
                    let tokens$2 = $4;
                    return try$(
                      parser(tokens$2),
                      (_use02) => {
                        let rest = _use02[0];
                        let tokens$3 = _use02[1];
                        return expect(
                          Token$RightSquare$const,
                          tokens$3,
                          (_use03, tokens2) => {
                            let end = _use03.byte_offset;
                            return new Ok(
                              new ParsedList(
                                reverse(acc$1),
                                new Some(rest),
                                tokens2,
                                end + 1
                              )
                            );
                          }
                        );
                      }
                    );
                  } else if ($4.head[0] instanceof RightSquare) {
                    let start5 = $2.head[1].byte_offset;
                    let close = $4.head;
                    let tokens$2 = $4.tail;
                    let end = $4.head[1].byte_offset;
                    if (discard instanceof Some) {
                      let discard$1 = discard[0];
                      let value2 = discard$1(new Span(start5, start5 + 1));
                      let parsed_list = new ParsedList(
                        reverse(acc$1),
                        new Some(value2),
                        tokens$2,
                        end + 1
                      );
                      return new Ok(parsed_list);
                    } else {
                      return unexpected_error(prepend(close, tokens$2));
                    }
                  } else {
                    let tokens$2 = $4;
                    return try$(
                      parser(tokens$2),
                      (_use02) => {
                        let rest = _use02[0];
                        let tokens$3 = _use02[1];
                        return expect(
                          Token$RightSquare$const,
                          tokens$3,
                          (_use03, tokens2) => {
                            let end = _use03.byte_offset;
                            return new Ok(
                              new ParsedList(
                                reverse(acc$1),
                                new Some(rest),
                                tokens2,
                                end + 1
                              )
                            );
                          }
                        );
                      }
                    );
                  }
                } else {
                  let tokens$2 = $2;
                  return list4(parser, discard, acc$1, tokens$2);
                }
              }
            } else {
              let other = $1;
              let position = tokens$1.head[1];
              return new Error(new UnexpectedToken(other, position));
            }
          }
        }
      );
    }
  }
}
function push_function(module2, attributes2, function$) {
  return new Module(
    module2.imports,
    module2.custom_types,
    module2.type_aliases,
    module2.constants,
    prepend(
      new Definition(reverse(attributes2), function$),
      module2.functions
    )
  );
}
function handle_operator(loop$next, loop$operators, loop$values) {
  while (true) {
    let next2 = loop$next;
    let operators = loop$operators;
    let values3 = loop$values;
    if (next2 instanceof Some) {
      if (operators instanceof Empty) {
        let operator = next2[0];
        return [
          Option$None$const,
          prepend(operator, List$Empty$const),
          values3
        ];
      } else if (values3 instanceof Empty) {
        throw makeError(
          "panic",
          FILEPATH,
          "glance",
          1185,
          "handle_operator",
          "parser bug, expression not full reduced",
          {}
        );
      } else {
        let $ = values3.tail;
        if ($ instanceof Empty) {
          throw makeError(
            "panic",
            FILEPATH,
            "glance",
            1185,
            "handle_operator",
            "parser bug, expression not full reduced",
            {}
          );
        } else {
          let next$1 = next2[0];
          let previous = operators.head;
          let operators$1 = operators.tail;
          let a = values3.head;
          let b = $.head;
          let rest_values = $.tail;
          let $1 = precedence(previous) >= precedence(next$1);
          if ($1) {
            let span2 = new Span(b.location.start, a.location.end);
            let expression$1 = new BinaryOperator(span2, previous, b, a);
            let values$1 = prepend(expression$1, rest_values);
            loop$next = new Some(next$1);
            loop$operators = operators$1;
            loop$values = values$1;
          } else {
            return [
              Option$None$const,
              prepend(next$1, prepend(previous, operators$1)),
              values3
            ];
          }
        }
      }
    } else if (operators instanceof Empty) {
      if (values3 instanceof Empty) {
        return [Option$None$const, operators, values3];
      } else if (values3.tail instanceof Empty) {
        let expression$1 = values3.head;
        return [new Some(expression$1), operators, values3];
      } else {
        throw makeError(
          "panic",
          FILEPATH,
          "glance",
          1185,
          "handle_operator",
          "parser bug, expression not full reduced",
          {}
        );
      }
    } else if (values3 instanceof Empty) {
      throw makeError(
        "panic",
        FILEPATH,
        "glance",
        1185,
        "handle_operator",
        "parser bug, expression not full reduced",
        {}
      );
    } else {
      let $ = values3.tail;
      if ($ instanceof Empty) {
        throw makeError(
          "panic",
          FILEPATH,
          "glance",
          1185,
          "handle_operator",
          "parser bug, expression not full reduced",
          {}
        );
      } else {
        let operator = operators.head;
        let operators$1 = operators.tail;
        let a = values3.head;
        let b = $.head;
        let values$1 = $.tail;
        let values$2 = prepend(
          new BinaryOperator(
            new Span(b.location.start, a.location.end),
            operator,
            b,
            a
          ),
          values$1
        );
        loop$next = Option$None$const;
        loop$operators = operators$1;
        loop$values = values$2;
      }
    }
  }
}
function binary_operator(token2) {
  if (token2 instanceof Plus) {
    return new Ok(BinaryOperator$AddInt$const);
  } else if (token2 instanceof Minus) {
    return new Ok(BinaryOperator$SubInt$const);
  } else if (token2 instanceof Star) {
    return new Ok(BinaryOperator$MultInt$const);
  } else if (token2 instanceof Slash) {
    return new Ok(BinaryOperator$DivInt$const);
  } else if (token2 instanceof Less) {
    return new Ok(BinaryOperator$LtInt$const);
  } else if (token2 instanceof Greater) {
    return new Ok(BinaryOperator$GtInt$const);
  } else if (token2 instanceof LessEqual) {
    return new Ok(BinaryOperator$LtEqInt$const);
  } else if (token2 instanceof GreaterEqual) {
    return new Ok(BinaryOperator$GtEqInt$const);
  } else if (token2 instanceof Percent) {
    return new Ok(BinaryOperator$RemainderInt$const);
  } else if (token2 instanceof PlusDot) {
    return new Ok(BinaryOperator$AddFloat$const);
  } else if (token2 instanceof MinusDot) {
    return new Ok(BinaryOperator$SubFloat$const);
  } else if (token2 instanceof StarDot) {
    return new Ok(BinaryOperator$MultFloat$const);
  } else if (token2 instanceof SlashDot) {
    return new Ok(BinaryOperator$DivFloat$const);
  } else if (token2 instanceof LessDot) {
    return new Ok(BinaryOperator$LtFloat$const);
  } else if (token2 instanceof GreaterDot) {
    return new Ok(BinaryOperator$GtFloat$const);
  } else if (token2 instanceof LessEqualDot) {
    return new Ok(BinaryOperator$LtEqFloat$const);
  } else if (token2 instanceof GreaterEqualDot) {
    return new Ok(BinaryOperator$GtEqFloat$const);
  } else if (token2 instanceof LessGreater) {
    return new Ok(BinaryOperator$Concatenate$const);
  } else if (token2 instanceof EqualEqual) {
    return new Ok(BinaryOperator$Eq$const);
  } else if (token2 instanceof NotEqual) {
    return new Ok(BinaryOperator$NotEq$const);
  } else if (token2 instanceof VBarVBar) {
    return new Ok(BinaryOperator$Or$const);
  } else if (token2 instanceof AmperAmper) {
    return new Ok(BinaryOperator$And$const);
  } else if (token2 instanceof Pipe) {
    return new Ok(BinaryOperator$Pipe$const);
  } else {
    return new Error(void 0);
  }
}
function pop_binary_operator(tokens) {
  if (tokens instanceof Empty) {
    return new Error(void 0);
  } else {
    let tokens$1 = tokens.tail;
    let token2 = tokens.head[0];
    return map4(
      binary_operator(token2),
      (op) => {
        return [op, tokens$1];
      }
    );
  }
}
function field2(tokens, parser) {
  if (tokens instanceof Empty) {
    return try$(
      parser(tokens),
      (_use0) => {
        let t = _use0[0];
        let tokens$1 = _use0[1];
        return new Ok([new UnlabelledField(t), tokens$1]);
      }
    );
  } else {
    let $ = tokens.tail;
    if ($ instanceof Empty) {
      return try$(
        parser(tokens),
        (_use0) => {
          let t = _use0[0];
          let tokens$1 = _use0[1];
          return new Ok([new UnlabelledField(t), tokens$1]);
        }
      );
    } else {
      let $1 = tokens.head[0];
      if ($1 instanceof Name && $.head[0] instanceof Colon) {
        let start5 = tokens.head[1];
        let tokens$1 = $.tail;
        let end = $.head[1];
        let name$1 = $1[0];
        if (tokens$1 instanceof Empty) {
          return try$(
            parser(tokens$1),
            (_use0) => {
              let t = _use0[0];
              let tokens$2 = _use0[1];
              return new Ok(
                [
                  new LabelledField(
                    name$1,
                    new Span(start5.byte_offset, end.byte_offset + 1),
                    t
                  ),
                  tokens$2
                ]
              );
            }
          );
        } else {
          let $2 = tokens$1.head[0];
          if ($2 instanceof RightParen) {
            return new Ok(
              [
                new ShorthandField(
                  name$1,
                  new Span(start5.byte_offset, end.byte_offset + 1)
                ),
                tokens$1
              ]
            );
          } else if ($2 instanceof Comma) {
            return new Ok(
              [
                new ShorthandField(
                  name$1,
                  new Span(start5.byte_offset, end.byte_offset + 1)
                ),
                tokens$1
              ]
            );
          } else {
            return try$(
              parser(tokens$1),
              (_use0) => {
                let t = _use0[0];
                let tokens$2 = _use0[1];
                return new Ok(
                  [
                    new LabelledField(
                      name$1,
                      new Span(start5.byte_offset, end.byte_offset + 1),
                      t
                    ),
                    tokens$2
                  ]
                );
              }
            );
          }
        }
      } else {
        return try$(
          parser(tokens),
          (_use0) => {
            let t = _use0[0];
            let tokens$1 = _use0[1];
            return new Ok([new UnlabelledField(t), tokens$1]);
          }
        );
      }
    }
  }
}
function string_offset(start5, string5) {
  return start5 + byte_size(string5);
}
function span_from_string(start5, string5) {
  return new Span(start5, start5 + byte_size(string5));
}
function comma_delimited(items, tokens, parser, final) {
  if (tokens instanceof Empty) {
    return new Error(Error$UnexpectedEndOfInput$const);
  } else {
    let token2 = tokens.head[0];
    if (isEqual(token2, final)) {
      let tokens$1 = tokens.tail;
      let token_start = tokens.head[1].byte_offset;
      return new Ok(
        [
          reverse(items),
          string_offset(token_start, to_source(token2)),
          tokens$1
        ]
      );
    } else {
      return try$(
        parser(tokens),
        (_use0) => {
          let element4 = _use0[0];
          let tokens$2 = _use0[1];
          if (tokens$2 instanceof Empty) {
            return new Error(Error$UnexpectedEndOfInput$const);
          } else {
            let $ = tokens$2.head[0];
            if ($ instanceof Comma) {
              let tokens$3 = tokens$2.tail;
              return comma_delimited(
                prepend(element4, items),
                tokens$3,
                parser,
                final
              );
            } else {
              let token$1 = $;
              if (isEqual(token$1, final)) {
                let tokens$3 = tokens$2.tail;
                let token_start$1 = tokens$2.head[1].byte_offset;
                let offset = string_offset(token_start$1, to_source(token$1));
                return new Ok(
                  [reverse(prepend(element4, items)), offset, tokens$3]
                );
              } else {
                let other = $;
                let position = tokens$2.head[1];
                return new Error(new UnexpectedToken(other, position));
              }
            }
          }
        }
      );
    }
  }
}
function bit_string_segment_options(parser, options, tokens) {
  return try$(
    (() => {
      if (tokens instanceof Empty) {
        return new Error(Error$UnexpectedEndOfInput$const);
      } else {
        let $ = tokens.head[0];
        if ($ instanceof Name) {
          let $1 = tokens.tail;
          if ($1 instanceof Empty) {
            let $2 = $[0];
            if ($2 === "bytes") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$BytesOption$const, tokens$1]
              );
            } else if ($2 === "binary") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$BytesOption$const, tokens$1]
              );
            } else if ($2 === "int") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$IntOption$const, tokens$1]);
            } else if ($2 === "float") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$FloatOption$const, tokens$1]
              );
            } else if ($2 === "bits") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$BitsOption$const, tokens$1]);
            } else if ($2 === "bit_string") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$BitsOption$const, tokens$1]);
            } else if ($2 === "utf8") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$Utf8Option$const, tokens$1]);
            } else if ($2 === "utf16") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf16Option$const, tokens$1]
              );
            } else if ($2 === "utf32") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf32Option$const, tokens$1]
              );
            } else if ($2 === "utf8_codepoint") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf8CodepointOption$const, tokens$1]
              );
            } else if ($2 === "utf16_codepoint") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf16CodepointOption$const, tokens$1]
              );
            } else if ($2 === "utf32_codepoint") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf32CodepointOption$const, tokens$1]
              );
            } else if ($2 === "signed") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$SignedOption$const, tokens$1]
              );
            } else if ($2 === "unsigned") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$UnsignedOption$const, tokens$1]
              );
            } else if ($2 === "big") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$BigOption$const, tokens$1]);
            } else if ($2 === "little") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$LittleOption$const, tokens$1]
              );
            } else if ($2 === "native") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$NativeOption$const, tokens$1]
              );
            } else {
              let other = $;
              let position = tokens.head[1];
              return new Error(new UnexpectedToken(other, position));
            }
          } else if ($1.head[0] instanceof LeftParen) {
            let $2 = $[0];
            if ($2 === "size") {
              let tokens$1 = $1.tail;
              return try$(
                parser(tokens$1),
                (_use0) => {
                  let value2 = _use0[0];
                  let tokens$2 = _use0[1];
                  return expect(
                    Token$RightParen$const,
                    tokens$2,
                    (_, tokens2) => {
                      return new Ok([new SizeValueOption(value2), tokens2]);
                    }
                  );
                }
              );
            } else if ($2 === "unit") {
              let $3 = $1.tail;
              if ($3 instanceof Empty) {
                let other = $;
                let position = tokens.head[1];
                return new Error(new UnexpectedToken(other, position));
              } else {
                let $4 = $3.tail;
                if ($4 instanceof Empty) {
                  let other = $;
                  let position = tokens.head[1];
                  return new Error(new UnexpectedToken(other, position));
                } else {
                  let $5 = $3.head[0];
                  if ($5 instanceof Int && $4.head[0] instanceof RightParen) {
                    let position = tokens.head[1];
                    let tokens$1 = $4.tail;
                    let i = $5[0];
                    let $6 = parse_int(i);
                    if ($6 instanceof Ok) {
                      let i$1 = $6[0];
                      return new Ok([new UnitOption(i$1), tokens$1]);
                    } else {
                      return new Error(
                        new UnexpectedToken(new Int(i), position)
                      );
                    }
                  } else {
                    let other = $;
                    let position = tokens.head[1];
                    return new Error(new UnexpectedToken(other, position));
                  }
                }
              }
            } else if ($2 === "bytes") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$BytesOption$const, tokens$1]
              );
            } else if ($2 === "binary") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$BytesOption$const, tokens$1]
              );
            } else if ($2 === "int") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$IntOption$const, tokens$1]);
            } else if ($2 === "float") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$FloatOption$const, tokens$1]
              );
            } else if ($2 === "bits") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$BitsOption$const, tokens$1]);
            } else if ($2 === "bit_string") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$BitsOption$const, tokens$1]);
            } else if ($2 === "utf8") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$Utf8Option$const, tokens$1]);
            } else if ($2 === "utf16") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf16Option$const, tokens$1]
              );
            } else if ($2 === "utf32") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf32Option$const, tokens$1]
              );
            } else if ($2 === "utf8_codepoint") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf8CodepointOption$const, tokens$1]
              );
            } else if ($2 === "utf16_codepoint") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf16CodepointOption$const, tokens$1]
              );
            } else if ($2 === "utf32_codepoint") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf32CodepointOption$const, tokens$1]
              );
            } else if ($2 === "signed") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$SignedOption$const, tokens$1]
              );
            } else if ($2 === "unsigned") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$UnsignedOption$const, tokens$1]
              );
            } else if ($2 === "big") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$BigOption$const, tokens$1]);
            } else if ($2 === "little") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$LittleOption$const, tokens$1]
              );
            } else if ($2 === "native") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$NativeOption$const, tokens$1]
              );
            } else {
              let other = $;
              let position = tokens.head[1];
              return new Error(new UnexpectedToken(other, position));
            }
          } else {
            let $2 = $[0];
            if ($2 === "bytes") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$BytesOption$const, tokens$1]
              );
            } else if ($2 === "binary") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$BytesOption$const, tokens$1]
              );
            } else if ($2 === "int") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$IntOption$const, tokens$1]);
            } else if ($2 === "float") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$FloatOption$const, tokens$1]
              );
            } else if ($2 === "bits") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$BitsOption$const, tokens$1]);
            } else if ($2 === "bit_string") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$BitsOption$const, tokens$1]);
            } else if ($2 === "utf8") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$Utf8Option$const, tokens$1]);
            } else if ($2 === "utf16") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf16Option$const, tokens$1]
              );
            } else if ($2 === "utf32") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf32Option$const, tokens$1]
              );
            } else if ($2 === "utf8_codepoint") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf8CodepointOption$const, tokens$1]
              );
            } else if ($2 === "utf16_codepoint") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf16CodepointOption$const, tokens$1]
              );
            } else if ($2 === "utf32_codepoint") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$Utf32CodepointOption$const, tokens$1]
              );
            } else if ($2 === "signed") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$SignedOption$const, tokens$1]
              );
            } else if ($2 === "unsigned") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$UnsignedOption$const, tokens$1]
              );
            } else if ($2 === "big") {
              let tokens$1 = $1;
              return new Ok([BitStringSegmentOption$BigOption$const, tokens$1]);
            } else if ($2 === "little") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$LittleOption$const, tokens$1]
              );
            } else if ($2 === "native") {
              let tokens$1 = $1;
              return new Ok(
                [BitStringSegmentOption$NativeOption$const, tokens$1]
              );
            } else {
              let other = $;
              let position = tokens.head[1];
              return new Error(new UnexpectedToken(other, position));
            }
          }
        } else if ($ instanceof Int) {
          let tokens$1 = tokens.tail;
          let position = tokens.head[1];
          let i = $[0];
          let $1 = parse_int(i);
          if ($1 instanceof Ok) {
            let i$1 = $1[0];
            return new Ok([new SizeOption(i$1), tokens$1]);
          } else {
            return new Error(new UnexpectedToken(new Int(i), position));
          }
        } else {
          let other = $;
          let position = tokens.head[1];
          return new Error(new UnexpectedToken(other, position));
        }
      }
    })(),
    (_use0) => {
      let option2 = _use0[0];
      let tokens$1 = _use0[1];
      let options$1 = prepend(option2, options);
      if (tokens$1 instanceof Empty) {
        return new Ok([reverse(options$1), tokens$1]);
      } else if (tokens$1.head[0] instanceof Minus) {
        let tokens$2 = tokens$1.tail;
        return bit_string_segment_options(parser, options$1, tokens$2);
      } else {
        return new Ok([reverse(options$1), tokens$1]);
      }
    }
  );
}
function optional_bit_string_segment_options(parser, tokens) {
  if (tokens instanceof Empty) {
    return new Ok([List$Empty$const, tokens]);
  } else if (tokens.head[0] instanceof Colon) {
    let tokens$1 = tokens.tail;
    return bit_string_segment_options(parser, List$Empty$const, tokens$1);
  } else {
    return new Ok([List$Empty$const, tokens]);
  }
}
function bit_string_segment(parser, tokens) {
  return try$(
    parser(tokens),
    (_use0) => {
      let value2 = _use0[0];
      let tokens$1 = _use0[1];
      let result = optional_bit_string_segment_options(parser, tokens$1);
      return try$(
        result,
        (_use02) => {
          let options = _use02[0];
          let tokens$2 = _use02[1];
          return new Ok([[value2, options], tokens$2]);
        }
      );
    }
  );
}
function delimited(acc, tokens, parser, delimeter) {
  return try$(
    parser(tokens),
    (_use0) => {
      let t = _use0[0];
      let tokens$1 = _use0[1];
      let acc$1 = prepend(t, acc);
      if (tokens$1 instanceof Empty) {
        return new Ok([reverse(acc$1), tokens$1]);
      } else {
        let token2 = tokens$1.head[0];
        if (isEqual(token2, delimeter)) {
          let tokens$2 = tokens$1.tail;
          return delimited(acc$1, tokens$2, parser, delimeter);
        } else {
          return new Ok([reverse(acc$1), tokens$1]);
        }
      }
    }
  );
}
function pattern_constructor_arguments(arguments$, tokens) {
  if (tokens instanceof Empty) {
    let tokens$1 = tokens;
    return try$(
      field2(tokens$1, pattern),
      (_use0) => {
        let pattern$1 = _use0[0];
        let tokens$2 = _use0[1];
        let arguments$1 = prepend(pattern$1, arguments$);
        if (tokens$2 instanceof Empty) {
          return new Error(Error$UnexpectedEndOfInput$const);
        } else {
          let $ = tokens$2.head[0];
          if ($ instanceof RightParen) {
            let tokens$3 = tokens$2.tail;
            let end = tokens$2.head[1].byte_offset;
            return new Ok(
              new PatternConstructorArguments(
                arguments$1,
                false,
                end + 1,
                tokens$3
              )
            );
          } else if ($ instanceof Comma) {
            let $1 = tokens$2.tail;
            if ($1 instanceof Empty) {
              let tokens$3 = $1;
              return pattern_constructor_arguments(arguments$1, tokens$3);
            } else {
              let $2 = $1.tail;
              if ($2 instanceof Empty) {
                let tokens$3 = $1;
                return pattern_constructor_arguments(arguments$1, tokens$3);
              } else if ($1.head[0] instanceof DotDot && $2.head[0] instanceof RightParen) {
                let tokens$3 = $2.tail;
                let end = $2.head[1].byte_offset;
                return new Ok(
                  new PatternConstructorArguments(
                    arguments$1,
                    true,
                    end + 1,
                    tokens$3
                  )
                );
              } else {
                let tokens$3 = $1;
                return pattern_constructor_arguments(arguments$1, tokens$3);
              }
            }
          } else {
            let token2 = $;
            let position = tokens$2.head[1];
            return new Error(new UnexpectedToken(token2, position));
          }
        }
      }
    );
  } else {
    let $ = tokens.head[0];
    if ($ instanceof RightParen) {
      let tokens$1 = tokens.tail;
      let end = tokens.head[1].byte_offset;
      return new Ok(
        new PatternConstructorArguments(arguments$, false, end + 1, tokens$1)
      );
    } else if ($ instanceof DotDot) {
      let $1 = tokens.tail;
      if ($1 instanceof Empty) {
        let tokens$1 = tokens;
        return try$(
          field2(tokens$1, pattern),
          (_use0) => {
            let pattern$1 = _use0[0];
            let tokens$2 = _use0[1];
            let arguments$1 = prepend(pattern$1, arguments$);
            if (tokens$2 instanceof Empty) {
              return new Error(Error$UnexpectedEndOfInput$const);
            } else {
              let $2 = tokens$2.head[0];
              if ($2 instanceof RightParen) {
                let tokens$3 = tokens$2.tail;
                let end = tokens$2.head[1].byte_offset;
                return new Ok(
                  new PatternConstructorArguments(
                    arguments$1,
                    false,
                    end + 1,
                    tokens$3
                  )
                );
              } else if ($2 instanceof Comma) {
                let $3 = tokens$2.tail;
                if ($3 instanceof Empty) {
                  let tokens$3 = $3;
                  return pattern_constructor_arguments(arguments$1, tokens$3);
                } else {
                  let $4 = $3.tail;
                  if ($4 instanceof Empty) {
                    let tokens$3 = $3;
                    return pattern_constructor_arguments(arguments$1, tokens$3);
                  } else if ($3.head[0] instanceof DotDot && $4.head[0] instanceof RightParen) {
                    let tokens$3 = $4.tail;
                    let end = $4.head[1].byte_offset;
                    return new Ok(
                      new PatternConstructorArguments(
                        arguments$1,
                        true,
                        end + 1,
                        tokens$3
                      )
                    );
                  } else {
                    let tokens$3 = $3;
                    return pattern_constructor_arguments(arguments$1, tokens$3);
                  }
                }
              } else {
                let token2 = $2;
                let position = tokens$2.head[1];
                return new Error(new UnexpectedToken(token2, position));
              }
            }
          }
        );
      } else {
        let $2 = $1.tail;
        if ($2 instanceof Empty) {
          if ($1.head[0] instanceof RightParen) {
            let tokens$1 = $2;
            let end = $1.head[1].byte_offset;
            return new Ok(
              new PatternConstructorArguments(
                arguments$,
                true,
                end + 1,
                tokens$1
              )
            );
          } else {
            let tokens$1 = tokens;
            return try$(
              field2(tokens$1, pattern),
              (_use0) => {
                let pattern$1 = _use0[0];
                let tokens$2 = _use0[1];
                let arguments$1 = prepend(pattern$1, arguments$);
                if (tokens$2 instanceof Empty) {
                  return new Error(Error$UnexpectedEndOfInput$const);
                } else {
                  let $3 = tokens$2.head[0];
                  if ($3 instanceof RightParen) {
                    let tokens$3 = tokens$2.tail;
                    let end = tokens$2.head[1].byte_offset;
                    return new Ok(
                      new PatternConstructorArguments(
                        arguments$1,
                        false,
                        end + 1,
                        tokens$3
                      )
                    );
                  } else if ($3 instanceof Comma) {
                    let $4 = tokens$2.tail;
                    if ($4 instanceof Empty) {
                      let tokens$3 = $4;
                      return pattern_constructor_arguments(
                        arguments$1,
                        tokens$3
                      );
                    } else {
                      let $5 = $4.tail;
                      if ($5 instanceof Empty) {
                        let tokens$3 = $4;
                        return pattern_constructor_arguments(
                          arguments$1,
                          tokens$3
                        );
                      } else if ($4.head[0] instanceof DotDot && $5.head[0] instanceof RightParen) {
                        let tokens$3 = $5.tail;
                        let end = $5.head[1].byte_offset;
                        return new Ok(
                          new PatternConstructorArguments(
                            arguments$1,
                            true,
                            end + 1,
                            tokens$3
                          )
                        );
                      } else {
                        let tokens$3 = $4;
                        return pattern_constructor_arguments(
                          arguments$1,
                          tokens$3
                        );
                      }
                    }
                  } else {
                    let token2 = $3;
                    let position = tokens$2.head[1];
                    return new Error(new UnexpectedToken(token2, position));
                  }
                }
              }
            );
          }
        } else {
          let $3 = $1.head[0];
          if ($3 instanceof RightParen) {
            let tokens$1 = $2;
            let end = $1.head[1].byte_offset;
            return new Ok(
              new PatternConstructorArguments(
                arguments$,
                true,
                end + 1,
                tokens$1
              )
            );
          } else if ($3 instanceof Comma && $2.head[0] instanceof RightParen) {
            let tokens$1 = $2.tail;
            let end = $2.head[1].byte_offset;
            return new Ok(
              new PatternConstructorArguments(
                arguments$,
                true,
                end + 1,
                tokens$1
              )
            );
          } else {
            let tokens$1 = tokens;
            return try$(
              field2(tokens$1, pattern),
              (_use0) => {
                let pattern$1 = _use0[0];
                let tokens$2 = _use0[1];
                let arguments$1 = prepend(pattern$1, arguments$);
                if (tokens$2 instanceof Empty) {
                  return new Error(Error$UnexpectedEndOfInput$const);
                } else {
                  let $4 = tokens$2.head[0];
                  if ($4 instanceof RightParen) {
                    let tokens$3 = tokens$2.tail;
                    let end = tokens$2.head[1].byte_offset;
                    return new Ok(
                      new PatternConstructorArguments(
                        arguments$1,
                        false,
                        end + 1,
                        tokens$3
                      )
                    );
                  } else if ($4 instanceof Comma) {
                    let $5 = tokens$2.tail;
                    if ($5 instanceof Empty) {
                      let tokens$3 = $5;
                      return pattern_constructor_arguments(
                        arguments$1,
                        tokens$3
                      );
                    } else {
                      let $6 = $5.tail;
                      if ($6 instanceof Empty) {
                        let tokens$3 = $5;
                        return pattern_constructor_arguments(
                          arguments$1,
                          tokens$3
                        );
                      } else if ($5.head[0] instanceof DotDot && $6.head[0] instanceof RightParen) {
                        let tokens$3 = $6.tail;
                        let end = $6.head[1].byte_offset;
                        return new Ok(
                          new PatternConstructorArguments(
                            arguments$1,
                            true,
                            end + 1,
                            tokens$3
                          )
                        );
                      } else {
                        let tokens$3 = $5;
                        return pattern_constructor_arguments(
                          arguments$1,
                          tokens$3
                        );
                      }
                    }
                  } else {
                    let token2 = $4;
                    let position = tokens$2.head[1];
                    return new Error(new UnexpectedToken(token2, position));
                  }
                }
              }
            );
          }
        }
      }
    } else {
      let tokens$1 = tokens;
      return try$(
        field2(tokens$1, pattern),
        (_use0) => {
          let pattern$1 = _use0[0];
          let tokens$2 = _use0[1];
          let arguments$1 = prepend(pattern$1, arguments$);
          if (tokens$2 instanceof Empty) {
            return new Error(Error$UnexpectedEndOfInput$const);
          } else {
            let $1 = tokens$2.head[0];
            if ($1 instanceof RightParen) {
              let tokens$3 = tokens$2.tail;
              let end = tokens$2.head[1].byte_offset;
              return new Ok(
                new PatternConstructorArguments(
                  arguments$1,
                  false,
                  end + 1,
                  tokens$3
                )
              );
            } else if ($1 instanceof Comma) {
              let $2 = tokens$2.tail;
              if ($2 instanceof Empty) {
                let tokens$3 = $2;
                return pattern_constructor_arguments(arguments$1, tokens$3);
              } else {
                let $3 = $2.tail;
                if ($3 instanceof Empty) {
                  let tokens$3 = $2;
                  return pattern_constructor_arguments(arguments$1, tokens$3);
                } else if ($2.head[0] instanceof DotDot && $3.head[0] instanceof RightParen) {
                  let tokens$3 = $3.tail;
                  let end = $3.head[1].byte_offset;
                  return new Ok(
                    new PatternConstructorArguments(
                      arguments$1,
                      true,
                      end + 1,
                      tokens$3
                    )
                  );
                } else {
                  let tokens$3 = $2;
                  return pattern_constructor_arguments(arguments$1, tokens$3);
                }
              }
            } else {
              let token2 = $1;
              let position = tokens$2.head[1];
              return new Error(new UnexpectedToken(token2, position));
            }
          }
        }
      );
    }
  }
}
function pattern_constructor(module2, constructor, tokens, start5, name_start) {
  if (tokens instanceof Empty) {
    let span2 = new Span(start5, string_offset(name_start, constructor));
    let pattern$1 = new PatternVariant(
      span2,
      module2,
      constructor,
      List$Empty$const,
      false
    );
    return new Ok([pattern$1, tokens]);
  } else if (tokens.head[0] instanceof LeftParen) {
    let tokens$1 = tokens.tail;
    let result = pattern_constructor_arguments(List$Empty$const, tokens$1);
    return try$(
      result,
      (_use0) => {
        let patterns = _use0.fields;
        let spread = _use0.spread;
        let end = _use0.end;
        let tokens$2 = _use0.remaining_tokens;
        let arguments$ = reverse(patterns);
        let pattern$1 = new PatternVariant(
          new Span(start5, end),
          module2,
          constructor,
          arguments$,
          spread
        );
        return new Ok([pattern$1, tokens$2]);
      }
    );
  } else {
    let span2 = new Span(start5, string_offset(name_start, constructor));
    let pattern$1 = new PatternVariant(
      span2,
      module2,
      constructor,
      List$Empty$const,
      false
    );
    return new Ok([pattern$1, tokens]);
  }
}
function pattern(tokens) {
  return try$(
    (() => {
      if (tokens instanceof Empty) {
        return new Error(Error$UnexpectedEndOfInput$const);
      } else {
        let $ = tokens.head[0];
        if ($ instanceof Name) {
          let $1 = tokens.tail;
          if ($1 instanceof Empty) {
            let tokens$1 = $1;
            let start5 = tokens.head[1].byte_offset;
            let name$1 = $[0];
            return new Ok(
              [
                new PatternVariable(span_from_string(start5, name$1), name$1),
                tokens$1
              ]
            );
          } else {
            let $2 = $1.tail;
            if ($2 instanceof Empty) {
              let tokens$1 = $1;
              let start5 = tokens.head[1].byte_offset;
              let name$1 = $[0];
              return new Ok(
                [
                  new PatternVariable(span_from_string(start5, name$1), name$1),
                  tokens$1
                ]
              );
            } else if ($1.head[0] instanceof Dot) {
              let $3 = $2.head[0];
              if ($3 instanceof UpperName) {
                let start5 = tokens.head[1].byte_offset;
                let module$1 = $[0];
                let tokens$1 = $2.tail;
                let name_start = $2.head[1].byte_offset;
                let name$1 = $3[0];
                return pattern_constructor(
                  new Some(module$1),
                  name$1,
                  tokens$1,
                  start5,
                  name_start
                );
              } else {
                let tokens$1 = $1;
                let start5 = tokens.head[1].byte_offset;
                let name$1 = $[0];
                return new Ok(
                  [
                    new PatternVariable(span_from_string(start5, name$1), name$1),
                    tokens$1
                  ]
                );
              }
            } else {
              let tokens$1 = $1;
              let start5 = tokens.head[1].byte_offset;
              let name$1 = $[0];
              return new Ok(
                [
                  new PatternVariable(span_from_string(start5, name$1), name$1),
                  tokens$1
                ]
              );
            }
          }
        } else if ($ instanceof UpperName) {
          let tokens$1 = tokens.tail;
          let start5 = tokens.head[1].byte_offset;
          let name$1 = $[0];
          return pattern_constructor(
            Option$None$const,
            name$1,
            tokens$1,
            start5,
            start5
          );
        } else if ($ instanceof DiscardName) {
          let tokens$1 = tokens.tail;
          let start5 = tokens.head[1].byte_offset;
          let name$1 = $[0];
          return new Ok(
            [
              new PatternDiscard(
                new Span(start5, string_offset(start5, name$1) + 1),
                name$1
              ),
              tokens$1
            ]
          );
        } else if ($ instanceof Int) {
          let tokens$1 = tokens.tail;
          let start5 = tokens.head[1].byte_offset;
          let value2 = $[0];
          return new Ok(
            [new PatternInt(span_from_string(start5, value2), value2), tokens$1]
          );
        } else if ($ instanceof Float) {
          let tokens$1 = tokens.tail;
          let start5 = tokens.head[1].byte_offset;
          let value2 = $[0];
          return new Ok(
            [new PatternFloat(span_from_string(start5, value2), value2), tokens$1]
          );
        } else if ($ instanceof String2) {
          let $1 = tokens.tail;
          if ($1 instanceof Empty) {
            let tokens$1 = $1;
            let start5 = tokens.head[1].byte_offset;
            let value2 = $[0];
            return new Ok(
              [
                new PatternString(
                  new Span(start5, string_offset(start5, value2) + 2),
                  value2
                ),
                tokens$1
              ]
            );
          } else {
            let $2 = $1.tail;
            if ($2 instanceof Empty) {
              let tokens$1 = $1;
              let start5 = tokens.head[1].byte_offset;
              let value2 = $[0];
              return new Ok(
                [
                  new PatternString(
                    new Span(start5, string_offset(start5, value2) + 2),
                    value2
                  ),
                  tokens$1
                ]
              );
            } else {
              let $3 = $2.tail;
              if ($3 instanceof Empty) {
                if ($1.head[0] instanceof LessGreater) {
                  let $4 = $2.head[0];
                  if ($4 instanceof Name) {
                    let start5 = tokens.head[1].byte_offset;
                    let v = $[0];
                    let tokens$1 = $3;
                    let name_start = $2.head[1].byte_offset;
                    let n = $4[0];
                    let span2 = new Span(start5, string_offset(name_start, n));
                    let pattern$1 = new PatternConcatenate(
                      span2,
                      v,
                      Option$None$const,
                      new Named(n)
                    );
                    return new Ok([pattern$1, tokens$1]);
                  } else if ($4 instanceof DiscardName) {
                    let start5 = tokens.head[1].byte_offset;
                    let v = $[0];
                    let tokens$1 = $3;
                    let name_start = $2.head[1].byte_offset;
                    let n = $4[0];
                    let span2 = new Span(start5, string_offset(name_start, n) + 1);
                    let pattern$1 = new PatternConcatenate(
                      span2,
                      v,
                      Option$None$const,
                      new Discarded(n)
                    );
                    return new Ok([pattern$1, tokens$1]);
                  } else {
                    let tokens$1 = $1;
                    let start5 = tokens.head[1].byte_offset;
                    let value2 = $[0];
                    return new Ok(
                      [
                        new PatternString(
                          new Span(start5, string_offset(start5, value2) + 2),
                          value2
                        ),
                        tokens$1
                      ]
                    );
                  }
                } else {
                  let tokens$1 = $1;
                  let start5 = tokens.head[1].byte_offset;
                  let value2 = $[0];
                  return new Ok(
                    [
                      new PatternString(
                        new Span(start5, string_offset(start5, value2) + 2),
                        value2
                      ),
                      tokens$1
                    ]
                  );
                }
              } else {
                let $4 = $3.tail;
                if ($4 instanceof Empty) {
                  if ($1.head[0] instanceof LessGreater) {
                    let $5 = $2.head[0];
                    if ($5 instanceof Name) {
                      let start5 = tokens.head[1].byte_offset;
                      let v = $[0];
                      let tokens$1 = $3;
                      let name_start = $2.head[1].byte_offset;
                      let n = $5[0];
                      let span2 = new Span(start5, string_offset(name_start, n));
                      let pattern$1 = new PatternConcatenate(
                        span2,
                        v,
                        Option$None$const,
                        new Named(n)
                      );
                      return new Ok([pattern$1, tokens$1]);
                    } else if ($5 instanceof DiscardName) {
                      let start5 = tokens.head[1].byte_offset;
                      let v = $[0];
                      let tokens$1 = $3;
                      let name_start = $2.head[1].byte_offset;
                      let n = $5[0];
                      let span2 = new Span(
                        start5,
                        string_offset(name_start, n) + 1
                      );
                      let pattern$1 = new PatternConcatenate(
                        span2,
                        v,
                        Option$None$const,
                        new Discarded(n)
                      );
                      return new Ok([pattern$1, tokens$1]);
                    } else {
                      let tokens$1 = $1;
                      let start5 = tokens.head[1].byte_offset;
                      let value2 = $[0];
                      return new Ok(
                        [
                          new PatternString(
                            new Span(start5, string_offset(start5, value2) + 2),
                            value2
                          ),
                          tokens$1
                        ]
                      );
                    }
                  } else {
                    let tokens$1 = $1;
                    let start5 = tokens.head[1].byte_offset;
                    let value2 = $[0];
                    return new Ok(
                      [
                        new PatternString(
                          new Span(start5, string_offset(start5, value2) + 2),
                          value2
                        ),
                        tokens$1
                      ]
                    );
                  }
                } else {
                  let $5 = $1.head[0];
                  if ($5 instanceof As) {
                    let $6 = $2.head[0];
                    if ($6 instanceof Name && $3.head[0] instanceof LessGreater) {
                      let $7 = $4.head[0];
                      if ($7 instanceof Name) {
                        let start5 = tokens.head[1].byte_offset;
                        let v = $[0];
                        let tokens$1 = $4.tail;
                        let name_start = $4.head[1].byte_offset;
                        let l = $6[0];
                        let r = $7[0];
                        let span2 = new Span(start5, string_offset(name_start, r));
                        let pattern$1 = new PatternConcatenate(
                          span2,
                          v,
                          new Some(new Named(l)),
                          new Named(r)
                        );
                        return new Ok([pattern$1, tokens$1]);
                      } else if ($7 instanceof DiscardName) {
                        let start5 = tokens.head[1].byte_offset;
                        let v = $[0];
                        let tokens$1 = $4.tail;
                        let name_start = $4.head[1].byte_offset;
                        let l = $6[0];
                        let r = $7[0];
                        let span2 = new Span(
                          start5,
                          string_offset(name_start, r) + 1
                        );
                        let pattern$1 = new PatternConcatenate(
                          span2,
                          v,
                          new Some(new Named(l)),
                          new Discarded(r)
                        );
                        return new Ok([pattern$1, tokens$1]);
                      } else {
                        let tokens$1 = $1;
                        let start5 = tokens.head[1].byte_offset;
                        let value2 = $[0];
                        return new Ok(
                          [
                            new PatternString(
                              new Span(start5, string_offset(start5, value2) + 2),
                              value2
                            ),
                            tokens$1
                          ]
                        );
                      }
                    } else if ($6 instanceof DiscardName && $3.head[0] instanceof LessGreater) {
                      let $7 = $4.head[0];
                      if ($7 instanceof Name) {
                        let start5 = tokens.head[1].byte_offset;
                        let v = $[0];
                        let tokens$1 = $4.tail;
                        let name_start = $4.head[1].byte_offset;
                        let l = $6[0];
                        let r = $7[0];
                        let span2 = new Span(start5, string_offset(name_start, r));
                        let pattern$1 = new PatternConcatenate(
                          span2,
                          v,
                          new Some(new Discarded(l)),
                          new Named(r)
                        );
                        return new Ok([pattern$1, tokens$1]);
                      } else {
                        let tokens$1 = $1;
                        let start5 = tokens.head[1].byte_offset;
                        let value2 = $[0];
                        return new Ok(
                          [
                            new PatternString(
                              new Span(start5, string_offset(start5, value2) + 2),
                              value2
                            ),
                            tokens$1
                          ]
                        );
                      }
                    } else {
                      let tokens$1 = $1;
                      let start5 = tokens.head[1].byte_offset;
                      let value2 = $[0];
                      return new Ok(
                        [
                          new PatternString(
                            new Span(start5, string_offset(start5, value2) + 2),
                            value2
                          ),
                          tokens$1
                        ]
                      );
                    }
                  } else if ($5 instanceof LessGreater) {
                    let $6 = $2.head[0];
                    if ($6 instanceof Name) {
                      let start5 = tokens.head[1].byte_offset;
                      let v = $[0];
                      let tokens$1 = $3;
                      let name_start = $2.head[1].byte_offset;
                      let n = $6[0];
                      let span2 = new Span(start5, string_offset(name_start, n));
                      let pattern$1 = new PatternConcatenate(
                        span2,
                        v,
                        Option$None$const,
                        new Named(n)
                      );
                      return new Ok([pattern$1, tokens$1]);
                    } else if ($6 instanceof DiscardName) {
                      let start5 = tokens.head[1].byte_offset;
                      let v = $[0];
                      let tokens$1 = $3;
                      let name_start = $2.head[1].byte_offset;
                      let n = $6[0];
                      let span2 = new Span(
                        start5,
                        string_offset(name_start, n) + 1
                      );
                      let pattern$1 = new PatternConcatenate(
                        span2,
                        v,
                        Option$None$const,
                        new Discarded(n)
                      );
                      return new Ok([pattern$1, tokens$1]);
                    } else {
                      let tokens$1 = $1;
                      let start5 = tokens.head[1].byte_offset;
                      let value2 = $[0];
                      return new Ok(
                        [
                          new PatternString(
                            new Span(start5, string_offset(start5, value2) + 2),
                            value2
                          ),
                          tokens$1
                        ]
                      );
                    }
                  } else {
                    let tokens$1 = $1;
                    let start5 = tokens.head[1].byte_offset;
                    let value2 = $[0];
                    return new Ok(
                      [
                        new PatternString(
                          new Span(start5, string_offset(start5, value2) + 2),
                          value2
                        ),
                        tokens$1
                      ]
                    );
                  }
                }
              }
            }
          }
        } else if ($ instanceof LeftSquare) {
          let tokens$1 = tokens.tail;
          let start5 = tokens.head[1].byte_offset;
          let result = list4(
            pattern,
            new Some((_capture) => {
              return new PatternDiscard(_capture, "");
            }),
            List$Empty$const,
            tokens$1
          );
          return map4(
            result,
            (_use0) => {
              let elements = _use0.values;
              let rest = _use0.spread;
              let tokens$2 = _use0.remaining_tokens;
              let end = _use0.end;
              return [
                new PatternList(new Span(start5, end), elements, rest),
                tokens$2
              ];
            }
          );
        } else if ($ instanceof Hash) {
          let $1 = tokens.tail;
          if ($1 instanceof Empty) {
            let other = $;
            let position = tokens.head[1];
            return new Error(new UnexpectedToken(other, position));
          } else if ($1.head[0] instanceof LeftParen) {
            let start5 = tokens.head[1].byte_offset;
            let tokens$1 = $1.tail;
            let result = comma_delimited(
              List$Empty$const,
              tokens$1,
              pattern,
              Token$RightParen$const
            );
            return try$(
              result,
              (_use0) => {
                let patterns = _use0[0];
                let end = _use0[1];
                let tokens$2 = _use0[2];
                return new Ok(
                  [new PatternTuple(new Span(start5, end), patterns), tokens$2]
                );
              }
            );
          } else {
            let other = $;
            let position = tokens.head[1];
            return new Error(new UnexpectedToken(other, position));
          }
        } else if ($ instanceof LessLess) {
          let tokens$1 = tokens.tail;
          let start5 = tokens.head[1].byte_offset;
          let parser = (_capture) => {
            return bit_string_segment(pattern, _capture);
          };
          let result = comma_delimited(
            List$Empty$const,
            tokens$1,
            parser,
            Token$GreaterGreater$const
          );
          return try$(
            result,
            (_use0) => {
              let segments = _use0[0];
              let end = _use0[1];
              let tokens$2 = _use0[2];
              return new Ok(
                [new PatternBitString(new Span(start5, end), segments), tokens$2]
              );
            }
          );
        } else {
          let other = $;
          let position = tokens.head[1];
          return new Error(new UnexpectedToken(other, position));
        }
      }
    })(),
    (_use0) => {
      let pattern$1 = _use0[0];
      let tokens$1 = _use0[1];
      if (tokens$1 instanceof Empty) {
        return new Ok([pattern$1, tokens$1]);
      } else {
        let $ = tokens$1.tail;
        if ($ instanceof Empty) {
          return new Ok([pattern$1, tokens$1]);
        } else if (tokens$1.head[0] instanceof As) {
          let $1 = $.head[0];
          if ($1 instanceof Name) {
            let tokens$2 = $.tail;
            let name_start = $.head[1].byte_offset;
            let name$1 = $1[0];
            let span2 = new Span(
              pattern$1.location.start,
              string_offset(name_start, name$1)
            );
            let pattern$2 = new PatternAssignment(span2, pattern$1, name$1);
            return new Ok([pattern$2, tokens$2]);
          } else {
            return new Ok([pattern$1, tokens$1]);
          }
        } else {
          return new Ok([pattern$1, tokens$1]);
        }
      }
    }
  );
}
function named_type(name2, module2, tokens, start5, name_start) {
  return try$(
    (() => {
      if (tokens instanceof Empty) {
        let end = name_start + byte_size(name2);
        return new Ok([List$Empty$const, end, tokens]);
      } else if (tokens.head[0] instanceof LeftParen) {
        let tokens$1 = tokens.tail;
        return comma_delimited(
          List$Empty$const,
          tokens$1,
          type_2,
          Token$RightParen$const
        );
      } else {
        let end = name_start + byte_size(name2);
        return new Ok([List$Empty$const, end, tokens]);
      }
    })(),
    (_use0) => {
      let parameters = _use0[0];
      let end = _use0[1];
      let tokens$1 = _use0[2];
      let t = new NamedType(new Span(start5, end), name2, module2, parameters);
      return new Ok([t, tokens$1]);
    }
  );
}
function tuple_type(start5, tokens) {
  let result = comma_delimited(
    List$Empty$const,
    tokens,
    type_2,
    Token$RightParen$const
  );
  return try$(
    result,
    (_use0) => {
      let types = _use0[0];
      let end = _use0[1];
      let tokens$1 = _use0[2];
      let span2 = new Span(start5, end);
      return new Ok([new TupleType(span2, types), tokens$1]);
    }
  );
}
function fn_type(start5, tokens) {
  let result = comma_delimited(
    List$Empty$const,
    tokens,
    type_2,
    Token$RightParen$const
  );
  return try$(
    result,
    (_use0) => {
      let parameters = _use0[0];
      let tokens$1 = _use0[2];
      return expect(
        Token$RightArrow$const,
        tokens$1,
        (_, tokens2) => {
          return try$(
            type_2(tokens2),
            (_use02) => {
              let return$ = _use02[0];
              let tokens$2 = _use02[1];
              let span2 = new Span(start5, return$.location.end);
              return new Ok(
                [new FunctionType(span2, parameters, return$), tokens$2]
              );
            }
          );
        }
      );
    }
  );
}
function type_2(tokens) {
  if (tokens instanceof Empty) {
    return new Error(Error$UnexpectedEndOfInput$const);
  } else {
    let $ = tokens.tail;
    if ($ instanceof Empty) {
      let $1 = tokens.head[0];
      if ($1 instanceof Name) {
        let tokens$1 = $;
        let i = tokens.head[1].byte_offset;
        let name$1 = $1[0];
        let value2 = new VariableType(span_from_string(i, name$1), name$1);
        return new Ok([value2, tokens$1]);
      } else if ($1 instanceof UpperName) {
        let tokens$1 = $;
        let start5 = tokens.head[1].byte_offset;
        let name$1 = $1[0];
        return named_type(name$1, Option$None$const, tokens$1, start5, start5);
      } else if ($1 instanceof DiscardName) {
        let tokens$1 = $;
        let i = tokens.head[1].byte_offset;
        let name$1 = $1[0];
        let value2 = new HoleType(
          new Span(i, string_offset(i, name$1) + 1),
          name$1
        );
        return new Ok([value2, tokens$1]);
      } else {
        let token2 = $1;
        let position = tokens.head[1];
        return new Error(new UnexpectedToken(token2, position));
      }
    } else {
      let $1 = tokens.head[0];
      if ($1 instanceof Name) {
        let $2 = $.tail;
        if ($2 instanceof Empty) {
          let tokens$1 = $;
          let i = tokens.head[1].byte_offset;
          let name$1 = $1[0];
          let value2 = new VariableType(span_from_string(i, name$1), name$1);
          return new Ok([value2, tokens$1]);
        } else if ($.head[0] instanceof Dot) {
          let $3 = $2.head[0];
          if ($3 instanceof UpperName) {
            let start5 = tokens.head[1].byte_offset;
            let module$1 = $1[0];
            let tokens$1 = $2.tail;
            let end = $2.head[1].byte_offset;
            let name$1 = $3[0];
            return named_type(name$1, new Some(module$1), tokens$1, start5, end);
          } else {
            let tokens$1 = $;
            let i = tokens.head[1].byte_offset;
            let name$1 = $1[0];
            let value2 = new VariableType(span_from_string(i, name$1), name$1);
            return new Ok([value2, tokens$1]);
          }
        } else {
          let tokens$1 = $;
          let i = tokens.head[1].byte_offset;
          let name$1 = $1[0];
          let value2 = new VariableType(span_from_string(i, name$1), name$1);
          return new Ok([value2, tokens$1]);
        }
      } else if ($1 instanceof UpperName) {
        let tokens$1 = $;
        let start5 = tokens.head[1].byte_offset;
        let name$1 = $1[0];
        return named_type(name$1, Option$None$const, tokens$1, start5, start5);
      } else if ($1 instanceof DiscardName) {
        let tokens$1 = $;
        let i = tokens.head[1].byte_offset;
        let name$1 = $1[0];
        let value2 = new HoleType(
          new Span(i, string_offset(i, name$1) + 1),
          name$1
        );
        return new Ok([value2, tokens$1]);
      } else if ($1 instanceof Fn && $.head[0] instanceof LeftParen) {
        let i = tokens.head[1].byte_offset;
        let tokens$1 = $.tail;
        return fn_type(i, tokens$1);
      } else if ($1 instanceof Hash && $.head[0] instanceof LeftParen) {
        let i = tokens.head[1].byte_offset;
        let tokens$1 = $.tail;
        return tuple_type(i, tokens$1);
      } else {
        let token2 = $1;
        let position = tokens.head[1];
        return new Error(new UnexpectedToken(token2, position));
      }
    }
  }
}
function optional_return_annotation(end, tokens) {
  if (tokens instanceof Empty) {
    return new Ok([Option$None$const, end, tokens]);
  } else if (tokens.head[0] instanceof RightArrow) {
    let tokens$1 = tokens.tail;
    return try$(
      type_2(tokens$1),
      (_use0) => {
        let return_type = _use0[0];
        let tokens$2 = _use0[1];
        return new Ok(
          [new Some(return_type), return_type.location.end, tokens$2]
        );
      }
    );
  } else {
    return new Ok([Option$None$const, end, tokens]);
  }
}
function optional_type_annotation(tokens) {
  if (tokens instanceof Empty) {
    return new Ok([Option$None$const, tokens]);
  } else if (tokens.head[0] instanceof Colon) {
    let tokens$1 = tokens.tail;
    return map4(
      type_2(tokens$1),
      (_use0) => {
        let annotation = _use0[0];
        let tokens$2 = _use0[1];
        return [new Some(annotation), tokens$2];
      }
    );
  } else {
    return new Ok([Option$None$const, tokens]);
  }
}
function fn_parameter(tokens) {
  return try$(
    (() => {
      if (tokens instanceof Empty) {
        return new Error(Error$UnexpectedEndOfInput$const);
      } else {
        let $ = tokens.head[0];
        if ($ instanceof Name) {
          let tokens$1 = tokens.tail;
          let name$1 = $[0];
          return new Ok([new Named(name$1), tokens$1]);
        } else if ($ instanceof DiscardName) {
          let tokens$1 = tokens.tail;
          let name$1 = $[0];
          return new Ok([new Discarded(name$1), tokens$1]);
        } else {
          let other = $;
          let position = tokens.head[1];
          return new Error(new UnexpectedToken(other, position));
        }
      }
    })(),
    (_use0) => {
      let name$1 = _use0[0];
      let tokens$1 = _use0[1];
      return try$(
        optional_type_annotation(tokens$1),
        (_use02) => {
          let type_$1 = _use02[0];
          let tokens$2 = _use02[1];
          return new Ok([new FnParameter(name$1, type_$1), tokens$2]);
        }
      );
    }
  );
}
function use_pattern(tokens) {
  return try$(
    pattern(tokens),
    (_use0) => {
      let pattern$1 = _use0[0];
      let tokens$1 = _use0[1];
      return try$(
        optional_type_annotation(tokens$1),
        (_use02) => {
          let annotation = _use02[0];
          let tokens$2 = _use02[1];
          return new Ok([new UsePattern(pattern$1, annotation), tokens$2]);
        }
      );
    }
  );
}
function fn_capture(label2, function$, before, after, tokens) {
  if (tokens instanceof Empty) {
    return new Error(Error$UnexpectedEndOfInput$const);
  } else if (tokens.head[0] instanceof RightParen) {
    let tokens$1 = tokens.tail;
    let end = tokens.head[1].byte_offset;
    let span2 = new Span(function$.location.start, end + 1);
    let capture = new FnCapture(
      span2,
      label2,
      function$,
      before,
      reverse(after)
    );
    return after_expression(capture, tokens$1);
  } else {
    return try$(
      field2(tokens, expression),
      (_use0) => {
        let argument = _use0[0];
        let tokens$1 = _use0[1];
        let after$1 = prepend(argument, after);
        if (tokens$1 instanceof Empty) {
          return new Error(Error$UnexpectedEndOfInput$const);
        } else {
          let $ = tokens$1.head[0];
          if ($ instanceof RightParen) {
            let tokens$2 = tokens$1.tail;
            let end = tokens$1.head[1].byte_offset;
            let span2 = new Span(function$.location.start, end + 1);
            let call$1 = new FnCapture(
              span2,
              label2,
              function$,
              before,
              reverse(after$1)
            );
            return after_expression(call$1, tokens$2);
          } else if ($ instanceof Comma) {
            let tokens$2 = tokens$1.tail;
            return fn_capture(label2, function$, before, after$1, tokens$2);
          } else {
            let other = $;
            let position = tokens$1.head[1];
            return new Error(new UnexpectedToken(other, position));
          }
        }
      }
    );
  }
}
function call(arguments$, function$, tokens) {
  if (tokens instanceof Empty) {
    return new Error(Error$UnexpectedEndOfInput$const);
  } else {
    let $ = tokens.head[0];
    if ($ instanceof Name) {
      let $1 = tokens.tail;
      if ($1 instanceof Empty) {
        return try$(
          field2(tokens, expression),
          (_use0) => {
            let argument = _use0[0];
            let tokens$1 = _use0[1];
            let arguments$1 = prepend(argument, arguments$);
            if (tokens$1 instanceof Empty) {
              return new Error(Error$UnexpectedEndOfInput$const);
            } else {
              let $2 = tokens$1.head[0];
              if ($2 instanceof RightParen) {
                let tokens$2 = tokens$1.tail;
                let end = tokens$1.head[1].byte_offset;
                let span2 = new Span(function$.location.start, end + 1);
                let call$1 = new Call2(
                  span2,
                  function$,
                  reverse(arguments$1)
                );
                return after_expression(call$1, tokens$2);
              } else if ($2 instanceof Comma) {
                let tokens$2 = tokens$1.tail;
                return call(arguments$1, function$, tokens$2);
              } else {
                let other = $2;
                let position = tokens$1.head[1];
                return new Error(new UnexpectedToken(other, position));
              }
            }
          }
        );
      } else {
        let $2 = $1.tail;
        if ($2 instanceof Empty) {
          return try$(
            field2(tokens, expression),
            (_use0) => {
              let argument = _use0[0];
              let tokens$1 = _use0[1];
              let arguments$1 = prepend(argument, arguments$);
              if (tokens$1 instanceof Empty) {
                return new Error(Error$UnexpectedEndOfInput$const);
              } else {
                let $3 = tokens$1.head[0];
                if ($3 instanceof RightParen) {
                  let tokens$2 = tokens$1.tail;
                  let end = tokens$1.head[1].byte_offset;
                  let span2 = new Span(function$.location.start, end + 1);
                  let call$1 = new Call2(
                    span2,
                    function$,
                    reverse(arguments$1)
                  );
                  return after_expression(call$1, tokens$2);
                } else if ($3 instanceof Comma) {
                  let tokens$2 = tokens$1.tail;
                  return call(arguments$1, function$, tokens$2);
                } else {
                  let other = $3;
                  let position = tokens$1.head[1];
                  return new Error(new UnexpectedToken(other, position));
                }
              }
            }
          );
        } else {
          let $3 = $2.tail;
          if ($3 instanceof Empty) {
            if ($1.head[0] instanceof Colon) {
              let $4 = $2.head[0];
              if ($4 instanceof DiscardName && $4[0] === "") {
                let label2 = $[0];
                let tokens$1 = $3;
                return fn_capture(
                  new Some(label2),
                  function$,
                  reverse(arguments$),
                  List$Empty$const,
                  tokens$1
                );
              } else {
                return try$(
                  field2(tokens, expression),
                  (_use0) => {
                    let argument = _use0[0];
                    let tokens$1 = _use0[1];
                    let arguments$1 = prepend(argument, arguments$);
                    if (tokens$1 instanceof Empty) {
                      return new Error(Error$UnexpectedEndOfInput$const);
                    } else {
                      let $5 = tokens$1.head[0];
                      if ($5 instanceof RightParen) {
                        let tokens$2 = tokens$1.tail;
                        let end = tokens$1.head[1].byte_offset;
                        let span2 = new Span(function$.location.start, end + 1);
                        let call$1 = new Call2(
                          span2,
                          function$,
                          reverse(arguments$1)
                        );
                        return after_expression(call$1, tokens$2);
                      } else if ($5 instanceof Comma) {
                        let tokens$2 = tokens$1.tail;
                        return call(arguments$1, function$, tokens$2);
                      } else {
                        let other = $5;
                        let position = tokens$1.head[1];
                        return new Error(new UnexpectedToken(other, position));
                      }
                    }
                  }
                );
              }
            } else {
              return try$(
                field2(tokens, expression),
                (_use0) => {
                  let argument = _use0[0];
                  let tokens$1 = _use0[1];
                  let arguments$1 = prepend(argument, arguments$);
                  if (tokens$1 instanceof Empty) {
                    return new Error(Error$UnexpectedEndOfInput$const);
                  } else {
                    let $4 = tokens$1.head[0];
                    if ($4 instanceof RightParen) {
                      let tokens$2 = tokens$1.tail;
                      let end = tokens$1.head[1].byte_offset;
                      let span2 = new Span(function$.location.start, end + 1);
                      let call$1 = new Call2(
                        span2,
                        function$,
                        reverse(arguments$1)
                      );
                      return after_expression(call$1, tokens$2);
                    } else if ($4 instanceof Comma) {
                      let tokens$2 = tokens$1.tail;
                      return call(arguments$1, function$, tokens$2);
                    } else {
                      let other = $4;
                      let position = tokens$1.head[1];
                      return new Error(new UnexpectedToken(other, position));
                    }
                  }
                }
              );
            }
          } else {
            let $4 = $3.tail;
            if ($4 instanceof Empty) {
              if ($1.head[0] instanceof Colon) {
                let $5 = $2.head[0];
                if ($5 instanceof DiscardName) {
                  let $6 = $3.head[0];
                  if ($6 instanceof RightParen) {
                    if ($5[0] === "") {
                      let label2 = $[0];
                      let tokens$1 = $4;
                      let end = $3.head[1].byte_offset;
                      let span2 = new Span(function$.location.start, end + 1);
                      let capture = new FnCapture(
                        span2,
                        new Some(label2),
                        function$,
                        reverse(arguments$),
                        List$Empty$const
                      );
                      return after_expression(capture, tokens$1);
                    } else {
                      return try$(
                        field2(tokens, expression),
                        (_use0) => {
                          let argument = _use0[0];
                          let tokens$1 = _use0[1];
                          let arguments$1 = prepend(argument, arguments$);
                          if (tokens$1 instanceof Empty) {
                            return new Error(Error$UnexpectedEndOfInput$const);
                          } else {
                            let $7 = tokens$1.head[0];
                            if ($7 instanceof RightParen) {
                              let tokens$2 = tokens$1.tail;
                              let end = tokens$1.head[1].byte_offset;
                              let span2 = new Span(
                                function$.location.start,
                                end + 1
                              );
                              let call$1 = new Call2(
                                span2,
                                function$,
                                reverse(arguments$1)
                              );
                              return after_expression(call$1, tokens$2);
                            } else if ($7 instanceof Comma) {
                              let tokens$2 = tokens$1.tail;
                              return call(arguments$1, function$, tokens$2);
                            } else {
                              let other = $7;
                              let position = tokens$1.head[1];
                              return new Error(
                                new UnexpectedToken(other, position)
                              );
                            }
                          }
                        }
                      );
                    }
                  } else if ($6 instanceof Comma) {
                    if ($5[0] === "") {
                      let label2 = $[0];
                      let tokens$1 = $4;
                      return fn_capture(
                        new Some(label2),
                        function$,
                        reverse(arguments$),
                        List$Empty$const,
                        tokens$1
                      );
                    } else {
                      return try$(
                        field2(tokens, expression),
                        (_use0) => {
                          let argument = _use0[0];
                          let tokens$1 = _use0[1];
                          let arguments$1 = prepend(argument, arguments$);
                          if (tokens$1 instanceof Empty) {
                            return new Error(Error$UnexpectedEndOfInput$const);
                          } else {
                            let $7 = tokens$1.head[0];
                            if ($7 instanceof RightParen) {
                              let tokens$2 = tokens$1.tail;
                              let end = tokens$1.head[1].byte_offset;
                              let span2 = new Span(
                                function$.location.start,
                                end + 1
                              );
                              let call$1 = new Call2(
                                span2,
                                function$,
                                reverse(arguments$1)
                              );
                              return after_expression(call$1, tokens$2);
                            } else if ($7 instanceof Comma) {
                              let tokens$2 = tokens$1.tail;
                              return call(arguments$1, function$, tokens$2);
                            } else {
                              let other = $7;
                              let position = tokens$1.head[1];
                              return new Error(
                                new UnexpectedToken(other, position)
                              );
                            }
                          }
                        }
                      );
                    }
                  } else if ($5[0] === "") {
                    let label2 = $[0];
                    let tokens$1 = $3;
                    return fn_capture(
                      new Some(label2),
                      function$,
                      reverse(arguments$),
                      List$Empty$const,
                      tokens$1
                    );
                  } else {
                    return try$(
                      field2(tokens, expression),
                      (_use0) => {
                        let argument = _use0[0];
                        let tokens$1 = _use0[1];
                        let arguments$1 = prepend(argument, arguments$);
                        if (tokens$1 instanceof Empty) {
                          return new Error(Error$UnexpectedEndOfInput$const);
                        } else {
                          let $7 = tokens$1.head[0];
                          if ($7 instanceof RightParen) {
                            let tokens$2 = tokens$1.tail;
                            let end = tokens$1.head[1].byte_offset;
                            let span2 = new Span(
                              function$.location.start,
                              end + 1
                            );
                            let call$1 = new Call2(
                              span2,
                              function$,
                              reverse(arguments$1)
                            );
                            return after_expression(call$1, tokens$2);
                          } else if ($7 instanceof Comma) {
                            let tokens$2 = tokens$1.tail;
                            return call(arguments$1, function$, tokens$2);
                          } else {
                            let other = $7;
                            let position = tokens$1.head[1];
                            return new Error(
                              new UnexpectedToken(other, position)
                            );
                          }
                        }
                      }
                    );
                  }
                } else {
                  return try$(
                    field2(tokens, expression),
                    (_use0) => {
                      let argument = _use0[0];
                      let tokens$1 = _use0[1];
                      let arguments$1 = prepend(argument, arguments$);
                      if (tokens$1 instanceof Empty) {
                        return new Error(Error$UnexpectedEndOfInput$const);
                      } else {
                        let $6 = tokens$1.head[0];
                        if ($6 instanceof RightParen) {
                          let tokens$2 = tokens$1.tail;
                          let end = tokens$1.head[1].byte_offset;
                          let span2 = new Span(function$.location.start, end + 1);
                          let call$1 = new Call2(
                            span2,
                            function$,
                            reverse(arguments$1)
                          );
                          return after_expression(call$1, tokens$2);
                        } else if ($6 instanceof Comma) {
                          let tokens$2 = tokens$1.tail;
                          return call(arguments$1, function$, tokens$2);
                        } else {
                          let other = $6;
                          let position = tokens$1.head[1];
                          return new Error(new UnexpectedToken(other, position));
                        }
                      }
                    }
                  );
                }
              } else {
                return try$(
                  field2(tokens, expression),
                  (_use0) => {
                    let argument = _use0[0];
                    let tokens$1 = _use0[1];
                    let arguments$1 = prepend(argument, arguments$);
                    if (tokens$1 instanceof Empty) {
                      return new Error(Error$UnexpectedEndOfInput$const);
                    } else {
                      let $5 = tokens$1.head[0];
                      if ($5 instanceof RightParen) {
                        let tokens$2 = tokens$1.tail;
                        let end = tokens$1.head[1].byte_offset;
                        let span2 = new Span(function$.location.start, end + 1);
                        let call$1 = new Call2(
                          span2,
                          function$,
                          reverse(arguments$1)
                        );
                        return after_expression(call$1, tokens$2);
                      } else if ($5 instanceof Comma) {
                        let tokens$2 = tokens$1.tail;
                        return call(arguments$1, function$, tokens$2);
                      } else {
                        let other = $5;
                        let position = tokens$1.head[1];
                        return new Error(new UnexpectedToken(other, position));
                      }
                    }
                  }
                );
              }
            } else if ($1.head[0] instanceof Colon) {
              let $5 = $2.head[0];
              if ($5 instanceof DiscardName) {
                let $6 = $3.head[0];
                if ($6 instanceof RightParen) {
                  if ($5[0] === "") {
                    let label2 = $[0];
                    let tokens$1 = $4;
                    let end = $3.head[1].byte_offset;
                    let span2 = new Span(function$.location.start, end + 1);
                    let capture = new FnCapture(
                      span2,
                      new Some(label2),
                      function$,
                      reverse(arguments$),
                      List$Empty$const
                    );
                    return after_expression(capture, tokens$1);
                  } else {
                    return try$(
                      field2(tokens, expression),
                      (_use0) => {
                        let argument = _use0[0];
                        let tokens$1 = _use0[1];
                        let arguments$1 = prepend(argument, arguments$);
                        if (tokens$1 instanceof Empty) {
                          return new Error(Error$UnexpectedEndOfInput$const);
                        } else {
                          let $7 = tokens$1.head[0];
                          if ($7 instanceof RightParen) {
                            let tokens$2 = tokens$1.tail;
                            let end = tokens$1.head[1].byte_offset;
                            let span2 = new Span(
                              function$.location.start,
                              end + 1
                            );
                            let call$1 = new Call2(
                              span2,
                              function$,
                              reverse(arguments$1)
                            );
                            return after_expression(call$1, tokens$2);
                          } else if ($7 instanceof Comma) {
                            let tokens$2 = tokens$1.tail;
                            return call(arguments$1, function$, tokens$2);
                          } else {
                            let other = $7;
                            let position = tokens$1.head[1];
                            return new Error(
                              new UnexpectedToken(other, position)
                            );
                          }
                        }
                      }
                    );
                  }
                } else if ($6 instanceof Comma) {
                  if ($4.head[0] instanceof RightParen) {
                    if ($5[0] === "") {
                      let label2 = $[0];
                      let tokens$1 = $4.tail;
                      let end = $4.head[1].byte_offset;
                      let span2 = new Span(function$.location.start, end + 1);
                      let capture = new FnCapture(
                        span2,
                        new Some(label2),
                        function$,
                        reverse(arguments$),
                        List$Empty$const
                      );
                      return after_expression(capture, tokens$1);
                    } else {
                      return try$(
                        field2(tokens, expression),
                        (_use0) => {
                          let argument = _use0[0];
                          let tokens$1 = _use0[1];
                          let arguments$1 = prepend(argument, arguments$);
                          if (tokens$1 instanceof Empty) {
                            return new Error(Error$UnexpectedEndOfInput$const);
                          } else {
                            let $7 = tokens$1.head[0];
                            if ($7 instanceof RightParen) {
                              let tokens$2 = tokens$1.tail;
                              let end = tokens$1.head[1].byte_offset;
                              let span2 = new Span(
                                function$.location.start,
                                end + 1
                              );
                              let call$1 = new Call2(
                                span2,
                                function$,
                                reverse(arguments$1)
                              );
                              return after_expression(call$1, tokens$2);
                            } else if ($7 instanceof Comma) {
                              let tokens$2 = tokens$1.tail;
                              return call(arguments$1, function$, tokens$2);
                            } else {
                              let other = $7;
                              let position = tokens$1.head[1];
                              return new Error(
                                new UnexpectedToken(other, position)
                              );
                            }
                          }
                        }
                      );
                    }
                  } else if ($5[0] === "") {
                    let label2 = $[0];
                    let tokens$1 = $4;
                    return fn_capture(
                      new Some(label2),
                      function$,
                      reverse(arguments$),
                      List$Empty$const,
                      tokens$1
                    );
                  } else {
                    return try$(
                      field2(tokens, expression),
                      (_use0) => {
                        let argument = _use0[0];
                        let tokens$1 = _use0[1];
                        let arguments$1 = prepend(argument, arguments$);
                        if (tokens$1 instanceof Empty) {
                          return new Error(Error$UnexpectedEndOfInput$const);
                        } else {
                          let $7 = tokens$1.head[0];
                          if ($7 instanceof RightParen) {
                            let tokens$2 = tokens$1.tail;
                            let end = tokens$1.head[1].byte_offset;
                            let span2 = new Span(
                              function$.location.start,
                              end + 1
                            );
                            let call$1 = new Call2(
                              span2,
                              function$,
                              reverse(arguments$1)
                            );
                            return after_expression(call$1, tokens$2);
                          } else if ($7 instanceof Comma) {
                            let tokens$2 = tokens$1.tail;
                            return call(arguments$1, function$, tokens$2);
                          } else {
                            let other = $7;
                            let position = tokens$1.head[1];
                            return new Error(
                              new UnexpectedToken(other, position)
                            );
                          }
                        }
                      }
                    );
                  }
                } else if ($5[0] === "") {
                  let label2 = $[0];
                  let tokens$1 = $3;
                  return fn_capture(
                    new Some(label2),
                    function$,
                    reverse(arguments$),
                    List$Empty$const,
                    tokens$1
                  );
                } else {
                  return try$(
                    field2(tokens, expression),
                    (_use0) => {
                      let argument = _use0[0];
                      let tokens$1 = _use0[1];
                      let arguments$1 = prepend(argument, arguments$);
                      if (tokens$1 instanceof Empty) {
                        return new Error(Error$UnexpectedEndOfInput$const);
                      } else {
                        let $7 = tokens$1.head[0];
                        if ($7 instanceof RightParen) {
                          let tokens$2 = tokens$1.tail;
                          let end = tokens$1.head[1].byte_offset;
                          let span2 = new Span(function$.location.start, end + 1);
                          let call$1 = new Call2(
                            span2,
                            function$,
                            reverse(arguments$1)
                          );
                          return after_expression(call$1, tokens$2);
                        } else if ($7 instanceof Comma) {
                          let tokens$2 = tokens$1.tail;
                          return call(arguments$1, function$, tokens$2);
                        } else {
                          let other = $7;
                          let position = tokens$1.head[1];
                          return new Error(new UnexpectedToken(other, position));
                        }
                      }
                    }
                  );
                }
              } else {
                return try$(
                  field2(tokens, expression),
                  (_use0) => {
                    let argument = _use0[0];
                    let tokens$1 = _use0[1];
                    let arguments$1 = prepend(argument, arguments$);
                    if (tokens$1 instanceof Empty) {
                      return new Error(Error$UnexpectedEndOfInput$const);
                    } else {
                      let $6 = tokens$1.head[0];
                      if ($6 instanceof RightParen) {
                        let tokens$2 = tokens$1.tail;
                        let end = tokens$1.head[1].byte_offset;
                        let span2 = new Span(function$.location.start, end + 1);
                        let call$1 = new Call2(
                          span2,
                          function$,
                          reverse(arguments$1)
                        );
                        return after_expression(call$1, tokens$2);
                      } else if ($6 instanceof Comma) {
                        let tokens$2 = tokens$1.tail;
                        return call(arguments$1, function$, tokens$2);
                      } else {
                        let other = $6;
                        let position = tokens$1.head[1];
                        return new Error(new UnexpectedToken(other, position));
                      }
                    }
                  }
                );
              }
            } else {
              return try$(
                field2(tokens, expression),
                (_use0) => {
                  let argument = _use0[0];
                  let tokens$1 = _use0[1];
                  let arguments$1 = prepend(argument, arguments$);
                  if (tokens$1 instanceof Empty) {
                    return new Error(Error$UnexpectedEndOfInput$const);
                  } else {
                    let $5 = tokens$1.head[0];
                    if ($5 instanceof RightParen) {
                      let tokens$2 = tokens$1.tail;
                      let end = tokens$1.head[1].byte_offset;
                      let span2 = new Span(function$.location.start, end + 1);
                      let call$1 = new Call2(
                        span2,
                        function$,
                        reverse(arguments$1)
                      );
                      return after_expression(call$1, tokens$2);
                    } else if ($5 instanceof Comma) {
                      let tokens$2 = tokens$1.tail;
                      return call(arguments$1, function$, tokens$2);
                    } else {
                      let other = $5;
                      let position = tokens$1.head[1];
                      return new Error(new UnexpectedToken(other, position));
                    }
                  }
                }
              );
            }
          }
        }
      }
    } else if ($ instanceof DiscardName) {
      let $1 = tokens.tail;
      if ($1 instanceof Empty) {
        if ($[0] === "") {
          let tokens$1 = $1;
          return fn_capture(
            Option$None$const,
            function$,
            reverse(arguments$),
            List$Empty$const,
            tokens$1
          );
        } else {
          return try$(
            field2(tokens, expression),
            (_use0) => {
              let argument = _use0[0];
              let tokens$1 = _use0[1];
              let arguments$1 = prepend(argument, arguments$);
              if (tokens$1 instanceof Empty) {
                return new Error(Error$UnexpectedEndOfInput$const);
              } else {
                let $2 = tokens$1.head[0];
                if ($2 instanceof RightParen) {
                  let tokens$2 = tokens$1.tail;
                  let end = tokens$1.head[1].byte_offset;
                  let span2 = new Span(function$.location.start, end + 1);
                  let call$1 = new Call2(
                    span2,
                    function$,
                    reverse(arguments$1)
                  );
                  return after_expression(call$1, tokens$2);
                } else if ($2 instanceof Comma) {
                  let tokens$2 = tokens$1.tail;
                  return call(arguments$1, function$, tokens$2);
                } else {
                  let other = $2;
                  let position = tokens$1.head[1];
                  return new Error(new UnexpectedToken(other, position));
                }
              }
            }
          );
        }
      } else {
        let $2 = $1.tail;
        if ($2 instanceof Empty) {
          let $3 = $1.head[0];
          if ($3 instanceof RightParen) {
            if ($[0] === "") {
              let tokens$1 = $2;
              let end = $1.head[1].byte_offset;
              let span2 = new Span(function$.location.start, end + 1);
              let capture = new FnCapture(
                span2,
                Option$None$const,
                function$,
                reverse(arguments$),
                List$Empty$const
              );
              return after_expression(capture, tokens$1);
            } else {
              return try$(
                field2(tokens, expression),
                (_use0) => {
                  let argument = _use0[0];
                  let tokens$1 = _use0[1];
                  let arguments$1 = prepend(argument, arguments$);
                  if (tokens$1 instanceof Empty) {
                    return new Error(Error$UnexpectedEndOfInput$const);
                  } else {
                    let $4 = tokens$1.head[0];
                    if ($4 instanceof RightParen) {
                      let tokens$2 = tokens$1.tail;
                      let end = tokens$1.head[1].byte_offset;
                      let span2 = new Span(function$.location.start, end + 1);
                      let call$1 = new Call2(
                        span2,
                        function$,
                        reverse(arguments$1)
                      );
                      return after_expression(call$1, tokens$2);
                    } else if ($4 instanceof Comma) {
                      let tokens$2 = tokens$1.tail;
                      return call(arguments$1, function$, tokens$2);
                    } else {
                      let other = $4;
                      let position = tokens$1.head[1];
                      return new Error(new UnexpectedToken(other, position));
                    }
                  }
                }
              );
            }
          } else if ($3 instanceof Comma) {
            if ($[0] === "") {
              let tokens$1 = $2;
              return fn_capture(
                Option$None$const,
                function$,
                reverse(arguments$),
                List$Empty$const,
                tokens$1
              );
            } else {
              return try$(
                field2(tokens, expression),
                (_use0) => {
                  let argument = _use0[0];
                  let tokens$1 = _use0[1];
                  let arguments$1 = prepend(argument, arguments$);
                  if (tokens$1 instanceof Empty) {
                    return new Error(Error$UnexpectedEndOfInput$const);
                  } else {
                    let $4 = tokens$1.head[0];
                    if ($4 instanceof RightParen) {
                      let tokens$2 = tokens$1.tail;
                      let end = tokens$1.head[1].byte_offset;
                      let span2 = new Span(function$.location.start, end + 1);
                      let call$1 = new Call2(
                        span2,
                        function$,
                        reverse(arguments$1)
                      );
                      return after_expression(call$1, tokens$2);
                    } else if ($4 instanceof Comma) {
                      let tokens$2 = tokens$1.tail;
                      return call(arguments$1, function$, tokens$2);
                    } else {
                      let other = $4;
                      let position = tokens$1.head[1];
                      return new Error(new UnexpectedToken(other, position));
                    }
                  }
                }
              );
            }
          } else if ($[0] === "") {
            let tokens$1 = $1;
            return fn_capture(
              Option$None$const,
              function$,
              reverse(arguments$),
              List$Empty$const,
              tokens$1
            );
          } else {
            return try$(
              field2(tokens, expression),
              (_use0) => {
                let argument = _use0[0];
                let tokens$1 = _use0[1];
                let arguments$1 = prepend(argument, arguments$);
                if (tokens$1 instanceof Empty) {
                  return new Error(Error$UnexpectedEndOfInput$const);
                } else {
                  let $4 = tokens$1.head[0];
                  if ($4 instanceof RightParen) {
                    let tokens$2 = tokens$1.tail;
                    let end = tokens$1.head[1].byte_offset;
                    let span2 = new Span(function$.location.start, end + 1);
                    let call$1 = new Call2(
                      span2,
                      function$,
                      reverse(arguments$1)
                    );
                    return after_expression(call$1, tokens$2);
                  } else if ($4 instanceof Comma) {
                    let tokens$2 = tokens$1.tail;
                    return call(arguments$1, function$, tokens$2);
                  } else {
                    let other = $4;
                    let position = tokens$1.head[1];
                    return new Error(new UnexpectedToken(other, position));
                  }
                }
              }
            );
          }
        } else {
          let $3 = $1.head[0];
          if ($3 instanceof RightParen) {
            if ($[0] === "") {
              let tokens$1 = $2;
              let end = $1.head[1].byte_offset;
              let span2 = new Span(function$.location.start, end + 1);
              let capture = new FnCapture(
                span2,
                Option$None$const,
                function$,
                reverse(arguments$),
                List$Empty$const
              );
              return after_expression(capture, tokens$1);
            } else {
              return try$(
                field2(tokens, expression),
                (_use0) => {
                  let argument = _use0[0];
                  let tokens$1 = _use0[1];
                  let arguments$1 = prepend(argument, arguments$);
                  if (tokens$1 instanceof Empty) {
                    return new Error(Error$UnexpectedEndOfInput$const);
                  } else {
                    let $4 = tokens$1.head[0];
                    if ($4 instanceof RightParen) {
                      let tokens$2 = tokens$1.tail;
                      let end = tokens$1.head[1].byte_offset;
                      let span2 = new Span(function$.location.start, end + 1);
                      let call$1 = new Call2(
                        span2,
                        function$,
                        reverse(arguments$1)
                      );
                      return after_expression(call$1, tokens$2);
                    } else if ($4 instanceof Comma) {
                      let tokens$2 = tokens$1.tail;
                      return call(arguments$1, function$, tokens$2);
                    } else {
                      let other = $4;
                      let position = tokens$1.head[1];
                      return new Error(new UnexpectedToken(other, position));
                    }
                  }
                }
              );
            }
          } else if ($3 instanceof Comma) {
            if ($2.head[0] instanceof RightParen) {
              if ($[0] === "") {
                let tokens$1 = $2.tail;
                let end = $2.head[1].byte_offset;
                let span2 = new Span(function$.location.start, end + 1);
                let capture = new FnCapture(
                  span2,
                  Option$None$const,
                  function$,
                  reverse(arguments$),
                  List$Empty$const
                );
                return after_expression(capture, tokens$1);
              } else {
                return try$(
                  field2(tokens, expression),
                  (_use0) => {
                    let argument = _use0[0];
                    let tokens$1 = _use0[1];
                    let arguments$1 = prepend(argument, arguments$);
                    if (tokens$1 instanceof Empty) {
                      return new Error(Error$UnexpectedEndOfInput$const);
                    } else {
                      let $4 = tokens$1.head[0];
                      if ($4 instanceof RightParen) {
                        let tokens$2 = tokens$1.tail;
                        let end = tokens$1.head[1].byte_offset;
                        let span2 = new Span(function$.location.start, end + 1);
                        let call$1 = new Call2(
                          span2,
                          function$,
                          reverse(arguments$1)
                        );
                        return after_expression(call$1, tokens$2);
                      } else if ($4 instanceof Comma) {
                        let tokens$2 = tokens$1.tail;
                        return call(arguments$1, function$, tokens$2);
                      } else {
                        let other = $4;
                        let position = tokens$1.head[1];
                        return new Error(new UnexpectedToken(other, position));
                      }
                    }
                  }
                );
              }
            } else if ($[0] === "") {
              let tokens$1 = $2;
              return fn_capture(
                Option$None$const,
                function$,
                reverse(arguments$),
                List$Empty$const,
                tokens$1
              );
            } else {
              return try$(
                field2(tokens, expression),
                (_use0) => {
                  let argument = _use0[0];
                  let tokens$1 = _use0[1];
                  let arguments$1 = prepend(argument, arguments$);
                  if (tokens$1 instanceof Empty) {
                    return new Error(Error$UnexpectedEndOfInput$const);
                  } else {
                    let $4 = tokens$1.head[0];
                    if ($4 instanceof RightParen) {
                      let tokens$2 = tokens$1.tail;
                      let end = tokens$1.head[1].byte_offset;
                      let span2 = new Span(function$.location.start, end + 1);
                      let call$1 = new Call2(
                        span2,
                        function$,
                        reverse(arguments$1)
                      );
                      return after_expression(call$1, tokens$2);
                    } else if ($4 instanceof Comma) {
                      let tokens$2 = tokens$1.tail;
                      return call(arguments$1, function$, tokens$2);
                    } else {
                      let other = $4;
                      let position = tokens$1.head[1];
                      return new Error(new UnexpectedToken(other, position));
                    }
                  }
                }
              );
            }
          } else if ($[0] === "") {
            let tokens$1 = $1;
            return fn_capture(
              Option$None$const,
              function$,
              reverse(arguments$),
              List$Empty$const,
              tokens$1
            );
          } else {
            return try$(
              field2(tokens, expression),
              (_use0) => {
                let argument = _use0[0];
                let tokens$1 = _use0[1];
                let arguments$1 = prepend(argument, arguments$);
                if (tokens$1 instanceof Empty) {
                  return new Error(Error$UnexpectedEndOfInput$const);
                } else {
                  let $4 = tokens$1.head[0];
                  if ($4 instanceof RightParen) {
                    let tokens$2 = tokens$1.tail;
                    let end = tokens$1.head[1].byte_offset;
                    let span2 = new Span(function$.location.start, end + 1);
                    let call$1 = new Call2(
                      span2,
                      function$,
                      reverse(arguments$1)
                    );
                    return after_expression(call$1, tokens$2);
                  } else if ($4 instanceof Comma) {
                    let tokens$2 = tokens$1.tail;
                    return call(arguments$1, function$, tokens$2);
                  } else {
                    let other = $4;
                    let position = tokens$1.head[1];
                    return new Error(new UnexpectedToken(other, position));
                  }
                }
              }
            );
          }
        }
      }
    } else if ($ instanceof RightParen) {
      let tokens$1 = tokens.tail;
      let end = tokens.head[1].byte_offset;
      let span2 = new Span(function$.location.start, end + 1);
      let call$1 = new Call2(span2, function$, reverse(arguments$));
      return after_expression(call$1, tokens$1);
    } else {
      return try$(
        field2(tokens, expression),
        (_use0) => {
          let argument = _use0[0];
          let tokens$1 = _use0[1];
          let arguments$1 = prepend(argument, arguments$);
          if (tokens$1 instanceof Empty) {
            return new Error(Error$UnexpectedEndOfInput$const);
          } else {
            let $1 = tokens$1.head[0];
            if ($1 instanceof RightParen) {
              let tokens$2 = tokens$1.tail;
              let end = tokens$1.head[1].byte_offset;
              let span2 = new Span(function$.location.start, end + 1);
              let call$1 = new Call2(span2, function$, reverse(arguments$1));
              return after_expression(call$1, tokens$2);
            } else if ($1 instanceof Comma) {
              let tokens$2 = tokens$1.tail;
              return call(arguments$1, function$, tokens$2);
            } else {
              let other = $1;
              let position = tokens$1.head[1];
              return new Error(new UnexpectedToken(other, position));
            }
          }
        }
      );
    }
  }
}
function after_expression(loop$parsed, loop$tokens) {
  while (true) {
    let parsed = loop$parsed;
    let tokens = loop$tokens;
    if (tokens instanceof Empty) {
      return new Ok([parsed, tokens]);
    } else {
      let $ = tokens.tail;
      if ($ instanceof Empty) {
        if (tokens.head[0] instanceof LeftParen) {
          let tokens$1 = $;
          return call(List$Empty$const, parsed, tokens$1);
        } else {
          return new Ok([parsed, tokens]);
        }
      } else {
        let $1 = tokens.head[0];
        if ($1 instanceof LeftParen) {
          let tokens$1 = $;
          return call(List$Empty$const, parsed, tokens$1);
        } else if ($1 instanceof Dot) {
          let $2 = $.head[0];
          if ($2 instanceof Name) {
            let tokens$1 = $.tail;
            let label_start = $.head[1].byte_offset;
            let label2 = $2[0];
            let span2 = new Span(
              parsed.location.start,
              string_offset(label_start, label2)
            );
            let expression$1 = new FieldAccess2(span2, parsed, label2);
            loop$parsed = expression$1;
            loop$tokens = tokens$1;
          } else if ($2 instanceof UpperName) {
            let tokens$1 = $.tail;
            let label_start = $.head[1].byte_offset;
            let label2 = $2[0];
            let span2 = new Span(
              parsed.location.start,
              string_offset(label_start, label2)
            );
            let expression$1 = new FieldAccess2(span2, parsed, label2);
            loop$parsed = expression$1;
            loop$tokens = tokens$1;
          } else if ($2 instanceof Int) {
            let tokens$1 = $.tail;
            let token2 = $2;
            let position = $.head[1];
            let value2 = $2[0];
            let $3 = parse_int(value2);
            if ($3 instanceof Ok) {
              let i = $3[0];
              let end = string_offset(position.byte_offset, value2);
              let span2 = new Span(parsed.location.start, end);
              let expression$1 = new TupleIndex(span2, parsed, i);
              loop$parsed = expression$1;
              loop$tokens = tokens$1;
            } else {
              return new Error(new UnexpectedToken(token2, position));
            }
          } else {
            return new Ok([parsed, tokens]);
          }
        } else {
          return new Ok([parsed, tokens]);
        }
      }
    }
  }
}
function todo_panic(tokens, constructor, start5, keyword_name) {
  if (tokens instanceof Empty) {
    let span2 = span_from_string(start5, keyword_name);
    let expression$1 = constructor(span2, Option$None$const);
    return new Ok([new Some(expression$1), tokens]);
  } else if (tokens.head[0] instanceof As) {
    let tokens$1 = tokens.tail;
    return try$(
      expression(tokens$1),
      (_use0) => {
        let reason = _use0[0];
        let tokens$2 = _use0[1];
        let span2 = new Span(start5, reason.location.end);
        let expression$1 = constructor(span2, new Some(reason));
        return new Ok([new Some(expression$1), tokens$2]);
      }
    );
  } else {
    let span2 = span_from_string(start5, keyword_name);
    let expression$1 = constructor(span2, Option$None$const);
    return new Ok([new Some(expression$1), tokens]);
  }
}
function optional_clause_guard(tokens) {
  if (tokens instanceof Empty) {
    return new Ok([Option$None$const, tokens]);
  } else if (tokens.head[0] instanceof If) {
    let tokens$1 = tokens.tail;
    return try$(
      expression(tokens$1),
      (_use0) => {
        let expression$1 = _use0[0];
        let tokens$2 = _use0[1];
        return new Ok([new Some(expression$1), tokens$2]);
      }
    );
  } else {
    return new Ok([Option$None$const, tokens]);
  }
}
function case_clause(tokens) {
  let multipatterns = (_capture) => {
    return delimited(List$Empty$const, _capture, pattern, Token$Comma$const);
  };
  let result = delimited(
    List$Empty$const,
    tokens,
    multipatterns,
    Token$VBar$const
  );
  return try$(
    result,
    (_use0) => {
      let patterns = _use0[0];
      let tokens$1 = _use0[1];
      return try$(
        optional_clause_guard(tokens$1),
        (_use02) => {
          let guard2 = _use02[0];
          let tokens$2 = _use02[1];
          return expect(
            Token$RightArrow$const,
            tokens$2,
            (_, tokens2) => {
              return map4(
                expression(tokens2),
                (_use03) => {
                  let expression$1 = _use03[0];
                  let tokens$3 = _use03[1];
                  return [new Clause(patterns, guard2, expression$1), tokens$3];
                }
              );
            }
          );
        }
      );
    }
  );
}
function case_clauses(clauses, tokens) {
  return try$(
    case_clause(tokens),
    (_use0) => {
      let clause = _use0[0];
      let tokens$1 = _use0[1];
      let clauses$1 = prepend(clause, clauses);
      if (tokens$1 instanceof Empty) {
        return case_clauses(clauses$1, tokens$1);
      } else if (tokens$1.head[0] instanceof RightBrace) {
        let tokens$2 = tokens$1.tail;
        let end = tokens$1.head[1].byte_offset;
        return new Ok([reverse(clauses$1), tokens$2, end + 1]);
      } else {
        return case_clauses(clauses$1, tokens$1);
      }
    }
  );
}
function case_subjects(subjects, tokens) {
  return try$(
    expression(tokens),
    (_use0) => {
      let subject = _use0[0];
      let tokens$1 = _use0[1];
      let subjects$1 = prepend(subject, subjects);
      if (tokens$1 instanceof Empty) {
        return new Ok([reverse(subjects$1), tokens$1]);
      } else if (tokens$1.head[0] instanceof Comma) {
        let tokens$2 = tokens$1.tail;
        return case_subjects(subjects$1, tokens$2);
      } else {
        return new Ok([reverse(subjects$1), tokens$1]);
      }
    }
  );
}
function case_(tokens, start5) {
  return try$(
    case_subjects(List$Empty$const, tokens),
    (_use0) => {
      let subjects = _use0[0];
      let tokens$1 = _use0[1];
      return expect(
        Token$LeftBrace$const,
        tokens$1,
        (_, tokens2) => {
          return try$(
            case_clauses(List$Empty$const, tokens2),
            (_use02) => {
              let clauses = _use02[0];
              let tokens$2 = _use02[1];
              let end = _use02[2];
              return new Ok(
                [
                  new Some(new Case3(new Span(start5, end), subjects, clauses)),
                  tokens$2
                ]
              );
            }
          );
        }
      );
    }
  );
}
function fn_(tokens, start5) {
  return expect(
    Token$LeftParen$const,
    tokens,
    (_, tokens2) => {
      let result = comma_delimited(
        List$Empty$const,
        tokens2,
        fn_parameter,
        Token$RightParen$const
      );
      return try$(
        result,
        (_use0) => {
          let parameters = _use0[0];
          let tokens$1 = _use0[2];
          return try$(
            optional_return_annotation(0, tokens$1),
            (_use02) => {
              let return$ = _use02[0];
              let tokens$2 = _use02[2];
              return expect(
                Token$LeftBrace$const,
                tokens$2,
                (_2, tokens3) => {
                  return try$(
                    statements(List$Empty$const, tokens3),
                    (_use03) => {
                      let body = _use03[0];
                      let end = _use03[1];
                      let tokens$3 = _use03[2];
                      return new Ok(
                        [
                          new Some(
                            new Fn2(
                              new Span(start5, end),
                              parameters,
                              return$,
                              body
                            )
                          ),
                          tokens$3
                        ]
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function record_update_field(tokens) {
  if (tokens instanceof Empty) {
    return new Error(Error$UnexpectedEndOfInput$const);
  } else {
    let $ = tokens.tail;
    if ($ instanceof Empty) {
      let other = tokens.head[0];
      let position = tokens.head[1];
      return new Error(new UnexpectedToken(other, position));
    } else {
      let $1 = tokens.head[0];
      if ($1 instanceof Name && $.head[0] instanceof Colon) {
        let tokens$1 = $.tail;
        let name$1 = $1[0];
        if (tokens$1 instanceof Empty) {
          return try$(
            expression(tokens$1),
            (_use0) => {
              let expression$1 = _use0[0];
              let tokens$2 = _use0[1];
              return new Ok(
                [
                  new RecordUpdateField(name$1, new Some(expression$1)),
                  tokens$2
                ]
              );
            }
          );
        } else {
          let $2 = tokens$1.head[0];
          if ($2 instanceof RightParen) {
            return new Ok(
              [new RecordUpdateField(name$1, Option$None$const), tokens$1]
            );
          } else if ($2 instanceof Comma) {
            return new Ok(
              [new RecordUpdateField(name$1, Option$None$const), tokens$1]
            );
          } else {
            return try$(
              expression(tokens$1),
              (_use0) => {
                let expression$1 = _use0[0];
                let tokens$2 = _use0[1];
                return new Ok(
                  [
                    new RecordUpdateField(name$1, new Some(expression$1)),
                    tokens$2
                  ]
                );
              }
            );
          }
        }
      } else {
        let other = $1;
        let position = tokens.head[1];
        return new Error(new UnexpectedToken(other, position));
      }
    }
  }
}
function record_update(module2, constructor, tokens, start5) {
  return try$(
    expression(tokens),
    (_use0) => {
      let record = _use0[0];
      let tokens$1 = _use0[1];
      if (tokens$1 instanceof Empty) {
        return new Ok([Option$None$const, tokens$1]);
      } else {
        let $ = tokens$1.head[0];
        if ($ instanceof RightParen) {
          let tokens$2 = tokens$1.tail;
          let end = tokens$1.head[1].byte_offset;
          let span2 = new Span(start5, end + 1);
          let expression$1 = new RecordUpdate(
            span2,
            module2,
            constructor,
            record,
            List$Empty$const
          );
          return new Ok([new Some(expression$1), tokens$2]);
        } else if ($ instanceof Comma) {
          let tokens$2 = tokens$1.tail;
          let result = comma_delimited(
            List$Empty$const,
            tokens$2,
            record_update_field,
            Token$RightParen$const
          );
          return try$(
            result,
            (_use02) => {
              let fields = _use02[0];
              let end = _use02[1];
              let tokens$3 = _use02[2];
              let span2 = new Span(start5, end);
              let expression$1 = new RecordUpdate(
                span2,
                module2,
                constructor,
                record,
                fields
              );
              return new Ok([new Some(expression$1), tokens$3]);
            }
          );
        } else {
          return new Ok([Option$None$const, tokens$1]);
        }
      }
    }
  );
}
function expression_unit(tokens, context) {
  return try$(
    (() => {
      if (tokens instanceof Empty) {
        return new Ok([Option$None$const, tokens]);
      } else {
        let $ = tokens.tail;
        if ($ instanceof Empty) {
          let $1 = tokens.head[0];
          if ($1 instanceof Name) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            let name$1 = $1[0];
            let span2 = span_from_string(start5, name$1);
            return new Ok([new Some(new Variable(span2, name$1)), tokens$1]);
          } else if ($1 instanceof UpperName) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            let name$1 = $1[0];
            return new Ok(
              [
                new Some(new Variable(span_from_string(start5, name$1), name$1)),
                tokens$1
              ]
            );
          } else if ($1 instanceof Int) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            let value2 = $1[0];
            let span2 = span_from_string(start5, value2);
            return new Ok([new Some(new Int2(span2, value2)), tokens$1]);
          } else if ($1 instanceof Float) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            let value2 = $1[0];
            let span2 = span_from_string(start5, value2);
            return new Ok([new Some(new Float2(span2, value2)), tokens$1]);
          } else if ($1 instanceof String2) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            let value2 = $1[0];
            let span2 = new Span(start5, string_offset(start5, value2) + 2);
            return new Ok([new Some(new String3(span2, value2)), tokens$1]);
          } else if ($1 instanceof Case2) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            return case_(tokens$1, start5);
          } else if ($1 instanceof Echo) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            let _block;
            if (context instanceof RegularExpressionUnit) {
              _block = map4(
                expression(tokens$1),
                (expression_and_tokens) => {
                  let expression$1 = expression_and_tokens[0];
                  let tokens$2 = expression_and_tokens[1];
                  let span2 = new Span(start5, expression$1.location.end);
                  return [span2, new Some(expression$1), tokens$2];
                }
              );
            } else {
              let span2 = span_from_string(start5, "echo");
              _block = new Ok([span2, Option$None$const, tokens$1]);
            }
            let result = _block;
            return try$(
              result,
              (_use0) => {
                let span2 = _use0[0];
                let echo_expression = _use0[1];
                let tokens$2 = _use0[2];
                if (tokens$2 instanceof Empty) {
                  return new Ok(
                    [
                      new Some(
                        new Echo2(span2, echo_expression, Option$None$const)
                      ),
                      tokens$2
                    ]
                  );
                } else if (tokens$2.head[0] instanceof As) {
                  let tokens$3 = tokens$2.tail;
                  return map4(
                    expression(tokens$3),
                    (_use02) => {
                      let message = _use02[0];
                      let tokens$4 = _use02[1];
                      let span$1 = new Span(span2.start, message.location.end);
                      return [
                        new Some(
                          new Echo2(span$1, echo_expression, new Some(message))
                        ),
                        tokens$4
                      ];
                    }
                  );
                } else {
                  return new Ok(
                    [
                      new Some(
                        new Echo2(span2, echo_expression, Option$None$const)
                      ),
                      tokens$2
                    ]
                  );
                }
              }
            );
          } else if ($1 instanceof Fn) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            return fn_(tokens$1, start5);
          } else if ($1 instanceof Panic) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            return todo_panic(
              tokens$1,
              (var0, var1) => {
                return new Panic2(var0, var1);
              },
              start5,
              "panic"
            );
          } else if ($1 instanceof Todo) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            return todo_panic(
              tokens$1,
              (var0, var1) => {
                return new Todo2(var0, var1);
              },
              start5,
              "todo"
            );
          } else if ($1 instanceof LeftBrace) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            return map4(
              statements(List$Empty$const, tokens$1),
              (_use0) => {
                let statements$1 = _use0[0];
                let end = _use0[1];
                let tokens$2 = _use0[2];
                return [
                  new Some(new Block(new Span(start5, end), statements$1)),
                  tokens$2
                ];
              }
            );
          } else if ($1 instanceof LeftSquare) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            let result = list4(
              expression,
              Option$None$const,
              List$Empty$const,
              tokens$1
            );
            return map4(
              result,
              (_use0) => {
                let elements = _use0.values;
                let rest = _use0.spread;
                let tokens$2 = _use0.remaining_tokens;
                let end = _use0.end;
                return [
                  new Some(new List2(new Span(start5, end), elements, rest)),
                  tokens$2
                ];
              }
            );
          } else if ($1 instanceof Minus) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            let unit = expression_unit(
              tokens$1,
              ParseExpressionUnitContext$RegularExpressionUnit$const
            );
            return try$(
              unit,
              (_use0) => {
                let maybe_expression = _use0[0];
                let tokens$2 = _use0[1];
                if (maybe_expression instanceof Some) {
                  let expression$1 = maybe_expression[0];
                  let span2 = new Span(start5, expression$1.location.end);
                  return new Ok(
                    [new Some(new NegateInt(span2, expression$1)), tokens$2]
                  );
                } else {
                  return unexpected_error(tokens$2);
                }
              }
            );
          } else if ($1 instanceof Bang) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            let unit = expression_unit(
              tokens$1,
              ParseExpressionUnitContext$RegularExpressionUnit$const
            );
            return try$(
              unit,
              (_use0) => {
                let maybe_expression = _use0[0];
                let tokens$2 = _use0[1];
                if (maybe_expression instanceof Some) {
                  let expression$1 = maybe_expression[0];
                  let span2 = new Span(start5, expression$1.location.end);
                  return new Ok(
                    [new Some(new NegateBool(span2, expression$1)), tokens$2]
                  );
                } else {
                  return unexpected_error(tokens$2);
                }
              }
            );
          } else if ($1 instanceof LessLess) {
            let tokens$1 = $;
            let start5 = tokens.head[1].byte_offset;
            let parser = (_capture) => {
              return bit_string_segment(expression, _capture);
            };
            let result = comma_delimited(
              List$Empty$const,
              tokens$1,
              parser,
              Token$GreaterGreater$const
            );
            return map4(
              result,
              (_use0) => {
                let segments = _use0[0];
                let end = _use0[1];
                let tokens$2 = _use0[2];
                return [
                  new Some(new BitString(new Span(start5, end), segments)),
                  tokens$2
                ];
              }
            );
          } else {
            return new Ok([Option$None$const, tokens]);
          }
        } else {
          let $1 = $.tail;
          if ($1 instanceof Empty) {
            let $2 = tokens.head[0];
            if ($2 instanceof Name) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              let name$1 = $2[0];
              let span2 = span_from_string(start5, name$1);
              return new Ok([new Some(new Variable(span2, name$1)), tokens$1]);
            } else if ($2 instanceof UpperName) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              let name$1 = $2[0];
              return new Ok(
                [
                  new Some(
                    new Variable(span_from_string(start5, name$1), name$1)
                  ),
                  tokens$1
                ]
              );
            } else if ($2 instanceof Int) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              let value2 = $2[0];
              let span2 = span_from_string(start5, value2);
              return new Ok([new Some(new Int2(span2, value2)), tokens$1]);
            } else if ($2 instanceof Float) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              let value2 = $2[0];
              let span2 = span_from_string(start5, value2);
              return new Ok([new Some(new Float2(span2, value2)), tokens$1]);
            } else if ($2 instanceof String2) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              let value2 = $2[0];
              let span2 = new Span(start5, string_offset(start5, value2) + 2);
              return new Ok([new Some(new String3(span2, value2)), tokens$1]);
            } else if ($2 instanceof Case2) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              return case_(tokens$1, start5);
            } else if ($2 instanceof Echo) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              let _block;
              if (context instanceof RegularExpressionUnit) {
                _block = map4(
                  expression(tokens$1),
                  (expression_and_tokens) => {
                    let expression$1 = expression_and_tokens[0];
                    let tokens$2 = expression_and_tokens[1];
                    let span2 = new Span(start5, expression$1.location.end);
                    return [span2, new Some(expression$1), tokens$2];
                  }
                );
              } else {
                let span2 = span_from_string(start5, "echo");
                _block = new Ok([span2, Option$None$const, tokens$1]);
              }
              let result = _block;
              return try$(
                result,
                (_use0) => {
                  let span2 = _use0[0];
                  let echo_expression = _use0[1];
                  let tokens$2 = _use0[2];
                  if (tokens$2 instanceof Empty) {
                    return new Ok(
                      [
                        new Some(
                          new Echo2(span2, echo_expression, Option$None$const)
                        ),
                        tokens$2
                      ]
                    );
                  } else if (tokens$2.head[0] instanceof As) {
                    let tokens$3 = tokens$2.tail;
                    return map4(
                      expression(tokens$3),
                      (_use02) => {
                        let message = _use02[0];
                        let tokens$4 = _use02[1];
                        let span$1 = new Span(span2.start, message.location.end);
                        return [
                          new Some(
                            new Echo2(span$1, echo_expression, new Some(message))
                          ),
                          tokens$4
                        ];
                      }
                    );
                  } else {
                    return new Ok(
                      [
                        new Some(
                          new Echo2(span2, echo_expression, Option$None$const)
                        ),
                        tokens$2
                      ]
                    );
                  }
                }
              );
            } else if ($2 instanceof Fn) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              return fn_(tokens$1, start5);
            } else if ($2 instanceof Panic) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              return todo_panic(
                tokens$1,
                (var0, var1) => {
                  return new Panic2(var0, var1);
                },
                start5,
                "panic"
              );
            } else if ($2 instanceof Todo) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              return todo_panic(
                tokens$1,
                (var0, var1) => {
                  return new Todo2(var0, var1);
                },
                start5,
                "todo"
              );
            } else if ($2 instanceof LeftBrace) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              return map4(
                statements(List$Empty$const, tokens$1),
                (_use0) => {
                  let statements$1 = _use0[0];
                  let end = _use0[1];
                  let tokens$2 = _use0[2];
                  return [
                    new Some(new Block(new Span(start5, end), statements$1)),
                    tokens$2
                  ];
                }
              );
            } else if ($2 instanceof LeftSquare) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              let result = list4(
                expression,
                Option$None$const,
                List$Empty$const,
                tokens$1
              );
              return map4(
                result,
                (_use0) => {
                  let elements = _use0.values;
                  let rest = _use0.spread;
                  let tokens$2 = _use0.remaining_tokens;
                  let end = _use0.end;
                  return [
                    new Some(new List2(new Span(start5, end), elements, rest)),
                    tokens$2
                  ];
                }
              );
            } else if ($2 instanceof Minus) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              let unit = expression_unit(
                tokens$1,
                ParseExpressionUnitContext$RegularExpressionUnit$const
              );
              return try$(
                unit,
                (_use0) => {
                  let maybe_expression = _use0[0];
                  let tokens$2 = _use0[1];
                  if (maybe_expression instanceof Some) {
                    let expression$1 = maybe_expression[0];
                    let span2 = new Span(start5, expression$1.location.end);
                    return new Ok(
                      [new Some(new NegateInt(span2, expression$1)), tokens$2]
                    );
                  } else {
                    return unexpected_error(tokens$2);
                  }
                }
              );
            } else if ($2 instanceof Hash && $.head[0] instanceof LeftParen) {
              let start5 = tokens.head[1].byte_offset;
              let tokens$1 = $1;
              let result = comma_delimited(
                List$Empty$const,
                tokens$1,
                expression,
                Token$RightParen$const
              );
              return map4(
                result,
                (_use0) => {
                  let expressions = _use0[0];
                  let end = _use0[1];
                  let tokens$2 = _use0[2];
                  return [
                    new Some(new Tuple(new Span(start5, end), expressions)),
                    tokens$2
                  ];
                }
              );
            } else if ($2 instanceof Bang) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              let unit = expression_unit(
                tokens$1,
                ParseExpressionUnitContext$RegularExpressionUnit$const
              );
              return try$(
                unit,
                (_use0) => {
                  let maybe_expression = _use0[0];
                  let tokens$2 = _use0[1];
                  if (maybe_expression instanceof Some) {
                    let expression$1 = maybe_expression[0];
                    let span2 = new Span(start5, expression$1.location.end);
                    return new Ok(
                      [new Some(new NegateBool(span2, expression$1)), tokens$2]
                    );
                  } else {
                    return unexpected_error(tokens$2);
                  }
                }
              );
            } else if ($2 instanceof LessLess) {
              let tokens$1 = $;
              let start5 = tokens.head[1].byte_offset;
              let parser = (_capture) => {
                return bit_string_segment(expression, _capture);
              };
              let result = comma_delimited(
                List$Empty$const,
                tokens$1,
                parser,
                Token$GreaterGreater$const
              );
              return map4(
                result,
                (_use0) => {
                  let segments = _use0[0];
                  let end = _use0[1];
                  let tokens$2 = _use0[2];
                  return [
                    new Some(new BitString(new Span(start5, end), segments)),
                    tokens$2
                  ];
                }
              );
            } else {
              return new Ok([Option$None$const, tokens]);
            }
          } else {
            let $2 = $1.tail;
            if ($2 instanceof Empty) {
              let $3 = tokens.head[0];
              if ($3 instanceof Name) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                let name$1 = $3[0];
                let span2 = span_from_string(start5, name$1);
                return new Ok([new Some(new Variable(span2, name$1)), tokens$1]);
              } else if ($3 instanceof UpperName) {
                if ($.head[0] instanceof LeftParen && $1.head[0] instanceof DotDot) {
                  let start5 = tokens.head[1].byte_offset;
                  let tokens$1 = $2;
                  let constructor = $3[0];
                  return record_update(
                    Option$None$const,
                    constructor,
                    tokens$1,
                    start5
                  );
                } else {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let name$1 = $3[0];
                  return new Ok(
                    [
                      new Some(
                        new Variable(span_from_string(start5, name$1), name$1)
                      ),
                      tokens$1
                    ]
                  );
                }
              } else if ($3 instanceof Int) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                let value2 = $3[0];
                let span2 = span_from_string(start5, value2);
                return new Ok([new Some(new Int2(span2, value2)), tokens$1]);
              } else if ($3 instanceof Float) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                let value2 = $3[0];
                let span2 = span_from_string(start5, value2);
                return new Ok([new Some(new Float2(span2, value2)), tokens$1]);
              } else if ($3 instanceof String2) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                let value2 = $3[0];
                let span2 = new Span(start5, string_offset(start5, value2) + 2);
                return new Ok([new Some(new String3(span2, value2)), tokens$1]);
              } else if ($3 instanceof Case2) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                return case_(tokens$1, start5);
              } else if ($3 instanceof Echo) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                let _block;
                if (context instanceof RegularExpressionUnit) {
                  _block = map4(
                    expression(tokens$1),
                    (expression_and_tokens) => {
                      let expression$1 = expression_and_tokens[0];
                      let tokens$2 = expression_and_tokens[1];
                      let span2 = new Span(start5, expression$1.location.end);
                      return [span2, new Some(expression$1), tokens$2];
                    }
                  );
                } else {
                  let span2 = span_from_string(start5, "echo");
                  _block = new Ok([span2, Option$None$const, tokens$1]);
                }
                let result = _block;
                return try$(
                  result,
                  (_use0) => {
                    let span2 = _use0[0];
                    let echo_expression = _use0[1];
                    let tokens$2 = _use0[2];
                    if (tokens$2 instanceof Empty) {
                      return new Ok(
                        [
                          new Some(
                            new Echo2(span2, echo_expression, Option$None$const)
                          ),
                          tokens$2
                        ]
                      );
                    } else if (tokens$2.head[0] instanceof As) {
                      let tokens$3 = tokens$2.tail;
                      return map4(
                        expression(tokens$3),
                        (_use02) => {
                          let message = _use02[0];
                          let tokens$4 = _use02[1];
                          let span$1 = new Span(
                            span2.start,
                            message.location.end
                          );
                          return [
                            new Some(
                              new Echo2(
                                span$1,
                                echo_expression,
                                new Some(message)
                              )
                            ),
                            tokens$4
                          ];
                        }
                      );
                    } else {
                      return new Ok(
                        [
                          new Some(
                            new Echo2(span2, echo_expression, Option$None$const)
                          ),
                          tokens$2
                        ]
                      );
                    }
                  }
                );
              } else if ($3 instanceof Fn) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                return fn_(tokens$1, start5);
              } else if ($3 instanceof Panic) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                return todo_panic(
                  tokens$1,
                  (var0, var1) => {
                    return new Panic2(var0, var1);
                  },
                  start5,
                  "panic"
                );
              } else if ($3 instanceof Todo) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                return todo_panic(
                  tokens$1,
                  (var0, var1) => {
                    return new Todo2(var0, var1);
                  },
                  start5,
                  "todo"
                );
              } else if ($3 instanceof LeftBrace) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                return map4(
                  statements(List$Empty$const, tokens$1),
                  (_use0) => {
                    let statements$1 = _use0[0];
                    let end = _use0[1];
                    let tokens$2 = _use0[2];
                    return [
                      new Some(new Block(new Span(start5, end), statements$1)),
                      tokens$2
                    ];
                  }
                );
              } else if ($3 instanceof LeftSquare) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                let result = list4(
                  expression,
                  Option$None$const,
                  List$Empty$const,
                  tokens$1
                );
                return map4(
                  result,
                  (_use0) => {
                    let elements = _use0.values;
                    let rest = _use0.spread;
                    let tokens$2 = _use0.remaining_tokens;
                    let end = _use0.end;
                    return [
                      new Some(new List2(new Span(start5, end), elements, rest)),
                      tokens$2
                    ];
                  }
                );
              } else if ($3 instanceof Minus) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                let unit = expression_unit(
                  tokens$1,
                  ParseExpressionUnitContext$RegularExpressionUnit$const
                );
                return try$(
                  unit,
                  (_use0) => {
                    let maybe_expression = _use0[0];
                    let tokens$2 = _use0[1];
                    if (maybe_expression instanceof Some) {
                      let expression$1 = maybe_expression[0];
                      let span2 = new Span(start5, expression$1.location.end);
                      return new Ok(
                        [new Some(new NegateInt(span2, expression$1)), tokens$2]
                      );
                    } else {
                      return unexpected_error(tokens$2);
                    }
                  }
                );
              } else if ($3 instanceof Hash && $.head[0] instanceof LeftParen) {
                let start5 = tokens.head[1].byte_offset;
                let tokens$1 = $1;
                let result = comma_delimited(
                  List$Empty$const,
                  tokens$1,
                  expression,
                  Token$RightParen$const
                );
                return map4(
                  result,
                  (_use0) => {
                    let expressions = _use0[0];
                    let end = _use0[1];
                    let tokens$2 = _use0[2];
                    return [
                      new Some(new Tuple(new Span(start5, end), expressions)),
                      tokens$2
                    ];
                  }
                );
              } else if ($3 instanceof Bang) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                let unit = expression_unit(
                  tokens$1,
                  ParseExpressionUnitContext$RegularExpressionUnit$const
                );
                return try$(
                  unit,
                  (_use0) => {
                    let maybe_expression = _use0[0];
                    let tokens$2 = _use0[1];
                    if (maybe_expression instanceof Some) {
                      let expression$1 = maybe_expression[0];
                      let span2 = new Span(start5, expression$1.location.end);
                      return new Ok(
                        [new Some(new NegateBool(span2, expression$1)), tokens$2]
                      );
                    } else {
                      return unexpected_error(tokens$2);
                    }
                  }
                );
              } else if ($3 instanceof LessLess) {
                let tokens$1 = $;
                let start5 = tokens.head[1].byte_offset;
                let parser = (_capture) => {
                  return bit_string_segment(expression, _capture);
                };
                let result = comma_delimited(
                  List$Empty$const,
                  tokens$1,
                  parser,
                  Token$GreaterGreater$const
                );
                return map4(
                  result,
                  (_use0) => {
                    let segments = _use0[0];
                    let end = _use0[1];
                    let tokens$2 = _use0[2];
                    return [
                      new Some(new BitString(new Span(start5, end), segments)),
                      tokens$2
                    ];
                  }
                );
              } else {
                return new Ok([Option$None$const, tokens]);
              }
            } else {
              let $3 = $2.tail;
              if ($3 instanceof Empty) {
                let $4 = tokens.head[0];
                if ($4 instanceof Name) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let name$1 = $4[0];
                  let span2 = span_from_string(start5, name$1);
                  return new Ok(
                    [new Some(new Variable(span2, name$1)), tokens$1]
                  );
                } else if ($4 instanceof UpperName) {
                  if ($.head[0] instanceof LeftParen && $1.head[0] instanceof DotDot) {
                    let start5 = tokens.head[1].byte_offset;
                    let tokens$1 = $2;
                    let constructor = $4[0];
                    return record_update(
                      Option$None$const,
                      constructor,
                      tokens$1,
                      start5
                    );
                  } else {
                    let tokens$1 = $;
                    let start5 = tokens.head[1].byte_offset;
                    let name$1 = $4[0];
                    return new Ok(
                      [
                        new Some(
                          new Variable(span_from_string(start5, name$1), name$1)
                        ),
                        tokens$1
                      ]
                    );
                  }
                } else if ($4 instanceof Int) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let value2 = $4[0];
                  let span2 = span_from_string(start5, value2);
                  return new Ok([new Some(new Int2(span2, value2)), tokens$1]);
                } else if ($4 instanceof Float) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let value2 = $4[0];
                  let span2 = span_from_string(start5, value2);
                  return new Ok([new Some(new Float2(span2, value2)), tokens$1]);
                } else if ($4 instanceof String2) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let value2 = $4[0];
                  let span2 = new Span(start5, string_offset(start5, value2) + 2);
                  return new Ok([new Some(new String3(span2, value2)), tokens$1]);
                } else if ($4 instanceof Case2) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  return case_(tokens$1, start5);
                } else if ($4 instanceof Echo) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let _block;
                  if (context instanceof RegularExpressionUnit) {
                    _block = map4(
                      expression(tokens$1),
                      (expression_and_tokens) => {
                        let expression$1 = expression_and_tokens[0];
                        let tokens$2 = expression_and_tokens[1];
                        let span2 = new Span(start5, expression$1.location.end);
                        return [span2, new Some(expression$1), tokens$2];
                      }
                    );
                  } else {
                    let span2 = span_from_string(start5, "echo");
                    _block = new Ok([span2, Option$None$const, tokens$1]);
                  }
                  let result = _block;
                  return try$(
                    result,
                    (_use0) => {
                      let span2 = _use0[0];
                      let echo_expression = _use0[1];
                      let tokens$2 = _use0[2];
                      if (tokens$2 instanceof Empty) {
                        return new Ok(
                          [
                            new Some(
                              new Echo2(span2, echo_expression, Option$None$const)
                            ),
                            tokens$2
                          ]
                        );
                      } else if (tokens$2.head[0] instanceof As) {
                        let tokens$3 = tokens$2.tail;
                        return map4(
                          expression(tokens$3),
                          (_use02) => {
                            let message = _use02[0];
                            let tokens$4 = _use02[1];
                            let span$1 = new Span(
                              span2.start,
                              message.location.end
                            );
                            return [
                              new Some(
                                new Echo2(
                                  span$1,
                                  echo_expression,
                                  new Some(message)
                                )
                              ),
                              tokens$4
                            ];
                          }
                        );
                      } else {
                        return new Ok(
                          [
                            new Some(
                              new Echo2(span2, echo_expression, Option$None$const)
                            ),
                            tokens$2
                          ]
                        );
                      }
                    }
                  );
                } else if ($4 instanceof Fn) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  return fn_(tokens$1, start5);
                } else if ($4 instanceof Panic) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  return todo_panic(
                    tokens$1,
                    (var0, var1) => {
                      return new Panic2(var0, var1);
                    },
                    start5,
                    "panic"
                  );
                } else if ($4 instanceof Todo) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  return todo_panic(
                    tokens$1,
                    (var0, var1) => {
                      return new Todo2(var0, var1);
                    },
                    start5,
                    "todo"
                  );
                } else if ($4 instanceof LeftBrace) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  return map4(
                    statements(List$Empty$const, tokens$1),
                    (_use0) => {
                      let statements$1 = _use0[0];
                      let end = _use0[1];
                      let tokens$2 = _use0[2];
                      return [
                        new Some(new Block(new Span(start5, end), statements$1)),
                        tokens$2
                      ];
                    }
                  );
                } else if ($4 instanceof LeftSquare) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let result = list4(
                    expression,
                    Option$None$const,
                    List$Empty$const,
                    tokens$1
                  );
                  return map4(
                    result,
                    (_use0) => {
                      let elements = _use0.values;
                      let rest = _use0.spread;
                      let tokens$2 = _use0.remaining_tokens;
                      let end = _use0.end;
                      return [
                        new Some(new List2(new Span(start5, end), elements, rest)),
                        tokens$2
                      ];
                    }
                  );
                } else if ($4 instanceof Minus) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let unit = expression_unit(
                    tokens$1,
                    ParseExpressionUnitContext$RegularExpressionUnit$const
                  );
                  return try$(
                    unit,
                    (_use0) => {
                      let maybe_expression = _use0[0];
                      let tokens$2 = _use0[1];
                      if (maybe_expression instanceof Some) {
                        let expression$1 = maybe_expression[0];
                        let span2 = new Span(start5, expression$1.location.end);
                        return new Ok(
                          [
                            new Some(new NegateInt(span2, expression$1)),
                            tokens$2
                          ]
                        );
                      } else {
                        return unexpected_error(tokens$2);
                      }
                    }
                  );
                } else if ($4 instanceof Hash && $.head[0] instanceof LeftParen) {
                  let start5 = tokens.head[1].byte_offset;
                  let tokens$1 = $1;
                  let result = comma_delimited(
                    List$Empty$const,
                    tokens$1,
                    expression,
                    Token$RightParen$const
                  );
                  return map4(
                    result,
                    (_use0) => {
                      let expressions = _use0[0];
                      let end = _use0[1];
                      let tokens$2 = _use0[2];
                      return [
                        new Some(new Tuple(new Span(start5, end), expressions)),
                        tokens$2
                      ];
                    }
                  );
                } else if ($4 instanceof Bang) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let unit = expression_unit(
                    tokens$1,
                    ParseExpressionUnitContext$RegularExpressionUnit$const
                  );
                  return try$(
                    unit,
                    (_use0) => {
                      let maybe_expression = _use0[0];
                      let tokens$2 = _use0[1];
                      if (maybe_expression instanceof Some) {
                        let expression$1 = maybe_expression[0];
                        let span2 = new Span(start5, expression$1.location.end);
                        return new Ok(
                          [
                            new Some(new NegateBool(span2, expression$1)),
                            tokens$2
                          ]
                        );
                      } else {
                        return unexpected_error(tokens$2);
                      }
                    }
                  );
                } else if ($4 instanceof LessLess) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let parser = (_capture) => {
                    return bit_string_segment(expression, _capture);
                  };
                  let result = comma_delimited(
                    List$Empty$const,
                    tokens$1,
                    parser,
                    Token$GreaterGreater$const
                  );
                  return map4(
                    result,
                    (_use0) => {
                      let segments = _use0[0];
                      let end = _use0[1];
                      let tokens$2 = _use0[2];
                      return [
                        new Some(new BitString(new Span(start5, end), segments)),
                        tokens$2
                      ];
                    }
                  );
                } else {
                  return new Ok([Option$None$const, tokens]);
                }
              } else {
                let $4 = tokens.head[0];
                if ($4 instanceof Name) {
                  if ($.head[0] instanceof Dot) {
                    let $5 = $1.head[0];
                    if ($5 instanceof UpperName && $2.head[0] instanceof LeftParen && $3.head[0] instanceof DotDot) {
                      let start5 = tokens.head[1].byte_offset;
                      let tokens$1 = $3.tail;
                      let module$1 = $4[0];
                      let constructor = $5[0];
                      return record_update(
                        new Some(module$1),
                        constructor,
                        tokens$1,
                        start5
                      );
                    } else {
                      let tokens$1 = $;
                      let start5 = tokens.head[1].byte_offset;
                      let name$1 = $4[0];
                      let span2 = span_from_string(start5, name$1);
                      return new Ok(
                        [new Some(new Variable(span2, name$1)), tokens$1]
                      );
                    }
                  } else {
                    let tokens$1 = $;
                    let start5 = tokens.head[1].byte_offset;
                    let name$1 = $4[0];
                    let span2 = span_from_string(start5, name$1);
                    return new Ok(
                      [new Some(new Variable(span2, name$1)), tokens$1]
                    );
                  }
                } else if ($4 instanceof UpperName) {
                  if ($.head[0] instanceof LeftParen && $1.head[0] instanceof DotDot) {
                    let start5 = tokens.head[1].byte_offset;
                    let tokens$1 = $2;
                    let constructor = $4[0];
                    return record_update(
                      Option$None$const,
                      constructor,
                      tokens$1,
                      start5
                    );
                  } else {
                    let tokens$1 = $;
                    let start5 = tokens.head[1].byte_offset;
                    let name$1 = $4[0];
                    return new Ok(
                      [
                        new Some(
                          new Variable(span_from_string(start5, name$1), name$1)
                        ),
                        tokens$1
                      ]
                    );
                  }
                } else if ($4 instanceof Int) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let value2 = $4[0];
                  let span2 = span_from_string(start5, value2);
                  return new Ok([new Some(new Int2(span2, value2)), tokens$1]);
                } else if ($4 instanceof Float) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let value2 = $4[0];
                  let span2 = span_from_string(start5, value2);
                  return new Ok([new Some(new Float2(span2, value2)), tokens$1]);
                } else if ($4 instanceof String2) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let value2 = $4[0];
                  let span2 = new Span(start5, string_offset(start5, value2) + 2);
                  return new Ok([new Some(new String3(span2, value2)), tokens$1]);
                } else if ($4 instanceof Case2) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  return case_(tokens$1, start5);
                } else if ($4 instanceof Echo) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let _block;
                  if (context instanceof RegularExpressionUnit) {
                    _block = map4(
                      expression(tokens$1),
                      (expression_and_tokens) => {
                        let expression$1 = expression_and_tokens[0];
                        let tokens$2 = expression_and_tokens[1];
                        let span2 = new Span(start5, expression$1.location.end);
                        return [span2, new Some(expression$1), tokens$2];
                      }
                    );
                  } else {
                    let span2 = span_from_string(start5, "echo");
                    _block = new Ok([span2, Option$None$const, tokens$1]);
                  }
                  let result = _block;
                  return try$(
                    result,
                    (_use0) => {
                      let span2 = _use0[0];
                      let echo_expression = _use0[1];
                      let tokens$2 = _use0[2];
                      if (tokens$2 instanceof Empty) {
                        return new Ok(
                          [
                            new Some(
                              new Echo2(span2, echo_expression, Option$None$const)
                            ),
                            tokens$2
                          ]
                        );
                      } else if (tokens$2.head[0] instanceof As) {
                        let tokens$3 = tokens$2.tail;
                        return map4(
                          expression(tokens$3),
                          (_use02) => {
                            let message = _use02[0];
                            let tokens$4 = _use02[1];
                            let span$1 = new Span(
                              span2.start,
                              message.location.end
                            );
                            return [
                              new Some(
                                new Echo2(
                                  span$1,
                                  echo_expression,
                                  new Some(message)
                                )
                              ),
                              tokens$4
                            ];
                          }
                        );
                      } else {
                        return new Ok(
                          [
                            new Some(
                              new Echo2(span2, echo_expression, Option$None$const)
                            ),
                            tokens$2
                          ]
                        );
                      }
                    }
                  );
                } else if ($4 instanceof Fn) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  return fn_(tokens$1, start5);
                } else if ($4 instanceof Panic) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  return todo_panic(
                    tokens$1,
                    (var0, var1) => {
                      return new Panic2(var0, var1);
                    },
                    start5,
                    "panic"
                  );
                } else if ($4 instanceof Todo) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  return todo_panic(
                    tokens$1,
                    (var0, var1) => {
                      return new Todo2(var0, var1);
                    },
                    start5,
                    "todo"
                  );
                } else if ($4 instanceof LeftBrace) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  return map4(
                    statements(List$Empty$const, tokens$1),
                    (_use0) => {
                      let statements$1 = _use0[0];
                      let end = _use0[1];
                      let tokens$2 = _use0[2];
                      return [
                        new Some(new Block(new Span(start5, end), statements$1)),
                        tokens$2
                      ];
                    }
                  );
                } else if ($4 instanceof LeftSquare) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let result = list4(
                    expression,
                    Option$None$const,
                    List$Empty$const,
                    tokens$1
                  );
                  return map4(
                    result,
                    (_use0) => {
                      let elements = _use0.values;
                      let rest = _use0.spread;
                      let tokens$2 = _use0.remaining_tokens;
                      let end = _use0.end;
                      return [
                        new Some(new List2(new Span(start5, end), elements, rest)),
                        tokens$2
                      ];
                    }
                  );
                } else if ($4 instanceof Minus) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let unit = expression_unit(
                    tokens$1,
                    ParseExpressionUnitContext$RegularExpressionUnit$const
                  );
                  return try$(
                    unit,
                    (_use0) => {
                      let maybe_expression = _use0[0];
                      let tokens$2 = _use0[1];
                      if (maybe_expression instanceof Some) {
                        let expression$1 = maybe_expression[0];
                        let span2 = new Span(start5, expression$1.location.end);
                        return new Ok(
                          [
                            new Some(new NegateInt(span2, expression$1)),
                            tokens$2
                          ]
                        );
                      } else {
                        return unexpected_error(tokens$2);
                      }
                    }
                  );
                } else if ($4 instanceof Hash && $.head[0] instanceof LeftParen) {
                  let start5 = tokens.head[1].byte_offset;
                  let tokens$1 = $1;
                  let result = comma_delimited(
                    List$Empty$const,
                    tokens$1,
                    expression,
                    Token$RightParen$const
                  );
                  return map4(
                    result,
                    (_use0) => {
                      let expressions = _use0[0];
                      let end = _use0[1];
                      let tokens$2 = _use0[2];
                      return [
                        new Some(new Tuple(new Span(start5, end), expressions)),
                        tokens$2
                      ];
                    }
                  );
                } else if ($4 instanceof Bang) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let unit = expression_unit(
                    tokens$1,
                    ParseExpressionUnitContext$RegularExpressionUnit$const
                  );
                  return try$(
                    unit,
                    (_use0) => {
                      let maybe_expression = _use0[0];
                      let tokens$2 = _use0[1];
                      if (maybe_expression instanceof Some) {
                        let expression$1 = maybe_expression[0];
                        let span2 = new Span(start5, expression$1.location.end);
                        return new Ok(
                          [
                            new Some(new NegateBool(span2, expression$1)),
                            tokens$2
                          ]
                        );
                      } else {
                        return unexpected_error(tokens$2);
                      }
                    }
                  );
                } else if ($4 instanceof LessLess) {
                  let tokens$1 = $;
                  let start5 = tokens.head[1].byte_offset;
                  let parser = (_capture) => {
                    return bit_string_segment(expression, _capture);
                  };
                  let result = comma_delimited(
                    List$Empty$const,
                    tokens$1,
                    parser,
                    Token$GreaterGreater$const
                  );
                  return map4(
                    result,
                    (_use0) => {
                      let segments = _use0[0];
                      let end = _use0[1];
                      let tokens$2 = _use0[2];
                      return [
                        new Some(new BitString(new Span(start5, end), segments)),
                        tokens$2
                      ];
                    }
                  );
                } else {
                  return new Ok([Option$None$const, tokens]);
                }
              }
            }
          }
        }
      }
    })(),
    (_use0) => {
      let parsed = _use0[0];
      let tokens$1 = _use0[1];
      if (parsed instanceof Some) {
        let expression$1 = parsed[0];
        let $ = after_expression(expression$1, tokens$1);
        if ($ instanceof Ok) {
          let expression$2 = $[0][0];
          let tokens$2 = $[0][1];
          return new Ok([new Some(expression$2), tokens$2]);
        } else {
          return $;
        }
      } else {
        return new Ok([Option$None$const, tokens$1]);
      }
    }
  );
}
function expression_loop(tokens, operators, values3, context) {
  return try$(
    expression_unit(tokens, context),
    (_use0) => {
      let expression$1 = _use0[0];
      let tokens$1 = _use0[1];
      if (expression$1 instanceof Some) {
        let e = expression$1[0];
        let values$1 = prepend(e, values3);
        let $ = pop_binary_operator(tokens$1);
        if ($ instanceof Ok) {
          let operator = $[0][0];
          let tokens$2 = $[0][1];
          let $1 = handle_operator(new Some(operator), operators, values$1);
          let $2 = $1[0];
          if ($2 instanceof Some) {
            let expression$2 = $2[0];
            return new Ok([expression$2, tokens$2]);
          } else {
            let operators$1 = $1[1];
            let values$2 = $1[2];
            return expression_loop(
              tokens$2,
              operators$1,
              values$2,
              (() => {
                if (operator instanceof Pipe2) {
                  return ParseExpressionUnitContext$ExpressionUnitAfterPipe$const;
                } else {
                  return ParseExpressionUnitContext$RegularExpressionUnit$const;
                }
              })()
            );
          }
        } else {
          let $1 = handle_operator(Option$None$const, operators, values$1)[0];
          if ($1 instanceof Some) {
            let expression$2 = $1[0];
            return new Ok([expression$2, tokens$1]);
          } else {
            return unexpected_error(tokens$1);
          }
        }
      } else {
        return unexpected_error(tokens$1);
      }
    }
  );
}
function expression(tokens) {
  return expression_loop(
    tokens,
    List$Empty$const,
    List$Empty$const,
    ParseExpressionUnitContext$RegularExpressionUnit$const
  );
}
function assert_(tokens, start5) {
  return try$(
    expression(tokens),
    (_use0) => {
      let subject = _use0[0];
      let tokens$1 = _use0[1];
      if (tokens$1 instanceof Empty) {
        let statement$1 = new Assert2(
          new Span(start5, subject.location.end),
          subject,
          Option$None$const
        );
        return new Ok([statement$1, tokens$1]);
      } else if (tokens$1.head[0] instanceof As) {
        let tokens$2 = tokens$1.tail;
        let $ = expression(tokens$2);
        if ($ instanceof Ok) {
          let message = $[0][0];
          let tokens$3 = $[0][1];
          let statement$1 = new Assert2(
            new Span(start5, message.location.end),
            subject,
            new Some(message)
          );
          return new Ok([statement$1, tokens$3]);
        } else {
          return $;
        }
      } else {
        let statement$1 = new Assert2(
          new Span(start5, subject.location.end),
          subject,
          Option$None$const
        );
        return new Ok([statement$1, tokens$1]);
      }
    }
  );
}
function use_(tokens, start5) {
  return try$(
    (() => {
      if (tokens instanceof Empty) {
        return delimited(
          List$Empty$const,
          tokens,
          use_pattern,
          Token$Comma$const
        );
      } else if (tokens.head[0] instanceof LeftArrow) {
        return new Ok([List$Empty$const, tokens]);
      } else {
        return delimited(
          List$Empty$const,
          tokens,
          use_pattern,
          Token$Comma$const
        );
      }
    })(),
    (_use0) => {
      let patterns = _use0[0];
      let tokens$1 = _use0[1];
      return expect(
        Token$LeftArrow$const,
        tokens$1,
        (_, tokens2) => {
          return try$(
            expression(tokens2),
            (_use02) => {
              let function$ = _use02[0];
              let tokens$2 = _use02[1];
              return new Ok(
                [
                  new Use2(
                    new Span(start5, function$.location.end),
                    patterns,
                    function$
                  ),
                  tokens$2
                ]
              );
            }
          );
        }
      );
    }
  );
}
function assignment(kind, tokens, start5) {
  return try$(
    pattern(tokens),
    (_use0) => {
      let pattern$1 = _use0[0];
      let tokens$1 = _use0[1];
      return try$(
        optional_type_annotation(tokens$1),
        (_use02) => {
          let annotation = _use02[0];
          let tokens$2 = _use02[1];
          return expect(
            Token$Equal$const,
            tokens$2,
            (_, tokens2) => {
              return try$(
                expression(tokens2),
                (_use03) => {
                  let value2 = _use03[0];
                  let tokens$3 = _use03[1];
                  return try$(
                    (() => {
                      if (kind instanceof Let3) {
                        return new Ok([kind, tokens$3, value2.location.end]);
                      } else if (tokens$3 instanceof Empty) {
                        return new Ok([kind, tokens$3, value2.location.end]);
                      } else if (kind.message instanceof None && tokens$3.head[0] instanceof As) {
                        let tokens$4 = tokens$3.tail;
                        return map4(
                          expression(tokens$4),
                          (_use04) => {
                            let message = _use04[0];
                            let tokens$5 = _use04[1];
                            return [
                              new LetAssert(new Some(message)),
                              tokens$5,
                              message.location.end
                            ];
                          }
                        );
                      } else {
                        return new Ok([kind, tokens$3, value2.location.end]);
                      }
                    })(),
                    (_use04) => {
                      let kind$1 = _use04[0];
                      let tokens$4 = _use04[1];
                      let end = _use04[2];
                      let statement$1 = new Assignment(
                        new Span(start5, end),
                        kind$1,
                        pattern$1,
                        annotation,
                        value2
                      );
                      return new Ok([statement$1, tokens$4]);
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function statement(tokens) {
  if (tokens instanceof Empty) {
    let tokens$1 = tokens;
    return try$(
      expression(tokens$1),
      (_use0) => {
        let expression$1 = _use0[0];
        let tokens$2 = _use0[1];
        return new Ok([new Expression(expression$1), tokens$2]);
      }
    );
  } else {
    let $ = tokens.tail;
    if ($ instanceof Empty) {
      let $1 = tokens.head[0];
      if ($1 instanceof Assert) {
        let tokens$1 = $;
        let start5 = tokens.head[1].byte_offset;
        return assert_(tokens$1, start5);
      } else if ($1 instanceof Let2) {
        let tokens$1 = $;
        let start5 = tokens.head[1].byte_offset;
        return assignment(AssignmentKind$Let$const, tokens$1, start5);
      } else if ($1 instanceof Use) {
        let tokens$1 = $;
        let start5 = tokens.head[1].byte_offset;
        return use_(tokens$1, start5);
      } else {
        let tokens$1 = tokens;
        return try$(
          expression(tokens$1),
          (_use0) => {
            let expression$1 = _use0[0];
            let tokens$2 = _use0[1];
            return new Ok([new Expression(expression$1), tokens$2]);
          }
        );
      }
    } else {
      let $1 = tokens.head[0];
      if ($1 instanceof Assert) {
        let tokens$1 = $;
        let start5 = tokens.head[1].byte_offset;
        return assert_(tokens$1, start5);
      } else if ($1 instanceof Let2) {
        if ($.head[0] instanceof Assert) {
          let start5 = tokens.head[1].byte_offset;
          let tokens$1 = $.tail;
          return assignment(new LetAssert(Option$None$const), tokens$1, start5);
        } else {
          let tokens$1 = $;
          let start5 = tokens.head[1].byte_offset;
          return assignment(AssignmentKind$Let$const, tokens$1, start5);
        }
      } else if ($1 instanceof Use) {
        let tokens$1 = $;
        let start5 = tokens.head[1].byte_offset;
        return use_(tokens$1, start5);
      } else {
        let tokens$1 = tokens;
        return try$(
          expression(tokens$1),
          (_use0) => {
            let expression$1 = _use0[0];
            let tokens$2 = _use0[1];
            return new Ok([new Expression(expression$1), tokens$2]);
          }
        );
      }
    }
  }
}
function statements(acc, tokens) {
  if (tokens instanceof Empty) {
    return try$(
      statement(tokens),
      (_use0) => {
        let statement$1 = _use0[0];
        let tokens$1 = _use0[1];
        return statements(prepend(statement$1, acc), tokens$1);
      }
    );
  } else if (tokens.head[0] instanceof RightBrace) {
    let tokens$1 = tokens.tail;
    let end = tokens.head[1].byte_offset;
    return new Ok([reverse(acc), end + 1, tokens$1]);
  } else {
    return try$(
      statement(tokens),
      (_use0) => {
        let statement$1 = _use0[0];
        let tokens$1 = _use0[1];
        return statements(prepend(statement$1, acc), tokens$1);
      }
    );
  }
}
function function_parameter(tokens) {
  return try$(
    (() => {
      if (tokens instanceof Empty) {
        return new Error(Error$UnexpectedEndOfInput$const);
      } else {
        let $ = tokens.tail;
        if ($ instanceof Empty) {
          let $1 = tokens.head[0];
          if ($1 instanceof Name) {
            let tokens$1 = $;
            let name$1 = $1[0];
            return new Ok([Option$None$const, new Named(name$1), tokens$1]);
          } else if ($1 instanceof DiscardName) {
            let tokens$1 = $;
            let name$1 = $1[0];
            return new Ok([Option$None$const, new Discarded(name$1), tokens$1]);
          } else {
            let token2 = $1;
            let position = tokens.head[1];
            return new Error(new UnexpectedToken(token2, position));
          }
        } else {
          let $1 = tokens.head[0];
          if ($1 instanceof Name) {
            let $2 = $.head[0];
            if ($2 instanceof Name) {
              let tokens$1 = $.tail;
              let label2 = $1[0];
              let name$1 = $2[0];
              return new Ok([new Some(label2), new Named(name$1), tokens$1]);
            } else if ($2 instanceof DiscardName) {
              let tokens$1 = $.tail;
              let label2 = $1[0];
              let name$1 = $2[0];
              return new Ok([new Some(label2), new Discarded(name$1), tokens$1]);
            } else {
              let tokens$1 = $;
              let name$1 = $1[0];
              return new Ok([Option$None$const, new Named(name$1), tokens$1]);
            }
          } else if ($1 instanceof DiscardName) {
            let tokens$1 = $;
            let name$1 = $1[0];
            return new Ok([Option$None$const, new Discarded(name$1), tokens$1]);
          } else {
            let token2 = $1;
            let position = tokens.head[1];
            return new Error(new UnexpectedToken(token2, position));
          }
        }
      }
    })(),
    (_use0) => {
      let label2 = _use0[0];
      let parameter = _use0[1];
      let tokens$1 = _use0[2];
      return try$(
        optional_type_annotation(tokens$1),
        (_use02) => {
          let type_$1 = _use02[0];
          let tokens$2 = _use02[1];
          return new Ok(
            [new FunctionParameter(label2, parameter, type_$1), tokens$2]
          );
        }
      );
    }
  );
}
function function_definition(module2, attributes2, publicity, name2, start5, tokens) {
  return expect(
    Token$LeftParen$const,
    tokens,
    (_, tokens2) => {
      let result = comma_delimited(
        List$Empty$const,
        tokens2,
        function_parameter,
        Token$RightParen$const
      );
      return try$(
        result,
        (_use0) => {
          let parameters = _use0[0];
          let end = _use0[1];
          let tokens$1 = _use0[2];
          let result$1 = optional_return_annotation(end, tokens$1);
          return try$(
            result$1,
            (_use02) => {
              let return_type = _use02[0];
              let end$1 = _use02[1];
              let tokens$2 = _use02[2];
              return try$(
                (() => {
                  if (tokens$2 instanceof Empty) {
                    return new Ok([List$Empty$const, end$1, tokens$2]);
                  } else if (tokens$2.head[0] instanceof LeftBrace) {
                    let tokens$3 = tokens$2.tail;
                    return statements(List$Empty$const, tokens$3);
                  } else {
                    return new Ok([List$Empty$const, end$1, tokens$2]);
                  }
                })(),
                (_use03) => {
                  let body = _use03[0];
                  let end$2 = _use03[1];
                  let tokens$3 = _use03[2];
                  let location = new Span(start5, end$2);
                  let function$ = new Function2(
                    location,
                    name2,
                    publicity,
                    parameters,
                    return_type,
                    body
                  );
                  let module$1 = push_function(module2, attributes2, function$);
                  return new Ok([module$1, tokens$3]);
                }
              );
            }
          );
        }
      );
    }
  );
}
function push_constant(module2, attributes2, constant) {
  return new Module(
    module2.imports,
    module2.custom_types,
    module2.type_aliases,
    prepend(
      new Definition(reverse(attributes2), constant),
      module2.constants
    ),
    module2.functions
  );
}
function expect_name(tokens, next2) {
  if (tokens instanceof Empty) {
    return new Error(Error$UnexpectedEndOfInput$const);
  } else {
    let $ = tokens.head[0];
    if ($ instanceof Name) {
      let tokens$1 = tokens.tail;
      let name$1 = $[0];
      return next2(name$1, tokens$1);
    } else {
      let other = $;
      let position = tokens.head[1];
      return new Error(new UnexpectedToken(other, position));
    }
  }
}
function const_definition(module2, attributes2, publicity, tokens, start5) {
  return expect_name(
    tokens,
    (name2, tokens2) => {
      return try$(
        optional_type_annotation(tokens2),
        (_use0) => {
          let annotation = _use0[0];
          let tokens$1 = _use0[1];
          return expect(
            Token$Equal$const,
            tokens$1,
            (_, tokens3) => {
              return try$(
                expression(tokens3),
                (_use02) => {
                  let expression$1 = _use02[0];
                  let tokens$2 = _use02[1];
                  let constant = new Constant(
                    new Span(start5, expression$1.location.end),
                    name2,
                    publicity,
                    annotation,
                    expression$1
                  );
                  let module$1 = push_constant(module2, attributes2, constant);
                  return new Ok([module$1, tokens$2]);
                }
              );
            }
          );
        }
      );
    }
  );
}
function push_custom_type(module2, attributes2, custom_type2) {
  let custom_type$1 = new CustomType2(
    custom_type2.location,
    custom_type2.name,
    custom_type2.publicity,
    custom_type2.opaque_,
    custom_type2.parameters,
    reverse(custom_type2.variants)
  );
  return new Module(
    module2.imports,
    prepend(
      new Definition(reverse(attributes2), custom_type$1),
      module2.custom_types
    ),
    module2.type_aliases,
    module2.constants,
    module2.functions
  );
}
function push_variant(custom_type2, variant) {
  return new CustomType2(
    custom_type2.location,
    custom_type2.name,
    custom_type2.publicity,
    custom_type2.opaque_,
    custom_type2.parameters,
    prepend(variant, custom_type2.variants)
  );
}
function variant_field(tokens) {
  if (tokens instanceof Empty) {
    let tokens$1 = tokens;
    return try$(
      type_2(tokens$1),
      (_use0) => {
        let type_$1 = _use0[0];
        let tokens$2 = _use0[1];
        return new Ok([new UnlabelledVariantField(type_$1), tokens$2]);
      }
    );
  } else {
    let $ = tokens.tail;
    if ($ instanceof Empty) {
      let tokens$1 = tokens;
      return try$(
        type_2(tokens$1),
        (_use0) => {
          let type_$1 = _use0[0];
          let tokens$2 = _use0[1];
          return new Ok([new UnlabelledVariantField(type_$1), tokens$2]);
        }
      );
    } else {
      let $1 = tokens.head[0];
      if ($1 instanceof Name && $.head[0] instanceof Colon) {
        let tokens$1 = $.tail;
        let name$1 = $1[0];
        return try$(
          type_2(tokens$1),
          (_use0) => {
            let type_$1 = _use0[0];
            let tokens$2 = _use0[1];
            return new Ok([new LabelledVariantField(type_$1, name$1), tokens$2]);
          }
        );
      } else {
        let tokens$1 = tokens;
        return try$(
          type_2(tokens$1),
          (_use0) => {
            let type_$1 = _use0[0];
            let tokens$2 = _use0[1];
            return new Ok([new UnlabelledVariantField(type_$1), tokens$2]);
          }
        );
      }
    }
  }
}
function expect_upper_name(tokens, next2) {
  if (tokens instanceof Empty) {
    return new Error(Error$UnexpectedEndOfInput$const);
  } else {
    let $ = tokens.head[0];
    if ($ instanceof UpperName) {
      let tokens$1 = tokens.tail;
      let end = tokens.head[1].byte_offset;
      let name$1 = $[0];
      return next2(name$1, end, tokens$1);
    } else {
      let other = $;
      let position = tokens.head[1];
      return new Error(new UnexpectedToken(other, position));
    }
  }
}
function attribute3(tokens) {
  return try$(
    (() => {
      if (tokens instanceof Empty) {
        return new Error(Error$UnexpectedEndOfInput$const);
      } else {
        let $ = tokens.head[0];
        if ($ instanceof Name) {
          let tokens$1 = tokens.tail;
          let name$1 = $[0];
          return new Ok([name$1, tokens$1]);
        } else {
          let other = $;
          let position = tokens.head[1];
          return new Error(new UnexpectedToken(other, position));
        }
      }
    })(),
    (_use0) => {
      let name$1 = _use0[0];
      let tokens$1 = _use0[1];
      if (tokens$1 instanceof Empty) {
        return new Ok([new Attribute2(name$1, List$Empty$const), tokens$1]);
      } else if (tokens$1.head[0] instanceof LeftParen) {
        let tokens$2 = tokens$1.tail;
        let result = comma_delimited(
          List$Empty$const,
          tokens$2,
          expression,
          Token$RightParen$const
        );
        return try$(
          result,
          (_use02) => {
            let parameters = _use02[0];
            let tokens$3 = _use02[2];
            return new Ok([new Attribute2(name$1, parameters), tokens$3]);
          }
        );
      } else {
        return new Ok([new Attribute2(name$1, List$Empty$const), tokens$1]);
      }
    }
  );
}
function attributes(loop$accumulated_attributes, loop$tokens) {
  while (true) {
    let accumulated_attributes = loop$accumulated_attributes;
    let tokens = loop$tokens;
    if (tokens instanceof Empty) {
      return new Ok([reverse(accumulated_attributes), tokens]);
    } else if (tokens.head[0] instanceof At2) {
      let tokens$1 = tokens.tail;
      let $ = attribute3(tokens$1);
      if ($ instanceof Ok) {
        let attribute$1 = $[0][0];
        let tokens$2 = $[0][1];
        loop$accumulated_attributes = prepend(
          attribute$1,
          accumulated_attributes
        );
        loop$tokens = tokens$2;
      } else {
        return $;
      }
    } else {
      return new Ok([reverse(accumulated_attributes), tokens]);
    }
  }
}
function until(loop$limit, loop$acc, loop$tokens, loop$callback) {
  while (true) {
    let limit = loop$limit;
    let acc = loop$acc;
    let tokens = loop$tokens;
    let callback = loop$callback;
    if (tokens instanceof Empty) {
      return new Error(Error$UnexpectedEndOfInput$const);
    } else {
      let token2 = tokens.head[0];
      if (isEqual(token2, limit)) {
        let tokens$1 = tokens.tail;
        let i = tokens.head[1].byte_offset;
        return new Ok([acc, string_offset(i, to_source(token2)), tokens$1]);
      } else {
        let $ = callback(acc, tokens);
        if ($ instanceof Ok) {
          let acc$1 = $[0][0];
          let tokens$2 = $[0][1];
          loop$limit = limit;
          loop$acc = acc$1;
          loop$tokens = tokens$2;
          loop$callback = callback;
        } else {
          return $;
        }
      }
    }
  }
}
function variants(ct, tokens) {
  return until(
    Token$RightBrace$const,
    ct,
    tokens,
    (ct2, tokens2) => {
      return try$(
        attributes(List$Empty$const, tokens2),
        (_use0) => {
          let attributes$1 = _use0[0];
          let tokens$1 = _use0[1];
          return expect_upper_name(
            tokens$1,
            (name2, _, tokens3) => {
              return try$(
                (() => {
                  if (tokens3 instanceof Empty) {
                    return new Ok([List$Empty$const, 0, tokens3]);
                  } else {
                    let $ = tokens3.tail;
                    if ($ instanceof Empty) {
                      if (tokens3.head[0] instanceof LeftParen) {
                        let tokens$2 = $;
                        return comma_delimited(
                          List$Empty$const,
                          tokens$2,
                          variant_field,
                          Token$RightParen$const
                        );
                      } else {
                        return new Ok([List$Empty$const, 0, tokens3]);
                      }
                    } else if (tokens3.head[0] instanceof LeftParen) {
                      if ($.head[0] instanceof RightParen) {
                        let tokens$2 = $.tail;
                        let i = $.head[1].byte_offset;
                        return new Ok([List$Empty$const, i, tokens$2]);
                      } else {
                        let tokens$2 = $;
                        return comma_delimited(
                          List$Empty$const,
                          tokens$2,
                          variant_field,
                          Token$RightParen$const
                        );
                      }
                    } else {
                      return new Ok([List$Empty$const, 0, tokens3]);
                    }
                  }
                })(),
                (_use02) => {
                  let fields = _use02[0];
                  let tokens$2 = _use02[2];
                  let ct$1 = push_variant(
                    ct2,
                    new Variant(name2, fields, attributes$1)
                  );
                  return new Ok([ct$1, tokens$2]);
                }
              );
            }
          );
        }
      );
    }
  );
}
function custom_type(module2, attributes2, name2, parameters, publicity, opaque_, tokens, start5) {
  let ct = new CustomType2(
    new Span(0, 0),
    name2,
    publicity,
    opaque_,
    parameters,
    List$Empty$const
  );
  return try$(
    variants(ct, tokens),
    (_use0) => {
      let ct$1 = _use0[0];
      let end = _use0[1];
      let tokens$1 = _use0[2];
      let ct$2 = new CustomType2(
        new Span(start5, end),
        ct$1.name,
        ct$1.publicity,
        ct$1.opaque_,
        ct$1.parameters,
        ct$1.variants
      );
      let module$1 = push_custom_type(module2, attributes2, ct$2);
      return new Ok([module$1, tokens$1]);
    }
  );
}
function push_type_alias(module2, attributes2, type_alias2) {
  return new Module(
    module2.imports,
    module2.custom_types,
    prepend(
      new Definition(reverse(attributes2), type_alias2),
      module2.type_aliases
    ),
    module2.constants,
    module2.functions
  );
}
function type_alias(module2, attributes2, name2, parameters, publicity, start5, tokens) {
  return try$(
    type_2(tokens),
    (_use0) => {
      let type_$1 = _use0[0];
      let tokens$1 = _use0[1];
      let span2 = new Span(start5, type_$1.location.end);
      let alias = new TypeAlias(span2, name2, publicity, parameters, type_$1);
      let module$1 = push_type_alias(module2, attributes2, alias);
      return new Ok([module$1, tokens$1]);
    }
  );
}
function name(tokens) {
  if (tokens instanceof Empty) {
    return new Error(Error$UnexpectedEndOfInput$const);
  } else {
    let $ = tokens.head[0];
    if ($ instanceof Name) {
      let tokens$1 = tokens.tail;
      let name$1 = $[0];
      return new Ok([name$1, tokens$1]);
    } else {
      let token2 = $;
      let position = tokens.head[1];
      return new Error(new UnexpectedToken(token2, position));
    }
  }
}
function type_definition(module2, attributes2, publicity, opaque_, tokens, start5) {
  return expect_upper_name(
    tokens,
    (name_value, name_start, tokens2) => {
      return try$(
        (() => {
          if (tokens2 instanceof Empty) {
            return new Ok(
              [List$Empty$const, string_offset(name_start, name_value), tokens2]
            );
          } else if (tokens2.head[0] instanceof LeftParen) {
            let tokens$1 = tokens2.tail;
            return comma_delimited(
              List$Empty$const,
              tokens$1,
              name,
              Token$RightParen$const
            );
          } else {
            return new Ok(
              [List$Empty$const, string_offset(name_start, name_value), tokens2]
            );
          }
        })(),
        (_use0) => {
          let parameters = _use0[0];
          let end = _use0[1];
          let tokens$1 = _use0[2];
          if (tokens$1 instanceof Empty) {
            let span2 = new Span(start5, end);
            let ct = new CustomType2(
              span2,
              name_value,
              publicity,
              opaque_,
              parameters,
              List$Empty$const
            );
            let module$1 = push_custom_type(module2, attributes2, ct);
            return new Ok([module$1, tokens$1]);
          } else {
            let $ = tokens$1.head[0];
            if ($ instanceof LeftBrace) {
              let tokens$2 = tokens$1.tail;
              let _pipe = module2;
              return custom_type(
                _pipe,
                attributes2,
                name_value,
                parameters,
                publicity,
                opaque_,
                tokens$2,
                start5
              );
            } else if ($ instanceof Equal) {
              let tokens$2 = tokens$1.tail;
              return type_alias(
                module2,
                attributes2,
                name_value,
                parameters,
                publicity,
                start5,
                tokens$2
              );
            } else {
              let span2 = new Span(start5, end);
              let ct = new CustomType2(
                span2,
                name_value,
                publicity,
                opaque_,
                parameters,
                List$Empty$const
              );
              let module$1 = push_custom_type(module2, attributes2, ct);
              return new Ok([module$1, tokens$1]);
            }
          }
        }
      );
    }
  );
}
function optional_module_alias(tokens, end) {
  if (tokens instanceof Empty) {
    return [Option$None$const, end, tokens];
  } else {
    let $ = tokens.tail;
    if ($ instanceof Empty) {
      return [Option$None$const, end, tokens];
    } else if (tokens.head[0] instanceof As) {
      let $1 = $.head[0];
      if ($1 instanceof Name) {
        let tokens$1 = $.tail;
        let alias_start = $.head[1].byte_offset;
        let alias = $1[0];
        return [
          new Some(new Named(alias)),
          string_offset(alias_start, alias),
          tokens$1
        ];
      } else if ($1 instanceof DiscardName) {
        let tokens$1 = $.tail;
        let alias_start = $.head[1].byte_offset;
        let alias = $1[0];
        return [
          new Some(new Discarded(alias)),
          string_offset(alias_start, alias) + 1,
          tokens$1
        ];
      } else {
        return [Option$None$const, end, tokens];
      }
    } else {
      return [Option$None$const, end, tokens];
    }
  }
}
function unqualified_imports(loop$types, loop$values, loop$tokens) {
  while (true) {
    let types = loop$types;
    let values3 = loop$values;
    let tokens = loop$tokens;
    if (tokens instanceof Empty) {
      return new Error(Error$UnexpectedEndOfInput$const);
    } else {
      let $ = tokens.head[0];
      if ($ instanceof Name) {
        let $1 = tokens.tail;
        if ($1 instanceof Empty) {
          let other = $;
          let position = tokens.head[1];
          return new Error(new UnexpectedToken(other, position));
        } else {
          let $2 = $1.tail;
          if ($2 instanceof Empty) {
            let $3 = $1.head[0];
            if ($3 instanceof RightBrace) {
              let name$1 = $[0];
              let tokens$1 = $2;
              let end = $1.head[1].byte_offset;
              let import_ = new UnqualifiedImport(name$1, Option$None$const);
              return new Ok(
                new UnqualifiedImports(
                  reverse(types),
                  reverse(prepend(import_, values3)),
                  end + 1,
                  tokens$1
                )
              );
            } else if ($3 instanceof Comma) {
              let name$1 = $[0];
              let tokens$1 = $2;
              let import_ = new UnqualifiedImport(name$1, Option$None$const);
              loop$types = types;
              loop$values = prepend(import_, values3);
              loop$tokens = tokens$1;
            } else {
              let other = $;
              let position = tokens.head[1];
              return new Error(new UnexpectedToken(other, position));
            }
          } else {
            let $3 = $2.tail;
            if ($3 instanceof Empty) {
              let $4 = $1.head[0];
              if ($4 instanceof RightBrace) {
                let name$1 = $[0];
                let tokens$1 = $2;
                let end = $1.head[1].byte_offset;
                let import_ = new UnqualifiedImport(name$1, Option$None$const);
                return new Ok(
                  new UnqualifiedImports(
                    reverse(types),
                    reverse(prepend(import_, values3)),
                    end + 1,
                    tokens$1
                  )
                );
              } else if ($4 instanceof Comma) {
                let name$1 = $[0];
                let tokens$1 = $2;
                let import_ = new UnqualifiedImport(name$1, Option$None$const);
                loop$types = types;
                loop$values = prepend(import_, values3);
                loop$tokens = tokens$1;
              } else {
                let other = $;
                let position = tokens.head[1];
                return new Error(new UnexpectedToken(other, position));
              }
            } else {
              let $4 = $1.head[0];
              if ($4 instanceof As) {
                let $5 = $2.head[0];
                if ($5 instanceof Name) {
                  let $6 = $3.head[0];
                  if ($6 instanceof RightBrace) {
                    let name$1 = $[0];
                    let tokens$1 = $3.tail;
                    let alias = $5[0];
                    let end = $3.head[1].byte_offset;
                    let import_ = new UnqualifiedImport(name$1, new Some(alias));
                    return new Ok(
                      new UnqualifiedImports(
                        reverse(types),
                        reverse(prepend(import_, values3)),
                        end + 1,
                        tokens$1
                      )
                    );
                  } else if ($6 instanceof Comma) {
                    let name$1 = $[0];
                    let tokens$1 = $3.tail;
                    let alias = $5[0];
                    let import_ = new UnqualifiedImport(name$1, new Some(alias));
                    loop$types = types;
                    loop$values = prepend(import_, values3);
                    loop$tokens = tokens$1;
                  } else {
                    let other = $;
                    let position = tokens.head[1];
                    return new Error(new UnexpectedToken(other, position));
                  }
                } else {
                  let other = $;
                  let position = tokens.head[1];
                  return new Error(new UnexpectedToken(other, position));
                }
              } else if ($4 instanceof RightBrace) {
                let name$1 = $[0];
                let tokens$1 = $2;
                let end = $1.head[1].byte_offset;
                let import_ = new UnqualifiedImport(name$1, Option$None$const);
                return new Ok(
                  new UnqualifiedImports(
                    reverse(types),
                    reverse(prepend(import_, values3)),
                    end + 1,
                    tokens$1
                  )
                );
              } else if ($4 instanceof Comma) {
                let name$1 = $[0];
                let tokens$1 = $2;
                let import_ = new UnqualifiedImport(name$1, Option$None$const);
                loop$types = types;
                loop$values = prepend(import_, values3);
                loop$tokens = tokens$1;
              } else {
                let other = $;
                let position = tokens.head[1];
                return new Error(new UnexpectedToken(other, position));
              }
            }
          }
        }
      } else if ($ instanceof UpperName) {
        let $1 = tokens.tail;
        if ($1 instanceof Empty) {
          let other = $;
          let position = tokens.head[1];
          return new Error(new UnexpectedToken(other, position));
        } else {
          let $2 = $1.tail;
          if ($2 instanceof Empty) {
            let $3 = $1.head[0];
            if ($3 instanceof RightBrace) {
              let name$1 = $[0];
              let tokens$1 = $2;
              let end = $1.head[1].byte_offset;
              let import_ = new UnqualifiedImport(name$1, Option$None$const);
              return new Ok(
                new UnqualifiedImports(
                  reverse(types),
                  reverse(prepend(import_, values3)),
                  end + 1,
                  tokens$1
                )
              );
            } else if ($3 instanceof Comma) {
              let name$1 = $[0];
              let tokens$1 = $2;
              let import_ = new UnqualifiedImport(name$1, Option$None$const);
              loop$types = types;
              loop$values = prepend(import_, values3);
              loop$tokens = tokens$1;
            } else {
              let other = $;
              let position = tokens.head[1];
              return new Error(new UnexpectedToken(other, position));
            }
          } else {
            let $3 = $2.tail;
            if ($3 instanceof Empty) {
              let $4 = $1.head[0];
              if ($4 instanceof RightBrace) {
                let name$1 = $[0];
                let tokens$1 = $2;
                let end = $1.head[1].byte_offset;
                let import_ = new UnqualifiedImport(name$1, Option$None$const);
                return new Ok(
                  new UnqualifiedImports(
                    reverse(types),
                    reverse(prepend(import_, values3)),
                    end + 1,
                    tokens$1
                  )
                );
              } else if ($4 instanceof Comma) {
                let name$1 = $[0];
                let tokens$1 = $2;
                let import_ = new UnqualifiedImport(name$1, Option$None$const);
                loop$types = types;
                loop$values = prepend(import_, values3);
                loop$tokens = tokens$1;
              } else {
                let other = $;
                let position = tokens.head[1];
                return new Error(new UnexpectedToken(other, position));
              }
            } else {
              let $4 = $1.head[0];
              if ($4 instanceof As) {
                let $5 = $2.head[0];
                if ($5 instanceof UpperName) {
                  let $6 = $3.head[0];
                  if ($6 instanceof RightBrace) {
                    let name$1 = $[0];
                    let tokens$1 = $3.tail;
                    let alias = $5[0];
                    let end = $3.head[1].byte_offset;
                    let import_ = new UnqualifiedImport(name$1, new Some(alias));
                    return new Ok(
                      new UnqualifiedImports(
                        reverse(types),
                        reverse(prepend(import_, values3)),
                        end + 1,
                        tokens$1
                      )
                    );
                  } else if ($6 instanceof Comma) {
                    let name$1 = $[0];
                    let tokens$1 = $3.tail;
                    let alias = $5[0];
                    let import_ = new UnqualifiedImport(name$1, new Some(alias));
                    loop$types = types;
                    loop$values = prepend(import_, values3);
                    loop$tokens = tokens$1;
                  } else {
                    let other = $;
                    let position = tokens.head[1];
                    return new Error(new UnexpectedToken(other, position));
                  }
                } else {
                  let other = $;
                  let position = tokens.head[1];
                  return new Error(new UnexpectedToken(other, position));
                }
              } else if ($4 instanceof RightBrace) {
                let name$1 = $[0];
                let tokens$1 = $2;
                let end = $1.head[1].byte_offset;
                let import_ = new UnqualifiedImport(name$1, Option$None$const);
                return new Ok(
                  new UnqualifiedImports(
                    reverse(types),
                    reverse(prepend(import_, values3)),
                    end + 1,
                    tokens$1
                  )
                );
              } else if ($4 instanceof Comma) {
                let name$1 = $[0];
                let tokens$1 = $2;
                let import_ = new UnqualifiedImport(name$1, Option$None$const);
                loop$types = types;
                loop$values = prepend(import_, values3);
                loop$tokens = tokens$1;
              } else {
                let other = $;
                let position = tokens.head[1];
                return new Error(new UnexpectedToken(other, position));
              }
            }
          }
        }
      } else if ($ instanceof Type) {
        let $1 = tokens.tail;
        if ($1 instanceof Empty) {
          let other = $;
          let position = tokens.head[1];
          return new Error(new UnexpectedToken(other, position));
        } else {
          let $2 = $1.tail;
          if ($2 instanceof Empty) {
            let other = $;
            let position = tokens.head[1];
            return new Error(new UnexpectedToken(other, position));
          } else {
            let $3 = $2.tail;
            if ($3 instanceof Empty) {
              let $4 = $1.head[0];
              if ($4 instanceof UpperName) {
                let $5 = $2.head[0];
                if ($5 instanceof RightBrace) {
                  let tokens$1 = $3;
                  let name$1 = $4[0];
                  let end = $2.head[1].byte_offset;
                  let import_ = new UnqualifiedImport(name$1, Option$None$const);
                  return new Ok(
                    new UnqualifiedImports(
                      reverse(prepend(import_, types)),
                      reverse(values3),
                      end + 1,
                      tokens$1
                    )
                  );
                } else if ($5 instanceof Comma) {
                  let tokens$1 = $3;
                  let name$1 = $4[0];
                  let import_ = new UnqualifiedImport(name$1, Option$None$const);
                  loop$types = prepend(import_, types);
                  loop$values = values3;
                  loop$tokens = tokens$1;
                } else {
                  let other = $;
                  let position = tokens.head[1];
                  return new Error(new UnexpectedToken(other, position));
                }
              } else {
                let other = $;
                let position = tokens.head[1];
                return new Error(new UnexpectedToken(other, position));
              }
            } else {
              let $4 = $3.tail;
              if ($4 instanceof Empty) {
                let $5 = $1.head[0];
                if ($5 instanceof UpperName) {
                  let $6 = $2.head[0];
                  if ($6 instanceof RightBrace) {
                    let tokens$1 = $3;
                    let name$1 = $5[0];
                    let end = $2.head[1].byte_offset;
                    let import_ = new UnqualifiedImport(
                      name$1,
                      Option$None$const
                    );
                    return new Ok(
                      new UnqualifiedImports(
                        reverse(prepend(import_, types)),
                        reverse(values3),
                        end + 1,
                        tokens$1
                      )
                    );
                  } else if ($6 instanceof Comma) {
                    let tokens$1 = $3;
                    let name$1 = $5[0];
                    let import_ = new UnqualifiedImport(
                      name$1,
                      Option$None$const
                    );
                    loop$types = prepend(import_, types);
                    loop$values = values3;
                    loop$tokens = tokens$1;
                  } else {
                    let other = $;
                    let position = tokens.head[1];
                    return new Error(new UnexpectedToken(other, position));
                  }
                } else {
                  let other = $;
                  let position = tokens.head[1];
                  return new Error(new UnexpectedToken(other, position));
                }
              } else {
                let $5 = $1.head[0];
                if ($5 instanceof UpperName) {
                  let $6 = $2.head[0];
                  if ($6 instanceof As) {
                    let $7 = $3.head[0];
                    if ($7 instanceof UpperName) {
                      let $8 = $4.head[0];
                      if ($8 instanceof RightBrace) {
                        let tokens$1 = $4.tail;
                        let name$1 = $5[0];
                        let alias = $7[0];
                        let end = $4.head[1].byte_offset;
                        let import_ = new UnqualifiedImport(
                          name$1,
                          new Some(alias)
                        );
                        return new Ok(
                          new UnqualifiedImports(
                            reverse(prepend(import_, types)),
                            reverse(values3),
                            end + 1,
                            tokens$1
                          )
                        );
                      } else if ($8 instanceof Comma) {
                        let tokens$1 = $4.tail;
                        let name$1 = $5[0];
                        let alias = $7[0];
                        let import_ = new UnqualifiedImport(
                          name$1,
                          new Some(alias)
                        );
                        loop$types = prepend(import_, types);
                        loop$values = values3;
                        loop$tokens = tokens$1;
                      } else {
                        let other = $;
                        let position = tokens.head[1];
                        return new Error(new UnexpectedToken(other, position));
                      }
                    } else {
                      let other = $;
                      let position = tokens.head[1];
                      return new Error(new UnexpectedToken(other, position));
                    }
                  } else if ($6 instanceof RightBrace) {
                    let tokens$1 = $3;
                    let name$1 = $5[0];
                    let end = $2.head[1].byte_offset;
                    let import_ = new UnqualifiedImport(
                      name$1,
                      Option$None$const
                    );
                    return new Ok(
                      new UnqualifiedImports(
                        reverse(prepend(import_, types)),
                        reverse(values3),
                        end + 1,
                        tokens$1
                      )
                    );
                  } else if ($6 instanceof Comma) {
                    let tokens$1 = $3;
                    let name$1 = $5[0];
                    let import_ = new UnqualifiedImport(
                      name$1,
                      Option$None$const
                    );
                    loop$types = prepend(import_, types);
                    loop$values = values3;
                    loop$tokens = tokens$1;
                  } else {
                    let other = $;
                    let position = tokens.head[1];
                    return new Error(new UnexpectedToken(other, position));
                  }
                } else {
                  let other = $;
                  let position = tokens.head[1];
                  return new Error(new UnexpectedToken(other, position));
                }
              }
            }
          }
        }
      } else if ($ instanceof RightBrace) {
        let tokens$1 = tokens.tail;
        let end = tokens.head[1].byte_offset;
        return new Ok(
          new UnqualifiedImports(
            reverse(types),
            reverse(values3),
            end + 1,
            tokens$1
          )
        );
      } else {
        let other = $;
        let position = tokens.head[1];
        return new Error(new UnexpectedToken(other, position));
      }
    }
  }
}
function optional_unqualified_imports(tokens, end) {
  if (tokens instanceof Empty) {
    return new Ok(
      new UnqualifiedImports(List$Empty$const, List$Empty$const, end, tokens)
    );
  } else {
    let $ = tokens.tail;
    if ($ instanceof Empty) {
      return new Ok(
        new UnqualifiedImports(
          List$Empty$const,
          List$Empty$const,
          end,
          tokens
        )
      );
    } else if (tokens.head[0] instanceof Dot && $.head[0] instanceof LeftBrace) {
      let tokens$1 = $.tail;
      return unqualified_imports(List$Empty$const, List$Empty$const, tokens$1);
    } else {
      return new Ok(
        new UnqualifiedImports(
          List$Empty$const,
          List$Empty$const,
          end,
          tokens
        )
      );
    }
  }
}
function module_name(loop$name, loop$end, loop$tokens) {
  while (true) {
    let name2 = loop$name;
    let end = loop$end;
    let tokens = loop$tokens;
    if (tokens instanceof Empty) {
      if (name2 === "") {
        return new Error(Error$UnexpectedEndOfInput$const);
      } else {
        return new Ok([name2, end, tokens]);
      }
    } else {
      let $ = tokens.tail;
      if ($ instanceof Empty) {
        let $1 = tokens.head[0];
        if ($1 instanceof Name && name2 === "") {
          let tokens$1 = $;
          let i = tokens.head[1].byte_offset;
          let s = $1[0];
          let end$1 = i + byte_size(s);
          loop$name = s;
          loop$end = end$1;
          loop$tokens = tokens$1;
        } else if (name2 === "") {
          let other = $1;
          let position = tokens.head[1];
          return new Error(new UnexpectedToken(other, position));
        } else {
          return new Ok([name2, end, tokens]);
        }
      } else {
        let $1 = tokens.head[0];
        if ($1 instanceof Name && name2 === "") {
          let tokens$1 = $;
          let s = $1[0];
          let i = tokens.head[1].byte_offset;
          let end$1 = i + byte_size(s);
          loop$name = s;
          loop$end = end$1;
          loop$tokens = tokens$1;
        } else if ($1 instanceof Slash) {
          let $2 = $.head[0];
          if ($2 instanceof Name && name2 !== "") {
            let tokens$1 = $.tail;
            let i = $.head[1].byte_offset;
            let s = $2[0];
            let end$1 = i + byte_size(s);
            loop$name = name2 + "/" + s;
            loop$end = end$1;
            loop$tokens = tokens$1;
          } else if (name2 === "") {
            let other = $1;
            let position = tokens.head[1];
            return new Error(new UnexpectedToken(other, position));
          } else {
            return new Ok([name2, end, tokens]);
          }
        } else if (name2 === "") {
          let other = $1;
          let position = tokens.head[1];
          return new Error(new UnexpectedToken(other, position));
        } else {
          return new Ok([name2, end, tokens]);
        }
      }
    }
  }
}
function import_statement(module2, attributes2, tokens, start5) {
  return try$(
    module_name("", 0, tokens),
    (_use0) => {
      let module_name$1 = _use0[0];
      let end = _use0[1];
      let tokens$1 = _use0[2];
      return try$(
        optional_unqualified_imports(tokens$1, end),
        (_use02) => {
          let ts = _use02.types;
          let vs = _use02.values;
          let end$1 = _use02.end;
          let tokens$2 = _use02.remaining_tokens;
          let $ = optional_module_alias(tokens$2, end$1);
          let alias = $[0];
          let end$2 = $[1];
          let tokens$3 = $[2];
          let span2 = new Span(start5, end$2);
          let import_ = new Import2(span2, module_name$1, alias, ts, vs);
          let definition = new Definition(reverse(attributes2), import_);
          let module$1 = new Module(
            prepend(definition, module2.imports),
            module2.custom_types,
            module2.type_aliases,
            module2.constants,
            module2.functions
          );
          return new Ok([module$1, tokens$3]);
        }
      );
    }
  );
}
function slurp(module2, attributes2, tokens) {
  if (tokens instanceof Empty) {
    return new Ok(module2);
  } else {
    let $ = tokens.head[0];
    if ($ instanceof Const) {
      let tokens$1 = tokens.tail;
      let start5 = tokens.head[1].byte_offset;
      let result = const_definition(
        module2,
        attributes2,
        Publicity$Private$const,
        tokens$1,
        start5
      );
      return try$(
        result,
        (_use0) => {
          let module$1 = _use0[0];
          let tokens$2 = _use0[1];
          return slurp(module$1, List$Empty$const, tokens$2);
        }
      );
    } else if ($ instanceof Fn) {
      let $1 = tokens.tail;
      if ($1 instanceof Empty) {
        let tokens$1 = tokens;
        return unexpected_error(tokens$1);
      } else {
        let $2 = $1.head[0];
        if ($2 instanceof Name) {
          let start5 = tokens.head[1];
          let tokens$1 = $1.tail;
          let name$1 = $2[0];
          let start$1 = start5.byte_offset;
          let result = function_definition(
            module2,
            attributes2,
            Publicity$Private$const,
            name$1,
            start$1,
            tokens$1
          );
          return try$(
            result,
            (_use0) => {
              let module$1 = _use0[0];
              let tokens$2 = _use0[1];
              return slurp(module$1, List$Empty$const, tokens$2);
            }
          );
        } else {
          let tokens$1 = tokens;
          return unexpected_error(tokens$1);
        }
      }
    } else if ($ instanceof Import) {
      let tokens$1 = tokens.tail;
      let start5 = tokens.head[1].byte_offset;
      let result = import_statement(module2, attributes2, tokens$1, start5);
      return try$(
        result,
        (_use0) => {
          let module$1 = _use0[0];
          let tokens$2 = _use0[1];
          return slurp(module$1, List$Empty$const, tokens$2);
        }
      );
    } else if ($ instanceof Pub) {
      let $1 = tokens.tail;
      if ($1 instanceof Empty) {
        let tokens$1 = tokens;
        return unexpected_error(tokens$1);
      } else {
        let $2 = $1.head[0];
        if ($2 instanceof Const) {
          let start5 = tokens.head[1].byte_offset;
          let tokens$1 = $1.tail;
          let result = const_definition(
            module2,
            attributes2,
            Publicity$Public$const,
            tokens$1,
            start5
          );
          return try$(
            result,
            (_use0) => {
              let module$1 = _use0[0];
              let tokens$2 = _use0[1];
              return slurp(module$1, List$Empty$const, tokens$2);
            }
          );
        } else if ($2 instanceof Fn) {
          let $3 = $1.tail;
          if ($3 instanceof Empty) {
            let tokens$1 = tokens;
            return unexpected_error(tokens$1);
          } else {
            let $4 = $3.head[0];
            if ($4 instanceof Name) {
              let start5 = tokens.head[1];
              let tokens$1 = $3.tail;
              let name$1 = $4[0];
              let start$1 = start5.byte_offset;
              let result = function_definition(
                module2,
                attributes2,
                Publicity$Public$const,
                name$1,
                start$1,
                tokens$1
              );
              return try$(
                result,
                (_use0) => {
                  let module$1 = _use0[0];
                  let tokens$2 = _use0[1];
                  return slurp(module$1, List$Empty$const, tokens$2);
                }
              );
            } else {
              let tokens$1 = tokens;
              return unexpected_error(tokens$1);
            }
          }
        } else if ($2 instanceof Opaque) {
          let $3 = $1.tail;
          if ($3 instanceof Empty) {
            let tokens$1 = tokens;
            return unexpected_error(tokens$1);
          } else if ($3.head[0] instanceof Type) {
            let start5 = tokens.head[1].byte_offset;
            let tokens$1 = $3.tail;
            let result = type_definition(
              module2,
              attributes2,
              Publicity$Public$const,
              true,
              tokens$1,
              start5
            );
            return try$(
              result,
              (_use0) => {
                let module$1 = _use0[0];
                let tokens$2 = _use0[1];
                return slurp(module$1, List$Empty$const, tokens$2);
              }
            );
          } else {
            let tokens$1 = tokens;
            return unexpected_error(tokens$1);
          }
        } else if ($2 instanceof Type) {
          let start5 = tokens.head[1].byte_offset;
          let tokens$1 = $1.tail;
          let result = type_definition(
            module2,
            attributes2,
            Publicity$Public$const,
            false,
            tokens$1,
            start5
          );
          return try$(
            result,
            (_use0) => {
              let module$1 = _use0[0];
              let tokens$2 = _use0[1];
              return slurp(module$1, List$Empty$const, tokens$2);
            }
          );
        } else {
          let tokens$1 = tokens;
          return unexpected_error(tokens$1);
        }
      }
    } else if ($ instanceof Type) {
      let tokens$1 = tokens.tail;
      let start5 = tokens.head[1].byte_offset;
      let result = type_definition(
        module2,
        attributes2,
        Publicity$Private$const,
        false,
        tokens$1,
        start5
      );
      return try$(
        result,
        (_use0) => {
          let module$1 = _use0[0];
          let tokens$2 = _use0[1];
          return slurp(module$1, List$Empty$const, tokens$2);
        }
      );
    } else if ($ instanceof At2) {
      let tokens$1 = tokens.tail;
      return try$(
        attribute3(tokens$1),
        (_use0) => {
          let attribute$1 = _use0[0];
          let tokens$2 = _use0[1];
          return slurp(module2, prepend(attribute$1, attributes2), tokens$2);
        }
      );
    } else {
      let tokens$1 = tokens;
      return unexpected_error(tokens$1);
    }
  }
}
function module(src) {
  let _pipe = new$7(src);
  let _pipe$1 = discard_comments(_pipe);
  let _pipe$2 = discard_whitespace(_pipe$1);
  let _pipe$3 = lex(_pipe$2);
  return ((_capture) => {
    return slurp(
      new Module(
        List$Empty$const,
        List$Empty$const,
        List$Empty$const,
        List$Empty$const,
        List$Empty$const
      ),
      List$Empty$const,
      _capture
    );
  })(_pipe$3);
}

// parser.mjs
var left_value = "left#";
var capture_param = "capture#";
function fail(message, span2, at) {
  return new Error(message + on_line(at(span2)));
}
function unique(loop$names, loop$message, loop$at) {
  while (true) {
    let names = loop$names;
    let message = loop$message;
    let at = loop$at;
    let named = filter(
      names,
      (name2) => {
        return !starts_with(name2[0], "_");
      }
    );
    if (named instanceof Empty) {
      return new Ok(void 0);
    } else {
      let rest = named.tail;
      let first2 = named.head[0];
      let $ = key_find(rest, first2);
      if ($ instanceof Ok) {
        let location = $[0];
        return fail(message + first2, location, at);
      } else {
        loop$names = rest;
        loop$message = message;
        loop$at = at;
      }
    }
  }
}
function statement_location(stmt) {
  if (stmt instanceof Use2) {
    let location = stmt.location;
    return location;
  } else if (stmt instanceof Assignment) {
    let location = stmt.location;
    return location;
  } else if (stmt instanceof Assert2) {
    let location = stmt.location;
    return location;
  } else {
    let expr = stmt[0];
    return expr.location;
  }
}
function is_record_field(label2) {
  return any(
    constructors,
    (entry) => {
      return contains(entry[1], label2);
    }
  );
}
function pattern_names(pattern2) {
  if (pattern2 instanceof PVar) {
    let name2 = pattern2[0];
    return prepend(name2, List$Empty$const);
  } else if (pattern2 instanceof PList) {
    let elems = pattern2.elems;
    let rest = pattern2.rest;
    return append(
      flat_map(elems, pattern_names),
      (() => {
        if (rest instanceof Some) {
          let name2 = rest[0];
          return prepend(name2, List$Empty$const);
        } else {
          return List$Empty$const;
        }
      })()
    );
  } else {
    return List$Empty$const;
  }
}
function located(names, location) {
  return map2(names, (name2) => {
    return [name2, location];
  });
}
function pattern_name(pattern2, context, at) {
  if (pattern2 instanceof PatternDiscard) {
    let name2 = pattern2.name;
    return new Ok("_" + name2);
  } else if (pattern2 instanceof PatternVariable) {
    let name2 = pattern2.name;
    return new Ok(name2);
  } else {
    return fail("Unsupported pattern in " + context, pattern2.location, at);
  }
}
function convert_pattern(pat, at) {
  if (pat instanceof PatternInt) {
    let location = pat.location;
    let s = pat.value;
    let $ = parse_int(s);
    if ($ instanceof Ok) {
      let n = $[0];
      return new Ok(new PInt(n));
    } else {
      return fail("Invalid integer literal: " + s, location, at);
    }
  } else if (pat instanceof PatternDiscard) {
    return new Ok(Pattern$PWildcard$const);
  } else if (pat instanceof PatternVariable) {
    let name2 = pat.name;
    return new Ok(new PVar(name2));
  } else if (pat instanceof PatternList) {
    let elems = pat.elements;
    let rest = pat.tail;
    return try$(
      try_map(
        elems,
        (_capture) => {
          return convert_pattern(_capture, at);
        }
      ),
      (converted_elems) => {
        return try$(
          (() => {
            if (rest instanceof Some) {
              let r = rest[0];
              return map4(
                pattern_name(r, "list pattern", at),
                (var0) => {
                  return new Some(var0);
                }
              );
            } else {
              return new Ok(Option$None$const);
            }
          })(),
          (rest2) => {
            return new Ok(new PList(converted_elems, rest2));
          }
        );
      }
    );
  } else if (pat instanceof PatternVariant && pat.module instanceof None && pat.arguments instanceof Empty && !pat.with_spread) {
    let $ = pat.constructor$;
    if ($ === "True") {
      return new Ok(new PBool(true));
    } else if ($ === "False") {
      return new Ok(new PBool(false));
    } else {
      return fail("Pattern type not supported", pat.location, at);
    }
  } else {
    return fail("Pattern type not supported", pat.location, at);
  }
}
function binop_name(op) {
  if (op instanceof Eq2) {
    return new Some("==");
  } else if (op instanceof NotEq) {
    return new Some("!=");
  } else if (op instanceof LtInt) {
    return new Some("<");
  } else if (op instanceof LtEqInt) {
    return new Some("<=");
  } else if (op instanceof GtEqInt) {
    return new Some(">=");
  } else if (op instanceof GtInt) {
    return new Some(">");
  } else if (op instanceof AddInt) {
    return new Some("+");
  } else if (op instanceof SubInt) {
    return new Some("-");
  } else if (op instanceof MultInt) {
    return new Some("*");
  } else if (op instanceof DivInt) {
    return new Some("/");
  } else if (op instanceof RemainderInt) {
    return new Some("%");
  } else {
    return Option$None$const;
  }
}
function binding_name(name2) {
  if (name2 instanceof Named) {
    let n = name2[0];
    return n;
  } else {
    let n = name2[0];
    return "_" + n;
  }
}
function labelled_arg(field3, at) {
  if (field3 instanceof LabelledField) {
    let label2 = field3.label;
    let location = field3.label_location;
    let item = field3.item;
    return new Ok([label2, location, item]);
  } else if (field3 instanceof ShorthandField) {
    let label2 = field3.label;
    let location = field3.location;
    return new Ok([label2, location, new Variable(location, label2)]);
  } else {
    let item = field3.item;
    return fail(
      "An unlabelled argument cannot follow a labelled one",
      item.location,
      at
    );
  }
}
function order_record_args(callee, num_before, args, at) {
  let _block;
  if (callee instanceof Variable) {
    let name2 = callee.name;
    _block = key_find(constructors, name2);
  } else {
    _block = new Error(void 0);
  }
  let fields = _block;
  if (fields instanceof Ok) {
    let fields$1 = fields[0];
    let $ = split_while(
      args,
      (arg) => {
        if (arg instanceof UnlabelledField) {
          return true;
        } else {
          return false;
        }
      }
    );
    let positional = $[0];
    let rest = $[1];
    return try$(
      try_map(rest, (_capture) => {
        return labelled_arg(_capture, at);
      }),
      (labelled) => {
        return try$(
          unique(
            map2(labelled, (arg) => {
              return [arg[0], arg[1]];
            }),
            "Duplicate label: ",
            at
          ),
          (_use0) => {
            let open_fields = drop(
              fields$1,
              num_before + length(positional)
            );
            return try$(
              try_each(
                labelled,
                (arg) => {
                  let $1 = contains(open_fields, arg[0]);
                  if ($1) {
                    return new Ok(void 0);
                  } else {
                    return fail("Unexpected label: " + arg[0], arg[1], at);
                  }
                }
              ),
              (_use02) => {
                let ordered = filter_map(
                  open_fields,
                  (field3) => {
                    let _pipe = find(
                      labelled,
                      (arg) => {
                        return arg[0] === field3;
                      }
                    );
                    return map4(
                      _pipe,
                      (arg) => {
                        return new UnlabelledField(arg[2]);
                      }
                    );
                  }
                );
                return new Ok(append(positional, ordered));
              }
            );
          }
        );
      }
    );
  } else {
    return new Ok(args);
  }
}
function convert_list(elems, rest, at) {
  return try$(
    try_map(elems, (_capture) => {
      return convert_expr(_capture, at);
    }),
    (converted) => {
      if (rest instanceof Some) {
        let r = rest[0];
        return try$(
          convert_expr(r, at),
          (r2) => {
            return new Ok(new LiteralList(converted, new Some(r2)));
          }
        );
      } else {
        return new Ok(new LiteralList(converted, Option$None$const));
      }
    }
  );
}
function convert_clauses(clauses, at) {
  return try_map(
    clauses,
    (clause) => {
      let $ = clause.patterns;
      let $1 = clause.guard;
      if ($ instanceof Empty) {
        return fail(
          "Multi-pattern clauses are not supported",
          clause.body.location,
          at
        );
      } else if ($1 instanceof Some) {
        let $2 = $.head;
        if ($2 instanceof Empty) {
          return fail(
            "Multi-pattern clauses are not supported",
            clause.body.location,
            at
          );
        } else if ($.tail instanceof Empty && $2.tail instanceof Empty) {
          let guard2 = $1[0];
          return fail("Guards are not supported", guard2.location, at);
        } else {
          return fail(
            "Multi-pattern clauses are not supported",
            clause.body.location,
            at
          );
        }
      } else {
        let $2 = $.head;
        if ($2 instanceof Empty) {
          return fail(
            "Multi-pattern clauses are not supported",
            clause.body.location,
            at
          );
        } else if ($.tail instanceof Empty && $2.tail instanceof Empty) {
          let pat = $2.head;
          return try$(
            convert_pattern(pat, at),
            (p) => {
              return try$(
                unique(
                  located(pattern_names(p), pat.location),
                  "Duplicate variable name in pattern: ",
                  at
                ),
                (_use0) => {
                  return try$(
                    convert_expr(clause.body, at),
                    (body) => {
                      return new Ok(
                        [p, new At(at(clause.body.location), body)]
                      );
                    }
                  );
                }
              );
            }
          );
        } else {
          return fail(
            "Multi-pattern clauses are not supported",
            clause.body.location,
            at
          );
        }
      }
    }
  );
}
function convert_binop(op, left, right, location, at) {
  let $ = binop_name(op);
  if ($ instanceof Some) {
    let op_name = $[0];
    return try$(
      convert_expr(left, at),
      (l) => {
        return try$(
          convert_expr(right, at),
          (r) => {
            return new Ok(
              new Call(
                new Var(op_name),
                prepend(l, prepend(r, List$Empty$const))
              )
            );
          }
        );
      }
    );
  } else {
    return fail("Unsupported operator", location, at);
  }
}
function convert_short_circuit(op_name, stops_at, left, right, at) {
  return try$(
    convert_expr(left, at),
    (l) => {
      return try$(
        convert_expr(right, at),
        (r) => {
          let call2 = new Call(
            new Var(op_name),
            prepend(
              new Var(left_value),
              prepend(r, List$Empty$const)
            )
          );
          return new Ok(
            new Case(
              l,
              prepend(
                [
                  new PBool(stops_at),
                  new LiteralBool(stops_at)
                ],
                prepend(
                  [new PVar(left_value), call2],
                  List$Empty$const
                )
              )
            )
          );
        }
      );
    }
  );
}
function convert_call_args(args, at) {
  return try_map(
    args,
    (field3) => {
      if (field3 instanceof LabelledField) {
        let location = field3.label_location;
        return fail(
          "Labelled arguments are only supported in a call to a record constructor",
          location,
          at
        );
      } else if (field3 instanceof ShorthandField) {
        let location = field3.location;
        return fail(
          "Labelled arguments are only supported in a call to a record constructor",
          location,
          at
        );
      } else {
        let item = field3.item;
        return convert_expr(item, at);
      }
    }
  );
}
function convert_capture(func, before, after, at) {
  return try$(
    convert_expr(func, at),
    (callee) => {
      return try$(
        convert_call_args(before, at),
        (bs) => {
          return try$(
            convert_call_args(after, at),
            (as_) => {
              let args = flatten(
                prepend(
                  bs,
                  prepend(
                    prepend(
                      new Var(capture_param),
                      List$Empty$const
                    ),
                    prepend(as_, List$Empty$const)
                  )
                )
              );
              return new Ok(
                new Lambda(
                  prepend(capture_param, List$Empty$const),
                  new Call(callee, args)
                )
              );
            }
          );
        }
      );
    }
  );
}
function convert_expr(expr, at) {
  if (expr instanceof Int2) {
    let location = expr.location;
    let s = expr.value;
    let $ = parse_int(s);
    if ($ instanceof Ok) {
      let n = $[0];
      return new Ok(new LiteralInt(n));
    } else {
      return fail("Invalid integer literal: " + s, location, at);
    }
  } else if (expr instanceof Float2) {
    let location = expr.location;
    return fail(
      "Only whole numbers are allowed (this language has no decimals)",
      location,
      at
    );
  } else if (expr instanceof Variable) {
    let $ = expr.name;
    if ($ === "True") {
      return new Ok(new LiteralBool(true));
    } else if ($ === "False") {
      return new Ok(new LiteralBool(false));
    } else {
      let name2 = $;
      return new Ok(new Var(name2));
    }
  } else if (expr instanceof Block) {
    let location = expr.location;
    let stmts = expr.statements;
    return convert_statements(stmts, location, at);
  } else if (expr instanceof List2) {
    let elems = expr.elements;
    let rest = expr.rest;
    return convert_list(elems, rest, at);
  } else if (expr instanceof Fn2) {
    let location = expr.location;
    let params = expr.arguments;
    let body = expr.body;
    let names = map2(params, (p) => {
      return binding_name(p.name);
    });
    return try$(
      unique(located(names, location), "Duplicate parameter name: ", at),
      (_use0) => {
        return try$(
          convert_statements(body, location, at),
          (b) => {
            return new Ok(new Lambda(names, b));
          }
        );
      }
    );
  } else if (expr instanceof FieldAccess2) {
    let $ = expr.container;
    if ($ instanceof Variable && $.name === "list") {
      let label2 = expr.label;
      let $1 = is_record_field(label2);
      if ($1) {
        return new Ok(
          new FieldAccess(new Var("list"), label2)
        );
      } else {
        return new Ok(new Var("list." + label2));
      }
    } else {
      let container = $;
      let label2 = expr.label;
      return try$(
        convert_expr(container, at),
        (c) => {
          return new Ok(new FieldAccess(c, label2));
        }
      );
    }
  } else if (expr instanceof Call2) {
    return convert_call(expr, List$Empty$const, List$Empty$const, at);
  } else if (expr instanceof FnCapture) {
    let func = expr.function;
    let before = expr.arguments_before;
    let after = expr.arguments_after;
    return convert_capture(func, before, after, at);
  } else if (expr instanceof Case3) {
    let $ = expr.subjects;
    if ($ instanceof Empty) {
      let location = expr.location;
      return fail("Multi-subject case is not supported", location, at);
    } else if ($.tail instanceof Empty) {
      let clauses = expr.clauses;
      let subject = $.head;
      return try$(
        convert_expr(subject, at),
        (s) => {
          return try$(
            convert_clauses(clauses, at),
            (arms) => {
              return new Ok(new Case(s, arms));
            }
          );
        }
      );
    } else {
      let location = expr.location;
      return fail("Multi-subject case is not supported", location, at);
    }
  } else if (expr instanceof BinaryOperator) {
    let $ = expr.name;
    if ($ instanceof And) {
      let left = expr.left;
      let right = expr.right;
      return convert_short_circuit("&&", false, left, right, at);
    } else if ($ instanceof Or) {
      let left = expr.left;
      let right = expr.right;
      return convert_short_circuit("||", true, left, right, at);
    } else if ($ instanceof Pipe2) {
      let left = expr.left;
      let right = expr.right;
      return try$(
        convert_expr(left, at),
        (l) => {
          return convert_call(
            right,
            prepend(l, List$Empty$const),
            List$Empty$const,
            at
          );
        }
      );
    } else {
      let location = expr.location;
      let op = $;
      let left = expr.left;
      let right = expr.right;
      return convert_binop(op, left, right, location, at);
    }
  } else {
    return fail("Expression type not supported", expr.location, at);
  }
}
function convert_call(func, before, after, at) {
  if (func instanceof Call2) {
    let callee = func.function;
    let args = func.arguments;
    return try$(
      convert_expr(callee, at),
      (c) => {
        return try$(
          order_record_args(callee, length(before), args, at),
          (ordered) => {
            return try$(
              convert_call_args(ordered, at),
              (converted_args) => {
                return new Ok(
                  new Call(
                    c,
                    flatten(
                      prepend(
                        before,
                        prepend(
                          converted_args,
                          prepend(after, List$Empty$const)
                        )
                      )
                    )
                  )
                );
              }
            );
          }
        );
      }
    );
  } else {
    return try$(
      convert_expr(func, at),
      (c) => {
        return new Ok(new Call(c, append(before, after)));
      }
    );
  }
}
function convert_statements(statements2, location, at) {
  let $ = reverse(statements2);
  if ($ instanceof Empty) {
    return fail("Empty block", location, at);
  } else {
    let last = $.head;
    let rest_rev = $.tail;
    return try$(
      (() => {
        if (last instanceof Use2) {
          let location$1 = last.location;
          return fail(
            "A use binding must be followed by more of the block",
            location$1,
            at
          );
        } else if (last instanceof Expression) {
          let expr = last[0];
          return map4(
            convert_expr(expr, at),
            (e) => {
              return new At(at(expr.location), e);
            }
          );
        } else {
          return fail(
            "A block must end with an expression",
            statement_location(last),
            at
          );
        }
      })(),
      (final_expr) => {
        return try_fold(
          rest_rev,
          final_expr,
          (body, stmt) => {
            if (stmt instanceof Use2) {
              let location$1 = stmt.location;
              let patterns = stmt.patterns;
              let func = stmt.function;
              return try$(
                try_map(
                  patterns,
                  (p) => {
                    return pattern_name(p.pattern, "use binding", at);
                  }
                ),
                (params) => {
                  return try$(
                    unique(
                      located(params, location$1),
                      "Duplicate parameter name: ",
                      at
                    ),
                    (_use0) => {
                      let callback = new Lambda(params, body);
                      return try$(
                        convert_call(
                          func,
                          List$Empty$const,
                          prepend(callback, List$Empty$const),
                          at
                        ),
                        (call2) => {
                          return new Ok(new At(at(location$1), call2));
                        }
                      );
                    }
                  );
                }
              );
            } else if (stmt instanceof Assignment && stmt.kind instanceof Let3) {
              let location$1 = stmt.location;
              let pattern2 = stmt.pattern;
              let value2 = stmt.value;
              return try$(
                pattern_name(pattern2, "let binding", at),
                (name2) => {
                  return try$(
                    convert_expr(value2, at),
                    (v) => {
                      return new Ok(
                        new Let(
                          name2,
                          new At(at(location$1), v),
                          body
                        )
                      );
                    }
                  );
                }
              );
            } else {
              return fail(
                "Only let, use, and expressions are allowed in a block",
                statement_location(stmt),
                at
              );
            }
          }
        );
      }
    );
  }
}
function convert_function(def, global, at) {
  let func = def.definition;
  let params = map2(
    func.parameters,
    (p) => {
      return binding_name(p.name);
    }
  );
  return try$(
    unique(located(params, func.location), "Duplicate parameter name: ", at),
    (_use0) => {
      return try$(
        convert_statements(func.body, func.location, at),
        (body) => {
          return new Ok(
            [
              func.name,
              new VFunc(new UserFn(func.name, params, body, new Global(global)))
            ]
          );
        }
      );
    }
  );
}
function line_finder(source) {
  let $ = fold2(
    split2(source, "\n"),
    [List$Empty$const, 0],
    (acc, line) => {
      let starts2 = acc[0];
      let offset = acc[1];
      return [
        prepend(offset, starts2),
        offset + byte_size(line) + 1
      ];
    }
  );
  let starts = $[0];
  return (span2) => {
    return count(starts, (start5) => {
      return start5 <= span2.start;
    });
  };
}
function parse_program(source, global) {
  let at = line_finder(source);
  let $ = module(source);
  if ($ instanceof Ok) {
    let module2 = $[0];
    let defs = sort(
      module2.functions,
      (a, b) => {
        return compare(
          a.definition.location.start,
          b.definition.location.start
        );
      }
    );
    return try$(
      try_map(
        defs,
        (_capture) => {
          return convert_function(_capture, global, at);
        }
      ),
      (fns) => {
        return try$(
          unique(
            map2(
              defs,
              (def) => {
                return [def.definition.name, def.definition.location];
              }
            ),
            "Duplicate function name: ",
            at
          ),
          (_use0) => {
            each2(
              fns,
              (f) => {
                return insert4(global, f[0], f[1]);
              }
            );
            return new Ok(global);
          }
        );
      }
    );
  } else {
    let $1 = $[0];
    if ($1 instanceof UnexpectedEndOfInput2) {
      let end = byte_size(trim_end(source));
      return fail("Unexpected end of input", new Span(end, end), at);
    } else {
      let position = $1.position;
      return fail(
        "Syntax error",
        new Span(position.byte_offset, position.byte_offset),
        at
      );
    }
  }
}

// canvas.mjs
var canvas2 = null;
var ctx = null;
var drawing = null;
var rate = 1;
var clock = 0;
var lastTs = 0;
var running = false;
var framesWithoutCanvas = 0;
var TENTHS_PER_SECOND = 10;
var MAX_FRAMES_WITHOUT_CANVAS = 600;
function setDrawing(pathList) {
  const paths = [];
  for (const p of pathList) {
    const flat = [];
    for (const q of p.points) flat.push(q.x, q.y);
    paths.push({
      pts: new Float64Array(flat),
      thickness: p.thickness,
      color: p.color,
      start: p.start,
      end: p.end
    });
  }
  drawing = { paths, endClock: drawingEndClock(paths) };
  if (!running) {
    running = true;
    lastTs = performance.now();
    requestAnimationFrame(frame);
  }
}
function drawingEndClock(paths) {
  let end = Infinity;
  for (const p of paths) {
    const finish = Math.max(p.start, p.end);
    end = end === Infinity ? finish : Math.max(end, finish);
  }
  return end;
}
function setSpeed(r) {
  rate = r;
}
function resetClock() {
  clock = 0;
}
function frame(ts) {
  const dt = Math.min((ts - lastTs) / 1e3, 0.1);
  lastTs = ts;
  clock += dt * rate * TENTHS_PER_SECOND;
  clock = clamp(clock, 0, drawing.endClock);
  render();
  requestAnimationFrame(frame);
}
function ensureSize() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(canvas2.clientWidth * dpr);
  const h = Math.round(canvas2.clientHeight * dpr);
  if (w > 0 && h > 0 && (canvas2.width !== w || canvas2.height !== h)) {
    canvas2.width = w;
    canvas2.height = h;
  }
}
function findCanvas() {
  const el = document.getElementById("animation-canvas");
  if (!el) {
    framesWithoutCanvas += 1;
    if (framesWithoutCanvas === MAX_FRAMES_WITHOUT_CANVAS) {
      console.error('The page has no <canvas id="animation-canvas"> element to draw on.');
    }
    return false;
  }
  if (el !== canvas2) {
    canvas2 = el;
    ctx = canvas2.getContext("2d");
  }
  return true;
}
function render() {
  if (!findCanvas()) return;
  ensureSize();
  const w = canvas2.width;
  const h = canvas2.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.setTransform(w / 1e3, 0, 0, h / 1e3, w / 2, h / 2);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const p of drawing.paths) {
    const u = penU(p);
    if (clock >= p.start) {
      drawUpToU(p, u);
    }
  }
}
function penU(p) {
  const duration = p.end - p.start;
  if (duration <= 0) return clock >= p.start ? 1 : 0;
  const u = (clock - p.start) / duration;
  return u < 0 ? 0 : u > 1 ? 1 : u;
}
function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}
function drawUpToU(p, u) {
  const pts = p.pts;
  const count2 = pts.length / 2;
  if (count2 < 2) return;
  const segs = count2 - 1;
  const f = u * segs;
  const k = Math.min(segs, Math.floor(f));
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 1; i <= k; i++) ctx.lineTo(pts[2 * i], pts[2 * i + 1]);
  const frac = f - k;
  if (k < segs && frac > 0) {
    const ax = pts[2 * k];
    const ay = pts[2 * k + 1];
    const bx = pts[2 * k + 2];
    const by = pts[2 * k + 3];
    ctx.lineTo(ax + (bx - ax) * frac, ay + (by - ay) * frac);
  }
  ctx.lineWidth = p.thickness;
  ctx.strokeStyle = p.color;
  ctx.stroke();
}

// render_ffi.mjs
function cos(x) {
  return Math.cos(x);
}
function sin(x) {
  return Math.sin(x);
}

// render.mjs
var FILEPATH2 = "src/render.gleam";
var RenderPath = class extends CustomType {
  constructor(points, thickness, color, start5, end) {
    super();
    this.points = points;
    this.thickness = thickness;
    this.color = color;
    this.start = start5;
    this.end = end;
  }
};
var palette = /* @__PURE__ */ prepend(
  "#e8d8b0",
  prepend(
    "#89ddff",
    prepend(
      "#c3e88d",
      prepend(
        "#f78c6c",
        prepend(
          "#c792ea",
          prepend(
            "#ffcb6b",
            prepend("#82aaff", prepend("#f07178", List$Empty$const))
          )
        )
      )
    )
  )
);
var tau = 6.283185307179586;
var circle_segments = 48;
function palette_color(index4) {
  let len = length(palette);
  let _block;
  if (len === 0) {
    _block = len;
  } else {
    let $2 = modulo(index4, len);
    if ($2 instanceof Ok) {
      let n = $2[0];
      _block = n;
    } else {
      _block = 0;
    }
  }
  let i = _block;
  let _block$1;
  let _pipe = drop(palette, i);
  _block$1 = first(_pipe);
  let $ = _block$1;
  let color;
  if ($ instanceof Ok) {
    color = $[0];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH2,
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
    );
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
function rgb_css(r, g, b) {
  return "rgb(" + to_string(clamp_byte(r)) + ", " + to_string(
    clamp_byte(g)
  ) + ", " + to_string(clamp_byte(b)) + ")";
}
function circle_points_loop(loop$center, loop$radius, loop$i, loop$acc) {
  while (true) {
    let center = loop$center;
    let radius = loop$radius;
    let i = loop$i;
    let acc = loop$acc;
    let $ = i > circle_segments;
    if ($) {
      return reverse(acc);
    } else {
      let t = divideFloat(identity(i), identity(circle_segments)) * tau;
      let point = new Point(
        center.x + radius * cos(t),
        center.y + radius * sin(t)
      );
      loop$center = center;
      loop$radius = radius;
      loop$i = i + 1;
      loop$acc = prepend(point, acc);
    }
  }
}
function circle_points(center, radius) {
  let r = absolute_value2(radius);
  return circle_points_loop(center, r, 0, List$Empty$const);
}
function render_path(path, color) {
  let $ = path.shape;
  if ($ instanceof Line) {
    let a = $.start;
    let b = $.end;
    return new RenderPath(
      prepend(a, prepend(b, List$Empty$const)),
      path.thickness,
      color,
      path.start,
      path.end
    );
  } else if ($ instanceof ColorLine) {
    let a = $.start;
    let b = $.end;
    let r = $.r;
    let g = $.g;
    let bl = $.b;
    return new RenderPath(
      prepend(a, prepend(b, List$Empty$const)),
      path.thickness,
      rgb_css(r, g, bl),
      path.start,
      path.end
    );
  } else if ($ instanceof Circle) {
    let center = $.center;
    let radius = $.radius;
    return new RenderPath(
      circle_points(center, radius),
      path.thickness,
      color,
      path.start,
      path.end
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
      path.end
    );
  }
}
function render_paths(paths) {
  return index_map(
    paths,
    (path, i) => {
      return render_path(path, palette_color(i));
    }
  );
}

// app.mjs
var FILEPATH3 = "src/app.gleam";
var Model = class extends CustomType {
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
};
var Model$Model = (source, code_open, error, shape_slider, speed, drawings, current) => new Model(source, code_open, error, shape_slider, speed, drawings, current);
var Model$isModel = (value2) => value2 instanceof Model;
var Model$Model$source = (value2) => value2.source;
var Model$Model$0 = (value2) => value2.source;
var Model$Model$code_open = (value2) => value2.code_open;
var Model$Model$1 = (value2) => value2.code_open;
var Model$Model$error = (value2) => value2.error;
var Model$Model$2 = (value2) => value2.error;
var Model$Model$shape_slider = (value2) => value2.shape_slider;
var Model$Model$3 = (value2) => value2.shape_slider;
var Model$Model$speed = (value2) => value2.speed;
var Model$Model$4 = (value2) => value2.speed;
var Model$Model$drawings = (value2) => value2.drawings;
var Model$Model$5 = (value2) => value2.drawings;
var Model$Model$current = (value2) => value2.current;
var Model$Model$6 = (value2) => value2.current;
var SetCode = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Msg$SetCode = ($0) => new SetCode($0);
var Msg$isSetCode = (value2) => value2 instanceof SetCode;
var Msg$SetCode$0 = (value2) => value2[0];
var ToggleCode = class extends CustomType {
};
var Msg$ToggleCode$const = new ToggleCode();
var Msg$ToggleCode = () => Msg$ToggleCode$const;
var Msg$isToggleCode = (value2) => value2 instanceof ToggleCode;
var SetShapeSlider = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Msg$SetShapeSlider = ($0) => new SetShapeSlider($0);
var Msg$isSetShapeSlider = (value2) => value2 instanceof SetShapeSlider;
var Msg$SetShapeSlider$0 = (value2) => value2[0];
var SetSpeed = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Msg$SetSpeed = ($0) => new SetSpeed($0);
var Msg$isSetSpeed = (value2) => value2 instanceof SetSpeed;
var Msg$SetSpeed$0 = (value2) => value2[0];
var SelectDrawing = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Msg$SelectDrawing = ($0) => new SelectDrawing($0);
var Msg$isSelectDrawing = (value2) => value2 instanceof SelectDrawing;
var Msg$SelectDrawing$0 = (value2) => value2[0];
var ResetAnim = class extends CustomType {
};
var Msg$ResetAnim$const = new ResetAnim();
var Msg$ResetAnim = () => Msg$ResetAnim$const;
var Msg$isResetAnim = (value2) => value2 instanceof ResetAnim;
var PauseAnim = class extends CustomType {
};
var Msg$PauseAnim$const = new PauseAnim();
var Msg$PauseAnim = () => Msg$PauseAnim$const;
var Msg$isPauseAnim = (value2) => value2 instanceof PauseAnim;
var PlayAnim = class extends CustomType {
};
var Msg$PlayAnim$const = new PlayAnim();
var Msg$PlayAnim = () => Msg$PlayAnim$const;
var Msg$isPlayAnim = (value2) => value2 instanceof PlayAnim;
var public_url = "https://sanabhig.github.io/animator/";
var include_app_in_gallery = false;
var video_url = "";
var include_video_in_gallery = false;
function init(_) {
  let lib = load_library();
  let source = current_source(lib);
  let model = new Model(source, true, "", 50, 1, lib.drawings, lib.current);
  return [
    model,
    batch(
      prepend(
        mount2(source, (var0) => {
          return new SetCode(var0);
        }),
        prepend(
          from2((dispatch2) => {
            return dispatch2(new SetCode(source));
          }),
          prepend(
            from2((_2) => {
              return setSpeed(1);
            }),
            List$Empty$const
          )
        )
      )
    )
  ];
}
function run_source(shape_slider, source) {
  let $ = parse_program(source, global_frame());
  if ($ instanceof Ok) {
    let program = $[0];
    let _pipe = try_draw(shape_slider, program);
    return map_error(_pipe, error_message);
  } else {
    return $;
  }
}
function persist(model) {
  return save_library(new Library(model.drawings, model.current));
}
function animate(paths, reset) {
  return from2(
    (_) => {
      if (reset) {
        resetClock();
      } else {
      }
      return setDrawing(render_paths(paths));
    }
  );
}
function clear_drawing() {
  return from2(
    (_) => {
      resetClock();
      return setDrawing(List$Empty$const);
    }
  );
}
function apply_source(model, text4, reset) {
  let drawings = update_drawing(model.drawings, model.current, text4);
  let next2 = new Model(
    text4,
    model.code_open,
    model.error,
    model.shape_slider,
    model.speed,
    drawings,
    model.current
  );
  persist(next2);
  let $ = run_source(next2.shape_slider, text4);
  if ($ instanceof Ok) {
    let paths = $[0];
    return [
      new Model(
        next2.source,
        next2.code_open,
        "",
        next2.shape_slider,
        next2.speed,
        next2.drawings,
        next2.current
      ),
      animate(paths, reset)
    ];
  } else {
    let msg = $[0];
    return [
      new Model(
        next2.source,
        next2.code_open,
        msg,
        next2.shape_slider,
        next2.speed,
        next2.drawings,
        next2.current
      ),
      clear_drawing()
    ];
  }
}
function update2(model, msg) {
  if (msg instanceof SetCode) {
    let text4 = msg[0];
    return apply_source(model, text4, true);
  } else if (msg instanceof ToggleCode) {
    return [
      new Model(
        model.source,
        !model.code_open,
        model.error,
        model.shape_slider,
        model.speed,
        model.drawings,
        model.current
      ),
      none()
    ];
  } else if (msg instanceof SetShapeSlider) {
    let value2 = msg[0];
    let next2 = new Model(
      model.source,
      model.code_open,
      model.error,
      value2,
      model.speed,
      model.drawings,
      model.current
    );
    let $ = run_source(value2, next2.source);
    if ($ instanceof Ok) {
      let paths = $[0];
      return [
        new Model(
          next2.source,
          next2.code_open,
          "",
          next2.shape_slider,
          next2.speed,
          next2.drawings,
          next2.current
        ),
        animate(paths, false)
      ];
    } else {
      let msg$1 = $[0];
      return [
        new Model(
          next2.source,
          next2.code_open,
          msg$1,
          next2.shape_slider,
          next2.speed,
          next2.drawings,
          next2.current
        ),
        clear_drawing()
      ];
    }
  } else if (msg instanceof SetSpeed) {
    let rate2 = msg[0];
    return [
      new Model(
        model.source,
        model.code_open,
        model.error,
        model.shape_slider,
        rate2,
        model.drawings,
        model.current
      ),
      from2((_) => {
        return setSpeed(rate2);
      })
    ];
  } else if (msg instanceof SelectDrawing) {
    let $ = msg[0];
    if ($ === "") {
      let name2 = promptDrawingName();
      let $1 = name2 === "";
      if ($1) {
        return [
          model,
          from2(
            (dispatch2) => {
              return dispatch2(new SelectDrawing(model.current));
            }
          )
        ];
      } else {
        let $2 = key_find(model.drawings, name2);
        if ($2 instanceof Ok) {
          let source = $2[0];
          let next2 = new Model(
            source,
            model.code_open,
            model.error,
            model.shape_slider,
            model.speed,
            model.drawings,
            name2
          );
          persist(next2);
          return [
            next2,
            batch(
              prepend(
                mount2(source, (var0) => {
                  return new SetCode(var0);
                }),
                prepend(
                  from2(
                    (dispatch2) => {
                      return dispatch2(new SetCode(source));
                    }
                  ),
                  List$Empty$const
                )
              )
            )
          ];
        } else {
          let source = default_new_source();
          let drawings = append(
            model.drawings,
            prepend([name2, source], List$Empty$const)
          );
          let next2 = new Model(
            source,
            model.code_open,
            "",
            model.shape_slider,
            model.speed,
            drawings,
            name2
          );
          persist(next2);
          return [
            next2,
            batch(
              prepend(
                mount2(source, (var0) => {
                  return new SetCode(var0);
                }),
                prepend(
                  from2(
                    (dispatch2) => {
                      return dispatch2(new SetCode(source));
                    }
                  ),
                  List$Empty$const
                )
              )
            )
          ];
        }
      }
    } else {
      let name2 = $;
      let $1 = key_find(model.drawings, name2);
      if ($1 instanceof Ok) {
        let source = $1[0];
        let next2 = new Model(
          source,
          model.code_open,
          model.error,
          model.shape_slider,
          model.speed,
          model.drawings,
          name2
        );
        persist(next2);
        return [
          next2,
          batch(
            prepend(
              mount2(source, (var0) => {
                return new SetCode(var0);
              }),
              prepend(
                from2(
                  (dispatch2) => {
                    return dispatch2(new SetCode(source));
                  }
                ),
                List$Empty$const
              )
            )
          )
        ];
      } else {
        return [model, none()];
      }
    }
  } else if (msg instanceof ResetAnim) {
    return [model, from2((_) => {
      return resetClock();
    })];
  } else if (msg instanceof PauseAnim) {
    return [
      new Model(
        model.source,
        model.code_open,
        model.error,
        model.shape_slider,
        0,
        model.drawings,
        model.current
      ),
      from2((_) => {
        return setSpeed(0);
      })
    ];
  } else {
    return [
      new Model(
        model.source,
        model.code_open,
        model.error,
        model.shape_slider,
        1,
        model.drawings,
        model.current
      ),
      from2((_) => {
        return setSpeed(1);
      })
    ];
  }
}
function view_slider(label2, test_id, value2, min3, max3, step, on_input2) {
  return label(
    prepend(class$("control"), List$Empty$const),
    prepend(
      span(
        prepend(class$("control-label"), List$Empty$const),
        prepend(text3(label2), List$Empty$const)
      ),
      prepend(
        input(
          prepend(
            type_("range"),
            prepend(
              min2(min3),
              prepend(
                max2(max3),
                prepend(
                  attribute2("step", step),
                  prepend(
                    value(value2),
                    prepend(
                      attribute2("data-test-id", test_id),
                      prepend(on_input(on_input2), List$Empty$const)
                    )
                  )
                )
              )
            )
          )
        ),
        List$Empty$const
      )
    )
  );
}
function view_drawing_select(model) {
  let options = map2(
    model.drawings,
    (pair) => {
      let name2 = pair[0];
      return option(
        prepend(
          value(name2),
          prepend(selected(name2 === model.current), List$Empty$const)
        ),
        name2
      );
    }
  );
  let new_option = option(
    prepend(value(""), List$Empty$const),
    "\uFF0B New drawing\u2026"
  );
  return label(
    prepend(class$("control drawing-select"), List$Empty$const),
    prepend(
      span(
        prepend(class$("control-label"), List$Empty$const),
        prepend(text3("Drawing"), List$Empty$const)
      ),
      prepend(
        select(
          prepend(
            attribute2("data-test-id", "drawing-select"),
            prepend(
              on_change((var0) => {
                return new SelectDrawing(var0);
              }),
              List$Empty$const
            )
          ),
          append(options, prepend(new_option, List$Empty$const))
        ),
        List$Empty$const
      )
    )
  );
}
function view_controls(model) {
  return div(
    prepend(class$("controls"), List$Empty$const),
    prepend(
      view_drawing_select(model),
      prepend(
        view_slider(
          "Shape",
          "shape-slider",
          to_string(model.shape_slider),
          "0",
          "100",
          "1",
          (v) => {
            return new SetShapeSlider(
              unwrap(parse_int(v), model.shape_slider)
            );
          }
        ),
        prepend(
          view_slider(
            "Speed",
            "speed-slider",
            float_to_string(model.speed),
            "-2",
            "3",
            "0.1",
            (v) => {
              return new SetSpeed(unwrap(parse_float(v), model.speed));
            }
          ),
          prepend(
            div(
              prepend(class$("playback"), List$Empty$const),
              prepend(
                button(
                  prepend(
                    class$("icon-btn"),
                    prepend(
                      attribute2("title", "Play"),
                      prepend(
                        on_click(Msg$PlayAnim$const),
                        List$Empty$const
                      )
                    )
                  ),
                  prepend(text3("\u25B6"), List$Empty$const)
                ),
                prepend(
                  button(
                    prepend(
                      class$("icon-btn"),
                      prepend(
                        attribute2("title", "Pause"),
                        prepend(
                          on_click(Msg$PauseAnim$const),
                          List$Empty$const
                        )
                      )
                    ),
                    prepend(text3("\u275A\u275A"), List$Empty$const)
                  ),
                  prepend(
                    button(
                      prepend(
                        class$("icon-btn"),
                        prepend(
                          attribute2("title", "Reset"),
                          prepend(
                            on_click(Msg$ResetAnim$const),
                            List$Empty$const
                          )
                        )
                      ),
                      prepend(text3("\u21BA"), List$Empty$const)
                    ),
                    List$Empty$const
                  )
                )
              )
            ),
            List$Empty$const
          )
        )
      )
    )
  );
}
function view_error(model) {
  let $ = model.error;
  if ($ === "") {
    return none2();
  } else {
    let msg = $;
    return pre(
      prepend(class$("error-banner"), List$Empty$const),
      prepend(text3(msg), List$Empty$const)
    );
  }
}
function view_reveal_code(model) {
  let $ = model.code_open;
  if ($) {
    return none2();
  } else {
    return button(
      prepend(
        class$("icon-btn reveal-code"),
        prepend(
          attribute2("title", "Show code"),
          prepend(on_click(Msg$ToggleCode$const), List$Empty$const)
        )
      ),
      prepend(text3("\u27E9"), List$Empty$const)
    );
  }
}
function view_anim(model) {
  return div(
    prepend(class$("canvas-area"), List$Empty$const),
    prepend(
      view_reveal_code(model),
      prepend(
        canvas(
          prepend(
            id("animation-canvas"),
            prepend(class$("canvas"), List$Empty$const)
          )
        ),
        prepend(
          view_error(model),
          prepend(view_controls(model), List$Empty$const)
        )
      )
    )
  );
}
function view(model) {
  let _block;
  let $ = model.code_open;
  if ($) {
    _block = "app";
  } else {
    _block = "app code-hidden";
  }
  let app_class = _block;
  return div(
    prepend(class$(app_class), List$Empty$const),
    prepend(
      div(
        prepend(class$("code-col"), List$Empty$const),
        prepend(view_panel(Msg$ToggleCode$const), List$Empty$const)
      ),
      prepend(view_anim(model), List$Empty$const)
    )
  );
}
function main() {
  let app = application(init, update2, view);
  let $ = start4(app, "#app", void 0);
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH3,
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
    );
  }
  return void 0;
}
export {
  Model,
  Model$Model,
  Model$Model$0,
  Model$Model$1,
  Model$Model$2,
  Model$Model$3,
  Model$Model$4,
  Model$Model$5,
  Model$Model$6,
  Model$Model$code_open,
  Model$Model$current,
  Model$Model$drawings,
  Model$Model$error,
  Model$Model$shape_slider,
  Model$Model$source,
  Model$Model$speed,
  Model$isModel,
  Msg$PauseAnim,
  Msg$PauseAnim$const,
  Msg$PlayAnim,
  Msg$PlayAnim$const,
  Msg$ResetAnim,
  Msg$ResetAnim$const,
  Msg$SelectDrawing,
  Msg$SelectDrawing$0,
  Msg$SetCode,
  Msg$SetCode$0,
  Msg$SetShapeSlider,
  Msg$SetShapeSlider$0,
  Msg$SetSpeed,
  Msg$SetSpeed$0,
  Msg$ToggleCode,
  Msg$ToggleCode$const,
  Msg$isPauseAnim,
  Msg$isPlayAnim,
  Msg$isResetAnim,
  Msg$isSelectDrawing,
  Msg$isSetCode,
  Msg$isSetShapeSlider,
  Msg$isSetSpeed,
  Msg$isToggleCode,
  PauseAnim,
  PlayAnim,
  ResetAnim,
  SelectDrawing,
  SetCode,
  SetShapeSlider,
  SetSpeed,
  ToggleCode,
  include_app_in_gallery,
  include_video_in_gallery,
  init,
  main,
  public_url,
  update2 as update,
  video_url,
  view
};
