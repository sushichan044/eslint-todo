import { type Args, cli, type Command } from "gunshi";

import {
  description as packageDescription,
  name as packageName,
  version as packageVersion,
} from "../../../package.json";
import { correctCmd } from "./correct";
import { generateCmd } from "./generate";

const subCommands = new Map<string, Command<Args>>();

subCommands.set("generate", generateCmd);
subCommands.set("correct", correctCmd);

const mainCmd = generateCmd;

export const getCLIExecutor = async (
  argv: string[],
): Promise<string | undefined> =>
  cli(argv, mainCmd, {
    description: packageDescription,
    name: packageName,
    subCommands,
    version: packageVersion,
  });
