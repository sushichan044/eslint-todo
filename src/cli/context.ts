import { relative } from "pathe";

import type { OperationLimit, OperationOptions } from "../operation/types";

import { safeTryNumber } from "../utils/number";
import { isNonEmptyString } from "../utils/string";

type CLIContext = {
  mode: "correct" | "generate";
  operation: CLIOperation;
  /**
   * Path to the todo file relative to the current working directory
   */
  todoFilePath: string;
};

type Input = {
  /**
   * Current working directory of the CLI
   */
  cwd: string;

  mode: {
    correct: boolean;
  };
  operation: CLIOperationInput;
  todoFileAbsolutePath: string;
};

export const resolveCLIContext = (input: Input): CLIContext => {
  const todoFilePath = relative(input.cwd, input.todoFileAbsolutePath);

  return {
    mode: input.mode.correct ? "correct" : "generate",
    operation: resolveCLIOperation(input.operation),
    todoFilePath: todoFilePath,
  };
};

type CLIOperationInput = {
  autoFixableOnly: boolean;
  fileLimit: string;
  violationLimit: string;
};

type CLIOperation = {
  limit: OperationLimit;
  options: OperationOptions;
};

export const resolveCLIOperation = (input: CLIOperationInput): CLIOperation => {
  const limit: OperationLimit = (() => {
    if (isNonEmptyString(input.violationLimit)) {
      const limit = safeTryNumber(input.violationLimit);
      if (limit === null) {
        throw new Error("violation-limit must be a number");
      }

      return {
        count: limit,
        type: "violation",
      };
    }
    if (isNonEmptyString(input.fileLimit)) {
      const limit = safeTryNumber(input.fileLimit);
      if (limit === null) {
        throw new Error("file-limit must be a number");
      }

      return {
        count: limit,
        type: "file",
      };
    }
    throw new Error("Either file-limit or violation-limit must be provided.");
  })();

  return {
    limit,
    options: {
      autoFixableOnly: input.autoFixableOnly,
    },
  };
};
