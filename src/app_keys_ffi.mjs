let keysAttached = false;
let lookAttached = false;

export function setTimeout(cb, ms) {
  return globalThis.setTimeout(cb, ms);
}

export function debugLog(s) {
  console.log("[animator]", s);
  globalThis.__animatorLog = (globalThis.__animatorLog || []).concat([s]);
}

/** Drop duplicate toggle events (automation / double-bound handlers). */
export function shouldToggle() {
  const now = performance.now();
  if (now - (globalThis.__animatorLastToggle || 0) < 400) return false;
  globalThis.__animatorLastToggle = now;
  return true;
}

/**
 * Document-level lidar actions. Bypasses Lustre's vdom event-path cache
 * (which breaks when the DOM is instrumented). Callbacks are swapped on
 * every attach; the listener is registered once.
 */
export function attachActions(setLidar, onScan) {
  globalThis.__animatorSetLidar = setLidar;
  globalThis.__animatorOnScan = onScan;
  if (globalThis.__animatorActionsBound) return;
  globalThis.__animatorActionsBound = true;
  let lastToggleAt = 0;
  globalThis.__animatorActionHandler = (e) => {
    const el = e.target?.closest?.("[data-action]");
    if (!el) return;
    const action = el.getAttribute("data-action");
    if (action === "lidar-toggle") {
      e.preventDefault();
      e.stopPropagation();
      const now = performance.now();
      if (now - lastToggleAt < 250) return;
      lastToggleAt = now;
      const wantOn = document.querySelector(".app")?.dataset?.lidar !== "on";
      try {
        globalThis.__animatorSetLidar?.(wantOn);
      } catch (err) {
        console.error("lidar toggle failed", err);
      }
    } else if (action === "lidar-scan") {
      e.preventDefault();
      e.stopPropagation();
      try {
        globalThis.__animatorOnScan?.();
      } catch (err) {
        console.error("lidar scan failed", err);
      }
    }
  };
  document.addEventListener("click", globalThis.__animatorActionHandler, true);
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
      k === " " ||
      k === "l" ||
      k === "L"
    ) {
      e.preventDefault();
      onKey(k);
    }
  });
}

/**
 * Click canvas to pointer-lock (look with mouse).
 * While locked: left-click = lidar scan (Space still works too).
 * Lock click itself does not scan; scans are debounced.
 */
export function attachMouseLook(onDelta, onScan) {
  if (lookAttached) return;
  lookAttached = true;

  let lockAt = 0;
  let lastScanAt = 0;

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

    document.addEventListener("mousedown", (e) => {
      if (document.pointerLockElement !== canvas) return;
      if (e.button !== 0) return;
      const now = performance.now();
      // Ignore the click that acquired the lock + debounce double fires.
      if (now - lockAt < 350) return;
      if (now - lastScanAt < 120) return;
      lastScanAt = now;
      e.preventDefault();
      onScan();
    });

    document.addEventListener("pointerlockchange", () => {
      const locked = document.pointerLockElement === canvas;
      canvas.style.cursor = locked ? "none" : "crosshair";
      if (locked) lockAt = performance.now();
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
