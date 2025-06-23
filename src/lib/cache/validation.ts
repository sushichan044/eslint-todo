import { createValidateEquals } from "typia";

import type { JSONValue } from "../../utils/json";
import type { CacheEntry } from "./types";

export const validateCacheEntry = <T extends JSONValue>() => {
  return createValidateEquals<CacheEntry<T>>();
};
