import type { Linter } from "eslint";

import { cwd } from "node:process";

import type { Config } from "../config";

import { mergeUserConfig } from "../config";
import { resolveFileConfig } from "../config/resolve";
import { ESLintTodoCore } from "../index";
import {
  buildESLintConfigWithSuppressionsJson,
  SuppressionsJsonGenerator,
} from "../suppressions-json";
import { TodoModuleV1Handler } from "../todofile/v1";
import { TodoModuleV2Handler } from "../todofile/v2";

type ESLintConfigTodoInput = Partial<
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

  const cwdString = cwd();
  const configFromFile = await resolveFileConfig(cwdString);
  const resolvedConfig = mergeUserConfig(configFromFile, {
    root,
    todoFile,
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

  if (module == null) {
    return [
      ...configs,
      {
        files: [todoModulePath.relative],
        name: "@sushichan044/eslint-todo/warning/FILE_NOT_FOUND_OR_INVALID_TODO_FILE",
      },
    ];
  }

  if (TodoModuleV1Handler.isVersion(module)) {
    return [
      ...configs,
      ...buildESLintConfigWithSuppressionsJson(SuppressionsJsonGenerator.fromV1(module), "off"),
    ];
  }

  if (TodoModuleV2Handler.isVersion(module)) {
    return [
      ...configs,
      ...buildESLintConfigWithSuppressionsJson(SuppressionsJsonGenerator.fromV2(module), "off"),
    ];
  }

  return [
    ...configs,
    {
      files: [todoModulePath.relative],
      name: "@sushichan044/eslint-todo/warning/FILE_NOT_FOUND_OR_INVALID_TODO_FILE",
    },
  ];
};

export default eslintConfigTodo;
