import { ESLint } from "eslint";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import path from "pathe";

import type { Options, UserOptions } from "./options";
import type { ESLintTodo } from "./types";

import { generateESLintTodoModule } from "./codegen";
import { optionsWithDefault } from "./options";
import { resolveTodoFilePath } from "./utils/path";
import { isNonEmptyString } from "./utils/string";

/**
 * ESLintTodo API Entrypoint.
 */
export class ESLintTodoCore {
  readonly #eslint: ESLint;
  // used for auto-fixing (future feature)
  readonly #eslintWithAutoFix: ESLint;
  readonly #options: Options;
  readonly #todoFilePath: ReturnType<typeof resolveTodoFilePath>;

  constructor(userOptions: UserOptions) {
    this.#options = optionsWithDefault(userOptions);
    this.#todoFilePath = resolveTodoFilePath(this.#options);

    this.#eslint = new ESLint({ cwd: this.#options.cwd });
    this.#eslintWithAutoFix = new ESLint({
      cwd: this.#options.cwd,
      fix: true,
    });
  }

  /**
   * Get ESLintTodo object.
   * @param lintResults LintResults from ESLint
   */
  getESLintTodo(lintResults: ESLint.LintResult[]): ESLintTodo {
    const todoByRuleId = aggregateESLintTodoByRuleId(
      lintResults,
      this.#options,
    );
    const uniqueTodoList = removeDuplicateFilesFromTodo(todoByRuleId);

    return uniqueTodoList;
  }

  /**
   * Run ESLint and collect the LintResults.
   * @returns LintResults from ESLint
   */
  async lint(): Promise<ESLint.LintResult[]> {
    const result = await this.#eslint.lintFiles(
      path.resolve(this.#options.cwd, "**/*"),
    );
    return result;
  }

  async resetTodoFile(): Promise<void> {
    if (!existsSync(this.#todoFilePath.absolute)) {
      return;
    }

    await writeFile(this.#todoFilePath.absolute, generateESLintTodoModule({}));
  }

  async writeTodoFile(todo: ESLintTodo): Promise<void> {
    const todoModule = generateESLintTodoModule(todo);
    await writeFile(this.#todoFilePath.absolute, todoModule);
  }
}

const aggregateESLintTodoByRuleId = (
  results: ESLint.LintResult[],
  options: Options,
): ESLintTodo => {
  return results.reduce((acc, lintResult) => {
    for (const message of lintResult.messages) {
      if (!isNonEmptyString(message.ruleId)) {
        continue;
      }

      acc[message.ruleId] ??= {
        autoFix: false,
        files: [],
      };

      if (Object.hasOwn(acc, message.ruleId)) {
        // acc[message.ruleId] already exists

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        acc[message.ruleId]!.files.push(
          path.relative(options.cwd, lintResult.filePath),
        );
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        acc[message.ruleId]!.autoFix = message.fix != null;
      }
    }
    return acc;
  }, {} as ESLintTodo);
};

/**
 * Format the ESLint todo object.
 * @param todo
 * @returns
 */
export const removeDuplicateFilesFromTodo = (todo: ESLintTodo): ESLintTodo => {
  return Object.entries(todo).reduce((acc, [ruleId, entry]) => {
    acc[ruleId] = {
      ...entry,
      files: [...new Set(entry.files)],
    };
    return acc;
  }, {} as ESLintTodo);
};
