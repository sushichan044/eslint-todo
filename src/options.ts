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

export const optionsWithDefault = (options: UserOptions = {}): Options => {
  return defu(options, defaultOptions);
};

const defaultOptions = {
  cwd: cwd(),
  todoFile: ".eslint-todo.js",
} as const satisfies Options;
