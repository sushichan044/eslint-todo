import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "pathe";
import { beforeEach, describe, expect, it } from "vitest";

import type { CacheConfig, CacheOptions } from "./types";

import { JSONCache } from "./index";

describe("JsonCache", () => {
  type TestData = {
    items: string[];
    metadata: Map<string, string>;
    value: number;
  };

  const testRootDirectory = join(process.cwd(), "test-cache");
  const cacheConfig: CacheConfig = {
    cacheId: "test-cache",
    configData: { feature: "enabled" },
    maxSampleSize: 10,
    version: "1.0.0",
  };
  const cacheOptions: CacheOptions = {
    enabled: true,
    rootDirectory: testRootDirectory,
  };

  let cache: JSONCache<TestData>;

  beforeEach(async () => {
    // Clean up any existing test cache
    try {
      await rm(testRootDirectory, { force: true, recursive: true });
    } catch {
      // Directory might not exist
    }

    cache = new JSONCache<TestData>(cacheConfig, cacheOptions);
  });

  it("should return null when cache doesn't exist", async () => {
    const result = await cache.get();
    expect(result).toBeNull();
  });

  it("should store and retrieve data", async () => {
    const testData: TestData = {
      items: ["a", "b", "c"],
      metadata: new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]),
      value: 42,
    };

    await cache.set(testData);
    const result = await cache.get();

    expect(result).toEqual(testData);
    expect(result?.metadata).toBeInstanceOf(Map);
  });

  it("should invalidate cache when config changes", async () => {
    const testData: TestData = {
      items: ["a", "b", "c"],
      metadata: new Map(),
      value: 42,
    };

    await cache.set(testData);

    // Create new cache with different config
    const newConfig = { ...cacheConfig, configData: { feature: "disabled" } };
    const newCache = new JSONCache<TestData>(newConfig, cacheOptions);

    const result = await newCache.get();
    expect(result).toBeNull();
  });

  it("should invalidate cache when version changes", async () => {
    const testData: TestData = {
      items: ["a", "b", "c"],
      metadata: new Map(),
      value: 42,
    };

    await cache.set(testData);

    // Create new cache with different version
    const newConfig = { ...cacheConfig, version: "2.0.0" };
    const newCache = new JSONCache<TestData>(newConfig, cacheOptions);

    const result = await newCache.get();
    expect(result).toBeNull();
  });

  it("should handle disabled cache", async () => {
    const disabledCache = new JSONCache<TestData>(cacheConfig, {
      ...cacheOptions,
      enabled: false,
    });

    const testData: TestData = {
      items: ["a", "b", "c"],
      metadata: new Map(),
      value: 42,
    };

    await disabledCache.set(testData);
    const result = await disabledCache.get();

    expect(result).toBeNull();
  });

  it("should clear cache", async () => {
    const testData: TestData = {
      items: ["a", "b", "c"],
      metadata: new Map(),
      value: 42,
    };

    await cache.set(testData);
    expect(await cache.get()).toEqual(testData);

    await cache.clear();
    expect(await cache.get()).toBeNull();
  });

  it("should handle corrupted cache file", async () => {
    // First create a valid cache
    const testData: TestData = {
      items: ["a", "b", "c"],
      metadata: new Map(),
      value: 42,
    };

    await cache.set(testData);

    // Corrupt the cache file
    const cacheDirectory = join(
      testRootDirectory,
      "node_modules",
      ".cache",
      "eslint-todo",
    );
    const cacheFile = join(cacheDirectory, "test-cache-cache.json");

    await writeFile(cacheFile, "invalid json {", "utf8");

    const result = await cache.get();
    expect(result).toBeNull();
  });

  it("should handle tracked files", async () => {
    const testFile = join(testRootDirectory, "test-file.ts");

    // Create test file
    await mkdir(testRootDirectory, { recursive: true });
    await writeFile(testFile, "const test = 1;", "utf8");

    const configWithTrackedFiles: CacheConfig = {
      ...cacheConfig,
      trackedFiles: [testFile],
    };

    const cacheWithTracking = new JSONCache<TestData>(
      configWithTrackedFiles,
      cacheOptions,
    );

    const testData: TestData = {
      items: ["a", "b", "c"],
      metadata: new Map(),
      value: 42,
    };

    await cacheWithTracking.set(testData);
    expect(await cacheWithTracking.get()).toEqual(testData);

    // Modify the tracked file
    await writeFile(testFile, "const test = 2;", "utf8");

    // Cache should be invalidated
    expect(await cacheWithTracking.get()).toBeNull();
  });

  it("should sample files when there are too many tracked files", async () => {
    const testFiles: string[] = [];
    await mkdir(testRootDirectory, { recursive: true });

    // Create more files than maxSampleSize
    for (let index = 0; index < 20; index++) {
      const testFile = join(testRootDirectory, `test-file-${index}.ts`);
      await writeFile(testFile, `const test${index} = ${index};`, "utf8");
      testFiles.push(testFile);
    }

    const configWithManyFiles: CacheConfig = {
      ...cacheConfig,
      maxSampleSize: 5,
      trackedFiles: testFiles,
    };

    const cacheWithManyFiles = new JSONCache<TestData>(
      configWithManyFiles,
      cacheOptions,
    );

    const testData: TestData = {
      items: ["a", "b", "c"],
      metadata: new Map(),
      value: 42,
    };

    await cacheWithManyFiles.set(testData);
    expect(await cacheWithManyFiles.get()).toEqual(testData);
  });

  it("should validate cache entry structure", async () => {
    const testData: TestData = {
      items: ["a", "b", "c"],
      metadata: new Map(),
      value: 42,
    };

    await cache.set(testData);

    // Manually corrupt the cache structure
    const cacheDirectory = join(
      testRootDirectory,
      "node_modules",
      ".cache",
      "eslint-todo",
    );
    const cacheFile = join(cacheDirectory, "test-cache-cache.json");

    const corruptedEntry = {
      configHash: "abc123",
      data: testData,
      // Missing required fields
    };

    await writeFile(cacheFile, JSON.stringify(corruptedEntry), "utf8");

    const result = await cache.get();
    expect(result).toBeNull();
  });
});
