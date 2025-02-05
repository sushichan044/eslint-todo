import type { Linter } from "eslint";

import { existsSync } from "node:fs";
import path from "node:path";

import type { Options, UserOptions } from "./options";
import type { ESLintTodo } from "./types";

import { optionsWithDefault } from "./options";
import { escapeGlobCharacters, importDefault } from "./utils";

export const eslintConfigTodo = async (
  userOptions: UserOptions = {}
): Promise<Linter.Config[]> => {
  const resolvedOptions = optionsWithDefault(userOptions);

  const todoPath = path.resolve(resolvedOptions.cwd, resolvedOptions.todoFile);

  if (!existsSync(todoPath)) {
    return [];
  }

  const todoModule = await importDefault<ESLintTodo>(todoPath);

  const config = buildESLintFlatConfig({
    todo: todoModule,
    ...resolvedOptions,
  });

  return config;
};

type ESLintConfigBuilderArgs = Options & {
  todo: ESLintTodo;
};

const buildESLintFlatConfig = (
  options: ESLintConfigBuilderArgs
): Linter.Config[] => {
  const { cwd, todo, todoFile } = options;

  const configs: Linter.Config[] = [];

  const relativeTodoFilePath = path.relative(cwd, path.resolve(cwd, todoFile));

  configs.push({
    files: [relativeTodoFilePath],
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
