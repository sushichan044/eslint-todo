import type { Linter } from "eslint";

import { existsSync } from "node:fs";

import type { UserOptions } from "../options";
import type { SupportedModules } from "../todofile";

import { optionsWithDefault } from "../options";
import { TodoModuleV1Handler } from "../todofile/v1";
import { TodoModuleV2Handler } from "../todofile/v2";
import { importDefault } from "../utils/import";
import { resolveTodoFilePath } from "../utils/path";

/**
 * Build ESLint configs for the todo file.
 * @param todoModule
 * Todo module object with supported version.
 * @returns
 * - ESLint configs to disable todo rules.
 * - `null` if unsupported todo module passed.
 */
const buildESLintFlatConfig = (
  todoModule: SupportedModules,
): Linter.Config[] | null => {
  if (TodoModuleV1Handler.isVersion(todoModule)) {
    return TodoModuleV1Handler.buildDisableConfigsForESLint(todoModule);
  }

  if (TodoModuleV2Handler.isVersion(todoModule)) {
    return TodoModuleV2Handler.buildDisableConfigsForESLint(todoModule);
  }

  // When new version is supported, typecheck will fail here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _exhaustiveCheck = todoModule satisfies never;

  return null;
};

const eslintConfigTodo = async (
  userOptions: UserOptions = {},
): Promise<Linter.Config[]> => {
  const options = optionsWithDefault(userOptions);
  const todoFilePath = resolveTodoFilePath(options);

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
