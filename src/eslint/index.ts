import type { Linter } from "eslint";

import { existsSync } from "node:fs";

import type { UserOptions } from "../options";
import type { SupportedModules } from "../todofile";

import { optionsWithDefault } from "../options";
import { importDefault } from "../utils/import";
import { resolveTodoModulePath } from "../utils/path";
import { buildESLintFlatConfig } from "./build";

const eslintConfigTodo = async (
  userOptions: UserOptions = {},
): Promise<Linter.Config[]> => {
  const options = optionsWithDefault(userOptions);
  const todoFilePath = resolveTodoModulePath(options);

  if (!existsSync(todoFilePath.absolute)) {
    return [];
  }

  const todoModule = await importDefault<SupportedModules>(
    todoFilePath.absolute,
  );

  const configs: Linter.Config[] = [
    {
      files: [todoFilePath.relative],
      linterOptions: {
        reportUnusedDisableDirectives: false,
      },
      name: "@sushichan044/eslint-todo/setup",
    },
  ];
  configs.push(
    ...(buildESLintFlatConfig(todoModule) ?? [
      {
        files: [todoFilePath.relative],
        name: "@sushichan044/eslint-todo/warning/YOU_ARE_USING_INVALID_TODO_FILE",
      },
    ]),
  );

  return configs;
};

/**
 * @deprecated
 * You should import this from default export.
 */
// HACK: only deprecated named export
const _old_eslintConfigTodo = eslintConfigTodo;

export { _old_eslintConfigTodo as eslintConfigTodo };
export default eslintConfigTodo;
