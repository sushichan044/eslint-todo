import { defineConfig } from "tsdown";

export default defineConfig({
  attw: { profile: "esmOnly" },
  clean: true,
  dts: true,
  entry: [
    "./src/index.ts",
    "./src/config/index.ts",
    "./src/eslint/index.ts",
    "./src/cli/index.ts",
    "./src/mcp/index.ts",

    // Worker threads depend on relative file structure.
    // So we need to include it explicitly to avoid any bundling issue or tree-shaking issue.
    "./src/worker/**/*.ts",
    "!./src/worker/**/*.test.ts",
  ],
  format: "esm",
  fromVite: true,
  minify: "dce-only",
  nodeProtocol: true,
  onSuccess: "pnpm run build:json-schema",
  outDir: "dist",
  outExtensions: () => {
    return {
      js: ".mjs",
    };
  },
  publint: true,
  sourcemap: false,
  treeshake: true,
  unbundle: true,
  unused: true,
});
