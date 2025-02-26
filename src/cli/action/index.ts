import type { Remote } from "comlink";
import type { ConsolaInstance } from "consola";
import type { MaybePromise } from "valibot";

import type { UserOptions } from "../../options";
import type { RemoteESLintTodoCore } from "../../remote/core";

import { launchRemoteESLintTodoCore } from "../../remote/client";

type ActionAPI = {
  core: Remote<RemoteESLintTodoCore>;
  logger: ConsolaInstance;
};

type CLIAction<InputValue = unknown, ReturnValue = unknown> = (
  api: ActionAPI,
  input: InputValue,
) => MaybePromise<ReturnValue>;

type RunActionOptions = {
  consola: ConsolaInstance;
  options: UserOptions;
};

export const defineAction = <Input = unknown, Return = unknown>(
  action: CLIAction<Input, Return>,
) => action;

export const runAction = async <Input = unknown, Return = unknown>(
  action: CLIAction<Input, Return>,
  options: RunActionOptions,
  input: Input = {} as Input,
): Promise<Return> => {
  const { consola, options: coreOptions } = options;

  // initialize remote ESLintTodoCore
  const remoteService = launchRemoteESLintTodoCore();
  const remoteCore = await new remoteService.RemoteESLintTodoCore(coreOptions);

  const actionApi = {
    core: remoteCore,
    logger: consola,
  } satisfies ActionAPI;

  try {
    return await action(actionApi, input);
  } finally {
    await remoteService.terminate();
  }
};
