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

  const isRootDirty = input.config.root !== undefined;
  const isTodoFileDirty = input.config.todoFile !== undefined;
  // We should check under `input.config` because `input.mode` or other keys are not in scope of dirty check.
  const isConfigDirty =
    isRootDirty || isTodoFileDirty || parsedCorrectMode.isConfigDirty;

  return {
    context: {
      mode,
    },
    inputConfig: {
      correct: parsedCorrectMode.config,
      root: input.config.root,
      todoFile: input.config.todoFile,
    },
    isConfigDirty,
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
  isConfigDirty: boolean;
};

type ParsedCorrectMode = {
  config: CorrectModeUserConfig;
  isConfigDirty: boolean;
};

const parseCorrectMode = (
  input: Input["config"]["correct"],
): ParsedCorrectMode => {
  if (Number.isNaN(input["limit.count"])) {
    throw new TypeError("limit must be a number");
  }

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
        files: input["exclude.files"] ?? [],
        rules: input["exclude.rules"] ?? [],
      },
      include: {
        files: input["include.files"] ?? [],
        rules: input["include.rules"] ?? [],
      },
      limit: {
        count: input["limit.count"],
        type: input["limit.type"],
      },
      partialSelection: input.partialSelection,
    },
    isConfigDirty: isDirty,
  };
};
