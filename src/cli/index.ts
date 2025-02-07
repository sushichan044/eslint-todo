import { defineCommand, runMain } from "citty";
import { createConsola } from "consola";
import path from "pathe";

import type { UserOptions } from "../options";

import { version as pkgVersion } from "../../package.json";
import { ESLintTodoCore } from "../index";

const consola = createConsola({ formatOptions: { date: false } });

const cli = defineCommand({
  args: {
    "cwd": {
      description: "Current working directory (default: .)",
      required: false,
      type: "string",
      valueHint: "path",
    },
    "todo-file": {
      description: "ESLint todo file name (default: .eslint-todo.js)",
      required: false,
      type: "string",
      valueHint: "filename",
    },
  },
  meta: {
    description:
      "Generate ESLint todo file and temporally suppress ESLint errors!",
    name: "@sushichan044/eslint-todo/cli",
    version: pkgVersion,
  },
  async run({ args }) {
    consola.info(`eslint-todo CLI ${pkgVersion}`);

    const cliCwd = process.cwd();
    const options: UserOptions = {
      cwd: args.cwd,
      todoFile: args["todo-file"],
    };
    const eslintTodoCore = new ESLintTodoCore(options);
    const todoFilePathFromCli = path.relative(
      cliCwd,
      eslintTodoCore.getTodoFilePath().absolute,
    );

    try {
      await eslintTodoCore.resetTodoFile();
    } catch (error) {
      consola.error(error);
      return;
    }

    consola.start("Running ESLint ...");
    const lintResults = await eslintTodoCore.lint();
    consola.success("ESLint finished!");

    consola.start("Generating ESLint todo file ...");
    const todo = eslintTodoCore.getESLintTodo(lintResults);
    await eslintTodoCore.writeTodoFile(todo);
    consola.success(`ESLint todo file generated at ${todoFilePathFromCli}!`);
  },
});

export const run = async (argv: string[]): Promise<void> => {
  await runMain(cli, { rawArgs: argv });
};
