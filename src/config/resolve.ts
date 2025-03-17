import type { Config, UserConfig } from "./config";

import { configWithDefault } from "./config";
import { readConfigFile } from "./file";
import { mergeUserConfig } from "./index";

/**
 * Resolve the config file and merge it with the user config.
 * Then apply the default values to the merged config.
 * @param cwd Directory to read the config file.
 * @param userConfig User input config via CLI or ESLint config.
 * @returns Resolved Config.
 */
export const resolveConfig = async (
  cwd: string,
  userConfig: UserConfig = {},
): Promise<Config> => {
  const configReadResult = await readConfigFile(cwd);
  const configFromFile = configReadResult.success ? configReadResult.data : {};

  // Merge the config file and the user config.
  const resolvedUserConfig = mergeUserConfig(configFromFile, userConfig);

  // Apply the default values to the merged config.
  return configWithDefault(resolvedUserConfig);
};
