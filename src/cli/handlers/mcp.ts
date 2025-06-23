import type { UserConfig } from "../../config";

import { configWithDefault } from "../../config/config";
import { readESLintConfig } from "../../lib/eslint";
import { createESLintConfigSubset } from "../../lib/eslint";
import { startMcpServerWithStdio } from "../../mcp/stdio";

export const handleMCP = async (cwd: string, userConfig: UserConfig) => {
  const config = configWithDefault(userConfig);

  const eslintConfig = await readESLintConfig(config.root);
  const eslintConfigSubset = createESLintConfigSubset(eslintConfig);

  const stopMcpServer = await startMcpServerWithStdio({
    config,
    eslintConfig: eslintConfigSubset,
  });

  process.on("SIGINT", () => {
    stopMcpServer()
      .then(() => {
        process.exitCode = 0;
      })
      .catch((error) => {
        console.error(error);
        process.exitCode = 1;
      });
  });
};
