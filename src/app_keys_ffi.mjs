let attached = false;

export function setTimeout(cb, ms) {
  return globalThis.setTimeout(cb, ms);
}

export function attachKeys(onKey) {
  if (attached) return;
  attached = true;
  window.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "TEXTAREA" || tag === "INPUT" || e.target?.isContentEditable) {
      return;
    }
    const k = e.key;
    if (
      k === "ArrowUp" ||
      k === "ArrowDown" ||
      k === "ArrowLeft" ||
      k === "ArrowRight" ||
      k === "w" ||
      k === "a" ||
      k === "s" ||
      k === "d" ||
      k === "W" ||
      k === "A" ||
      k === "S" ||
      k === "D" ||
      k === " "
    ) {
      e.preventDefault();
      onKey(k);
    }
  });
}
