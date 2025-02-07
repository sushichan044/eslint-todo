import type { Linter } from "eslint";

import { existsSync } from "node:fs";

import type { UserOptions } from "./options";
import type { ESLintTodoV1 } from "./todofile/v1";
import type { TodoFilePath } from "./utils/path";

import { optionsWithDefault } from "./options";
import { TodoFileV1 } from "./todofile/v1";
import { importDefault } from "./utils/import";
import { resolveTodoFilePath } from "./utils/path";

export const eslintConfigTodo = async (
  userOptions: UserOptions = {},
): Promise<Linter.Config[]> => {
  const options = optionsWithDefault(userOptions);
  const todoFilePath = resolveTodoFilePath(options);

  if (!existsSync(todoFilePath.absolute)) {
    return [];
  }

  const todo = await importDefault<ESLintTodoV1>(todoFilePath.absolute);
  const config = buildESLintFlatConfig({ todo, todoFilePath });
  return config;
};

type ESLintConfigBuilderArgs = {
  todo: ESLintTodoV1;
  todoFilePath: TodoFilePath;
};

const buildESLintFlatConfig = (
  options: ESLintConfigBuilderArgs,
): Linter.Config[] => {
  const { todo, todoFilePath } = options;

  const configs: Linter.Config[] = [];

  configs.push({
    files: [todoFilePath.relative],
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    name: "@sushichan044/eslint-todo/setup",
  });

  if (TodoFileV1.isVersion(todo)) {
    configs.push(...TodoFileV1.buildDisableConfigsForESLint(todo));
  }

  return configs;
};
