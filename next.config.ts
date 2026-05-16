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
};

export default nextConfig;
