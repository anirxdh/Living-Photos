"use client";

import {
  CameraControls,
  type CameraControls as CameraControlsImpl,
  Html,
  useGLTF,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, type ReactNode, Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Scene } from "@/lib/db/schema";
import { SplatRenderer } from "./splat-renderer";
import { WasdControls } from "./wasd-controls";

interface Props {
  scene: Scene;
}

export default function SceneViewer({ scene }: Props) {
  const [webglOk, setWebglOk] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      setWebglOk(!!gl);
    } catch {
      setWebglOk(false);
    }
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  if (!webglOk) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-12 text-center">
        <p className="mb-2 text-lg">Your browser can't render this scene.</p>
        <p className="text-sm text-muted-foreground">
          Open this page on a desktop browser with WebGL 2 (Chrome, Safari 15+, Firefox).
        </p>
      </div>
    );
  }

  // Mobile devices get the low-poly splat tier to avoid Safari WebGL crashes
  // on heavy worlds. Falls back to full-res on desktop.
  const splatUrl = isMobile && scene.spzUrlLowPoly ? scene.spzUrlLowPoly : scene.spzUrl;
  // Hide mesh fixtures for now — the mock pipeline emits a Khronos Box.glb
  // placeholder that visually competes with the splat. Real Hunyuan3D output
  // (in real mode) renders fine; the placeholder just looks bad in demo.
  const meshUrls = (scene.meshes ?? []).filter(
    (m) => m.url.toLowerCase().endsWith(".glb") && !m.url.includes("/fixtures/"),
  );
  const isDemoMode = !splatUrl && meshUrls.length === 0;

  return (
    <div className="relative">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black">
        {isDemoMode && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="max-w-md px-8 text-center text-white/80">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Demo mode</p>
              <p className="mt-3 font-serif text-2xl italic">
                Your memory would walk through here.
              </p>
              <p className="mt-3 text-sm text-white/60">
                Real 3D scenes generate when MOCK_MODE is off and World Labs + FAL keys are live.
              </p>
            </div>
          </div>
        )}
        <Canvas
          dpr={[1, 2]}
          // 'always' (not 'demand') so Spark.js's splat decoder + render loop
          // actually gets per-frame invalidations once the .spz is loaded.
          // With 'demand', nothing triggered a re-render after splat load and
          // the canvas stayed black.
          frameloop="always"
          gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
          // Start the camera INSIDE the room (just left of center, at standing
          // height) looking forward. Splats from Marble are roughly metric so
          // these XYZ units are ~meters.
          camera={{ position: [0, 1.4, 0], fov: 65 }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <Suspense fallback={<LoadingHtml />}>
            {splatUrl?.toLowerCase().endsWith(".spz") && (
              <SafeAsset>
                <SplatRenderer url={splatUrl} />
              </SafeAsset>
            )}
            {meshUrls.map((m, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: mock meshes share /fixtures/object.glb; index disambiguates duplicates
              <SafeAsset key={`${m.url}#${i}`}>
                <SceneMesh url={m.url} />
              </SafeAsset>
            ))}
          </Suspense>
          {/* Drei's Environment preset loads a CDN-hosted HDRI which fails
              under COEP=credentialless (the cross-origin fetch + the broken-
              image fallback you see in the viewer). Splat-only scenes don't
              need an env map anyway — the splat itself carries color. */}
          <SceneControls />
        </Canvas>
      </div>
      {scene.ambientSfxUrl && (
        // biome-ignore lint/a11y/useMediaCaption: ambient SFX, no speech
        <audio src={scene.ambientSfxUrl} autoPlay loop className="hidden" />
      )}
      {scene.narrationUrl && (
        // biome-ignore lint/a11y/useMediaCaption: narration plays alongside ambient
        <audio src={scene.narrationUrl} autoPlay className="hidden" />
      )}
      <p className="mt-3 text-center text-sm text-muted-foreground">
        <kbd className="rounded border border-border px-1.5 py-0.5 text-xs">W A S D</kbd> walk ·{" "}
        <kbd className="rounded border border-border px-1.5 py-0.5 text-xs">drag</kbd> look ·{" "}
        <kbd className="rounded border border-border px-1.5 py-0.5 text-xs">scroll</kbd> zoom ·{" "}
        <kbd className="rounded border border-border px-1.5 py-0.5 text-xs">shift</kbd> faster
      </p>
    </div>
  );
}

function LoadingHtml() {
  return (
    <Html center>
      <div className="rounded-md bg-black/70 px-3 py-2 text-xs text-white">Loading scene…</div>
    </Html>
  );
}

function SceneMesh({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

/** Drag-to-look (CameraControls) + WASD-to-walk (via the controls ref).
 *  Wraps them together so WasdControls can drive CameraControls' API
 *  (truck/forward) instead of fighting it by mutating camera.position. */
function SceneControls() {
  const controls = useRef<CameraControlsImpl | null>(null);

  // Soft virtual room boundary — splats have no geometry so there's no real
  // collision. Without this, WASD walks straight through walls. The box is
  // sized for typical Marble interior scale (~6m × 4m room with some
  // breathing room). Real production: use Marble's collider_mesh_url for
  // raycast-based collision (planned V2).
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const box = new THREE.Box3(
      new THREE.Vector3(-3.5, 0.3, -3.5),
      new THREE.Vector3(3.5, 2.5, 3.5),
    );
    c.setBoundary(box);
  }, []);

  return (
    <>
      <CameraControls
        ref={controls}
        // No min/max polar — let users look up at ceilings + down at floors.
        minDistance={0.001}
        maxDistance={50}
        // Disable click-truck so accidental clicks don't teleport you.
        mouseButtons={{ left: 1, middle: 8, right: 2, wheel: 16 }}
      />
      <WasdControls controlsRef={controls} />
    </>
  );
}

/**
 * Catches loader errors (invalid GLB/SPZ, network failures, malformed binary)
 * and renders nothing instead of crashing the whole Canvas. Lets the scene
 * page survive when individual assets are placeholder stubs in MOCK_MODE.
 */
class SafeAsset extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[SceneViewer] asset failed to load, skipping:", error.message);
    }
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
