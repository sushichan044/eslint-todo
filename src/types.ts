import type { ESLint } from "eslint";

import type { LatestSupportedModuleHandler } from "./todofile";
import type { TodoFilePath } from "./todofile/path";
import type { GetCurrentTodoModule, TodoModuleLike } from "./todofile/types";
import type { PromisifyAllMethods } from "./utils/types";

interface ESLintTodoCoreLike {
  fixViolations(limit: OperationLimit): Promise<void>;

  getESLintTodo(
    lintResults: ESLint.LintResult[],
  ): GetCurrentTodoModule<LatestSupportedModuleHandler>;

  getTodoModulePath(): TodoFilePath;

  initializeESLint(): void;

  lint(code: string, filePath: string): Promise<ESLint.LintResult[]>;

  resetTodoModule(): Promise<void>;

  writeTodoModule(todo: TodoModuleLike): Promise<void>;
}

export type IESLintTodoCoreLike = PromisifyAllMethods<ESLintTodoCoreLike>;
