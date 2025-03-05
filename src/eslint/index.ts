import type { Linter } from "eslint";

import type { UserOptions } from "../options";

import { ESLintTodoCore } from "../index";
// TODO: ここでは本当に TodoModuleV1Handler が必要
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
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

  const builtConfigs = buildESLintConfigForModule(module, "off");
  if (builtConfigs != null) {
    configs.push(...builtConfigs);
  }

  return configs;
};

export default eslintConfigTodo;
