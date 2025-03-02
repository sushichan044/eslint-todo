import { relative } from "pathe";
import * as v from "valibot";

import type { UserOperationOptions } from "../operation/options";
import type { OperationLimit } from "../operation/types";

import { safeTryNumber } from "../utils/number";

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
  allowPartialSelection: boolean;
  autoFixableOnly: boolean;
  limit: string;
  limitType: string;
};

type CLIOperation = {
  limit: OperationLimit;
  options: UserOperationOptions;
};

const limitTypeSchema = v.union([v.literal("violation"), v.literal("file")]);

export const resolveCLIOperation = (input: CLIOperationInput): CLIOperation => {
  const parsedLimitType = v.safeParse(limitTypeSchema, input.limitType);
  if (!parsedLimitType.success) {
    throw new Error("limit-type must be either 'violation' or 'file'");
  }

  const limitCount = safeTryNumber(input.limit);
  if (limitCount === null) {
    throw new Error("limit must be a number");
  }

  const limit = {
    count: limitCount,
    type: parsedLimitType.output,
  };

  return {
    limit,
    options: {
      allowPartialSelection: input.allowPartialSelection,
      autoFixableOnly: input.autoFixableOnly,
    },
  };
};
