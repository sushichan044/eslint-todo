import type { CacheConfig, CacheOptions } from "../lib/cache/types";
import type { DependencyGraph, ImportGraphConfig } from "./types";

import { JSONCache } from "../lib/cache";

/**
 * Cache manager for dependency graphs using the generic JsonCache.
 */
export class DependencyGraphCache {
  private readonly cache: JSONCache<DependencyGraph>;

  constructor(rootDirectory: string) {
    const cacheConfig: CacheConfig = {
      cacheId: "dependency-graph",
      maxSampleSize: 50,
      version: "1.0.0",
    };

    const cacheOptions: CacheOptions = {
      enabled: true,
      rootDirectory,
    };

    this.cache = new JSONCache<DependencyGraph>(cacheConfig, cacheOptions);
  }

  /**
   * Clears the cache.
   */
  async clear(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Gets a cached dependency graph if it's still valid.
   */
  async get(
    config: ImportGraphConfig,
    rootDirectory: string,
  ): Promise<DependencyGraph | null> {
    // Update cache configuration with current settings
    const cacheConfig: CacheConfig = {
      cacheId: "dependency-graph",
      configData: {
        dependencyDepth: config.dependencyDepth,
        enabled: config.enabled,
        entryPoints: [...config.entryPoints].sort(), // Sort for consistent hashing
        mode: config.mode,
        rootDirectory,
      },
      maxSampleSize: 50,
      version: "1.0.0",
    };

    const cacheOptions: CacheOptions = {
      enabled: true,
      rootDirectory,
    };

    // Create a new cache instance with updated config
    const configuredCache = new JSONCache<DependencyGraph>(
      cacheConfig,
      cacheOptions,
    );

    return await configuredCache.get();
  }

  /**
   * Stores a dependency graph in the cache.
   */
  async set(
    graph: DependencyGraph,
    config: ImportGraphConfig,
    rootDirectory: string,
  ): Promise<void> {
    // Sample files from the graph for tracking
    const sampleFiles = this.getSampleFilesFromGraph(graph);

    const cacheConfig: CacheConfig = {
      cacheId: "dependency-graph",
      configData: {
        dependencyDepth: config.dependencyDepth,
        enabled: config.enabled,
        entryPoints: [...config.entryPoints].sort(), // Sort for consistent hashing
        mode: config.mode,
        rootDirectory,
      },
      maxSampleSize: 50,
      trackedFiles: sampleFiles,
      version: "1.0.0",
    };

    const cacheOptions: CacheOptions = {
      enabled: true,
      rootDirectory,
    };

    // Create a new cache instance with updated config
    const configuredCache = new JSONCache<DependencyGraph>(
      cacheConfig,
      cacheOptions,
    );

    await configuredCache.set(graph);
  }

  /**
   * Samples a subset of files from the dependency graph for cache validation.
   * This prevents performance issues with very large graphs.
   */
  private getSampleFilesFromGraph(graph: DependencyGraph): string[] {
    const allFiles = [...graph.nodes.keys()];

    // Always include entry points
    const sampleFiles = [...graph.entryPoints];

    // Add a sample of other files (up to 50 total)
    const maxSampleSize = 50;
    const remainingSlots = maxSampleSize - sampleFiles.length;

    if (remainingSlots > 0 && allFiles.length > sampleFiles.length) {
      const otherFiles = allFiles.filter(
        (file) => !graph.entryPoints.includes(file),
      );

      // Sample evenly distributed files
      const step = Math.max(1, Math.floor(otherFiles.length / remainingSlots));
      for (
        let index = 0;
        index < otherFiles.length && sampleFiles.length < maxSampleSize;
        index += step
      ) {
        sampleFiles.push(otherFiles[index]!);
      }
    }

    return sampleFiles;
  }
}
