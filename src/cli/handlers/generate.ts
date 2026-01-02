import { resolveFlatConfig } from "@sushichan044/eslint-config-array-resolver";
import { relative } from "pathe";

import type { UserConfig } from "../../config";

import { ESLintTodoCore } from "../..";
import { prepareAction } from "../../action";
import { genAction } from "../../action/gen";
import { configWithDefault } from "../../config/config";
import { createESLintConfigSubset } from "../../lib/eslint";
import { logger } from "../logger";

export const handleGenerate = async (cwd: string, userConfig: UserConfig) => {
  const config = configWithDefault(userConfig);

  const eslintConfig = await resolveFlatConfig(config.root);
  const eslintConfigSubset = createESLintConfigSubset(eslintConfig);

  const eslintTodoCore = new ESLintTodoCore(config);
  const todoFilePathFromCLI = relative(cwd, eslintTodoCore.getTodoModulePath().absolute);

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
        logger.success(`ESLint todo file generated at ${todoFilePathFromCLI}!`);
      },
    },
  });

  await genActionExecutor();
};
