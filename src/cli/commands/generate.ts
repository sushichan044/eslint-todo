import { define } from "gunshi/definition";
import { cwd } from "node:process";
import { relative } from "pathe";

import { ESLintTodoCore } from "../..";
import { prepareAction } from "../../action";
import { genAction } from "../../action/gen";
import { configWithDefault } from "../../config/config";
import { resolveFileConfig } from "../../config/resolve";
import { createESLintConfigSubset, readESLintConfig } from "../../lib/eslint";
import { parseArguments } from "../arguments";
import { commonArguments } from "./common-arguments";
import { logger } from "./logger";

/**
 * @package
 */
export const generateCmd = define({
  args: {
    ...commonArguments,
  } as const,
  name: "generate",
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
        mcp: false,
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
    const config = configWithDefault(userConfig);

    const eslintConfig = await readESLintConfig(config.root);
    const eslintConfigSubset = createESLintConfigSubset(eslintConfig);

    const eslintTodoCore = new ESLintTodoCore(config);
    const todoFilePathFromCLI = relative(
      cliCwd,
      eslintTodoCore.getTodoModulePath().absolute,
    );

    const genActionExecutor = prepareAction(genAction, {
      config,
      eslintConfig: eslintConfigSubset,
      hooks: {
        "after:lint": () => {
          logger.success("ESLint finished!");
        },
        "before:lint": () => {
          logger.start("Running ESLint ...");
        },

        "warn:todo-module-is-dirty": () => {
          logger.warn(
            `Attempting to edit ${todoFilePathFromCLI} which has uncommitted changes. Please commit or stash these changes and try again.`,
          );
        },

        "after:write": () => {
          logger.success(
            `ESLint todo file generated at ${todoFilePathFromCLI}!`,
          );
        },
      },
    });

    await genActionExecutor();
    return;
  },
});
