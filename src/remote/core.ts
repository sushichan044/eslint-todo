import * as Comlink from "comlink";
// @ts-expect-error comlink node adapter has no types
import nodeEndpoint from "comlink/dist/esm/node-adapter.mjs";
import { parentPort } from "node:worker_threads";

import type { UserOptions } from "../options";
import type { SupportedModules } from "../todofile";
import type { RuleSeverity } from "../todofile/types";
import type { IESLintTodoCoreLike } from "../types";

import { ESLintTodoCore } from "../index";

if (parentPort == null)
  throw new Error("This module must be run in a worker thread.");

export class RemoteESLintTodoCore implements IESLintTodoCoreLike {
  readonly #todoCore: ESLintTodoCore;

  constructor(userOptions: UserOptions) {
    this.#todoCore = new ESLintTodoCore(userOptions);
  }

  buildESLintConfig(
    todoModule: SupportedModules,
    severity: RuleSeverity,
  ): ReturnType<ESLintTodoCore["buildESLintConfig"]> {
    return this.#todoCore.buildESLintConfig(todoModule, severity);
  }

  buildTodoFromLintResults(
    ...parameters: Parameters<ESLintTodoCore["buildTodoFromLintResults"]>
  ): ReturnType<ESLintTodoCore["buildTodoFromLintResults"]> {
    return this.#todoCore.buildTodoFromLintResults(...parameters);
  }

  getTodoModulePath(
    ...parameters: Parameters<ESLintTodoCore["getTodoModulePath"]>
  ): ReturnType<ESLintTodoCore["getTodoModulePath"]> {
    return this.#todoCore.getTodoModulePath(...parameters);
  }

  initializeESLint(
    ...parameters: Parameters<ESLintTodoCore["initializeESLint"]>
  ): ReturnType<ESLintTodoCore["initializeESLint"]> {
    return this.#todoCore.initializeESLint(...parameters);
  }

  async lint(
    ...parameters: Parameters<ESLintTodoCore["lint"]>
  ): ReturnType<ESLintTodoCore["lint"]> {
    return this.#todoCore.lint(...parameters);
  }

  async readTodoModule(
    ...parameters: Parameters<
      ESLintTodoCore["_DO_NOT_USE_DIRECTLY_unsafeReadTodoModule"]
    >
  ): ReturnType<ESLintTodoCore["_DO_NOT_USE_DIRECTLY_unsafeReadTodoModule"]> {
    return this.#todoCore._DO_NOT_USE_DIRECTLY_unsafeReadTodoModule(...parameters);
  }

  async resetTodoModule(
    ...parameters: Parameters<ESLintTodoCore["resetTodoModule"]>
  ): ReturnType<ESLintTodoCore["resetTodoModule"]> {
    return this.#todoCore.resetTodoModule(...parameters);
  }

  async writeTodoModule(
    ...parameters: Parameters<ESLintTodoCore["writeTodoModule"]>
  ): ReturnType<ESLintTodoCore["writeTodoModule"]> {
    return this.#todoCore.writeTodoModule(...parameters);
  }
}

Comlink.expose(
  RemoteESLintTodoCore,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
  nodeEndpoint(parentPort),
);
