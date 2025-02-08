import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  entries: [
    "src/index.ts",
    "src/cli/index.ts",
    "src/eslint/index.ts",
    "src/remote/core.ts",
    "src/remote/client.ts",
  ],
});
