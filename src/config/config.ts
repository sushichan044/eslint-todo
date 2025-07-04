import defu from "defu";
import { klona } from "klona";
import { cwd } from "node:process";

import type { DeepPartial } from "../utils/types";

export type Config = {
  /**
   * Options for correct mode.
   */
  correct: CorrectModeConfig;
  /**
   * Project root.
   *
   * **This directory must contain the ESLint configuration file.**
   *
   * This also affects the default location of the ESLint todo file.
   *
   * @default process.cwd()
   */
  root: string;
  /**
   * The file path to read and write the ESLint todo list.
   *
   * @default ".eslint-todo.js"
   */
  todoFile: string;
};

export type UserConfig = DeepPartial<Config>;

export type CorrectModeConfig = {
  /**
   * Allow to select non auto-fixable rules.
   *
   * @default true
   */
  autoFixableOnly: boolean;
  /**
   * Options for excluding todo items.
   */
  exclude: {
    /**
     * Glob patterns for files to exclude from the operation.
     *
     * @default []
     */
    files: string[];
    /**
     * List of rules to exclude from the operation. Comma-separated string.
     *
     * @default []
     */
    rules: string[];
  };
  /**
   * Options for including todo items.
   */
  include: {
    /**
     * Glob patterns for files to include in the operation.
     *
     * @default []
     */
    files: string[];
    /**
     * List of rules to include in the operation.
     *
     * @default []
     */
    rules: string[];
  };
  limit: {
    /**
     * Limit the number of violations or files to fix.
     *
     * @default 100
     */
    count: number;
    /**
     * Type of limit to apply.
     *
     * @default "violation"
     */
    type: CorrectModeLimitType;
  };
  /**
   * Allow partial selection of violations.
   *
   * @default false
   */
  partialSelection: boolean;
};

export type CorrectModeLimitType = "file" | "violation";

export type CorrectModeUserConfig = DeepPartial<CorrectModeConfig>;

const DEFAULT_CONFIG = {
  correct: {
    autoFixableOnly: true,
    exclude: {
      files: [],
      rules: [],
    },
    include: {
      files: [],
      rules: [],
    },
    limit: {
      count: 100,
      type: "violation",
    },
    partialSelection: false,
  },
  root: cwd(),
  todoFile: ".eslint-todo.js",
} as const satisfies Config;

export const configWithDefault = (config?: UserConfig): Config => {
  return defu(config, getDefaultConfig());
};

const getDefaultConfig = () => klona(DEFAULT_CONFIG);
