import type { Linter } from "eslint";

import { existsSync } from "node:fs";

import type { UserOptions } from "./options";
import type { ESLintTodo } from "./types";
import type { TodoFilePath } from "./utils/path";

import { optionsWithDefault } from "./options";
import { importDefault } from "./utils/import";
import { resolveTodoFilePath } from "./utils/path";
import { escapeGlobCharacters } from "./utils/string";

export const eslintConfigTodo = async (
  userOptions: UserOptions = {},
): Promise<Linter.Config[]> => {
  const options = optionsWithDefault(userOptions);
  const todoFilePath = resolveTodoFilePath(options);

  if (!existsSync(todoFilePath.absolute)) {
    return [];
  }

  const todo = await importDefault<ESLintTodo>(todoFilePath.absolute);
  const config = buildESLintFlatConfig({ todo, todoFilePath });
  return config;
};

type ESLintConfigBuilderArgs = {
  todo: ESLintTodo;
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

  Object.entries(todo).forEach(([ruleId, entry]) => {
    configs.push({
      files: entry.files.map((f) => escapeGlobCharacters(f)),
      name: `@sushichan044/eslint-todo/todo/${ruleId}`,
      rules: {
        [ruleId]: "off",
      },
    } satisfies Linter.Config);
  });

  return configs;
};
