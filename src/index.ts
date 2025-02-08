import { ESLint } from "eslint";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { resolve } from "pathe";

import type { Options, UserOptions } from "./options";
import type { LatestSupportedModuleHandler } from "./todofile";
import type { GetCurrentTodoModule, TodoModuleLike } from "./todofile/types";
import type { TodoFilePath } from "./utils/path";

import { generateESLintTodoModule } from "./codegen";
import { optionsWithDefault } from "./options";
import { LATEST_MODULE_HANDLER } from "./todofile";
import { resolveTodoFilePath } from "./utils/path";

/**
 * ESLintTodo API Entrypoint.
 */
export class ESLintTodoCore {
  // @ts-expect-error Initialize in this.initializeESLint()
  #eslint: ESLint;
  // @ts-expect-error Initialize in this.initializeESLint()
  #eslintWithAutoFix: ESLint; // for auto-fixing (future feature)
  readonly #options: Options;
  readonly #todoFilePath: TodoFilePath;

  constructor(userOptions: UserOptions) {
    this.#options = optionsWithDefault(userOptions);
    this.#todoFilePath = resolveTodoFilePath(this.#options);

    this.initializeESLint();
  }

  /**
   * Get ESLintTodo object.
   * @param lintResults LintResults from ESLint
   */
  getESLintTodo(
    lintResults: ESLint.LintResult[],
  ): GetCurrentTodoModule<LatestSupportedModuleHandler> {
    return LATEST_MODULE_HANDLER.buildTodoFromLintResults(
      lintResults,
      this.#options,
    );
  }

  getTodoModulePath(): TodoFilePath {
    return this.#todoFilePath;
  }

  initializeESLint(): void {
    this.#eslint = new ESLint({ cwd: this.#options.cwd });
    this.#eslintWithAutoFix = new ESLint({
      cwd: this.#options.cwd,
      fix: true,
    });
  }

  /**
   * Run ESLint and collect the LintResults.
   * @returns LintResults from ESLint
   */
  async lint(): Promise<ESLint.LintResult[]> {
    const result = await this.#eslint.lintFiles(
      resolve(this.#options.cwd, "**/*"),
    );
    return result;
  }

  async resetTodoModule(): Promise<void> {
    if (!existsSync(this.#todoFilePath.absolute)) {
      return;
    }

    await writeFile(
      this.#todoFilePath.absolute,
      generateESLintTodoModule(LATEST_MODULE_HANDLER.getDefaultTodo()),
    );
  }

  async writeTodoModule(todo: TodoModuleLike): Promise<void> {
    const todoModule = generateESLintTodoModule(todo);
    await writeFile(this.#todoFilePath.absolute, todoModule);
  }
}
