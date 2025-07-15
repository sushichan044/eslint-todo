import { define } from "gunshi/definition";
import { cwd } from "node:process";

import type { UserConfig } from "../../config";

import { resolveFileConfig } from "../../config/resolve";
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
    /**
     * If any CLI flag is explicitly passed,
     * treat the config as dirty and ignore the config file.
     */
    const isDirty = Object.values(context.explicit).includes(true);
    if (isDirty) {
      logger.warn(
        "Ignoring config file because config is passed via CLI flags.",
      );
    }

    const userCLIConfig = {
      root: context.values.root,
      todoFile: context.values.todoFile,
    } satisfies UserConfig;

    const cliCwd = cwd();
    const userConfig = isDirty
      ? userCLIConfig
      : await resolveFileConfig(cliCwd);

    await handleMCP(cliCwd, userConfig);
  },
});
