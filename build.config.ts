import { defineBuildConfig } from "unbuild";

import { typiaRollup } from "./typia-plugin";

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    "src/index.ts",
    "src/cli/index.ts",
    "src/eslint/index.ts",
    "src/remote/core.ts",
    "src/remote/client.ts",
  ],
  hooks: {
    "rollup:options": (_, options) => {
      // typia plugin should be the first otherwise it will not work
      options.plugins.unshift(typiaRollup);
    },
  },
});
