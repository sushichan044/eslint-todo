import { type Args, cli, type Command } from "gunshi";
import { renderHeader as defaultHeaderRenderer } from "gunshi/renderer";

import {
  description as packageDescription,
  name as packageName,
  version as packageVersion,
} from "../../../package.json";
import { correctCmd } from "./correct";
import { generateCmd } from "./generate";
import { mcpCmd } from "./mcp";

const subCommands = new Map<string, Command<Args>>();

subCommands.set("generate", generateCmd);
subCommands.set("correct", correctCmd);
subCommands.set("mcp", mcpCmd);

const mainCmd = generateCmd;

export const getCLIExecutor = async (
  argv: string[],
): Promise<string | undefined> =>
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
