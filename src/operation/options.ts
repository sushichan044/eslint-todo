import defu from "defu";

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

export type UserOperationOptions = Partial<OperationOptions>;

export const operationOptionsWithDefault = (
  options: UserOperationOptions = {},
): OperationOptions => {
  return defu(options, getDefaultOperationOptions());
};

const getDefaultOperationOptions = () =>
  ({
    allowPartialSelection: false,
    autoFixableOnly: true,
  }) as const satisfies OperationOptions;
