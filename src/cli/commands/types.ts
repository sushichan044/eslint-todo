import type { ArgSchema } from "gunshi/definition";

import type { FlattenObject } from "../../utils/flatten";

/**
 * @package
 */
export type FlattenToArgumentSchema<T extends Record<PropertyKey, unknown>> = {
  [K in keyof FlattenObject<T>]: ArgSchema;
};
