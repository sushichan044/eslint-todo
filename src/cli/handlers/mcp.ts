import { resolveFlatConfig } from "@sushichan044/eslint-config-array-resolver";

import type { UserConfig } from "../../config";

import { configWithDefault } from "../../config/config";
import { createESLintConfigSubset } from "../../lib/eslint";
import { startMcpServerWithStdio } from "../../mcp/stdio";

export const handleMCP = async (cwd: string, userConfig: UserConfig) => {
  const config = configWithDefault(userConfig);

  const eslintConfig = await resolveFlatConfig(config.root);
  const eslintConfigSubset = createESLintConfigSubset(eslintConfig);

  const stopMcpServer = await startMcpServerWithStdio({
    config,
    eslintConfig: eslintConfigSubset,
  });

  process.on("SIGINT", () => {
    stopMcpServer()
      .then(() => {
        process.exit(0);
      })
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  });
};
