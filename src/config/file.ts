import type { IValidation } from "typia";

import { loadConfig } from "unconfig";

import type { UserConfig } from "./config";

import { UserConfigSchema } from "./validation";

/**
 * Read the config file and validate it.
 * @param root Directory to read the config file.
 * @returns Result of validation.
 *
 * @package
 */
// eslint-todo.config.{js,cjs,mjs,ts,cts,mts,json}
export const readConfigFile = async (
  root: string,
): Promise<IValidation<UserConfig>> => {
  const { config } = await loadConfig<UserConfig>({
    cwd: root,
    defaults: {},
    sources: [
      {
        files: "eslint-todo.config",
      },
    ],
  });

  if (Object.hasOwn(config, "$schema")) {
    // @ts-expect-error often used in JSON config file
    delete config.$schema;
  }

  return UserConfigSchema(config);
};
