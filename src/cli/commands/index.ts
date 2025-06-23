import type { Args, Command } from "gunshi";

import { cli, define } from "gunshi";
import { renderHeader as defaultHeaderRenderer } from "gunshi/renderer";
import { cwd } from "node:process";

import {
  description as packageDescription,
  name as packageName,
  version as packageVersion,
} from "../../../package.json";
import { resolveFileConfig } from "../../config/resolve";
import { parseArguments } from "../arguments";
import { handleCorrect } from "../handlers/correct";
import { handleGenerate } from "../handlers/generate";
import { handleMCP } from "../handlers/mcp";
import { logger } from "../logger";
import {
  commonArguments,
  correctModeArguments,
  modeArguments,
} from "./common-arguments";
import { correctCmd } from "./correct";
import { generateCmd } from "./generate";
import { mcpCmd } from "./mcp";

const subCommands = new Map<string, Command<Args>>();

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
    // Resolve Args
    const root = context.values.root;
    const todoFile = context.values.todoFile;
    const autoFixableOnly = context.values["correct.autoFixableOnly"];
    const excludeRules = context.values["correct.exclude.rules"];
    const excludeFiles = context.values["correct.exclude.files"];
    const includeRules = context.values["correct.include.rules"];
    const includeFiles = context.values["correct.include.files"];
    const limitCount = context.values["correct.limit.count"];
    const limitType = context.values["correct.limit.type"];
    const partialSelection = context.values["correct.partialSelection"];

    const { inputConfig, isConfigDirty } = parseArguments({
      config: {
        correct: {
          "autoFixableOnly": autoFixableOnly,
          "exclude.files": excludeFiles,
          "exclude.rules": excludeRules,
          "include.files": includeFiles,
          "include.rules": includeRules,
          "limit.count": limitCount,
          "limit.type": limitType,
          partialSelection,
        },
        root,
        todoFile,
      },
      mode: {
        correct: context.values.correct,
        mcp: context.values.mcp,
      },
    });

    if (isConfigDirty) {
      logger.warn(
        "Ignoring config file because config is passed via CLI flags.",
      );
    }

    // Get partial config from CLI flags or config file.
    // If any flag is passed, the config file is completely ignored.
    const cliCwd = cwd();
    const userConfig = isConfigDirty
      ? inputConfig
      : await resolveFileConfig(cliCwd);

    if (context.values.mcp) {
      return await handleMCP(cliCwd, userConfig);
    }

    if (context.values.correct) {
      return await handleCorrect(cliCwd, userConfig);
    }

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
