/**
 * Configuration options for import graph analysis.
 */
export type ImportGraphConfig = {
  /**
   * Whether to enable import graph-based file filtering.
   * @default false
   */
  enabled: boolean;

  /**
   * Entry point files to start the dependency analysis from.
   * These can be glob patterns or specific file paths.
   * @default []
   */
  entryPoints: string[];

  /**
   * Maximum dependency depth to traverse.
   * If not specified, will traverse the entire dependency tree.
   */
  dependencyDepth?: number;

  /**
   * Mode for selecting files based on the import graph.
   * - 'dependents': Files that depend on the entry points (upstream)
   * - 'dependencies': Files that the entry points depend on (downstream)
   * - 'connected': All files connected to the entry points (both directions)
   * @default 'connected'
   */
  mode: "connected" | "dependencies" | "dependents";
};

/**
 * Represents a single file in the dependency graph.
 */
export type DependencyNode = {
  /**
   * Absolute path to the file.
   */
  source: string;

  /**
   * Files that this file depends on (imports).
   */
  dependencies: string[];

  /**
   * Files that depend on this file.
   */
  dependents: string[];

  /**
   * Whether this file is an entry point.
   */
  isEntryPoint: boolean;

  /**
   * Distance from the nearest entry point.
   */
  depth: number;
};

/**
 * Complete dependency graph for a project.
 */
export type DependencyGraph = {
  /**
   * All files in the dependency graph, keyed by their absolute path.
   */
  nodes: Record<string, DependencyNode>;

  /**
   * Entry point files used to build this graph.
   */
  entryPoints: string[];

  /**
   * Timestamp when this graph was built.
   */
  buildTime: number;
};

/**
 * Result of analyzing files with import graph filtering.
 */
export type ImportGraphFilterResult = {
  /**
   * Files that match the import graph criteria.
   */
  matchedFiles: string[];

  /**
   * Files that were filtered out.
   */
  filteredFiles: string[];

  /**
   * The dependency graph used for filtering.
   */
  graph: DependencyGraph;
};

/**
 * Options for building a dependency graph.
 */
export type BuildGraphOptions = {
  /**
   * Project root directory.
   */
  rootDir: string;

  /**
   * Entry point files or patterns.
   */
  entryPoints: string[];

  /**
   * Maximum depth to traverse.
   */
  maxDepth?: number;

  /**
   * File patterns to exclude from analysis.
   */
  exclude?: string[];

  /**
   * File extensions to include in analysis.
   * @default ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']
   */
  extensions?: string[];
};
