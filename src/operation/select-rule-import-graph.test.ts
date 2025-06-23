import { describe, expect, it } from "vitest";

import type { CorrectModeConfig } from "../config/config";
import type { DependencyGraph } from "../import-graph/types";
import type { ESLintConfigSubset } from "../lib/eslint";

import { applyRuleAndFileFilters } from "./select-rule";

const createMockESLintConfig = (): ESLintConfigSubset => ({
  rules: {
    "no-console": { fixable: true },
    "no-unused-vars": { fixable: false },
  },
});

const createMockDependencyGraph = (): DependencyGraph => ({
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

describe("applyRuleAndFileFilters with import graph", () => {
  it("should filter files using import graph when enabled", async () => {
    const config: CorrectModeConfig = {
      autoFixableOnly: false,
      exclude: {
        files: [],
        rules: [],
      },
      importGraph: {
        enabled: true,
        entryPoints: ["/src/entry.ts"],
        mode: "connected",
      },
      include: {
        files: [],
        rules: [],
      },
      limit: {
        count: 100,
        type: "violation",
      },
      partialSelection: false,
    };

    const violatedFiles = [
      "/src/entry.ts",
      "/src/utils.ts",
      "/src/helper.ts",
      "/src/unrelated.ts",
    ];

    const result = await applyRuleAndFileFilters(
      "no-console",
      violatedFiles,
      createMockESLintConfig(),
      config,
      "/src",
      createMockDependencyGraph(),
    );

    expect(result.isEligible).toBe(true);
    if (result.isEligible) {
      expect(result.correctableFiles).toEqual([
        "/src/entry.ts",
        "/src/utils.ts",
        "/src/helper.ts",
      ]);
    }
  });

  it("should respect dependency depth limits in import graph", async () => {
    const config: CorrectModeConfig = {
      autoFixableOnly: false,
      exclude: {
        files: [],
        rules: [],
      },
      importGraph: {
        dependencyDepth: 1,
        enabled: true,
        entryPoints: ["/src/entry.ts"],
        mode: "connected",
      },
      include: {
        files: [],
        rules: [],
      },
      limit: {
        count: 100,
        type: "violation",
      },
      partialSelection: false,
    };

    const violatedFiles = [
      "/src/entry.ts",
      "/src/utils.ts",
      "/src/helper.ts",
      "/src/unrelated.ts",
    ];

    const result = await applyRuleAndFileFilters(
      "no-console",
      violatedFiles,
      createMockESLintConfig(),
      config,
      "/src",
      createMockDependencyGraph(),
    );

    expect(result.isEligible).toBe(true);
    if (result.isEligible) {
      expect(result.correctableFiles).toEqual([
        "/src/entry.ts",
        "/src/utils.ts",
      ]);
    }
  });

  it("should fall back to glob filtering when import graph is disabled", async () => {
    const config: CorrectModeConfig = {
      autoFixableOnly: false,
      exclude: {
        files: [],
        rules: [],
      },
      importGraph: {
        enabled: false,
        entryPoints: ["/src/entry.ts"],
        mode: "connected",
      },
      include: {
        files: ["**/*.ts"],
        rules: [],
      },
      limit: {
        count: 100,
        type: "violation",
      },
      partialSelection: false,
    };

    const violatedFiles = [
      "/src/entry.ts",
      "/src/utils.ts",
      "/src/helper.ts",
      "/src/unrelated.ts",
    ];

    const result = await applyRuleAndFileFilters(
      "no-console",
      violatedFiles,
      createMockESLintConfig(),
      config,
      "/src",
      createMockDependencyGraph(),
    );

    expect(result.isEligible).toBe(true);
    if (result.isEligible) {
      // Should include all files since glob pattern matches all .ts files
      expect(result.correctableFiles).toEqual([
        "/src/entry.ts",
        "/src/utils.ts",
        "/src/helper.ts",
        "/src/unrelated.ts",
      ]);
    }
  });

  it("should combine glob and import graph filtering", async () => {
    const config: CorrectModeConfig = {
      autoFixableOnly: false,
      exclude: {
        files: ["**/unrelated.ts"], // Exclude unrelated.ts via glob
        rules: [],
      },
      importGraph: {
        enabled: true,
        entryPoints: ["/src/entry.ts"],
        mode: "connected",
      },
      include: {
        files: [],
        rules: [],
      },
      limit: {
        count: 100,
        type: "violation",
      },
      partialSelection: false,
    };

    const violatedFiles = [
      "/src/entry.ts",
      "/src/utils.ts",
      "/src/helper.ts",
      "/src/unrelated.ts",
    ];

    const result = await applyRuleAndFileFilters(
      "no-console",
      violatedFiles,
      createMockESLintConfig(),
      config,
      "/src",
      createMockDependencyGraph(),
    );

    expect(result.isEligible).toBe(true);
    if (result.isEligible) {
      // Should apply both glob exclude and import graph filtering
      expect(result.correctableFiles).toEqual([
        "/src/entry.ts",
        "/src/utils.ts",
        "/src/helper.ts",
      ]);
    }
  });

  it("should handle empty entry points gracefully", async () => {
    const config: CorrectModeConfig = {
      autoFixableOnly: false,
      exclude: {
        files: [],
        rules: [],
      },
      importGraph: {
        enabled: true,
        entryPoints: [], // Empty entry points
        mode: "connected",
      },
      include: {
        files: [],
        rules: [],
      },
      limit: {
        count: 100,
        type: "violation",
      },
      partialSelection: false,
    };

    const violatedFiles = ["/src/entry.ts", "/src/utils.ts"];

    const result = await applyRuleAndFileFilters(
      "no-console",
      violatedFiles,
      createMockESLintConfig(),
      config,
      "/src",
      createMockDependencyGraph(),
    );

    // With empty entry points, import graph filtering is skipped and falls back to glob filtering
    // Since there are no glob filters, all files should pass through
    expect(result.isEligible).toBe(true);
    if (result.isEligible) {
      expect(result.correctableFiles).toEqual([
        "/src/entry.ts",
        "/src/utils.ts",
      ]);
    }
  });
});
