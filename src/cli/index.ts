import { defineCommand, runMain } from "citty";
import { createConsola } from "consola";

import type { UserOptions } from "../options";

import { version as pkgVersion } from "../../package.json";
import { ESLintTodoCore } from "../index";
import { runAction } from "./action";
import { deleteRuleAction } from "./action/deleteRule";
import { selectRulesToFixAction } from "./action/fix";
import { genAction } from "./action/gen";
import { updateAction } from "./action/update";
import { resolveCLIContext } from "./context";

const consola = createConsola({ formatOptions: { date: false } });

const cli = defineCommand({
  args: {
    // general options
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

    // mode toggle
    "correct": {
      default: false,
      description: "Launch the correct mode (default: false)",
      required: false,
      type: "boolean",
    },

    // operation options
    "auto-fixable-only": {
      default: true,
      description: "Only handle auto-fixable violations. (default: true)",
      required: false,
      type: "boolean",
      valueHint: "boolean",
    },
    "file-limit": {
      default: "100",
      description:
        "Limit the number of files to fix. Only works with --correct. (default: 100)",
      required: false,
      type: "string",
      valueHint: "number",
    },
    "violation-limit": {
      default: "100",
      description:
        "Limit the number of violations to fix. Only works with --correct. (default: 100)",
      required: false,
      type: "string",
      valueHint: "number",
    },

    // logging
    "debug": {
      description: "Enable debug mode",
      required: false,
      type: "boolean",
    },
    "trace": {
      description: "Enable trace mode",
      required: false,
      type: "boolean",
    },
    "verbose": {
      description: "Enable verbose mode",
      required: false,
      type: "boolean",
    },
  },
  meta: {
    description:
      "Generate ESLint todo file and temporally suppress ESLint errors!",
    name: "@sushichan044/eslint-todo/cli",
    version: pkgVersion,
  },
  async run({ args }) {
    const cliCwd = process.cwd();
    const options: UserOptions = {
      cwd: args.cwd,
      todoFile: args["todo-file"],
    };
    // initialize local ESLintTodoCore
    const eslintTodoCore = new ESLintTodoCore(options);

    const ctx = resolveCLIContext({
      cwd: cliCwd,
      mode: {
        correct: args.correct,
      },
      operation: {
        autoFixableOnly: args["auto-fixable-only"],
        fileLimit: args["file-limit"],
        violationLimit: args["violation-limit"],
      },
      todoFileAbsolutePath: eslintTodoCore.getTodoModulePath().absolute,
    });

    await runAction(updateAction, { consola, options });

    if (ctx.mode === "generate") {
      await runAction(genAction, { consola, options });
      consola.success(`ESLint todo file generated at ${ctx.todoFilePath}!`);
      return;
    }

    if (ctx.mode === "correct") {
      const selection = await runAction(
        selectRulesToFixAction,
        { consola, options },
        ctx.operation,
      );

      if (!selection.success) {
        consola.warn(
          "Couldn't find any rule to fix. Increase the limit and retry.",
        );
        return;
      }

      await runAction(
        deleteRuleAction,
        { consola, options },
        { ruleId: selection.ruleId },
      );

      consola.success(
        `Rule ${selection.ruleId} deleted from the todo file at ${ctx.todoFilePath}! Run eslint --fix to apply the changes.`,
      );
      return;
    }

    throw new Error(`Unknown mode: ${JSON.stringify(ctx.mode)}`);
  },
  setup({ args }) {
    consola.info(`eslint-todo CLI ${pkgVersion}`);

    if (args.debug === true) {
      consola.level = 4;
    } else if (args.trace === true) {
      consola.level = 5;
    } else if (args.verbose === true) {
      consola.level = +999;
    }
  },
});

export const run = async (argv: string[]): Promise<void> => {
  await runMain(cli, { rawArgs: argv });
};
