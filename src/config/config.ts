import defu from "defu";
import { klona } from "klona";
import { cwd } from "node:process";

import type { DeepPartial } from "../utils/types";

export type Config = {
  /**
   * Project root. eslint-todo will search todo file and config file from this directory.
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
  /**
   * Options for correct mode.
   */
  correct: CorrectModeConfig;
};

export type UserConfig = DeepPartial<Config>;

export type CorrectModeConfig = {
  /**
   * Options for excluding todo items.
   */
  exclude: {
    /**
     * List of rules to exclude from the operation. Comma-separated string.
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
    type: "file" | "violation";
  };
  /**
   * Allow partial selection of violations.
   *
   * @default false
   */
  partialSelection: boolean;
  /**
   * Allow to select non auto-fixable rules.
   *
   * @default true
   */
  autoFixableOnly: boolean;
};

export type CorrectModeUserConfig = DeepPartial<CorrectModeConfig>;

/**
 * @package
 */
export const DEFAULT_CONFIG = {
  correct: {
    autoFixableOnly: true,
    exclude: {
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
