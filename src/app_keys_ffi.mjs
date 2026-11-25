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

/** Click the canvas to pointer-lock; mouse X then yaws look. */
export function attachMouseLook(onDelta) {
  if (lookAttached) return;
  lookAttached = true;

  const bind = (canvas) => {
    if (!canvas || canvas.dataset.lookBound === "1") return;
    canvas.dataset.lookBound = "1";
    canvas.style.cursor = "crosshair";
    canvas.title = "Click to mouse-look (Esc to release)";

    canvas.addEventListener("click", () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
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
