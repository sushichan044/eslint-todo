#!/usr/bin/env node

import { cli, define } from "gunshi";
import process from "node:process";
import { renderHeader as defaultHeaderRenderer } from "gunshi/renderer";

import { readESLintConfig } from "../lib/eslint/index";

interface RuleInfoDisplay {
  description?: string;
  fixable?: boolean | "code" | "whitespace";
  messages?: Record<string, string>;
  name: string;
  plugin: string;
  type?: string;
  url?: string;
}

const ruleInfoCmd = define({
  args: {
    json: {
      default: false,
      description: "Output as JSON",
      short: "j",
      type: "boolean",
    },
    root: {
      description:
        "Root directory of the project (default: current working directory)",
      short: "r",
      type: "string",
    },
    rule: {
      description:
        "Rule name to search for (e.g., 'no-unused-vars', '@typescript-eslint/no-explicit-any')",
      short: "n",
      type: "string",
    },
    search: {
      default: false,
      description: "Enable partial matching search",
      short: "s",
      type: "boolean",
    },
  } as const,
  name: "rule-info",
  run: async (context) => {
    const { json, root, rule, search } = context.values;
    const actualRoot = root ?? process.cwd();

    if (rule === undefined || rule === null || rule === "") {
      console.error("Error: Rule name is required");
      process.exit(1);
    }

    try {
      // Read ESLint config and rules
      const config = await readESLintConfig(actualRoot);
      const rules = config.payload.rules;

      type RuleEntry = [string, unknown];
      let matchedRules: RuleEntry[] = [];

      // Search logic
      if (search) {
        // Partial match search
        matchedRules = Object.entries(rules).filter(([ruleName]) =>
          ruleName.toLowerCase().includes(rule.toLowerCase()),
        );
      } else {
        // Exact match
        const exactRule = rules[rule];
        if (exactRule !== undefined) {
          matchedRules = [[rule, exactRule]];
        }
      }

      // Handle no results
      if (matchedRules.length === 0) {
        const errorMessage = `No rules found for: ${rule}`;
        if (json) {
          console.log(
            JSON.stringify({ error: "No rules found", query: rule }, null, 2),
          );
        } else {
          console.error(`Error: ${errorMessage}`);
        }
        process.exit(1);
      }

      // Format results
      const results: RuleInfoDisplay[] = matchedRules.map(
        ([ruleName, ruleInfo]) => {
          // Type assertion for rule info object
          const ruleData = ruleInfo as {
            docs?: { description?: string; url?: string };
            fixable?: boolean | "code" | "whitespace" | null;
            messages?: Record<string, string>;
            plugin?: string;
            type?: string;
          };

          return {
            description: ruleData.docs?.description,
            fixable:
              ruleData.fixable === null ? false : (ruleData.fixable ?? true),
            messages: ruleData.messages,
            name: ruleName,
            plugin: ruleData.plugin ?? "eslint",
            type: ruleData.type,
            url: ruleData.docs?.url,
          };
        },
      );

      // Output results
      if (json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        for (const result of results) {
          console.log(`📋 Rule: ${result.name}`);
          console.log(`   Plugin: ${result.plugin}`);
          if (result.description !== undefined && result.description !== "") {
            console.log(`   Description: ${result.description}`);
          }
          if (result.url !== undefined && result.url !== "") {
            console.log(`   URL: ${result.url}`);
          }
          console.log(
            `   Fixable: ${result.fixable === true || result.fixable === "code" || result.fixable === "whitespace" ? "Yes" : "No"}`,
          );
          if (result.type !== undefined && result.type !== "") {
            console.log(`   Type: ${result.type}`);
          }
          if (
            result.messages !== undefined &&
            Object.keys(result.messages).length > 0
          ) {
            console.log("   Messages:");
            for (const [key, message] of Object.entries(result.messages)) {
              console.log(`     ${key}: ${message}`);
            }
          }
          console.log(); // Empty line between rules
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      if (json) {
        console.log(JSON.stringify({ error: errorMessage }, null, 2));
      } else {
        console.error(`Error: ${errorMessage}`);
      }
      process.exit(1);
    }
  },
});

export default ruleInfoCmd;

// If this file is run directly, execute the command
// Use require check for Node.js compatibility
if (
  process.argv[1] !== null &&
  process.argv[1] !== undefined &&
  (process.argv[1].includes("rule-info-cli.ts") ||
    process.argv[1].includes("rule-info-cli.js"))
) {
  void cli(process.argv, ruleInfoCmd, {
    description: "ESLint rule information CLI tool",
    name: "rule-info",
    renderHeader: async (context) => {
      // Don't show header when JSON output is requested
      if (context.values.json === true) {
        return "";
      }
      return defaultHeaderRenderer(context);
    },
  });
}
