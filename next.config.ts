import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server actions body size for upload (we use blob signed URLs, so this stays small)
    serverActions: { bodySizeLimit: "10mb" },
  },
  // Three.js + Spark.js are client-only; transpile them for App Router
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "@sparkjsdev/spark",
    "@sparkjsdev/spark-react-r3f",
  ],
  // Skip running the build-time eslint phase — we use Biome
  eslint: { ignoreDuringBuilds: true },
  // Sentry / PostHog are wired via instrumentation hooks; keep typed-routes off for now
  typedRoutes: false,
  // Spark.js v2 spawns a Worker that uses WASM + SharedArrayBuffer. Modern
  // browsers refuse to expose SharedArrayBuffer unless the page is "cross-
  // origin isolated", which requires both COOP and COEP headers. Without
  // them the worker terminates immediately with no useful error message —
  // exactly the "Worker terminate" symptom we hit. These headers apply to
  // every response so the scene viewer page can spawn the Spark worker.
  async headers() {
    return [
      {
        // Scope to scene viewer pages only — applying globally would break
        // Stripe Checkout (its cross-origin scripts don't set CORP headers).
        //
        // COEP=credentialless (not require-corp) so cross-origin assets
        // without explicit CORP headers (Drei's HDRI environment from
        // cdn.jsdelivr, Marble splats from Google Cloud Storage, etc.) still
        // load — they're just fetched without credentials. We still get
        // SharedArrayBuffer access which is what Spark.js v2's worker needs.
        source: "/scene/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
