import * as Comlink from "comlink";
// @ts-expect-error comlink node adapter has no types
import nodeEndPoint from "comlink/dist/esm/node-adapter.mjs";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { dirname, join } from "pathe";

import type { RemoteESLintTodoCore } from "./core";

type RemoteCore = {
  RemoteESLintTodoCore: Comlink.Remote<typeof RemoteESLintTodoCore>;
  terminate: () => Promise<number>;
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
  const worker = new Worker(
    fileURLToPath(join(dirname(import.meta.url), "core.mjs")),
  );

  const remoteCore = Comlink.wrap<typeof RemoteESLintTodoCore>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    nodeEndPoint(worker),
  );

  return {
    RemoteESLintTodoCore: remoteCore,
    terminate: async () => worker.terminate(),
    // future
    // [Symbol.asyncDispose]: async () => {
    //   await worker.terminate();
    // },
  };
};
