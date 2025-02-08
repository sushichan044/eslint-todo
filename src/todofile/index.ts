import type { TodoModuleHandler } from "./types";
import type { TodoModuleV1 } from "./v1";
import type { TodoModuleV2 } from "./v2";

import { TodoModuleV2Handler } from "./v2";

type SupportedTodoModulesArray = [
  // you should place newer Module forwards
  TodoModuleV2,
  TodoModuleV1,
];

export const LATEST_MODULE_HANDLER =
  TodoModuleV2Handler satisfies LatestSupportedModuleHandler;

export type LatestSupportedModuleHandler = TodoModuleHandler<
  SupportedTodoModulesArray[0]
>;

export type SupportedModules = SupportedTodoModulesArray[number];
