import { defineCommand, runMain } from "citty";

import type { Options } from "./options";

import { generateESLintTodo } from ".";

const cli = defineCommand({
  args: {
    "cwd": {
      description: "Current working directory",
      required: false,
      type: "string",
      valueHint: "path",
    },
    "todo-file": {
      description: "ESLint todo file name",
      required: false,
      type: "string",
      valueHint: "filename",
    },
  },
  meta: {
    description:
      "Generate ESLint todo file and temporally suppress ESLint errors!",
    name: "@sushichan044/eslint-todo/cli",
    version: "0.0.1",
  },
  async run({ args }) {
    const options = {
      cwd: args.cwd,
      todoFile: args["todo-file"],
    } satisfies Options;

    await generateESLintTodo(options);
  },
});

export const run = async (argv: string[]): Promise<void> => {
  await runMain(cli, { rawArgs: argv });
};
