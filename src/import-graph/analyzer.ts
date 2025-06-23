import type { ICruiseOptions, IReporterOutput } from "dependency-cruiser";

import { cruise } from "dependency-cruiser";
import { resolve } from "pathe";

import type {
  BuildGraphOptions,
  DependencyGraph,
  DependencyNode,
  ImportGraphConfig,
  ImportGraphFilterResult,
} from "./types";

/**
 * Builds a dependency graph using dependency-cruiser.
 */
export async function buildDependencyGraph(
  options: BuildGraphOptions,
): Promise<DependencyGraph> {
  const { entryPoints, exclude = [], maxDepth, rootDir } = options;

  // Configure dependency-cruiser options
  const cruiseOptions: ICruiseOptions = {
    doNotFollow: {
      // Don't follow into node_modules, but record the dependencies
      path: "node_modules",
    },
    exclude: {
      path: exclude.length > 0 ? exclude.join("|") : undefined,
    },
    includeOnly: rootDir,
    maxDepth,
  };

  // Resolve entry points to actual file paths
  const resolvedEntryPoints = resolveEntryPoints(entryPoints, rootDir);

  // Run dependency-cruiser analysis
  const cruiseResult: IReporterOutput = await cruise([rootDir], cruiseOptions);

  // Convert cruise result to our dependency graph format
  return convertCruiseResultToDependencyGraph(
    cruiseResult,
    resolvedEntryPoints,
    maxDepth,
  );
}

/**
 * Filters files based on import graph analysis.
 */
export function filterFilesByImportGraph(
  files: string[],
  graph: DependencyGraph,
  config: ImportGraphConfig,
): ImportGraphFilterResult {
  const { dependencyDepth, mode } = config;

  let matchedFiles: string[] = [];

  // Get all files connected to entry points based on the mode
  const connectedFiles = getConnectedFiles(graph, mode, dependencyDepth);

  // Filter input files to only include those in the connected set
  matchedFiles = files.filter((file) => {
    const absolutePath = resolve(file);
    return connectedFiles.has(absolutePath);
  });

  const filteredFiles = files.filter((file) => !matchedFiles.includes(file));

  return {
    filteredFiles,
    graph,
    matchedFiles,
  };
}

/**
 * Gets all files connected to entry points based on the specified mode.
 */
function getConnectedFiles(
  graph: DependencyGraph,
  mode: ImportGraphConfig["mode"],
  maxDepth?: number,
): Set<string> {
  const connectedFiles = new Set<string>();

  // Start with entry points
  for (const entryPoint of graph.entryPoints) {
    connectedFiles.add(entryPoint);

    const node = graph.nodes.get(entryPoint);
    if (!node) continue;

    switch (mode) {
      case "connected": {
        // Include both dependencies and dependents
        addDependencies(graph, entryPoint, connectedFiles, maxDepth);
        addDependents(graph, entryPoint, connectedFiles, maxDepth);
        break;
      }
      case "dependencies": {
        // Include files that entry points depend on (downstream)
        addDependencies(graph, entryPoint, connectedFiles, maxDepth);
        break;
      }
      case "dependents": {
        // Include files that depend on entry points (upstream)
        addDependents(graph, entryPoint, connectedFiles, maxDepth);
        break;
      }
    }
  }

  return connectedFiles;
}

/**
 * Recursively adds all dependencies of a file to the connected set.
 */
function addDependencies(
  graph: DependencyGraph,
  filePath: string,
  connectedFiles: Set<string>,
  maxDepth?: number,
  currentDepth = 0,
): void {
  if (maxDepth !== undefined && currentDepth >= maxDepth) {
    return;
  }

  const node = graph.nodes.get(filePath);
  if (!node) return;

  for (const dependency of node.dependencies) {
    if (!connectedFiles.has(dependency)) {
      connectedFiles.add(dependency);
      addDependencies(
        graph,
        dependency,
        connectedFiles,
        maxDepth,
        currentDepth + 1,
      );
    }
  }
}

/**
 * Recursively adds all dependents of a file to the connected set.
 */
