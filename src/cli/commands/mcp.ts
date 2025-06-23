import { define } from "gunshi/definition";
import { cwd } from "node:process";

import { configWithDefault } from "../../config/config";
import { resolveFileConfig } from "../../config/resolve";
import { createESLintConfigSubset, readESLintConfig } from "../../lib/eslint";
import { startMcpServerWithStdio } from "../../mcp/stdio";
import { parseArguments } from "../arguments";
import { commonArguments } from "./common-arguments";

/**
 * @package
 */
export const mcpCmd = define({
  args: {
    ...commonArguments,
  } as const,
  name: "mcp",
  run: async (context) => {
    const root = context.values.root;
    const todoFile = context.values.todoFile;

    const { inputConfig, isConfigDirty } = parseArguments({
      config: {
        correct: {
          "autoFixableOnly": undefined,
          "exclude.files": undefined,
          "exclude.rules": undefined,
          "include.files": undefined,
          "include.rules": undefined,
          "limit.count": undefined,
          "limit.type": undefined,
          "partialSelection": undefined,
        },
        root,
        todoFile,
      },
      mode: {
        correct: false,
        mcp: true,
      },
    });

    const cliCwd = cwd();
    const userConfig = isConfigDirty
      ? inputConfig
      : await resolveFileConfig(cliCwd);
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

    return;
  },
});
