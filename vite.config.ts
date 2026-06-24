import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "WardleyDemo",
      formats: ["iife"],
      fileName: () => "wardley-demo.js",
    },
    rollupOptions: {
      output: {
        exports: "default",
      },
    },
  },
});
