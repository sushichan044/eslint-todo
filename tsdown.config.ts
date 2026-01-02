import { defineConfig } from "tsdown";

import { typiaRolldown } from "./typia-plugin";

export default defineConfig({
  attw: { level: "error", profile: "esm-only" },
    clean: true,
  dts: true,
  entry: [
    "./src/index.ts",
    "./src/config/index.ts",
    "./src/eslint/index.ts",
    "./src/cli/index.ts",

    // Worker threads depend on relative file structure.
    // So we need to include it explicitly to avoid any bundling issue or tree-shaking issue.
    "./src/worker/**/*.ts",
    "!./src/worker/**/*.test.ts",
  ],
  fixedExtension:true,
  format: "esm",
  minify: "dce-only",
  nodeProtocol: true,
  onSuccess: "pnpm run build:json-schema",
  outDir: "dist",
  plugins: [typiaRolldown],
  publint: true,
  sourcemap: false,
  treeshake: true,
  unbundle: true,
  unused: true,
});
