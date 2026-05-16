import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/contract/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules", "vendor", ".next"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      exclude: ["**/*.config.*", "**/types.ts", "node_modules", ".next", "vendor", "tests"],
    },
    // Tests run with MOCK_MODE=true unless overridden
    env: {
      MOCK_MODE: "true",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/app": path.resolve(__dirname, "./app"),
      "@/tests": path.resolve(__dirname, "./tests"),
    },
  },
});
