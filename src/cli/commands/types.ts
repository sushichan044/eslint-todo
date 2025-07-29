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
  // conditional keys are not in keyof FlattenObject<T>.
  // so we need to allow additional keys.
  [key: string]: ArgSchema;
} & {
  [K in keyof FlattenObject<T>]: ArgSchema;
};
