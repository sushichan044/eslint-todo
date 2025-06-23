import type { Args } from "gunshi";

/**
 * @package
 */
export const commonArguments = {
  root: {
    type: "string",
  },
  todoFile: {
    short: "f",
    type: "string",
  },
} as const satisfies Args;
