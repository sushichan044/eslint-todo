import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "pathe";
import { beforeEach, describe, expect, it } from "vitest";

import type { DependencyGraph, ImportGraphConfig } from "./types";

import { DependencyGraphCache } from "./cache";

describe("DependencyGraphCache", () => {
  const testRootDirectory = join(process.cwd(), "test-import-graph-cache");
  let cache: DependencyGraphCache;

  const mockConfig: ImportGraphConfig = {
    dependencyDepth: 3,
    enabled: true,
    entryPoints: ["src/index.ts"],
    mode: "connected",
  };

  const mockGraph: DependencyGraph = {
    buildTime: Date.now(),
    entryPoints: ["/project/src/index.ts"],
    nodes: new Map([
      [
        "/project/src/index.ts",
        {
          dependencies: ["/project/src/utils.ts"],
          dependents: [],
          depth: 0,
          isEntryPoint: true,
          source: "/project/src/index.ts",
        },
      ],
      [
        "/project/src/utils.ts",
        {
          dependencies: [],
          dependents: ["/project/src/index.ts"],
          depth: 1,
          isEntryPoint: false,
          source: "/project/src/utils.ts",
        },
      ],
    ]),
  };

  beforeEach(async () => {
    // Clean up any existing test cache
    try {
      await rm(testRootDirectory, { force: true, recursive: true });
    } catch {
      // Directory might not exist
    }

    cache = new DependencyGraphCache(testRootDirectory);
  });

  it("should return null when cache doesn't exist", async () => {
    const result = await cache.get(mockConfig, testRootDirectory);
    expect(result).toBeNull();
  });

  it("should store and retrieve dependency graph", async () => {
    await cache.set(mockGraph, mockConfig, testRootDirectory);
    const result = await cache.get(mockConfig, testRootDirectory);

    expect(result).toEqual(mockGraph);
    expect(result?.nodes).toBeInstanceOf(Map);
  });

  it("should invalidate cache when config changes", async () => {
    await cache.set(mockGraph, mockConfig, testRootDirectory);

    // Change config
    const newConfig: ImportGraphConfig = {
      ...mockConfig,
      mode: "dependencies",
    };

    const result = await cache.get(newConfig, testRootDirectory);
    expect(result).toBeNull();
  });

  it("should invalidate cache when entry points change", async () => {
    await cache.set(mockGraph, mockConfig, testRootDirectory);

    // Change entry points
    const newConfig: ImportGraphConfig = {
      ...mockConfig,
      entryPoints: ["src/app.ts"],
    };

    const result = await cache.get(newConfig, testRootDirectory);
    expect(result).toBeNull();
  });

  it("should invalidate cache when dependency depth changes", async () => {
    await cache.set(mockGraph, mockConfig, testRootDirectory);

    // Change dependency depth
    const newConfig: ImportGraphConfig = {
      ...mockConfig,
      dependencyDepth: 5,
    };

    const result = await cache.get(newConfig, testRootDirectory);
    expect(result).toBeNull();
  });

  it("should clear cache", async () => {
    await cache.set(mockGraph, mockConfig, testRootDirectory);
    expect(await cache.get(mockConfig, testRootDirectory)).toEqual(mockGraph);

    await cache.clear();
    expect(await cache.get(mockConfig, testRootDirectory)).toBeNull();
  });

  it("should handle file modification tracking", async () => {
    // Create a test file that should be tracked
    await mkdir(testRootDirectory, { recursive: true });

    // Create the directory structure for the test file
    const testFileDirectory = join(testRootDirectory, "project", "src");
    await mkdir(testFileDirectory, { recursive: true });
    const testFilePath = join(testFileDirectory, "index.ts");
    await writeFile(testFilePath, "export const test = 1;", "utf8");

    // Update the mock graph to use the actual file path
    const updatedGraph: DependencyGraph = {
      ...mockGraph,
      entryPoints: [testFilePath],
      nodes: new Map([
        [
          testFilePath,
          {
            dependencies: [],
            dependents: [],
            depth: 0,
            isEntryPoint: true,
            source: testFilePath,
          },
        ],
      ]),
    };

    // Create config that tracks this file
    const configWithRealPath: ImportGraphConfig = {
      ...mockConfig,
      entryPoints: [testFilePath],
    };

    await cache.set(updatedGraph, configWithRealPath, testRootDirectory);
    expect(await cache.get(configWithRealPath, testRootDirectory)).toEqual(
      updatedGraph,
    );

    // Modify the tracked file
    await writeFile(testFilePath, "export const test = 2;", "utf8");

    // Cache should be invalidated
    expect(await cache.get(configWithRealPath, testRootDirectory)).toBeNull();
  });

  it("should handle large graphs by sampling files", async () => {
    // Create a large graph with many files
    const largeGraph: DependencyGraph = {
      buildTime: Date.now(),
      entryPoints: [],
      nodes: new Map(),
    };

    // Add many nodes to the graph
    for (let index = 0; index < 100; index++) {
      const filePath = `/project/src/file${index}.ts`;
      largeGraph.nodes.set(filePath, {
        dependencies: [],
        dependents: [],
        depth: index === 0 ? 0 : 1,
        isEntryPoint: index === 0,
        source: filePath,
      });

      if (index === 0) {
        largeGraph.entryPoints.push(filePath);
      }
    }

    await cache.set(largeGraph, mockConfig, testRootDirectory);
    const result = await cache.get(mockConfig, testRootDirectory);

    expect(result).toEqual(largeGraph);
    expect(result?.nodes.size).toBe(100);
  });
});
