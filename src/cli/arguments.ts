import type { CorrectModeUserConfig, UserConfig } from "../config/config";

import { isNonEmptyString } from "../utils/string";

type Input = {
  correct: {
    "autoFixableOnly": boolean | undefined;
    /**
     * Comma-separated list of rules to exclude from the operation.
     */
    "exclude.rules": string | undefined;
    /**
     * Limit the number of violations or files to fix.
     */
    "limit.count": string | undefined;
    "limit.type": string | undefined;
    "partialSelection": boolean | undefined;
  };
  mode: {
    correct: boolean;
  };
  root: string | undefined;
  todoFile: string | undefined;
};

type ParsedCLIInput = {
  context: {
    mode: "correct" | "generate";
  };
  userConfig: UserConfig;
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
    context: {
      mode: input.mode.correct ? "correct" : "generate",
    },
    userConfig: {
      correct: parseCorrectMode(input.correct),
      root: input.root,
      todoFile: input.todoFile,
    },
  };
};

const isValidLimitType = (input: string): input is "file" | "violation" => {
  return ["file", "violation"].includes(input);
};

const parseCorrectMode = (input: Input["correct"]): CorrectModeUserConfig => {
  const limitCount = isNonEmptyString(input["limit.count"])
    ? Number.parseInt(input["limit.count"])
    : undefined;
  if (limitCount != undefined && Number.isNaN(limitCount)) {
    throw new TypeError("limit must be a number");
  }

  if (
    isNonEmptyString(input["limit.type"]) &&
    !isValidLimitType(input["limit.type"])
  ) {
    throw new Error(
      `limit-type must be either 'violation' or 'file', got ${input["limit.type"]}`,
    );
  }

  const excludedRules = isNonEmptyString(input?.["exclude.rules"])
    ? input["exclude.rules"].split(",").flatMap((element) => {
        const trimmedElement = element.trim();
        if (isNonEmptyString(trimmedElement)) {
          return trimmedElement;
        }
        return [];
      })
    : undefined;

  return {
    autoFixableOnly: input.autoFixableOnly,
    exclude: {
      rules: excludedRules,
    },
    limit: {
      count: limitCount,
      type: input["limit.type"],
    },
    partialSelection: input.partialSelection,
  };
};
