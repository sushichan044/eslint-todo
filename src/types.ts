import type { ESLint } from "eslint";

import type { OperationLimit } from "./operation/types";
import type { LatestSupportedModuleHandler } from "./todofile";
import type { TodoFilePath } from "./todofile/path";
import type { GetCurrentTodoModule, TodoModuleLike } from "./todofile/types";

export type MaybePromise<T> = Promise<T> | T;

type PromisifyAllMethods<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? R extends PromiseLike<unknown>
      ? (...args: A) => R
      : (...args: A) => MaybePromise<R>
    : T[K];
};

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
