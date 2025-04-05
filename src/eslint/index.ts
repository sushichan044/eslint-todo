import type { Linter } from "eslint";

import { cwd } from "node:process";

import type { Config } from "../config";
import type { DeepPartial } from "../utils/types";

import { resolveConfig } from "../config/resolve";
import { ESLintTodoCore } from "../index";
import { TodoModuleV2Handler } from "../todofile/v2";

type ESLintConfigTodoInput = DeepPartial<
  Pick<Config, "suppressionsLocation"> & {
    cwd: Config["root"];
  }
>;

const eslintConfigTodo = async (
  // Only for backward compatibility. Will be replaced with Partial<Pick<Config, "root" | "todoFile">> in the v0.1.0
  config?: ESLintConfigTodoInput,
): Promise<Linter.Config[]> => {
  const root = config?.cwd;
  const suppressionsLocation = config?.suppressionsLocation;

  const cwdString = cwd();
  const resolvedConfig = await resolveConfig(cwdString, {
    root,
    suppressionsLocation,
  });
  const core = new ESLintTodoCore(resolvedConfig);

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

  if (module == null || !TodoModuleV2Handler.isVersion(module)) {
    configs.push({
      files: [todoModulePath.relative],
      name: "@sushichan044/eslint-todo/warning/FILE_NOT_FOUND_OR_INVALID_TODO_FILE",
    });
    return configs;
  }

  return [...configs, ...core.buildESLintConfig(module, "off")];
};

export default eslintConfigTodo;
