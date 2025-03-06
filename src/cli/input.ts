import { relative } from "pathe";
import * as v from "valibot";

import type { UserOperationOptions } from "../operation/options";
import type { OperationLimit } from "../operation/types";

import { safeTryNumber } from "../utils/number";

type Input = {
  /**
   * Current working directory of the CLI
   */
  cwd: string;

  mode: {
    correct: boolean;
    list: boolean;
  };
  operation: CLIOperationInput;
  todoFileAbsolutePath: string;
};

type StructuredCLIInput = {
  mode: "correct" | "generate" | "list";
  operation: StructuredCLIOperation;
  /**
   * Path to the todo file relative to the current working directory
   */
  todoFilePath: string;
};

/**
 * Structure the CLI flags and arguments into a structured object.
 * DO NOT SET ANY DEFAULT VALUES HERE. JUST STRUCTURE THE INPUT.
 * @param input CLI flags and arguments
 *
 * @package
 */
export const structureCLIInput = (input: Input): StructuredCLIInput => {
  const todoFilePath = relative(input.cwd, input.todoFileAbsolutePath);

  const mode = (() => {
    if (input.mode.correct) {
      return "correct";
    }
    if (input.mode.list) {
      return "list";
    }
    return "generate";
  })();

  return {
    mode,
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

type StructuredCLIOperation = {
  limit: OperationLimit;
  options: UserOperationOptions;
};

const limitTypeSchema = v.union([v.literal("violation"), v.literal("file")]);

const resolveCLIOperation = (
  input: CLIOperationInput,
): StructuredCLIOperation => {
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
