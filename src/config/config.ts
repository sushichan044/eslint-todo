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
   * The path to the ESLint bulk suppressions file.
   *
   * @default "eslint-suppressions.json"
   */
  suppressionsLocation: string;
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
};

export type CorrectModeUserConfig = DeepPartial<CorrectModeConfig>;

const DEFAULT_CONFIG = {
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
  suppressionsLocation: "eslint-suppressions.json",
} as const satisfies Config;

export const configWithDefault = (config?: UserConfig): Config => {
  return defu(config, getDefaultConfig());
};

const getDefaultConfig = () => klona(DEFAULT_CONFIG);
