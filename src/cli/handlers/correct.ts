import { resolveFlatConfig } from "@sushichan044/eslint-config-array-resolver";
import { colorize } from "consola/utils";
import { relative } from "pathe";

import type { UserConfig } from "../../config";

import { ESLintTodoCore } from "../..";
import { prepareAction } from "../../action";
import { deleteRuleAction } from "../../action/delete-rule";
import { selectRulesToFixAction } from "../../action/select-rule";
import { configWithDefault } from "../../config/config";
import { createESLintConfigSubset } from "../../lib/eslint";
import { logger } from "../logger";

export const handleCorrect = async (cwd: string, userConfig: UserConfig) => {
  const config = configWithDefault(userConfig);

  const eslintConfig = await resolveFlatConfig(config.root);
  const eslintConfigSubset = createESLintConfigSubset(eslintConfig);

  const eslintTodoCore = new ESLintTodoCore(config);
  const todoFilePathFromCLI = relative(
    cwd,
    eslintTodoCore.getTodoModulePath().absolute,
  );

  const todoModuleHasChanges =
    await eslintTodoCore.todoModuleHasUncommittedChanges();

  if (todoModuleHasChanges) {
    logger.warn(
      `Attempting to run \`eslint-todo --correct\` on ${todoFilePathFromCLI} which has uncommitted changes. Please commit or stash these changes and try again.

This command makes ignored errors in ${todoFilePathFromCLI} detectable by ESLint again.
If you want to fix ESLint errors, please use \`eslint --fix\` instead.`,
    );
    // Do not continue if the todo module has uncommitted changes.
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
};
