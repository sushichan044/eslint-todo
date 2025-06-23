import type { JSONValue } from "../../utils/json";

/**
 * Base cache entry interface for all cacheable data.
 */
export type CacheEntry<T extends JSONValue = JSONValue> = {
  /**
   * The cached data.
   */
  data: T;

  /**
   * Hash of the configuration used to build this cache.
   */
  configHash: string;

  /**
   * File modification times when this cache was built.
   */
  fileMtimes: Record<string, number>;

  /**
   * Timestamp when this cache was created.
   */
  timestamp: number;

  /**
   * Version of the cache format.
   */
  version: string;
};

/**
 * Configuration for cache generation.
 */
export type CacheConfig = {
  /**
   * Unique identifier for this cache type.
   */
  cacheId: string;

  /**
   * Version of the cache format.
   */
  version: string;

  /**
   * Files to track for invalidation.
   */
  trackedFiles?: string[];

  /**
   * Additional configuration data to include in hash.
   */
  configData?: Record<string, JSONValue>;

  /**
   * Maximum number of files to sample for validation (performance optimization).
   * @default 50
   */
  maxSampleSize?: number;
};

/**
 * Options for cache operations.
 */
export type CacheOptions = {
  /**
   * Root directory for cache storage.
   */
  rootDirectory: string;

  /**
   * Whether to enable cache.
   * @default true
   */
  enabled?: boolean;
};

/**
 * Generic cache manager interface.
 */
export interface CacheManager<T extends JSONValue = JSONValue> {
  clear(): Promise<void>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<CacheEntry<T> | null>;
  has(key: string): Promise<boolean>;
  set(key: string, entry: CacheEntry<T>): Promise<void>;
}

/**
 * Options for cache manager operations.
 */
export type CacheManagerOptions = {
  /**
   * Root directory for cache storage.
   */
  rootDirectory: string;

  /**
   * Cache identifier.
   */
  cacheId: string;

  /**
   * Directory for cache files.
   */
  cacheDirectory: string;

  /**
   * Maximum age of cache entries in milliseconds.
   */
  maxAge: number;

  /**
   * Configuration hash for invalidation.
   */
  configHash: string;

  /**
   * Cache version.
   */
  version: string;

  /**
   * Maximum number of files to sample for validation.
   */
  maxSampleSize?: number;

  /**
   * Whether to enable cache.
   * @default true
   */
  enabled?: boolean;
};
