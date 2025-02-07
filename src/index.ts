import { ESLint } from "eslint";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import path from "pathe";

import type { Options, UserOptions } from "./options";
import type { ESLintTodoV1 } from "./todofile/v1";
import type { TodoFilePath } from "./utils/path";

import { generateESLintTodoModule } from "./codegen";
import { optionsWithDefault } from "./options";
import { TodoFileV1 } from "./todofile/v1";
import { resolveTodoFilePath } from "./utils/path";

/**
 * ESLintTodo API Entrypoint.
 */
export class ESLintTodoCore {
  readonly #eslint: ESLint;
  // used for auto-fixing (future feature)
  readonly #eslintWithAutoFix: ESLint;
  readonly #options: Options;
  readonly #todoFilePath: TodoFilePath;

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
  getESLintTodo(lintResults: ESLint.LintResult[]): ESLintTodoV1 {
    return TodoFileV1.buildTodoFromLintResults(lintResults, this.#options);
  }

  getTodoFilePath(): TodoFilePath {
    return this.#todoFilePath;
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

  async writeTodoFile(todo: ESLintTodoV1): Promise<void> {
    const todoModule = generateESLintTodoModule(todo);
    await writeFile(this.#todoFilePath.absolute, todoModule);
  }
}
