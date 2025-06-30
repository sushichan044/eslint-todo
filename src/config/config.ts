import defu from "defu";
import { klona } from "klona";
import { cwd } from "node:process";

import type { DeepRequired } from "../utils/types";

export type Config = DeepRequired<UserConfig>;

export type UserConfig = {
  /**
   * Options for correct mode.
   */
  correct?: CorrectModeUserConfig;
  /**
   * Project root.
   *
   * **This directory must contain the ESLint configuration file.**
   *
   * This also affects the default location of the ESLint todo file.
   *
   * @default process.cwd()
   */
  root?: string;
  /**
   * The file path to read and write the ESLint todo list.
   *
   * @default ".eslint-todo.js"
   */
  todoFile?: string;
};

export type CorrectModeConfig = DeepRequired<CorrectModeUserConfig>;

export type CorrectModeLimitType = "file" | "violation";

export type CorrectModeUserConfig = {
  /**
   * Allow to select non auto-fixable rules.
   *
   * @default true
   */
  autoFixableOnly?: boolean;

  /**
   * Options for excluding todo items.
   */
  exclude?: {
    /**
     * Glob patterns for files to exclude from the operation.
     *
     * @default []
     */
    files?: string[];

    /**
     * List of rules to exclude from the operation. Comma-separated string.
     *
     * @default []
     */
    rules?: string[];
  };

  /**
   * Options for including todo items.
   */
  include?: {
    /**
     * Glob patterns for files to include in the operation.
     *
     * @default []
     */
    files?: string[];

    /**
     * List of rules to include in the operation.
     *
     * @default []
     */
    rules?: string[];
  };
  limit?: {
    /**
     * Limit the number of violations or files to fix.
     *
     * @default 100
     */
    count?: number;

    /**
     * Type of limit to apply.
     *
     * @default "violation"
     */
    type?: CorrectModeLimitType;
  };

  /**
   * Allow partial selection of violations.
   *
   * @default false
   */
  partialSelection?: boolean;
};

export type CorrectModeLimit =
  | {
      /**
       * Entrypoints to build the import graph.
       *
       * @default []
       */
      entrypoints: string[];
      type: "import-graph";
    }
  | {
      /**
       * Limit the number of files to fix.
       *
       * @default 100
       */
      count: number;
      type: "file";
    }
  | {
      /**
       * Limit the number of violations to fix.
       *
       * @default 100
       */
      count: number;
      type: "violation";
    };

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
