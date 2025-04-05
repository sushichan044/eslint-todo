import type { TodoModuleHandler } from "./types";
import type { TodoModuleV2 } from "./v2";

import { TodoModuleV2Handler } from "./v2";

// SupportedTodoModules

type SupportedTodoModulesArray = [
  // you should place newer Module forwards
  TodoModuleV2,
];
export type SupportedTodoModules = SupportedTodoModulesArray[number];

type SupportedTodoModuleHandlers = [TodoModuleHandler<TodoModuleV2>];

export const SUPPORTED_TODO_MODULE_HANDLERS = [
  // you should add module handler here if you add new version of TodoModule
  TodoModuleV2Handler,
] as const satisfies SupportedTodoModuleHandlers;

// LatestModule

export type LatestTodoModule = SupportedTodoModulesArray[0];

export const LATEST_TODO_MODULE_HANDLER =
  TodoModuleV2Handler satisfies LatestTodoModuleHandler;

type LatestTodoModuleHandler = TodoModuleHandler<LatestTodoModule>;
