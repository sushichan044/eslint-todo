import { defineCommand, runMain } from "citty";
import { createConsola } from "consola";
import { colorize } from "consola/utils";
import { relative } from "pathe";

import {
  name as packageName,
  version as packageVersion,
} from "../../package.json";
import { prepareAction } from "../action";
import { deleteRuleAction } from "../action/delete-rule";
import { genAction } from "../action/gen";
import { selectRulesToFixAction } from "../action/select-rule";
import { configWithDefault } from "../config/config";
import { resolveFileConfig } from "../config/resolve";
import { ESLintTodoCore } from "../index";
import { createESLintConfigSubset, readESLintConfig } from "../lib/eslint";
import { startMcpServerWithStdio } from "../mcp/stdio";
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
    "todoFile": {
      alias: "f",
      description: `ESLint todo file name.`,
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
    "mcp": {
      default: false,
      description: "Launch the MCP server.",
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
    "correct.exclude.files": {
      description:
        "Glob patterns for files to exclude from the operation. Comma-separated.",
      required: false,
      type: "string",
      valueHint: "glob,glob",
    },
    "correct.exclude.rules": {
      description:
        "List of rules to exclude from the operation. Comma-separated.",
      required: false,
      type: "string",
      valueHint: "rule-id,rule-id",
    },
    "correct.include.files": {
      description:
        "Glob patterns for files to include in the operation. Comma-separated.",
      required: false,
      type: "string",
      valueHint: "glob,glob",
    },
    "correct.include.rules": {
      description:
        "List of rules to include in the operation. Comma-separated.",
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
  },
  meta: {
    description:
      "Generate ESLint todo file and temporally suppress ESLint errors!",
    name: "@sushichan044/eslint-todo/cli",
    version: packageVersion,
  },
  async run({ args }) {
    const cliCwd = process.cwd();

    const {
      context,
      inputConfig,
      isConfigDirty: configPassedViaFlags,
    } = parseArguments({
      // args from citty are always not nullable even if default is not set
      config: {
        correct: {
          "autoFixableOnly": args["correct.autoFixableOnly"] as
            | boolean
            | undefined,
          "exclude.files": args["correct.exclude.files"] as string | undefined,
          "exclude.rules": args["correct.exclude.rules"] as string | undefined,
          "include.files": args["correct.include.files"] as string | undefined,
          "include.rules": args["correct.include.rules"] as string | undefined,
          "limit.count": args["correct.limit.count"] as string | undefined,
          "limit.type": args["correct.limit.type"] as string | undefined,
          "partialSelection": args["correct.partialSelection"] as
            | boolean
            | undefined,
        },
        root: args.root as string | undefined,
        todoFile: args.todoFile as string | undefined,
      },
      mode: {
        correct: args.correct,
        mcp: args.mcp,
      },
    });

    if (configPassedViaFlags) {
      consola.warn(
        "Ignoring config file because config is passed via CLI flags.",
      );
    }
    // Get partial config from CLI flags or config file.
    // If any flag is passed, the config file is completely ignored.
    const userConfig = configPassedViaFlags
      ? inputConfig
      : await resolveFileConfig(cliCwd);
    // Apply default values to the partial config
    const config = configWithDefault(userConfig);

    const eslintConfig = await readESLintConfig(config.root);
    const eslintConfigSubset = createESLintConfigSubset(eslintConfig);

    // initialize local ESLintTodoCore
    const eslintTodoCore = new ESLintTodoCore(config);

    const todoFilePathFromCLI = relative(
      cliCwd,
      eslintTodoCore.getTodoModulePath().absolute,
    );

    if (context.mode === "mcp") {
      const stopMcpServer = await startMcpServerWithStdio({
        config,
        eslintConfig: eslintConfigSubset,
      });

      process.on("SIGINT", () => {
        stopMcpServer()
          .then(() => {
            process.exitCode = 0;
          })
          .catch((error) => {
            consola.error(error);
            process.exitCode = 1;
          });
      });
      return;
    }

    if (context.mode === "generate") {
      const genActionExecutor = prepareAction(genAction, {
        config,
        eslintConfig: eslintConfigSubset,
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
        eslintConfig: eslintConfigSubset,
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
        eslintConfig: eslintConfigSubset,
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
        },
      });

      await deleteRuleExecutor(result.selection);
      return;
    }

    throw new Error(`Unknown mode: ${JSON.stringify(context.mode)}`);
  },
  setup({ args }) {
    if (!args.mcp) {
      // When used as MCP server, we should not output anything not satisfies MCP transport protocol.
      consola.info(`${packageName} CLI ${packageVersion}`);
    }
  },
});

export const run = async (argv: string[]): Promise<void> => {
  await runMain(cli, { rawArgs: argv });
};
