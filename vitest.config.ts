import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    // Vitest 4 can intermittently lose runner state under suite-scale Windows
    // worker concurrency. A single fork keeps process isolation while making
    // collection deterministic for this small unit-test suite.
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
