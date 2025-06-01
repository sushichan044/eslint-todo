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
  inputConfig: UserConfig;
  isDirty: boolean;
};

/**
 * Structure the CLI flags and arguments into a structured object.
 * DO NOT SET ANY DEFAULT VALUES HERE. JUST STRUCTURE THE INPUT.
 * @param input CLI flags and arguments
 *
 * @package
 */
export const parseArguments = (input: Input): ParsedCLIInput => {
  const mode = (() => {
    if (input.mode.correct) {
      return "correct";
    }
    if (input.mode.mcp) {
      return "mcp";
    }
    return "generate";
  })();

  const isModeDirty = mode !== "generate";
  const isRootDirty = input.root !== undefined;
  const isTodoFileDirty = input.todoFile !== undefined;

  const parsedCorrectMode = parseCorrectMode(input.correct);

  const isDirty =
    isModeDirty || isRootDirty || isTodoFileDirty || parsedCorrectMode.isDirty;

  return {
    context: {
      mode,
    },
    inputConfig: {
      correct: parsedCorrectMode.config,
      root: input.root,
      todoFile: input.todoFile,
    },
    isDirty,
  };
};

const isValidLimitType = (input: string): input is "file" | "violation" => {
  return ["file", "violation"].includes(input);
};

type ParsedCorrectMode = {
  config: CorrectModeUserConfig;
  isDirty: boolean;
};

const parseCorrectMode = (input: Input["correct"]): ParsedCorrectMode => {
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

  const isDirty =
    input.autoFixableOnly !== undefined ||
    input["exclude.rules"] !== undefined ||
    input["exclude.files"] !== undefined ||
    input["include.files"] !== undefined ||
    input["include.rules"] !== undefined ||
    input["limit.count"] !== undefined ||
    input["limit.type"] !== undefined ||
    input.partialSelection !== undefined;

  return {
    config: {
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
    },
    isDirty,
  };
};

/**
 * Parse a comma-separated string into an array of non-empty strings.
 * @param input The comma-separated string to parse
 * @returns Array of trimmed non-empty strings
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
