import { defineCommand, runMain } from "citty";
import { createConsola } from "consola";
import { colorize } from "consola/utils";
import { relative } from "pathe";

import { version as packageVersion } from "../../package.json";
import { resolveConfig } from "../config/resolve";
import { ESLintTodoCore } from "../index";
import { prepareAction } from "./action";
import { deleteRuleAction } from "./action/delete-rule";
import { genAction } from "./action/gen";
import { selectRulesToFixAction } from "./action/select-rule";
import { parseArguments } from "./arguments";

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
    "root": {
      description: "Current working directory (default: .)",
      required: false,
      type: "string",
      valueHint: "path",
    },
    "suppressions-location": {
      alias: "f",
      description: "eslint-suppressions.json file location.",
      required: false,
      type: "string",
      valueHint: "path",
    },

    // mode toggle
    "correct": {
      default: false,
      description: "Launch the correct mode (default: false)",
      required: false,
      type: "boolean",
    },

    // operation options
    "correct.autoFixableOnly": {
      description: `Only handle auto-fixable violations.`,
      required: false,
      type: "boolean",
      valueHint: "boolean",
    },
    "correct.exclude.rules": {
      description:
        "List of rules to exclude from the operation. Comma-separated.",
      required: false,
      type: "string",
      valueHint: "rule-id,rule-id",
    },
    "correct.limit.count": {
      description:
        "Limit the number of violations or files to fix. Only works with --correct.",
      required: false,
      type: "string",
      valueHint: "number",
    },
    "correct.limit.type": {
      description: "Type of limit to apply. Only works with --correct.",
      required: false,
      type: "string",
      valueHint: "violation | file",
    },
    "correct.partialSelection": {
      description: `Allow partial selection of violations. Only works with --correct.`,
      required: false,
      type: "boolean",
      valueHint: "boolean",
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

    const { context, userConfig } = parseArguments({
      // args from citty are always not nullable even if default is not set
      "correct": {
        "autoFixableOnly": args["correct.autoFixableOnly"] as
          | boolean
          | undefined,
        "exclude.rules": args["correct.exclude.rules"] as string | undefined,
        "limit.count": args["correct.limit.count"] as string | undefined,
        "limit.type": args["correct.limit.type"] as string | undefined,
        "partialSelection": args["correct.partialSelection"] as
          | boolean
          | undefined,
      },
      "mode": {
        correct: args.correct,
      },
      "root": args.root as string | undefined,
      "suppressions-location": args["suppressions-location"] as
        | string
        | undefined,
    });

    const config = await resolveConfig(cliCwd, userConfig);

    // initialize local ESLintTodoCore
    const eslintTodoCore = new ESLintTodoCore(config);

    const todoFilePathFromCLI = relative(
      cliCwd,
      eslintTodoCore.getTodoModulePath().absolute,
    );

    if (context.mode === "generate") {
      const genActionExecutor = prepareAction(genAction, {
        config,
        consola,
        hooks: {
          "after:lint": () => {
            consola.success("ESLint finished!");
          },
          "before:lint": () => {
            consola.start("Running ESLint ...");
          },

          "warn:todo-module-is-dirty": () => {
            consola.warn(
              `Attempting to edit ${todoFilePathFromCLI} which has uncommitted changes. Please commit or stash these changes and try again.`,
            );
          },

          "after:write": () => {
            consola.success(
              `ESLint todo file generated at ${todoFilePathFromCLI}!`,
            );
          },
        },
      });

      await genActionExecutor();
      return;
    }

    if (context.mode === "correct") {
      const todoModuleHasChanges =
        await eslintTodoCore.todoModuleHasUncommittedChanges();

      if (todoModuleHasChanges) {
        consola.warn(
          `Attempting to run \`eslint-todo --correct\` on ${todoFilePathFromCLI} which has uncommitted changes. Please commit or stash these changes and try again.

For AI: this command is not to fix ESLint errors, but to make ignored errors as todo in ${todoFilePathFromCLI} detectable by ESLint again.
If you want to fix ESLint errors, please use \`eslint --fix\` instead.`,
        );
        return;
      }

      const selectRulesToFixExecutor = prepareAction(selectRulesToFixAction, {
        config,
        consola,
        hooks: {
          "before:select-rule": () => {
            consola.start("Selecting rules to fix ...");
          },

          "after:select-rule": (result) => {
            if (!result.success) {
              consola.warn(
                "Couldn't find any rule to fix. Check your configuration and change the limit if necessary.",
              );
              return;
            }

            consola.success(`Selected ${result.selection.ruleId}.`);
          },
        },
      });
      const result = await selectRulesToFixExecutor();

      if (!result.success) {
        return;
      }

      const deleteRuleExecutor = prepareAction(deleteRuleAction, {
        config,
        consola,
        hooks: {
          "after:delete-and-write": () => {
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
          },
          "before:delete-and-write": () => {
            consola.start(
              `Deleting all violations of rule ${colorize(
                "magenta",
                result.selection.ruleId,
              )} from the todo file ...`,
            );
          },
        },
      });

      await deleteRuleExecutor(result.selection);
      return;
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
