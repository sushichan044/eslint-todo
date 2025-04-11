import { defineBuildConfig } from "unbuild";

import { checkWorkerScriptsIncludedInEntries } from "./scripts/check-worker-build";
import { sh } from "./src/utils/command";
import { typiaRollup } from "./typia-plugin";

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    "src/index.ts",
    "src/cli/index.ts",
    "src/config/index.ts",
    "src/eslint/index.ts",
    "src/mcp/index.ts",
    "src/worker/core/client.ts",
    "src/worker/core/index.ts",
  ],
  hooks: {
    "build:before": (context) => {
      // Since the client of workers depends on a relative path to the file that defines Comlink Remote,
      // we check the configuration at build time to ensure that all worker files are included in the `entries` option.
      checkWorkerScriptsIncludedInEntries(
        context.options.rootDir,
        context.options.entries,
      );
    },
    "build:done": async () => {
      await sh(["pnpm", "run", "build:json-schema"]);
    },
    "rollup:options": (_, options) => {
      // typia plugin should be the first otherwise it will not work
      options.plugins.unshift(typiaRollup);
    },
  },
  rollup: {
    inlineDependencies: true,
  },
});
