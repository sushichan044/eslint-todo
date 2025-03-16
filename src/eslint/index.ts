import type { Linter } from "eslint";

import type { Config } from "../config";
import type { DeepPartial } from "../utils/types";

import { ESLintTodoCore } from "../index";
// TODO: ここでは本当に TodoModuleV1Handler が必要
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { TodoModuleV1Handler } from "../todofile/v1";
import { TodoModuleV2Handler } from "../todofile/v2";

type ESLintConfigTodoInput = DeepPartial<
  Pick<Config, "todoFile"> & {
    cwd: Config["root"];
  }
>;

const eslintConfigTodo = async (
  // Only for backward compatibility. Will be replaced with Partial<Pick<Config, "root" | "todoFile">> in the v0.1.0
  config?: ESLintConfigTodoInput,
): Promise<Linter.Config[]> => {
  const root = config?.cwd;
  const todoFile = config?.todoFile;

  const core = new ESLintTodoCore({
    root,
    todoFile,
  });

  const todoModulePath = core.getTodoModulePath();
  const module = await (async () => {
    try {
      return await core._DO_NOT_USE_DIRECTLY_unsafeReadTodoModule();
    } catch {
      return null;
    }
  })();

  const configs: Linter.Config[] = [
    {
      name: "@sushichan044/eslint-todo/setup",
    },
    {
      ignores: [todoModulePath.relative],
      name: "@sushichan044/eslint-todo/ignore",
    },
  ];

  if (
    module == null ||
    (!TodoModuleV1Handler.isVersion(module) &&
      !TodoModuleV2Handler.isVersion(module))
  ) {
    configs.push({
      files: [todoModulePath.relative],
      name: "@sushichan044/eslint-todo/warning/FILE_NOT_FOUND_OR_INVALID_TODO_FILE",
    });
    return configs;
  }

  return [...configs, ...core.buildESLintConfig(module, "off")];
};

/**
 * @deprecated
 * You should import this from default export.
 */
// HACK: only deprecated named export
const _old_eslintConfigTodo = eslintConfigTodo;

export { _old_eslintConfigTodo as eslintConfigTodo };
export default eslintConfigTodo;
