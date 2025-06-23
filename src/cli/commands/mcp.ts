import { define } from "gunshi/definition";
import { cwd } from "node:process";

import { resolveFileConfig } from "../../config/resolve";
import { parseArguments } from "../arguments";
import { handleMCP } from "../handlers/mcp";
import { logger } from "../logger";
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

    if (isConfigDirty) {
      logger.warn(
        "Ignoring config file because config is passed via CLI flags.",
      );
    }

    const cliCwd = cwd();
    const userConfig = isConfigDirty
      ? inputConfig
      : await resolveFileConfig(cliCwd);

    await handleMCP(cliCwd, userConfig);
  },
});
