"use client";

import type { CameraControls as CameraControlsImpl } from "@react-three/drei";
import type { RefObject } from "react";
import { useEffect, useRef } from "react";

/**
 * Walk-through translation that drives a Drei `CameraControls` ref via its
 * public API. Directly mutating `camera.position` doesn't work because
 * CameraControls lerps the camera to its internal target every frame and
 * overwrites our move.
 *
 *   W / ↑   forward
 *   S / ↓   back
 *   A / ←   strafe left
 *   D / →   strafe right
 *   Shift   3× speed
 */
export function WasdControls({
  controlsRef,
  speed = 1.5,
}: {
  controlsRef: RefObject<CameraControlsImpl | null>;
  speed?: number;
}) {
  const keys = useRef<Record<string, boolean>>({});
  const lastTime = useRef<number | null>(null);

  useEffect(() => {
    function down(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      keys.current[e.key.toLowerCase()] = true;
    }
    function up(e: KeyboardEvent) {
      keys.current[e.key.toLowerCase()] = false;
    }
    function blur() {
      keys.current = {};
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);

    let rafId: number;
    function loop(t: number) {
      const dt = lastTime.current === null ? 0 : (t - lastTime.current) / 1000;
      lastTime.current = t;
      const c = controlsRef.current;
      const k = keys.current;
      if (c && dt > 0) {
        const boost = k.shift ? 3 : 1;
        const dist = speed * boost * Math.min(dt, 0.1);
        let fwd = 0;
        let side = 0;
        if (k.w || k.arrowup) fwd += dist;
        if (k.s || k.arrowdown) fwd -= dist;
        if (k.d || k.arrowright) side += dist;
        if (k.a || k.arrowleft) side -= dist;
        if (fwd !== 0) c.forward(fwd, true);
        if (side !== 0) c.truck(side, 0, true);
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      cancelAnimationFrame(rafId);
    };
  }, [controlsRef, speed]);

  return null;
}
