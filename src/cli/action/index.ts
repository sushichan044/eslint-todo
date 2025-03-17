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

/**
 * @package
 */
export type CLIAction<Input = unknown, Return = unknown> =
  IsNever<Input> extends true
    ? (api: ActionAPI) => MaybePromise<Return>
    : (api: ActionAPI, input: Input) => MaybePromise<Return>;

/**
 * Define a CLI action.
 *
 * @package
 */
export const defineAction = <Input = never, Return = unknown>(
  action: CLIAction<Input, Return>,
) => action;

type ActionRunnerOptions = {
  config: Config;
  consola: ConsolaInstance;
};

/**
 * Prepare an action for execution.
 *
 * @param action The action to prepare
 * @param options Options for running the action
 * @returns A function that can be called with input to execute the action
 */
export function prepareAction<Input = never, Return = unknown>(
  action: CLIAction<Input, Return>,
  options: ActionRunnerOptions,
): IsNever<Input> extends true
  ? () => Promise<Return>
  : (input: Input) => Promise<Return> {
  const { config, consola } = options;

  const executor = async (input?: Input) => {
    // initialize remote ESLintTodoCore
    const remoteService = launchRemoteESLintTodoCore();
    const remoteCore = await new remoteService.RemoteESLintTodoCore(config);

    const actionApi = {
      config,
      core: remoteCore,
      logger: consola,
    } satisfies ActionAPI;

    try {
      if (input === undefined) {
        return await (action as CLIAction<never, Return>)(actionApi);
      }
      return await action(actionApi, input);
    } catch (error) {
      consola.error(error);
      throw error;
    } finally {
      await remoteService.terminate();
    }
  };

  return executor as IsNever<Input> extends true
    ? () => Promise<Return>
    : (input: Input) => Promise<Return>;
}
