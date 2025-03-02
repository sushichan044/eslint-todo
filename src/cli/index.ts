import { defineCommand, runMain } from "citty";
import { createConsola } from "consola";
import { colorize } from "consola/utils";

import type { UserOptions } from "../options";

import { version as pkgVersion } from "../../package.json";
import { ESLintTodoCore } from "../index";
import { runAction } from "./action";
import { deleteRuleAction } from "./action/deleteRule";
import { genAction } from "./action/gen";
import { selectRulesToFixAction } from "./action/selectRule";
import { updateAction } from "./action/update";
import { resolveCLIContext } from "./context";

const consola = createConsola({ formatOptions: { date: false } });

const cli = defineCommand({
  args: {
    // IMPORTANT:
    // do not set default values for boolean options!
    // CLI flag name is unexpected behavior when default value is set.
    //
    // example: `auto-fixable-only` with `default: true` results in
    // $ eslint-todo --no-auto-fixable-only
    // because the default value is true, the flag is negated.

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
    "allow-partial-selection": {
      description:
        "Allow partial selection of violations. Only works with --correct. (default: false)",
      required: false,
      type: "boolean",
      valueHint: "boolean",
    },
    "auto-fixable-only": {
      description: "Only handle auto-fixable violations. (default: true)",
      required: false,
      type: "boolean",
      valueHint: "boolean",
    },
    "limit": {
      default: "100",
      description:
        "Limit the number of violations or files to fix. Only works with --correct. (default: 100)",
      required: false,
      type: "string",
      valueHint: "number",
    },
    "limit-type": {
      default: "violation",
      description:
        "Type of limit to apply. Only works with --correct. (default: violation)",
      required: false,
      type: "string",
      valueHint: "violation | file",
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
        allowPartialSelection: args["allow-partial-selection"],
        autoFixableOnly: args["auto-fixable-only"],
        limit: args.limit,
        limitType: args["limit-type"],
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
      const result = await runAction(
        selectRulesToFixAction,
        { consola, options },
        ctx.operation,
      );

      if (!result.success) {
        consola.warn(
          "Couldn't find any rule to fix. Increase the limit and retry.",
        );
        return;
      }

      await runAction(deleteRuleAction, { consola, options }, result.selection);

      if (result.selection.type === "full") {
        consola.success(
          `All violations of rule ${colorize(
            "magenta",
            result.selection.ruleId,
          )} are deleted from the todo file and now ESLint will detect the violations.`,
        );
        return;
      }

      if (result.selection.type === "partial") {
        const violationCount = Object.entries(
          result.selection.violations,
        ).reduce((sum, [, count]) => sum + count, 0);
        const violationFiles = Object.keys(result.selection.violations).length;

        consola.success(
          `${violationCount} violations in ${violationFiles} files of rule ${colorize(
            "magenta",
            result.selection.ruleId,
          )} are deleted from the todo file and now ESLint will detect the violations.`,
        );
        return;
      }

      const _exhaustiveCheck = result.selection satisfies never;
      throw new Error(
        `Unknown selection type: ${JSON.stringify(_exhaustiveCheck)}`,
      );
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
