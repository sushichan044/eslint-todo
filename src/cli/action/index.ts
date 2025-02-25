import type { Remote } from "comlink";
import type { ConsolaInstance } from "consola";
import type { MaybePromise } from "valibot";

import type { UserOptions } from "../../options";
import type { RemoteESLintTodoCore } from "../../remote/core";

import { launchRemoteESLintTodoCore } from "../../remote/client";

type CLIAction<ReturnValue = unknown> = (
  core: Remote<RemoteESLintTodoCore>,
  consola: ConsolaInstance,
) => MaybePromise<ReturnValue>;

type RunActionOptions = {
  consola: ConsolaInstance;
  options: UserOptions;
};

export const defineAction = <RETURN>(action: CLIAction<RETURN>) => action;

export const runAction = async <T>(
  action: CLIAction<T>,
  options: RunActionOptions,
): Promise<T> => {
  // initialize remote ESLintTodoCore
  const remoteService = launchRemoteESLintTodoCore();
  const remoteCore = await new remoteService.RemoteESLintTodoCore(
    options.options,
  );

  try {
    return await action(remoteCore, options.consola);
  } finally {
    await remoteService.terminate();
  }
};
