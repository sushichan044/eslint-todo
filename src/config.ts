import type { Linter } from "eslint";

import { existsSync } from "fs";
import path from "path";

type Awaitable<T> = Promise<T> | T;

async function interopDefault<T>(
  m: Awaitable<T>
): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await m;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-member-access
  return (resolved as any).default || resolved;
}

type ESLintTodoEntry = {
  autoFix: boolean;
  files: string[];
};

type ESLintTodo = Record<string, ESLintTodoEntry>;

export const eslintConfigTodo = async (
  todoFile: string
): Promise<Linter.Config[]> => {
  const todoPath = path.resolve(process.cwd(), todoFile);

  if (!existsSync(todoPath)) {
    throw new Error(`ESLint todo file not found at ${todoPath}`);
  }
  const todoRelativePath = path.relative(process.cwd(), todoPath);

  const configs: Linter.Config[] = [];

  configs.push({
    files: [todoRelativePath],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    name: "@sushichan044/eslint-todo/setup",
  });

  const todoModule = await interopDefault<ESLintTodo>(import(todoPath));

  Object.entries(todoModule).forEach(([ruleId, entry]) => {
    const config = {
      files: entry.files.map((f) =>
        f.replace(/\[/g, "\\[").replace(/\]/g, "\\]")
      ),
      name: `@sushichan044/eslint-todo/${ruleId}`,
      rules: {
        [ruleId]: "off",
      },
    } as Linter.Config;

    configs.push(config);
  });

  return configs;
};
