import typia from "typia";

import type { UserConfig } from "./config";

/**
 * @package
 */
export const UserConfigSchema = typia.createValidateEquals<UserConfig>();
