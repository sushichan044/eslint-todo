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
} as const satisfies OperationOptions;
