import type {
  ESLintConfig,
  ReadConfigOptions,
} from "@eslint/config-inspector/monkey-patch";

import { readConfig } from "@eslint/config-inspector/monkey-patch";

export const readConfigWithESLintInspector = async (
  options: ReadConfigOptions,
): Promise<ESLintConfig> => {
  return await readConfig(options);
};
