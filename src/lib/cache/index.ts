import { outputFile } from "fs-extra";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "pathe";
import { createValidateEquals } from "typia";

import type { JSONValue } from "../../utils/json";
import type { MaybePromise } from "../../utils/types";

interface JSONCache<T extends JSONValue> {
  fetch(getter: () => MaybePromise<T>): Promise<T>;

  get(): Promise<T | null>;

  set(data: T): Promise<void>;
}

export const createJSONCache = <T extends JSONValue>(
  namespace: string,
): JSONCache<T> => {
  const cacheFile = calculateCachePath(namespace);
  const validate = createValidateEquals<T>();

  const get = async () => {
    if (!existsSync(cacheFile)) {
      return null;
    }

    const parsed = validate(JSON.parse(await readFile(cacheFile, "utf8")));
    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  };

  const set = async (data: T) => {
    await outputFile(cacheFile, JSON.stringify(data, null, 2), "utf8");
  };

  return {
    get,

    set,

    fetch: async (getter) => {
      const cache = await get();
      if (cache !== null) {
        return cache;
      }

      const data = await getter();
      await set(data);

      return data;
    },
  };
};

const calculateCachePath = (namespace: string) => {
  return join(
    process.cwd(),
    "node_modules",
    ".cache",
    "eslint-todo",
    namespace,
    "cache.json",
  );
};
