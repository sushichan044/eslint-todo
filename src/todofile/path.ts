import { relative, resolve } from "pathe";

import type { Options } from "../options";

export type TodoFilePath = {
  /**
   * todo file's absolute path.
   */
  absolute: string;
  /**
   * todo file's relative path from directory you specified as `cwd`.
   */
  relative: string;
};

/**
 * Resolve the absolute and relative path of the todo file.
 */
export const resolveTodoModulePath = (options: Options): TodoFilePath => {
  const { cwd, todoFile } = options;

  const absolutePath = resolve(cwd, todoFile);
  const relativePath = relative(cwd, absolutePath);

  return {
    absolute: absolutePath,
    relative: relativePath,
  };
};
