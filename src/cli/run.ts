import type { ConsolaInstance } from "consola";

import type { UserOptions } from "../options";
import type { CLIAction } from "./types";

import { launchRemoteESLintTodoCore } from "../remote/client";

type RunActionOptions = {
  consola: ConsolaInstance;
  options: UserOptions;
};

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
