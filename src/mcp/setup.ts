import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { z } from "zod";

import type { MCPServerContext } from "./types";

import { ESLintTodoCore } from "..";
import { prepareAction } from "../action";
import { deleteRuleAction } from "../action/delete-rule";
import { selectRulesToFixAction } from "../action/select-rule";
import { mergeConfig } from "../config";

export interface SetupMcpServerOptions {
  onError: (error: unknown) => void;
}

/**
 * @package
 */
export const setupMcpServer = (
  server: McpServer,
  context: MCPServerContext,
  { onError }: Partial<SetupMcpServerOptions> = {},
) => {
  onError ??= (error) => {
    console.error(error);
  };

  // false positive
  // eslint-disable-next-line unicorn/prefer-add-event-listener
  server.server.onerror = onError;

  server.tool(
    "delete_suppression_with_limit",
    [
      "Delete suppression from ESLint suppressions json file with specific limit.",
      "",
      "Use this tool when you need to reduce ESLint suppressions while controlling the amount of diff reviewable.",
      "If you want to fix ESLint errors, please use `eslint --fix` instead.",
      "",
      "## Parameters",
      "You only specify the parameters you need for your work.",
    ].join("\n"),
    {
      autoFixableOnly: z
        .boolean()
        .optional()
        .describe("Allow to select non auto-fixable rules"),
      excludedRules: z
        .array(z.string())
        .optional()
        .default([])
        .describe("List of rules to exclude"),
      limitCount: z
        .number()
        .optional()
        .describe("Limit of suppression to delete"),
      limitType: z
        .enum(["file", "violation"])
        .optional()
        .describe("Type of limit"),
      partialSelection: z
        .boolean()
        .optional()
        .describe("Allow to select partial suppressions of a rule"),
    },
    {
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
      readOnlyHint: false,
      title: "Delete suppression with limit",
    },
    async (parameters) => {
      try {
        const config = mergeConfig(context.config, {
          correct: {
            autoFixableOnly: parameters.autoFixableOnly,
            exclude: {
              rules: parameters.excludedRules,
            },
            limit: {
              count: parameters.limitCount,
              type: parameters.limitType,
            },
            partialSelection: parameters.partialSelection,
          },
        });

        const core = new ESLintTodoCore(config);

        const todoModuleHasChanges =
          await core.todoModuleHasUncommittedChanges();

        if (todoModuleHasChanges) {
          return {
            content: [
              {
                text: [
                  "# Warning: The suppressions file has uncommitted changes",
                  "You attempt to run this tool on a suppressions file that has uncommitted changes.",
                  "This will cause unexpected diff, so we stopped the tool.",
                  "",
                  "## Suggested action",
                  "1. Commit or stash these changes and try again. You should confirm with human reviewer.",
                  "2. If you want to fix ESLint errors, please use `eslint --fix` instead.",
                ].join("\n"),
                type: "text",
              },
            ],
            isError: true,
          };
        }

        const selectRule = prepareAction(selectRulesToFixAction, {
          config: config,
          eslintConfig: context.eslintConfig,
        });

        const selectionResult = await selectRule();

        if (!selectionResult.success) {
          return {
            content: [
              {
                text: [
                  "# No rules to fix",
                  "Could not select rules to fix with given limit. Deletion from suppression json will not be performed.",
                  "## Recommended action",
                  "1. Check the eslint suppressions json file to ensure that the rule is suppressed.",
                  "2. If the rule is suppressed, try a larger limit.",
                  "3. If you can allow deleting partial suppressions of a rule, try to set `partialSelection` to `true`.",
                ].join("\n"),
                type: "text",
              },
            ],
          };
        }

        const deleteRule = prepareAction(deleteRuleAction, {
          config: context.config,
          eslintConfig: context.eslintConfig,
        });

        await deleteRule(selectionResult.selection);

        if (selectionResult.selection.type === "full") {
          return {
            content: [
              {
                text: [
                  "# Tool call succeed",
                  `All suppressions of ${selectionResult.selection.ruleId} have been deleted.`,
                ].join("\n"),
                type: "text",
              },
            ],
          };
        }

        const deletedCount = Object.values(
          selectionResult.selection.violations,
        ).reduce((accumulator, current) => accumulator + current, 0);

        return {
          content: [
            {
              text: [
                "# Tool call succeed",
                `${deletedCount} suppressions of ${selectionResult.selection.ruleId} have been deleted.`,
              ].join("\n"),
              type: "text",
            },
          ],
        };
      } catch (error) {
        console.error(error);
        return {
          content: [
            {
              text: [
                "# **Error Occurred**",
                "It looks like there was an error while communicating with the eslint-todo API.",
                "",
                "## Error Details",
                error instanceof Error ? error.message : String(error),
              ].join("\n"),
              type: "text",
            },
          ],
          isError: true,
        };
      }
    },
  );
};
