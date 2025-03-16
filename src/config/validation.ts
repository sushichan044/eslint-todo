import typia from "typia";

import type { Config, UserConfig } from "./config";

export const ConfigSchema = typia.createValidateEquals<Config>();

export const UserConfigSchema = typia.createValidateEquals<UserConfig>();
