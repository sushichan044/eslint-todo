import { describe, expect, it } from "vitest";

import type { DependencyGraph, ImportGraphConfig } from "./types";

import { filterFilesByImportGraph } from "./analyzer";

const createMockGraph = (): DependencyGraph => ({
  buildTime: Date.now(),
  entryPoints: ["/src/entry.ts"],
  nodes: new Map([
    [
      "/src/entry.ts",
      {
        dependencies: ["/src/utils.ts"],
        dependents: [],
        depth: 0,
        isEntryPoint: true,
        source: "/src/entry.ts",
      },
    ],
    [
      "/src/helper.ts",
      {
        dependencies: [],
        dependents: ["/src/utils.ts"],
        depth: 2,
        isEntryPoint: false,
        source: "/src/helper.ts",
      },
    ],
    [
      "/src/unrelated.ts",
      {
        dependencies: [],
        dependents: [],
        depth: Infinity,
        isEntryPoint: false,
        source: "/src/unrelated.ts",
      },
    ],
    [
      "/src/utils.ts",
      {
        dependencies: ["/src/helper.ts"],
        dependents: ["/src/entry.ts"],
        depth: 1,
        isEntryPoint: false,
        source: "/src/utils.ts",
      },
    ],
  ]),
});

describe("filterFilesByImportGraph", () => {
  it("should filter files based on 'connected' mode", () => {
    const graph = createMockGraph();
    const config: ImportGraphConfig = {
      enabled: true,
      entryPoints: ["/src/entry.ts"],
      mode: "connected",
    };

    const files = [
      "/src/entry.ts",
      "/src/utils.ts",
      "/src/helper.ts",
      "/src/unrelated.ts",
    ];

    const result = filterFilesByImportGraph(files, graph, config);

    expect(result.matchedFiles).toEqual([
      "/src/entry.ts",
      "/src/utils.ts",
      "/src/helper.ts",
    ]);
    expect(result.filteredFiles).toEqual(["/src/unrelated.ts"]);
  });

  it("should filter files based on 'dependencies' mode", () => {
    const graph = createMockGraph();
    const config: ImportGraphConfig = {
      enabled: true,
      entryPoints: ["/src/entry.ts"],
      mode: "dependencies",
    };

    const files = [
      "/src/entry.ts",
      "/src/utils.ts",
      "/src/helper.ts",
      "/src/unrelated.ts",
    ];

    const result = filterFilesByImportGraph(files, graph, config);

    expect(result.matchedFiles).toEqual([
      "/src/entry.ts",
      "/src/utils.ts",
      "/src/helper.ts",
    ]);
    expect(result.filteredFiles).toEqual(["/src/unrelated.ts"]);
  });

  it("should respect dependency depth limits", () => {
    const graph = createMockGraph();
    const config: ImportGraphConfig = {
      dependencyDepth: 1,
      enabled: true,
      entryPoints: ["/src/entry.ts"],
      mode: "connected",
    };

    const files = [
      "/src/entry.ts",
      "/src/utils.ts",
      "/src/helper.ts",
      "/src/unrelated.ts",
    ];

    const result = filterFilesByImportGraph(files, graph, config);

    expect(result.matchedFiles).toEqual(["/src/entry.ts", "/src/utils.ts"]);
    expect(result.filteredFiles).toEqual([
      "/src/helper.ts",
      "/src/unrelated.ts",
    ]);
  });

  it("should handle empty entry points", () => {
    const graph: DependencyGraph = {
      buildTime: Date.now(),
      entryPoints: [], // No entry points in the graph
      nodes: new Map([
        [
          "/src/entry.ts",
          {
            dependencies: ["/src/utils.ts"],
            dependents: [],
            depth: Infinity,
            isEntryPoint: false,
            source: "/src/entry.ts",
          },
        ],
        [
          "/src/utils.ts",
          {
            dependencies: [],
            dependents: ["/src/entry.ts"],
            depth: Infinity,
            isEntryPoint: false,
            source: "/src/utils.ts",
          },
        ],
      ]),
    };

    const config: ImportGraphConfig = {
      enabled: true,
      entryPoints: [],
      mode: "connected",
    };

    const files = ["/src/entry.ts", "/src/utils.ts"];

    const result = filterFilesByImportGraph(files, graph, config);

    expect(result.matchedFiles).toEqual([]);
    expect(result.filteredFiles).toEqual(["/src/entry.ts", "/src/utils.ts"]);
  });
});