function addDependents(
  graph: DependencyGraph,
  filePath: string,
  connectedFiles: Set<string>,
  maxDepth?: number,
  currentDepth = 0,
): void {
  if (maxDepth !== undefined && currentDepth >= maxDepth) {
    return;
  }

  const node = graph.nodes.get(filePath);
  if (!node) return;

  for (const dependent of node.dependents) {
    if (!connectedFiles.has(dependent)) {
      connectedFiles.add(dependent);
      addDependents(
        graph,
        dependent,
        connectedFiles,
        maxDepth,
        currentDepth + 1,
      );
    }
  }
}

/**
 * Resolves entry point patterns to actual file paths.
 */
function resolveEntryPoints(
  entryPoints: string[],
  rootDirectory: string,
): string[] {
  const resolved: string[] = [];

  for (const entryPoint of entryPoints) {
    if (entryPoint.includes("*") || entryPoint.includes("?")) {
      // It's a glob pattern - we'll need to resolve it
      // For now, assume it's a direct file path or resolve it relative to rootDirectory
      const absolutePath = resolve(rootDirectory, entryPoint);
      resolved.push(absolutePath);
    } else {
      // Direct file path
      const absolutePath = resolve(rootDirectory, entryPoint);
      resolved.push(absolutePath);
    }
  }

  return resolved;
}

/**
 * Converts dependency-cruiser output to our internal dependency graph format.
 */
function convertCruiseResultToDependencyGraph(
  cruiseResult: IReporterOutput,
  entryPoints: string[],
  maxDepth?: number,
): DependencyGraph {
  const nodes = new Map<string, DependencyNode>();
  const entryPointSet = new Set(entryPoints);

  // First pass: create all nodes
  if (
    cruiseResult.output !== null &&
    cruiseResult.output !== undefined &&
    typeof cruiseResult.output === "object" &&
    "modules" in cruiseResult.output
  ) {
    const modules = cruiseResult.output.modules;
    for (const module of modules) {
      const source = resolve(module.source);
      const isEntryPoint = entryPointSet.has(source);

      // Calculate depth from nearest entry point
      const depth = isEntryPoint ? 0 : Infinity;

      const node: DependencyNode = {
        dependencies: [],
        dependents: [],
        depth,
        isEntryPoint,
        source,
      };

      nodes.set(source, node);
    }

    // Second pass: populate dependencies and calculate depths
    for (const module of modules) {
      const source = resolve(module.source);
      const sourceNode = nodes.get(source);
      if (!sourceNode) continue;

      if (module.dependencies.length > 0) {
        for (const dep of module.dependencies) {
          const targetPath = resolve(dep.resolved);
          const targetNode = nodes.get(targetPath);

          if (targetNode) {
            // Add dependency relationship
            sourceNode.dependencies.push(targetPath);
            targetNode.dependents.push(source);
          }
        }
      }
    }

    // Third pass: calculate proper depths using BFS from entry points
    calculateDepths(nodes, entryPoints, maxDepth);
  }

  return {
    buildTime: Date.now(),
    entryPoints,
    nodes,
  };
}

/**
 * Calculates the depth of each node from the nearest entry point using BFS.
 */
function calculateDepths(
  nodes: Map<string, DependencyNode>,
  entryPoints: string[],
  maxDepth?: number,
): void {
  const queue: Array<{ depth: number; path: string }> = [];
  const visited = new Set<string>();

  // Initialize queue with entry points
  for (const entryPoint of entryPoints) {
    const node = nodes.get(entryPoint);
    if (node) {
      node.depth = 0;
      queue.push({ depth: 0, path: entryPoint });
      visited.add(entryPoint);
    }
  }

  // BFS to calculate depths
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const { depth, path } = current;

    if (maxDepth !== undefined && depth >= maxDepth) {
      continue;
    }

    const node = nodes.get(path);
    if (!node) continue;

    // Process dependencies
    for (const depPath of node.dependencies) {
      if (!visited.has(depPath)) {
        const depNode = nodes.get(depPath);
        if (depNode) {
          depNode.depth = Math.min(depNode.depth, depth + 1);
          queue.push({ depth: depth + 1, path: depPath });
          visited.add(depPath);
        }
      }
    }
  }
}
