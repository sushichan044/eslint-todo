import type { Remote } from "comlink";
import type { ConsolaInstance } from "consola";

import type { RemoteESLintTodoCore } from "../remote/core";

export type CLIAction<ReturnValue = unknown> = (
  core: Remote<RemoteESLintTodoCore>,
  consola: ConsolaInstance,
) => Promise<ReturnValue>;
