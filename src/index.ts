import type { Linter } from "eslint";

import { ESLint } from "eslint";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "pathe";

import type { Config, UserConfig } from "./config";
import type { TodoFilePath } from "./path";
import type { LatestTodoModule, SupportedTodoModules } from "./todofile";
import type { RuleSeverity, TodoModuleLike } from "./todofile/types";
import type { ESLintInitializeOptions, IESLintTodoCoreLike } from "./types";

import { generateTodoModuleCode } from "./codegen";
import { configWithDefault } from "./config/config";
import { resolveTodoModulePath } from "./path";
import { LATEST_TODO_MODULE_HANDLER } from "./todofile";
import { TodoModuleV2Handler } from "./todofile/v2";
import { initGitUtility } from "./utils/git";
import { importDefault } from "./utils/import";

/**
 * ESLintTodo API Entrypoint.
 */
export class ESLintTodoCore implements IESLintTodoCoreLike {
  readonly #config: Config;
  // @ts-expect-error Initialize in this.initializeESLint()
  #eslint: ESLint;
  readonly #git: ReturnType<typeof initGitUtility>;
  readonly #todoFilePath: TodoFilePath;

  constructor(userConfig?: UserConfig) {
    this.#config = configWithDefault(userConfig);
    this.#todoFilePath = resolveTodoModulePath(this.#config);
    this.#git = initGitUtility(this.#config.root);

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
    return await importDefault<TodoModuleLike>(this.#todoFilePath.absolute, {});
  }

  buildESLintConfig(
    todoModule: SupportedTodoModules,
    severity: RuleSeverity,
  ): Linter.Config[] {
    if (TodoModuleV2Handler.isVersion(todoModule)) {
      return TodoModuleV2Handler.buildConfigsForESLint(todoModule, severity);
    }

    // When new version is supported, typecheck will fail here.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _exhaustiveCheck = todoModule satisfies never;

    return [];
  }

  buildTodoFromLintResults(lintResults: ESLint.LintResult[]): LatestTodoModule {
    return LATEST_TODO_MODULE_HANDLER.buildTodoFromLintResults(
      lintResults,
      this.#config,
    );
  }

  getTodoModulePath(): TodoFilePath {
    return this.#todoFilePath;
  }

  initializeESLint(options: ESLintInitializeOptions = {}): void {
    const { overrideConfig } = options;

    this.#eslint = new ESLint({ cwd: this.#config.root, overrideConfig });
  }

  async lint(): Promise<ESLint.LintResult[]> {
    const result = await this.#eslint.lintFiles(
      resolve(this.#config.root, "**/*"),
    );
    return result;
  }

  async resetTodoModule(): Promise<void> {
    if (!existsSync(this.#todoFilePath.absolute)) {
      return;
    }

    await writeFile(
      this.#todoFilePath.absolute,
      generateTodoModuleCode(LATEST_TODO_MODULE_HANDLER.getDefaultTodo()),
    );
  }

  async todoModuleHasUncommittedChanges(): Promise<boolean> {
    return await this.#git.hasGitChanges({
      between: "working-and-staged",
      file: this.#todoFilePath.absolute,
    });
  }

  async writeTodoModule(todo: TodoModuleLike): Promise<void> {
    const todoModule = generateTodoModuleCode(todo);
    await writeFile(this.#todoFilePath.absolute, todoModule);
  }
}
