import { defu } from "defu";
import { klona } from "klona";
import { cwd } from "node:process";

import type { DeepPartial } from "./utils/types";

export type Options = {
  /**
   * The file path to read and write the ESLint todo list.
   * @default ".eslint-todo.js"
   */
  todoFile: string;

  /**
   * The current working directory.
   *
   * @default process.cwd()
   */
  cwd: string;
};

export type UserOptions = DeepPartial<Options>;

/**
 * @package
 */
export const optionsWithDefault = (options: UserOptions = {}): Options => {
  return defu(options, getDefaultOptions());
};

const getDefaultOptions = () => klona(DEFAULT_OPTIONS);

/**
 * @private
 */
export const DEFAULT_OPTIONS = {
  cwd: cwd(),
  todoFile: ".eslint-todo.js",
} as const satisfies Options;
