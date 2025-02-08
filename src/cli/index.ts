import { defineCommand, runMain } from "citty";
import { createConsola } from "consola";
import { relative } from "pathe";

import type { UserOptions } from "../options";

import { version as pkgVersion } from "../../package.json";
import { ESLintTodoCore } from "../index";
import { launchRemoteESLintTodoCore } from "../remote/client";
import { TodoModuleV1Handler } from "../todofile/v1";

const consola = createConsola({ formatOptions: { date: false } });

const cli = defineCommand({
  args: {
    "correct": {
      default: false,
      description: "Enable correct mode",
      required: false,
      type: "boolean",
      valueHint: "boolean",
    },
    "cwd": {
      description: "Current working directory (default: .)",
      required: false,
      type: "string",
      valueHint: "path",
    },
    "todo-file": {
      alias: "f",
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

    // initialize local ESLintTodoCore
    const eslintTodoCore = new ESLintTodoCore(options);
    // initialize remote ESLintTodoCore
    const remoteService = launchRemoteESLintTodoCore();
    const remoteCore = await new remoteService.RemoteESLintTodoCore(options);

    // start processing
    const todoFilePathFromCli = relative(
      cliCwd,
      eslintTodoCore.getTodoModulePath().absolute,
    );

    const currentModule = await remoteCore.readTodoModule();
    if (TodoModuleV1Handler.isVersion(currentModule)) {
      consola.start(
        "Detected old version of todo file. Automatically upgrading ...",
      );
      const upgradedModule =
        TodoModuleV1Handler.upgradeToNextVersion(currentModule);

      if (upgradedModule !== false) {
        await eslintTodoCore.writeTodoModule(upgradedModule);
        consola.success("Upgrade finished!");
      }
    }

    if (!args.correct) {
      // Generate ESLint todo file
      try {
        await eslintTodoCore.resetTodoModule();
      } catch (error) {
        consola.error(error);
        return;
      }

      consola.start("Running ESLint ...");
      const lintResults = await eslintTodoCore.lint();
      consola.success("ESLint finished!");

      consola.start("Generating ESLint todo file ...");
      const todo = eslintTodoCore.getESLintTodo(lintResults);
      await eslintTodoCore.writeTodoModule(todo);
      consola.success(`ESLint todo file generated at ${todoFilePathFromCli}!`);
    }

    await remoteService.terminate();
  },
});

export const run = async (argv: string[]): Promise<void> => {
  await runMain(cli, { rawArgs: argv });
};
