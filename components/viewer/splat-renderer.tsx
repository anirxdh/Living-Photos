"use client";

/**
 * Spark.js splat renderer wrapped for React Three Fiber.
 *
 * Loads a Gaussian-splat (.spz / .ply / .splat / .ksplat / .sog) and renders
 * it inside an R3F Canvas. Mounted by `scene-viewer.tsx` only on the client
 * (the parent dynamically imports with `ssr: false`).
 *
 * Why imperative instead of declarative JSX:
 * R3F's `extend()` lets you write `<SplatMeshEl args={[{ url }]} />`, which
 * runs `new SplatMesh({ url })` — but Spark v2's constructor only stashes
 * options. The actual fetch + WASM decode happens via `asyncInitialize()`
 * which the constructor schedules internally and SparkRenderer drives during
 * the render loop. With the JSX pattern the SplatMesh instance was created
 * but never decoded — canvas stayed black, no .spz request fired.
 *
 * The vanilla-Three pattern from the Spark README works end-to-end:
 * `new SplatMesh({ url })`, then `scene.add(mesh)`. We replicate that here.
 */
import { useThree } from "@react-three/fiber";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import { useEffect } from "react";

interface Props {
  url: string;
  /** Marble outputs use a Y-down convention; Three uses Y-up. Flip the splat
   *  180° around X so floors are down and ceilings are up. Defaults to true. */
  flipY?: boolean;
}

export function SplatRenderer({ url, flipY = true }: Props) {
  const { scene, gl } = useThree();

  useEffect(() => {
    // React 19 Strict Mode (enabled in next.config) mounts → cleanup →
    // mounts again. The first cleanup disposed a half-initialized SplatMesh
    // mid-WASM-decode, which crashed Spark's worker on the second mount.
    // `cancelled` lets the async init see the unmount and skip side-effects.
    let cancelled = false;
    let mesh: SplatMesh | null = null;
    let sparkRenderer: SparkRenderer | null = null;

    // SparkRenderer is a Three.Mesh that drives sorting + LoD + decode for
    // every SplatMesh in the scene. Add one per scene, then add SplatMeshes
    // alongside it (siblings, not children).
    sparkRenderer = new SparkRenderer({ renderer: gl });
    scene.add(sparkRenderer);

    mesh = new SplatMesh({ url });
    // Mesh raycasting on a 1M-point cloud is expensive and unhelpful here.
    mesh.raycast = () => {};
    if (flipY) {
      // 180° around X = flip Y (and Z). Floors point down, ceilings up.
      mesh.rotation.x = Math.PI;
    }
    scene.add(mesh);

    // Only dispose after init completes — avoids the strict-mode race where
    // we'd otherwise dispose a partially-decoded splat and crash.
    mesh.initialized?.then(() => {
      if (cancelled && mesh) {
        scene.remove(mesh);
        mesh.dispose?.();
      }
    });

    return () => {
      cancelled = true;
      // If init already finished, remove now; otherwise the .then() handler
      // above will do it. Removing the SparkRenderer is always safe.
      if (mesh?.isInitialized) {
        scene.remove(mesh);
        mesh.dispose?.();
      }
      if (sparkRenderer) {
        scene.remove(sparkRenderer);
      }
    };
  }, [scene, gl, url, flipY]);

  return null;
}
