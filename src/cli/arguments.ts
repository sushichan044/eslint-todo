import type { CorrectModeLimitType, UserConfig } from "../config/config";

/**
 * Structure the CLI flags and arguments into a structured object.
 *
 * @param input CLI flags and arguments
 *
 * @package
 */
export const parseArguments = (input: Input): ParsedCLIInput => {
  const mode = (() => {
    if (input.mode.correct) return "correct";
    if (input.mode.mcp) return "mcp";
    return "generate";
  })();

  // NaN check is performed here as gunshi doesn't handle this validation.
  if (
    input.config.correct["limit.count"] !== undefined &&
    Number.isNaN(input.config.correct["limit.count"])
  ) {
    throw new TypeError("limit must be a number");
  }

  return {
    context: {
      mode,
    },
    inputConfig: {
      correct: {
        autoFixableOnly: input.config.correct.autoFixableOnly,
        exclude: {
          files: input.config.correct["exclude.files"],
          rules: input.config.correct["exclude.rules"],
        },
        include: {
          files: input.config.correct["include.files"],
          rules: input.config.correct["include.rules"],
        },
        limit: {
          count: input.config.correct["limit.count"],
          type: input.config.correct["limit.type"],
        },
        partialSelection: input.config.correct.partialSelection,
      },
      root: input.config.root,
      todoFile: input.config.todoFile,
    },
  };
};

type Input = {
  config: {
    correct: {
      "autoFixableOnly": boolean | undefined;
      /**
       * Glob patterns for files to exclude from the operation.
       */
      "exclude.files": string[] | undefined;
      /**
       * Comma-separated list of rules to exclude from the operation.
       */
      "exclude.rules": string[] | undefined;
      /**
       * Glob patterns for files to include in the operation.
       */
      "include.files": string[] | undefined;
      /**
       * Comma-separated list of rules to include in the operation.
       */
      "include.rules": string[] | undefined;
      /**
       * Limit the number of violations or files to fix.
       */
      "limit.count": number | undefined;
      "limit.type": CorrectModeLimitType | undefined;
      "partialSelection": boolean | undefined;
    };
    root: string | undefined;
    todoFile: string | undefined;
  };

  mode: {
    correct: boolean;
    mcp: boolean;
  };
};

type ParsedCLIInput = {
  context: {
    mode: "correct" | "generate" | "mcp";
  };
  inputConfig: UserConfig;
};
