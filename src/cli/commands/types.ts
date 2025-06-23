import type { ArgSchema } from "gunshi/definition";

import type { Config } from "../../config";
import type { FlattenObject } from "../../utils/flatten";

/**
 * @package
 */
export type CorrectModeArguments = FlattenToArgumentSchema<
  Pick<Config, "correct">
>;

type FlattenToArgumentSchema<T extends Record<PropertyKey, unknown>> = {
  [K in keyof FlattenObject<T>]: ArgSchema;
};
