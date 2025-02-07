type OperationFileLimit = {
  limit: number;
  type: "file";
};

type OperationViolationLimit = {
  limit: number;
  type: "violation";
};

/**
 * Operation limit with ESLintTodo.
 */
export type OperationLimit = OperationFileLimit | OperationViolationLimit;
