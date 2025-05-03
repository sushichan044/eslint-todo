import type { Config } from "../config";
import type { ESLintConfigSubset } from "../lib/eslint";

/**
 * @package
 */
export interface MCPServerContext {
  config: Config;
  eslintConfig: ESLintConfigSubset;
}
