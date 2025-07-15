import type {
  CorrectModeLimitType,
  CorrectModeUserConfig,
  UserConfig,
} from "../config/config";

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

  const parsedCorrectMode = parseCorrectMode(input.config.correct);

  return {
    context: {
      mode,
    },
    inputConfig: {
      correct: parsedCorrectMode.config,
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

type ParsedCorrectMode = {
  config: CorrectModeUserConfig;
};

const parseCorrectMode = (
  input: Input["config"]["correct"],
): ParsedCorrectMode => {
  if (
    input["limit.count"] !== undefined &&
    Number.isNaN(input["limit.count"])
  ) {
    throw new TypeError("limit must be a number");
  }

  return {
    config: {
      autoFixableOnly: input.autoFixableOnly,
      exclude: {
        files: input["exclude.files"],
        rules: input["exclude.rules"],
      },
      include: {
        files: input["include.files"],
        rules: input["include.rules"],
      },
      limit: {
        count: input["limit.count"],
        type: input["limit.type"],
      },
      partialSelection: input.partialSelection,
    },
  };
};
