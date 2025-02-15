import type { Linter } from "eslint";

import type { UserOptions } from "../options";

import { ESLintTodoCore } from "../index";
import { TodoModuleV1Handler } from "../todofile/v1";
import { TodoModuleV2Handler } from "../todofile/v2";
import { buildESLintConfigForModule } from "./build";

const eslintConfigTodo = async (
  userOptions: UserOptions = {},
): Promise<Linter.Config[]> => {
  const core = new ESLintTodoCore(userOptions);

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
      files: [todoModulePath.relative],
      linterOptions: {
        reportUnusedDisableDirectives: false,
      },
      name: "@sushichan044/eslint-todo/setup",
    },
  ];

  if (
    module == null ||
    (!TodoModuleV1Handler.isVersion(module) &&
      !TodoModuleV2Handler.isVersion(module))
  ) {
    configs.push({
      files: [todoModulePath.relative],
      name: "@sushichan044/eslint-todo/warning/YOU_ARE_USING_INVALID_TODO_FILE",
    });
    return configs;
  }

  const builtConfigs = buildESLintConfigForModule(module, "off");
  if (builtConfigs != null) {
    configs.push(...builtConfigs);
  }

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
