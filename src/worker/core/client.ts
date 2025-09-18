import * as Comlink from "comlink";
// @ts-expect-error comlink node adapter has no types
import nodeEndPoint from "comlink/dist/esm/node-adapter.mjs";
import { Worker } from "node:worker_threads";

import type { RemoteESLintTodoCore } from ".";

type RemoteCore = {
  RemoteESLintTodoCore: Comlink.Remote<typeof RemoteESLintTodoCore>;
  terminate: () => Promise<void>;
  // future
  // [Symbol.asyncDispose]: () => Promise<void>;
};

/**
 * Launch a remote ESLintTodoCore worker with new process.
 *
 * @example
 * ```ts
 *  const remote = launchRemoteESLintTodoCore();
    const remoteCore = await new remote.RemoteESLintTodoCore(options);
    const currentModule = await remoteCore.safeReadTodoModule();

    await remote.terminate();
    ```
 */
export const launchRemoteESLintTodoCore = (): RemoteCore => {
  const worker = new Worker(new URL(import.meta.resolve("./index.mjs")));

  const remoteCore = Comlink.wrap<typeof RemoteESLintTodoCore>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    nodeEndPoint(worker),
  );

  return {
    RemoteESLintTodoCore: remoteCore,
    terminate: async () => {
      await worker.terminate();
    },
    // future
    // [Symbol.asyncDispose]: async () => {
    //   await worker.terminate();
    // },
  };
};
