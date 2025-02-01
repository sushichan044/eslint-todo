import { existsSync } from "fs";
import path from "path";
import type { Linter } from "eslint";

type Awaitable<T> = T | Promise<T>;

async function interopDefault<T>(
  m: Awaitable<T>
): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await m;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (resolved as any).default || resolved;
}

type ESLintTodoEntry = {
  files: string[];
  autoFix: boolean;
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
    name: "@sushichan044/eslint-todo/setup",
    files: [todoRelativePath],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  });

  const todoModule = await interopDefault<ESLintTodo>(import(todoPath));

  Object.entries(todoModule).forEach(([ruleId, entry]) => {
    const config = {
      name: `@sushichan044/eslint-todo/${ruleId}`,
      rules: {
        [ruleId]: "off",
      },
      files: entry.files.map((f) =>
        f.replace(/\[/g, "\\[").replace(/\]/g, "\\]")
      ),
    } as Linter.Config;

    configs.push(config);
  });

  return configs;
};
