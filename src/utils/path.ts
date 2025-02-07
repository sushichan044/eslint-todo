import path from "pathe";

import type { Options } from "../options";

type TodoFilePath = {
  absolute: string;
  relative: string;
};

/**
 * Resolve the absolute and relative path of the todo file.
 */
export const resolveTodoFilePath = (options: Options): TodoFilePath => {
  const { cwd, todoFile } = options;

  const absolute = path.resolve(cwd, todoFile);
  const relative = path.relative(cwd, absolute);

  return {
    absolute,
    relative,
  };
};
