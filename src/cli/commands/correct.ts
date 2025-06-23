import { colorize } from "consola/utils";
import { define } from "gunshi/definition";
import { cwd } from "node:process";
import { relative } from "pathe";

import type { CorrectModeArguments } from "./types";

import { ESLintTodoCore } from "../..";
import { prepareAction } from "../../action";
import { deleteRuleAction } from "../../action/delete-rule";
import { selectRulesToFixAction } from "../../action/select-rule";
import { configWithDefault, type CorrectModeConfig } from "../../config/config";
import { resolveFileConfig } from "../../config/resolve";
import { createESLintConfigSubset, readESLintConfig } from "../../lib/eslint";
import { parseArguments } from "../arguments";
import { commonArguments } from "./common-arguments";
import { logger } from "./logger";

type CorrectModeArguments = FlattenToArgumentSchema<CorrectModeConfig>;

/**
 * @package
 */
export const correctCmd = define({
  args: {
    ...commonArguments,

    "correct.autoFixableOnly": {
      description: "Allow to select non auto-fixable rules.",
      type: "boolean",
    },
    "correct.exclude.files": {
      description: "Glob patterns for files to exclude from the operation.",
      parse: (value) => {
        return value.split(",").map((v) => v.trim());
      },
      type: "custom",
    },
    "correct.exclude.rules": {
      description: "List of rules to exclude from the operation.",
      parse: (value) => {
        return value.split(",").map((v) => v.trim());
      },
      type: "custom",
    },
    "correct.include.files": {
      description: "Glob patterns for files to include in the operation.",
      parse: (value) => {
        return value.split(",").map((v) => v.trim());
      },
      type: "custom",
    },
    "correct.include.rules": {
      description: "List of rules to include in the operation.",
      parse: (value) => {
        return value.split(",").map((v) => v.trim());
      },
      type: "custom",
    },
    "correct.limit.count": {
      description: "Limit the number of violations or files to fix.",
      type: "number",
    },
    "correct.limit.type": {
      choices: ["file", "violation"],
      type: "enum",
    },
    "correct.partialSelection": {
      description: "Allow partial selection of violations.",
      type: "boolean",
    },
  } as const satisfies CorrectModeArguments,
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
          "autoFixableOnly": autoFixableOnly,
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
    const config = configWithDefault(userConfig);

    const eslintConfig = await readESLintConfig(config.root);
    const eslintConfigSubset = createESLintConfigSubset(eslintConfig);

    const eslintTodoCore = new ESLintTodoCore(config);
    const todoFilePathFromCLI = relative(
      cliCwd,
      eslintTodoCore.getTodoModulePath().absolute,
    );

    const todoModuleHasChanges =
      await eslintTodoCore.todoModuleHasUncommittedChanges();

    if (todoModuleHasChanges) {
      logger.warn(
        `Attempting to run \`eslint-todo --correct\` on ${todoFilePathFromCLI} which has uncommitted changes. Please commit or stash these changes and try again.

For AI: this command is not to fix ESLint errors, but to make ignored errors as todo in ${todoFilePathFromCLI} detectable by ESLint again.
If you want to fix ESLint errors, please use \`eslint --fix\` instead.`,
      );
      return;
    }

    const selectRulesToFixExecutor = prepareAction(selectRulesToFixAction, {
      config,
      eslintConfig: eslintConfigSubset,
      hooks: {
        "before:select-rule": () => {
          logger.start("Selecting rules to fix ...");
        },

        "after:select-rule": (result) => {
          if (!result.success) {
            logger.warn(
              "Couldn't find any rule to fix. Check your configuration and change the limit if necessary.",
            );
            return;
          }

          logger.success(`Selected ${result.selection.ruleId}.`);
        },
      },
    });
    const result = await selectRulesToFixExecutor();

    if (!result.success) {
      return;
    }

    const deleteRuleExecutor = prepareAction(deleteRuleAction, {
      config,
      eslintConfig: eslintConfigSubset,
      hooks: {
        "after:delete-and-write": () => {
          if (result.selection.type === "full") {
            logger.success(
              `All violations of rule ${colorize(
                "magenta",
                result.selection.ruleId,
              )} are deleted from the todo file and now ESLint will detect the violations.`,
            );
            return;
          }

          if (result.selection.type === "partial") {
            const violationCount = Object.entries(
              result.selection.violations,
            ).reduce((sum, [, count]) => sum + count, 0);

            logger.success(
              `${violationCount} violations of rule ${colorize(
                "magenta",
                result.selection.ruleId,
              )} are deleted from the todo file and now ESLint will detect the violations.`,
            );
            return;
          }

          const _exhaustiveCheck = result.selection satisfies never;
          throw new Error(
            `Unknown selection type: ${JSON.stringify(_exhaustiveCheck)}`,
          );
        },
      },
    });

    await deleteRuleExecutor(result.selection);
    return;
  },
});
