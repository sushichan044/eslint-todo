import { defu } from "defu";
import { cwd } from "node:process";

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

export type UserOptions = Partial<Options>;

/**
 * @package
 */
export const optionsWithDefault = (options: UserOptions = {}): Options => {
  return defu(options, getDefaultOptions());
};

const getDefaultOptions = () =>
  ({ ...DEFAULT_OPTIONS }) as const satisfies Options;

/**
 * @private
 */
export const DEFAULT_OPTIONS = {
  cwd: cwd(),
  todoFile: ".eslint-todo.js",
} as const satisfies Options;
