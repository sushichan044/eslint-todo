import { cwd } from "node:process";
import { defineBuildConfig } from "unbuild";

import { generateJsonSchemaFile } from "./scripts/json-schema";
import { typiaRollup } from "./typia-plugin";

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    "src/index.ts",
    "src/cli/index.ts",
    "src/config/index.ts",
    "src/eslint/index.ts",
    "src/remote/core.ts",
    "src/remote/client.ts",
  ],
  hooks: {
    "build:done": async () => {
      await generateJsonSchemaFile(cwd());
    },
    "rollup:options": (_, options) => {
      // typia plugin should be the first otherwise it will not work
      options.plugins.unshift(typiaRollup);
    },
  },
});
