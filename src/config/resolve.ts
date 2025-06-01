import type { UserConfig } from "./config";

import { readConfigFile } from "./file";

/**
 * Resolve the config file.
 *
 * @param cwd Directory to read the config file.
 * @returns Resolved Config.
 */
export const resolveFileConfig = async (cwd: string): Promise<UserConfig> => {
  // If userConfig is empty, read and use config file as before
  const configReadResult = await readConfigFile(cwd);
  return configReadResult.success ? configReadResult.data : {};
};
