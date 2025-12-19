import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  outDir: "dist",
  target: "es2022",
  format: ["esm"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  minify: false,
  onSuccess: "node dist/main.js",
});
