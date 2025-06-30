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
    // Resolve Args
    const root = context.values.root;
    const todoFile = context.values.todoFile;
    const autoFixableOnly = context.values["correct.autoFixableOnly"];
    const excludeRules = context.values["correct.exclude.rules"];
    const excludeFiles = context.values["correct.exclude.files"];
    const includeRules = context.values["correct.include.rules"];
    const includeFiles = context.values["correct.include.files"];
    const limitCount = context.values["correct.limit.count"];
    const limitType = context.values["correct.limit.type"];
    const partialSelection = context.values["correct.partialSelection"];

    const { inputConfig, isConfigDirty } = parseArguments({
      config: {
        correct: {
          autoFixableOnly: autoFixableOnly,
          "exclude.files": excludeFiles,
          "exclude.rules": excludeRules,
          "include.files": includeFiles,
          "include.rules": includeRules,
          "limit.count": limitCount,
          "limit.type": limitType,
          partialSelection,
        },
        root,
        todoFile,
      },
      mode: {
        correct: true,
        mcp: false,
      },
    });

    if (isConfigDirty) {
      logger.warn(
        "Ignoring config file because config is passed via CLI flags.",
      );
    }

    // Resolve Config
    const cliCwd = cwd();
    const userConfig = isConfigDirty
      ? inputConfig
      : await resolveFileConfig(cliCwd);

    return await handleCorrect(cliCwd, userConfig);
  },
});
