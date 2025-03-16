import type { IValidation } from "@samchon/openapi";

import { resolve } from "pathe";

import type { UserConfig } from "./config";

import { importDefault } from "../utils/import";
import { UserConfigSchema } from "./validation";

// eslint-todo.config.{js,cjs,mjs,ts,cts,mts,json}
export const readConfigFile = async (
  root: string,
): Promise<IValidation<UserConfig>> => {
  const loaded = await importDefault<UserConfig>(
    resolve(root, "./eslint-todo.config"),
    {},
  );

  if (Object.hasOwn(loaded, "$schema")) {
    // @ts-expect-error often used in JSON config file
    delete loaded.$schema;
  }

  return UserConfigSchema(loaded);
};
