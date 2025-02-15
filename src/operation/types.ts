type OperationFileLimit = {
  count: number;
  type: "file";
};

type OperationViolationLimit = {
  count: number;
  type: "violation";
};

/**
 * Operation limit with ESLintTodo.
 */
export type OperationLimit = OperationFileLimit | OperationViolationLimit;

export type OperationOptions = {
  /**
   * Only handle auto-fixable violations.
   *
   * @default true
   */
  autoFixableOnly?: boolean;

  /**
   * Limit the number of operations.
   */
  limit: OperationLimit;
};
