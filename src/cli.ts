import { defineCommand, runMain } from "citty";

import { resetTodoFile, writeTodoFile } from "./fs";
import { generateESLintTodo } from "./index";
import { optionsWithDefault } from "./options";

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
    const options = optionsWithDefault({
      cwd: args.cwd,
      todoFile: args["todo-file"],
    });
    await resetTodoFile(options);

    const todo = await generateESLintTodo(options);
    await writeTodoFile(todo, options);
  },
});

export const run = async (argv: string[]): Promise<void> => {
  await runMain(cli, { rawArgs: argv });
};
