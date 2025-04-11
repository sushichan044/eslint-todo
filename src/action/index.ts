import type { Remote } from "comlink";
import type { Hookable, HookCallback, HookKeys } from "hookable";

import { createHooks } from "hookable";

import type { Config } from "../config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { DeepPartial, IsNever, MaybePromise } from "../utils/types";
import type { RemoteESLintTodoCore } from "../worker/core";

import { launchRemoteESLintTodoCore } from "../worker/core/client";

type HookHandlers<Hooks extends Record<string, HookCallback>> = {
  [K in HookKeys<Hooks>]: Hooks[K];
};

type ActionAPI<
  Hooks extends Record<string, HookCallback> = Record<string, never>,
> = {
  config: Config;
  core: Remote<RemoteESLintTodoCore>;
  eslintConfig: ESLintConfigSubset;
  hooks: Hookable<Hooks>;
};

/**
 * @package
 */
export type Action<
  Input = unknown,
  Return = unknown,
  Hooks extends Record<string, HookCallback> = Record<string, never>,
> =
  IsNever<Input> extends true
    ? (api: ActionAPI<Hooks>) => MaybePromise<Return>
    : (api: ActionAPI<Hooks>, input: Input) => MaybePromise<Return>;

/**
 * Define an action.
 *
 * @package
 */
export const defineAction = <
  Input = never,
  Return = unknown,
  Hooks extends Record<string, HookCallback> = Record<string, never>,
>(
  action: Action<Input, Return, Hooks>,
) => {
  return action;
};

type ActionRunnerOptions<
  Hooks extends Record<string, HookCallback> = Record<string, never>,
> = {
  config: Config;
  eslintConfig: ESLintConfigSubset;
  hooks?: DeepPartial<HookHandlers<Hooks>>;
};

/**
 * Prepare an action for execution.
 *
 * @param action The action to prepare
 * @param options Options for running the action
 * @returns A function that can be called with input to execute the action
 */
export function prepareAction<
  Input = never,
  Return = unknown,
  Hooks extends Record<string, HookCallback> = Record<string, never>,
>(
  action: Action<Input, Return, Hooks>,
  options: ActionRunnerOptions<Hooks>,
): IsNever<Input> extends true
  ? () => Promise<Return>
  : (input: Input) => Promise<Return> {
  const hooks = createHooks<Hooks>();

  if (options.hooks) {
    // @ts-expect-error - TypeScript reports hookHandlers has number properties, but it's actually only has string properties
    hooks.addHooks(options.hooks);
  }

  const executor = async (input?: Input) => {
    // initialize remote ESLintTodoCore
    const remoteService = launchRemoteESLintTodoCore();
    const remoteCore = await new remoteService.RemoteESLintTodoCore(
      options.config,
    );

    const actionApi = {
      config: options.config,
      core: remoteCore,
      eslintConfig: options.eslintConfig,
      hooks,
    } satisfies ActionAPI<Hooks>;

    try {
      const result =
        input === undefined
          ? await (action as Action<never, Return, Hooks>)(actionApi)
          : await action(actionApi, input);

      return result;
    } catch (error) {
      throw error;
    } finally {
      await remoteService.terminate();
    }
  };

  return executor as IsNever<Input> extends true
    ? () => Promise<Return>
    : (input: Input) => Promise<Return>;
}
