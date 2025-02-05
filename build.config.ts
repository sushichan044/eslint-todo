import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  entries: ["src/index.ts", "src/cli.ts", "src/eslint.ts"],
});
