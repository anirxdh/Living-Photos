"use client";

import { CameraControls, Environment, Html, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import type { Scene } from "@/lib/db/schema";

interface Props {
  scene: Scene;
}

export default function SceneViewer({ scene }: Props) {
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    // Detect WebGL 2.0 — Spark / splat rendering needs it
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      setWebglOk(!!gl);
    } catch {
      setWebglOk(false);
    }
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

  return (
    <div className="relative">
      <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-black">
        <Canvas
          dpr={[1, 2]}
          frameloop="demand"
          gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
          camera={{ position: [0, 1.5, 3], fov: 50 }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <Suspense fallback={<LoadingHtml />}>
            {scene.meshes
              ?.filter((m) => m.url.toLowerCase().endsWith(".glb"))
              .map((m) => (
                <SceneMesh key={m.url} url={m.url} />
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
  // Caller already filters non-.glb URLs; hooks must run unconditionally.
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}
