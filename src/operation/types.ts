export type OperationFileLimit = {
  count: number;
  type: "file";
};

export type OperationViolationLimit = {
  count: number;
  type: "violation";
};

/**
 * Operation limit with ESLintTodo.
 */
export type OperationLimit = OperationFileLimit | OperationViolationLimit;
