import NodeExternals from "rollup-plugin-node-externals";
import { defineConfig } from "tsdown";

import { sh } from "./src/utils/command";
import { typiaRolldown } from "./typia-plugin";

export default defineConfig({
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
  hooks: {
    "build:done": async () => {
      try {
        await sh(["pnpm", "run", "build:json-schema"]);
        console.log("✅ JSON schema generated successfully");
      } catch (error) {
        if (error instanceof Error) {
          console.error("❌ Failed to generate JSON schema:", error.message);
        } else {
          console.error("❌ Failed to generate JSON schema:", String(error));
        }
        throw error;
      }
    },
  },
  minify: "dce-only",
  nodeProtocol: true,
  outDir: "dist",
  outExtensions: () => {
    return {
      js: ".mjs",
    };
  },
  plugins: [typiaRolldown, NodeExternals()],
  publint: true,
  sourcemap: false,
  treeshake: true,
  unbundle: true,
  unused: true,
});
