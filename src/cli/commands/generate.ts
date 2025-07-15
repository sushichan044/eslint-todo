import { define } from "gunshi/definition";
import { cwd } from "node:process";

import { resolveFileConfig } from "../../config/resolve";
import { parseArguments } from "../arguments";
import { handleGenerate } from "../handlers/generate";
import { logger } from "../logger";
import { commonArguments } from "./common-arguments";

/**
 * @package
 */
export const generateCmd = define({
  args: {
    ...commonArguments,
  } as const,
  name: "generate",
  run: async (context) => {
    /**
     * If any CLI flag is explicitly passed,
     * treat the config as dirty and ignore the config file.
     */
    const isDirty = Object.values(context.explicit).includes(true);

    const { inputConfig } = parseArguments({
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
        root: context.values.root,
        todoFile: context.values.todoFile,
      },
      mode: {
        correct: false,
        mcp: false,
      },
    });

    if (isDirty) {
      logger.warn(
        "Ignoring config file because config is passed via CLI flags.",
      );
    }

    const cliCwd = cwd();
    const userConfig = isDirty ? inputConfig : await resolveFileConfig(cliCwd);

    return await handleGenerate(cliCwd, userConfig);
  },
});
