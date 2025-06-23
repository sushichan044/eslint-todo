import type { Args } from "gunshi";

import type { CorrectModeArguments } from "./types";

import { isNonEmptyString } from "../../utils/string";

const parseCommaSeparatedString = (value: string): string[] => {
  const result: string[] = [];
  for (const part of value.split(",")) {
    const trimmed = part.trim();
    if (isNonEmptyString(trimmed)) {
      result.push(trimmed);
    }
  }
  return result;
};

/**
 * @package
 */
export const commonArguments = {
  root: {
    description:
      "Root directory of the project. (default: current working directory)",
    type: "string",
  },
  todoFile: {
    description: "ESLint todo file name. (default: .eslint-todo.js)",
    short: "f",
    type: "string",
  },
} as const satisfies Args;

export const modeArguments = {
  correct: {
    default: false,
    description: "Launch the correct mode (default: false)",
    type: "boolean",
  },
  mcp: {
    default: false,
    description: "Launch the MCP server. (default: false)",
    type: "boolean",
  },
} as const satisfies Args;

export const correctModeArguments = {
  "correct.autoFixableOnly": {
    description: "Allow to select non auto-fixable rules.",
    type: "boolean",
  },
  "correct.exclude.files": {
    description:
      "Glob patterns for files to exclude from the operation. Comma-separated.",
    parse: parseCommaSeparatedString,
    type: "custom",
  },
  "correct.exclude.rules": {
    description:
      "List of rules to exclude from the operation. Comma-separated.",
    parse: parseCommaSeparatedString,
    type: "custom",
  },
  "correct.include.files": {
    description:
      "Glob patterns for files to include in the operation. Comma-separated.",
    parse: parseCommaSeparatedString,
    type: "custom",
  },
  "correct.include.rules": {
    description: "List of rules to include in the operation. Comma-separated.",
    parse: parseCommaSeparatedString,
    type: "custom",
  },
  "correct.limit.count": {
    description: "Limit the number of violations or files to fix.",
    type: "number",
  },
  "correct.limit.type": {
    choices: ["file", "violation"],
    type: "enum",
  },
  "correct.partialSelection": {
    description: "Allow partial selection of violations.",
    type: "boolean",
  },
} as const satisfies CorrectModeArguments;
