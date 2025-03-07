import { defineCommand, runMain } from "citty";
import { createConsola } from "consola";
import { colorize } from "consola/utils";

import type { UserOptions } from "../options";

import { version as packageVersion } from "../../package.json";
import { ESLintTodoCore } from "../index";
// needed for show default value in CLI
// eslint-disable-next-line import-access/jsdoc
import { DEFAULT_OPERATION_OPTIONS } from "../operation/options";
// needed for show default value in CLI
// eslint-disable-next-line import-access/jsdoc
import { DEFAULT_OPTIONS } from "../options";
import { runAction } from "./action";
import { deleteRuleAction } from "./action/delete-rule";
import { genAction } from "./action/gen";
import { selectRulesToFixAction } from "./action/select-rule";
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
      description: `ESLint todo file name (default: ${DEFAULT_OPTIONS.todoFile})`,
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
      description: `Allow partial selection of violations. Only works with --correct. (default: ${DEFAULT_OPERATION_OPTIONS.allowPartialSelection})`,
      required: false,
      type: "boolean",
      valueHint: "boolean",
    },
    "auto-fixable-only": {
      description: `Only handle auto-fixable violations. (default: ${DEFAULT_OPERATION_OPTIONS.autoFixableOnly})`,
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
    version: packageVersion,
  },
  async run({ args }) {
    const cliCwd = process.cwd();
    const options: UserOptions = {
      cwd: args.cwd,
      todoFile: args["todo-file"],
    };
    // initialize local ESLintTodoCore
    const eslintTodoCore = new ESLintTodoCore(options);

    const context = resolveCLIContext({
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

    if (context.mode === "generate") {
      await runAction(genAction, { consola, options });
      consola.success(`ESLint todo file generated at ${context.todoFilePath}!`);
      return;
    }

    if (context.mode === "correct") {
      const result = await runAction(
        selectRulesToFixAction,
        { consola, options },
        context.operation,
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

        consola.success(
          `${violationCount} violations of rule ${colorize(
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

    throw new Error(`Unknown mode: ${JSON.stringify(context.mode)}`);
  },
  setup({ args }) {
    consola.info(`eslint-todo CLI ${packageVersion}`);

    switch (true) {
      case args.debug: {
        consola.level = 4;

        break;
      }
      case args.trace: {
        consola.level = 5;

        break;
      }
      case args.verbose: {
        consola.level = +999;

        break;
      }
      // No default
    }
  },
});

export const run = async (argv: string[]): Promise<void> => {
  await runMain(cli, { rawArgs: argv });
};
