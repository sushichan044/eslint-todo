import { ESLint } from "eslint";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "pathe";

import type { Options, UserOptions } from "./options";
import type { LatestSupportedModuleHandler } from "./todofile";
import type { TodoFilePath } from "./todofile/path";
import type { GetCurrentTodoModule, TodoModuleLike } from "./todofile/types";
import type { IESLintTodoCoreLike } from "./types";

import { generateTodoModuleCode } from "./codegen";
import { optionsWithDefault } from "./options";
import { LATEST_MODULE_HANDLER } from "./todofile";
import { resolveTodoModulePath } from "./todofile/path";
import { importDefault } from "./utils/import";

/**
 * ESLintTodo API Entrypoint.
 */
export class ESLintTodoCore implements IESLintTodoCoreLike {
  // @ts-expect-error Initialize in this.initializeESLint()
  #eslint: ESLint;
  // @ts-expect-error Initialize in this.initializeESLint()
  #eslintWithAutoFix: ESLint; // for auto-fixing (future feature)
  readonly #options: Options;
  readonly #todoFilePath: TodoFilePath;

  constructor(userOptions: UserOptions) {
    this.#options = optionsWithDefault(userOptions);
    this.#todoFilePath = resolveTodoModulePath(this.#options);

    this.initializeESLint();
  }

  /**
   * WARNING: DO NOT USE THIS METHOD DIRECTLY.
   *
   * You should use `launchRemoteCore()` to create a remote worker and use `RemoteESLintTodoCore.readTodoModule()` instead.
   */
  async _DO_NOT_USE_DIRECTLY_unsafeReadTodoModule(): Promise<TodoModuleLike> {
    // If use import() here, it will be cached and this cannot be revalidated in the same process.
    // So, this.lint() will run with cached todo file, even if the file is updated after this._DO_NOT_USE_DIRECTLY_unsafeReadTodoModule().
    // To avoid this behavior, just use `RemoteESLintTodoCore.readTodoModule()` in the remote worker.
    return await importDefault<TodoModuleLike>(this.#todoFilePath.absolute);
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
      generateTodoModuleCode(LATEST_MODULE_HANDLER.getDefaultTodo()),
    );
  }

  async writeTodoModule(todo: TodoModuleLike): Promise<void> {
    const todoModule = generateTodoModuleCode(todo);
    await writeFile(this.#todoFilePath.absolute, todoModule);
  }
}
