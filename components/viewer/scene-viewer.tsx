"use client";

import { CameraControls, Environment, Html, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, type ReactNode, Suspense, useEffect, useState } from "react";
import type { Scene } from "@/lib/db/schema";
import { SplatRenderer } from "./splat-renderer";

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
  const meshUrls = (scene.meshes ?? []).filter((m) => m.url.toLowerCase().endsWith(".glb"));
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
          camera={{ position: [0, 1.5, 3], fov: 50 }}
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
          <Environment preset="apartment" />
          <CameraControls
            minDistance={1}
            maxDistance={8}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
          />
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
        Drag to look around · scroll / pinch to move closer
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
