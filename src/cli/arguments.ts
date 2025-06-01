import type { CorrectModeUserConfig, UserConfig } from "../config/config";

import { isNonEmptyString } from "../utils/string";

type Input = {
  correct: {
    "autoFixableOnly": boolean | undefined;
    /**
     * Glob patterns for files to exclude from the operation.
     */
    "exclude.files": string | undefined;
    /**
     * Comma-separated list of rules to exclude from the operation.
     */
    "exclude.rules": string | undefined;
    /**
     * Glob patterns for files to include in the operation.
     */
    "include.files": string | undefined;
    /**
     * Comma-separated list of rules to include in the operation.
     */
    "include.rules": string | undefined;
    /**
     * Limit the number of violations or files to fix.
     */
    "limit.count": string | undefined;
    "limit.type": string | undefined;
    "partialSelection": boolean | undefined;
  };
  mode: {
    correct: boolean;
    mcp: boolean;
  };
  root: string | undefined;
  todoFile: string | undefined;
};

type ParsedCLIInput = {
  context: {
    mode: "correct" | "generate" | "mcp";
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

  const mode = (() => {
    if (input.mode.correct) {
      return "correct";
    }
    if (input.mode.mcp) {
      return "mcp";
    }
    return "generate";
  })();

  return {
    context: {
      mode,
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

  const excludedRules = parseCommaSeparatedString(input["exclude.rules"]);
  const excludedFiles = parseCommaSeparatedString(input["exclude.files"]);
  const includedFiles = parseCommaSeparatedString(input["include.files"]);
  const includedRules = parseCommaSeparatedString(input["include.rules"]);

  return {
    autoFixableOnly: input.autoFixableOnly,
    exclude: {
      files: excludedFiles,
      rules: excludedRules,
    },
    include: {
      files: includedFiles,
      rules: includedRules,
    },
    limit: {
      count: limitCount,
      type: input["limit.type"],
    },
    partialSelection: input.partialSelection,
  };
};

/**
 * Parse a comma-separated string into an array of non-empty strings.
 * @param input The comma-separated string to parse
 * @returns Array of trimmed non-empty strings, or undefined if input is empty
 */
const parseCommaSeparatedString = (input: string | undefined): string[] => {
  if (!isNonEmptyString(input)) {
    return [];
  }

  return input.split(",").flatMap((element) => {
    const trimmedElement = element.trim();
    if (isNonEmptyString(trimmedElement)) {
      return trimmedElement;
    }
    return [];
  });
};
