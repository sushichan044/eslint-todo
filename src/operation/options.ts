import defu from "defu";
import { klona } from "klona";

import type { DeepPartial } from "../utils/types";

export type OperationOptions = {
  /**
   * Only handle auto-fixable violations.
   *
   * @default true
   */
  autoFixableOnly: boolean;
  /**
   * Allow partial selection.
   * This is useful when you want to fix some of many violations for a rule.
   *
   * @default false
   */
  allowPartialSelection: boolean;
  /**
   * Exclude options for the operation.
   */
  exclude: {
    /**
     * List of rules to exclude from the operation.
     */
    rules: string[];
  };
};

export type UserOperationOptions = DeepPartial<OperationOptions>;

/**
 * @package
 */
export const operationOptionsWithDefault = (
  options: UserOperationOptions = {},
): OperationOptions => {
  return defu(options, getDefaultOperationOptions());
};

const getDefaultOperationOptions = () => klona(DEFAULT_OPERATION_OPTIONS);

/**
 * @private
 */
export const DEFAULT_OPERATION_OPTIONS = {
  allowPartialSelection: false,
  autoFixableOnly: true,
  exclude: {
    rules: [],
  },
} as const satisfies OperationOptions;
