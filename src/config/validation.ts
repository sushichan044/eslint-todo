import typia from "typia";

import type { Config, UserConfig } from "./config";

/**
 * @package
 */
export const ConfigSchema = typia.createValidateEquals<Config>();

/**
 * @package
 */
export const UserConfigSchema = typia.createValidateEquals<UserConfig>();
