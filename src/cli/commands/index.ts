import type { Command } from "gunshi";

import { cli, define } from "gunshi";
import { renderHeader as defaultHeaderRenderer } from "gunshi/renderer";
import { cwd } from "node:process";

import type { UserConfig } from "../../config";

import {
  description as packageDescription,
  name as packageName,
  version as packageVersion,
} from "../../../package.json";
import { resolveFileConfig } from "../../config/resolve";
import { handleCorrect } from "../handlers/correct";
import { handleGenerate } from "../handlers/generate";
import { handleMCP } from "../handlers/mcp";
import { logger } from "../logger";
import { buildStrategyFromCLI } from "../utils/strategy";
import {
  commonArguments,
  correctModeArguments,
  modeArguments,
} from "./common-arguments";
import { correctCmd } from "./correct";
import { generateCmd } from "./generate";
import { mcpCmd } from "./mcp";

const subCommands = new Map<string, Command>();

subCommands.set("generate", generateCmd);
subCommands.set("correct", correctCmd);
subCommands.set("mcp", mcpCmd);

/**
 * Select sub command based on CLI flags.
 *
 * Only for backward compatibility.
 *
 * @deprecated Use sub commands instead.
 */
const mainCmd = define({
  args: {
    ...commonArguments,
    ...modeArguments,
    ...correctModeArguments,
  } as const,
  name: "root",
  run: async (context) => {
    /**
     * If any CLI flag other than mode flags(correct, mcp) is explicitly passed,
     * treat the config as dirty and ignore the config file.
     */
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      correct: _explicitCorrect,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mcp: _explicitMcp,
      ...flagsExceptMode
    } = context.explicit;
    const isDirty = Object.values(flagsExceptMode).includes(true);
    if (isDirty) {
      logger.warn(
        "Ignoring config file because config is passed via CLI flags.",
      );
    }

    const mode = (() => {
      if (context.values.correct) return "correct";
      if (context.values.mcp) return "mcp";
      return "generate";
    })();

    const userCLIConfig = {
      correct: {
        autoFixableOnly: context.values["correct.autoFixableOnly"],
        exclude: {
          files: context.values["correct.exclude.files"],
          rules: context.values["correct.exclude.rules"],
        },
        include: {
          files: context.values["correct.include.files"],
          rules: context.values["correct.include.rules"],
        },
        limit: {
          count: context.values["correct.limit.count"],
          type: context.values["correct.limit.type"],
        },
        partialSelection: context.values["correct.partialSelection"],
        strategy: buildStrategyFromCLI(context),
      },
      root: context.values.root,
      todoFile: context.values.todoFile,
    } satisfies UserConfig;

    const cliCwd = cwd();
    const userConfig = isDirty
      ? userCLIConfig
      : await resolveFileConfig(cliCwd);

    if (mode === "mcp") {
      logger.warn(
        "The `--mcp` flag is deprecated and will be removed in v1. Use the `mcp` sub command instead.",
      );

      return await handleMCP(cliCwd, userConfig);
    }

    if (mode === "correct") {
      logger.warn(
        "The `--correct` flag is deprecated and will be removed in v1. Use the `correct` sub command instead.",
      );

      return await handleCorrect(cliCwd, userConfig);
    }

    // After v1, root command will still be `generate` command.
    // So we don't need to print deprecation warning here.
    return await handleGenerate(cliCwd, userConfig);
  },
});

export const getCLIExecutor = async (
  argv: string[],
): Promise<string | undefined> =>
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  cli(argv, mainCmd, {
    description: packageDescription,
    name: packageName,
    renderHeader: async (context) => {
      // MCP server is running on the stdio, so we don't want to write unnecessary output.
      if (context.name === "mcp") {
        return "";
      }
      return defaultHeaderRenderer(context);
    },
    subCommands,
    version: packageVersion,
  });
