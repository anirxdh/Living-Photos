"use client";

import { extend, useThree } from "@react-three/fiber";
/**
 * Spark.js splat renderer wrapped for React Three Fiber.
 *
 * Loads a Gaussian-splat `.spz` produced by World Labs Marble and renders it
 * inside an R3F Canvas. Mounted by `scene-viewer.tsx` only on the client
 * (the parent dynamically imports with `ssr: false`).
 */
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";

const SparkRendererEl = extend(SparkRenderer);
const SplatMeshEl = extend(SplatMesh);

const ignoreRaycast: THREE.Object3D["raycast"] = () => {};

interface Props {
  url: string;
  visible?: boolean;
  /** Move the splat vertically so the floor sits at y=0. */
  groundPlaneOffset?: number;
  /** Some Marble outputs are y-flipped; flip when needed. */
  flipY?: boolean;
  metricScaleFactor?: number;
}

export function SplatRenderer({
  url,
  visible = true,
  groundPlaneOffset = 0,
  flipY = false,
  metricScaleFactor = 1,
}: Props) {
  const renderer = useThree((s) => s.gl);
  const splatRef = useRef<SplatMesh>(null);
  const sparkRef = useRef<SparkRenderer>(null);

  useEffect(() => {
    if (splatRef.current) splatRef.current.raycast = ignoreRaycast;
    if (sparkRef.current) sparkRef.current.raycast = ignoreRaycast;
  }, []);

  const sparkArgs = useMemo(() => ({ renderer, enableLod: true, encodeLinear: false }), [renderer]);
  const splatArgs = useMemo(() => ({ url }), [url]);

  return (
    <SparkRendererEl ref={sparkRef} args={[sparkArgs]} visible={visible}>
      <group
        position={[0, groundPlaneOffset, 0]}
        rotation={[flipY ? Math.PI : 0, 0, 0]}
        scale={metricScaleFactor}
      >
        <SplatMeshEl ref={splatRef} args={[splatArgs]} />
      </group>
    </SparkRendererEl>
  );
}
