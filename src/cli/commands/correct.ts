import { define } from "gunshi/definition";
import { cwd } from "node:process";

import { resolveFileConfig } from "../../config/resolve";
import { parseArguments } from "../arguments";
import { handleCorrect } from "../handlers/correct";
import { logger } from "../logger";
import { commonArguments, correctModeArguments } from "./common-arguments";

/**
 * @package
 */
export const correctCmd = define({
  args: {
    ...commonArguments,
    ...correctModeArguments,
  } as const,
  name: "correct",
  run: async (context) => {
    /**
     * If any CLI flag is explicitly passed,
     * treat the config as dirty and ignore the config file.
     */
    const isDirty = Object.values(context.explicit).includes(true);

    const { inputConfig } = parseArguments({
      config: {
        correct: {
          "autoFixableOnly": context.values["correct.autoFixableOnly"],
          "exclude.files": context.values["correct.exclude.files"],
          "exclude.rules": context.values["correct.exclude.rules"],
          "include.files": context.values["correct.include.files"],
          "include.rules": context.values["correct.include.rules"],
          "limit.count": context.values["correct.limit.count"],
          "limit.type": context.values["correct.limit.type"],
          "partialSelection": context.values["correct.partialSelection"],
        },
        root: context.values.root,
        todoFile: context.values.todoFile,
      },
      mode: {
        correct: true,
        mcp: false,
      },
    });

    if (isDirty) {
      logger.warn(
        "Ignoring config file because config is passed via CLI flags.",
      );
    }

    // Resolve Config
    const cliCwd = cwd();
    const userConfig = isDirty ? inputConfig : await resolveFileConfig(cliCwd);

    return await handleCorrect(cliCwd, userConfig);
  },
});
