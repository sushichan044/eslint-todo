import { relative, resolve } from "pathe";

import type { Config } from "./config";

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
export const resolveTodoModulePath = (config: Config): TodoFilePath => {
  const { root, suppressionsLocation } = config;

  const absolutePath = resolve(root, suppressionsLocation);
  const relativePath = relative(root, absolutePath);

  return {
    absolute: absolutePath,
    relative: relativePath,
  };
};
