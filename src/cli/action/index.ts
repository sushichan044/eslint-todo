import type { Remote } from "comlink";
import type { ConsolaInstance } from "consola";

import type { Config } from "../../config";
import type { RemoteESLintTodoCore } from "../../remote/core";
import type { IsNever, MaybePromise } from "../../utils/types";

import { launchRemoteESLintTodoCore } from "../../remote/client";

type ActionAPI = {
  config: Config;
  core: Remote<RemoteESLintTodoCore>;
  logger: ConsolaInstance;
};

type CLIAction<Input = unknown, Return = unknown> =
  IsNever<Input> extends true
    ? (api: ActionAPI) => MaybePromise<Return>
    : (api: ActionAPI, input: Input) => MaybePromise<Return>;

type RunActionOptions = {
  config: Config;
  consola: ConsolaInstance;
};

/**
 * Define a CLI action.
 *
 * @package
 */
export const defineAction = <Input = never, Return = unknown>(
  action: CLIAction<Input, Return>,
) => action;

const NO_INPUT = Symbol("NO_INPUT");

// action with no input
export async function runAction<Return = unknown>(
  action: CLIAction<never, Return>,
  options: RunActionOptions,
): Promise<Return>;

// action with input
export async function runAction<Input, Return = unknown>(
  action: CLIAction<Input, Return>,
  options: RunActionOptions,
  input: Input,
): Promise<Return>;

export async function runAction<Input, Return = unknown>(
  action: CLIAction<Input, Return>,
  options: RunActionOptions,
  input: Input | typeof NO_INPUT = NO_INPUT,
): Promise<Return> {
  const { config, consola } = options;

  // initialize remote ESLintTodoCore
  const remoteService = launchRemoteESLintTodoCore();
  const remoteCore = await new remoteService.RemoteESLintTodoCore(config);

  const actionApi = {
    config,
    core: remoteCore,
    logger: consola,
  } satisfies ActionAPI;

  try {
    if (input === NO_INPUT) {
      // run action with no input
      return await (action as CLIAction<never, Return>)(actionApi);
    }
    return await action(actionApi, input);
  } catch (error) {
    consola.error(error);
    throw error;
  } finally {
    await remoteService.terminate();
  }
}
