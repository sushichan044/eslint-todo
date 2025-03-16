import type { Config } from "../config";
import type { CorrectModeConfig } from "../config/config";

import { configWithDefault } from "../config/config";
import { safeTryNumber } from "../utils/number";
import { isNonEmptyString } from "../utils/string";

type Input = {
  correct: {
    "allowPartialSelection": boolean;
    "autoFixableOnly": boolean;
    /**
     * Comma-separated list of rules to exclude from the operation.
     */
    "exclude.rules": string;
    /**
     * Limit the number of violations or files to fix.
     */
    "limit": string;
    "limitType": string;
  };
  mode: {
    correct: boolean;
  };
  root: string;
  todoFile: string;
};

type ParsedCLIInput = {
  config: Config;
  context: {
    mode: "correct" | "generate";
  };
};

/**
 * Structure the CLI flags and arguments into a structured object.
 * DO NOT SET ANY DEFAULT VALUES HERE. JUST STRUCTURE THE INPUT.
 * @param input CLI flags and arguments
 *
 * @package
 */
export const parseArguments = (input: Input): ParsedCLIInput => {
  // const relativeTodoFilePath = relative(input.root, input.todoFileAbsolutePath);

  return {
    config: configWithDefault({
      correct: parseCorrectMode(input.correct),
      root: input.root,
      todoFile: input.todoFile,
    }),
    context: {
      mode: input.mode.correct ? "correct" : "generate",
    },
  };
};

const parseCorrectMode = (input: Input["correct"]): CorrectModeConfig => {
  const limitCount = safeTryNumber(input.limit);
  if (limitCount === null) {
    throw new Error("limit must be a number");
  }

  if (!isValidLimitType(input.limitType)) {
    throw new Error(
      `limit-type must be either 'violation' or 'file', got ${input.limitType}`,
    );
  }

  const limit = {
    count: limitCount,
    type: input.limitType,
  };

  const excludedRules = input["exclude.rules"].split(",").flatMap((element) => {
    const trimmedElement = element.trim();
    if (isNonEmptyString(trimmedElement)) {
      return trimmedElement;
    }
    return [];
  });

  return {
    autoFixableOnly: input.autoFixableOnly,
    exclude: {
      rules: excludedRules,
    },
    limit,
    partialSelection: input.allowPartialSelection,
  };
};

const isValidLimitType = (input?: unknown): input is "file" | "violation" => {
  return ["file", "violation"].includes(input as string);
};
