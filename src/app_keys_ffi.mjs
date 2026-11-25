let keysAttached = false;
let lookAttached = false;

export function setTimeout(cb, ms) {
  return globalThis.setTimeout(cb, ms);
}

export function attachKeys(onKey) {
  if (keysAttached) return;
  keysAttached = true;
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

/**
 * Click canvas to pointer-lock (look with mouse).
 * While locked: left-click = lidar scan (Space still works too).
 */
export function attachMouseLook(onDelta, onScan) {
  if (lookAttached) return;
  lookAttached = true;

  const bind = (canvas) => {
    if (!canvas || canvas.dataset.lookBound === "1") return;
    canvas.dataset.lookBound = "1";
    canvas.style.cursor = "crosshair";
    canvas.title =
      "Click to mouse-look · while locked, click = scan · Esc releases";

    canvas.addEventListener("click", () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    });

    // mousedown fires while pointer-locked; click alone is unreliable then.
    document.addEventListener("mousedown", (e) => {
      if (document.pointerLockElement !== canvas) return;
      if (e.button !== 0) return;
      e.preventDefault();
      onScan();
    });

    document.addEventListener("pointerlockchange", () => {
      canvas.style.cursor =
        document.pointerLockElement === canvas ? "none" : "crosshair";
    });

    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== canvas) return;
      if (e.movementX === 0) return;
      onDelta(e.movementX);
    });
  };

  const tryBind = () => {
    const canvas = document.getElementById("animation-canvas");
    if (canvas) bind(canvas);
    else requestAnimationFrame(tryBind);
  };
  tryBind();
}
