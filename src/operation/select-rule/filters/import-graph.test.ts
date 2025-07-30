import type { TSConfig } from "pkg-types";

import defu from "defu";
import { createFixture } from "fs-fixture";
import { describe, expect, it } from "vitest";

import type { Config } from "../../../config/config";
import type { RuleViolationInfo } from "../index";

import { importGraphBasedStrategy } from "./import-graph";

// ============================================================================
// Test Utilities
// ============================================================================

const createTSConfig = (overrides: Partial<TSConfig> = {}): TSConfig => {
  return defu(
    {
      compilerOptions: {
        allowUnreachableCode: false,
        esModuleInterop: true,
        exactOptionalPropertyTypes: true,
        forceConsistentCasingInFileNames: true,
        isolatedModules: true,
        module: "nodenext",
        noFallthroughCasesInSwitch: true,
        noImplicitOverride: true,
        noImplicitReturns: true,
        noPropertyAccessFromIndexSignature: true,
        noUncheckedIndexedAccess: true,
        noUncheckedSideEffectImports: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        strict: true,
        strictNullChecks: true,
        target: "esnext",
        verbatimModuleSyntax: true,
      },
    },
    overrides,
  );
};

const createConfig = (
  overrides: Partial<Config["correct"]> = {},
  root = ".",
): Config => ({
  correct: {
    autoFixableOnly: false,
    exclude: { files: [], rules: [] },
    include: { files: [], rules: [] },
    limit: { count: 100, type: "file" },
    partialSelection: false,
    strategy: { type: "normal" },
    ...overrides,
  },
  root,
  todoFile: ".eslint-todo.js",
});

const createRuleViolationInfo = (
  ruleId: string,
  isFixable: boolean,
  violations: { [file: string]: { count: number } },
): RuleViolationInfo => ({
  meta: {
    isFixable,
    ruleId,
  },
  violations,
});

// ============================================================================
// Tests
// ============================================================================

describe("importGraphBasedStrategy", () => {
  describe("strategy type validation", () => {
    it("returns unchanged info when strategy type is not import-graph", async () => {
      const info = createRuleViolationInfo("no-console", true, {
        "src/entry.ts": { count: 1 },
        "src/unused.ts": { count: 2 },
      });
      const config = createConfig({
        strategy: { type: "normal" },
      });

      const result = await importGraphBasedStrategy(info, config);

      expect(result).toEqual(info);
    });

    it("processes info when strategy type is import-graph", async () => {
      await using fixture = await createFixture({
        "package.json": JSON.stringify({
          name: "test-project",
          type: "module",
        }),
        "src": {
          "entry.ts": `import { helper } from "./helper";
console.log(helper);`,
          "helper.ts": `export const helper = "test-helper";`,
          "unused.ts": `export const unused = "not-imported";`,
        },
        "tsconfig.json": JSON.stringify(
          createTSConfig({
            exclude: ["node_modules"],
            include: ["**/*.js", "**/*.ts"],
          }),
        ),
      });

      const info = createRuleViolationInfo("no-console", true, {
        "src/entry.ts": { count: 1 },
        "src/helper.ts": { count: 2 },
        "src/unused.ts": { count: 3 },
      });
      const config = createConfig(
        {
          strategy: {
            entrypoints: ["src/entry.ts"],
            type: "import-graph",
          },
        },
        fixture.getPath("."),
      );

      const result = await importGraphBasedStrategy(info, config);

      expect(result.meta).toEqual(info.meta);
      expect(result.violations).toEqual({
        "src/entry.ts": { count: 1 },
        "src/helper.ts": { count: 2 },
        // "src/unused.ts" should be filtered out as it's not reachable
      });
    });
  });

  describe("TypeScript path alias resolution", () => {
    it("resolves files imported with path aliases", async () => {
      await using fixture = await createFixture({
        "package.json": JSON.stringify({
          name: "test-alias-project",
          type: "module",
        }),
        "src": {
          "api": {
            "service.ts": `import { config } from "@/config";
export class ApiService {
  constructor() {
    console.log(config.apiUrl);
  }
}`,
          },
          "app.ts": `import { config } from "@/config";
import { ApiService } from "@api/service";
import { formatUtil } from "@utils/format";
export const app = { config, ApiService, formatUtil };`,
          "config.ts": `export const config = { apiUrl: "https://api.example.com" };`,
          "standalone.ts": `export const standalone = "isolated-file";`,
          "utils": {
            "format.ts": `export const formatUtil = (text: string) => text.toUpperCase();`,
            "unused.ts": `export const unusedUtil = "not-imported";`,
          },
        },
        "tsconfig.json": JSON.stringify(
          createTSConfig({
            compilerOptions: {
              baseUrl: ".",
              paths: {
                "@/*": ["src/*"],
                "@api/*": ["src/api/*"],
                "@utils/*": ["src/utils/*"],
              },
            },
            exclude: ["node_modules"],
            include: ["**/*.js", "**/*.ts"],
          }),
        ),
      });

      const info = createRuleViolationInfo("no-console", true, {
        "src/api/service.ts": { count: 3 },
        "src/app.ts": { count: 1 },
        "src/config.ts": { count: 2 },
        "src/standalone.ts": { count: 6 },
        "src/utils/format.ts": { count: 4 },
        "src/utils/unused.ts": { count: 5 },
      });
      const config = createConfig(
        {
          strategy: {
            entrypoints: ["src/app.ts"],
            type: "import-graph",
          },
        },
        fixture.getPath("."),
      );

      const result = await importGraphBasedStrategy(info, config);

      expect(result.violations).toEqual({
        "src/api/service.ts": { count: 3 },
        "src/app.ts": { count: 1 },
        "src/config.ts": { count: 2 },
        "src/utils/format.ts": { count: 4 },
        // "src/utils/unused.ts" and "src/standalone.ts" should be filtered out
      });
    });
  });

  describe("error handling", () => {
    it("handles empty violations input", async () => {
      await using fixture = await createFixture({
        "package.json": JSON.stringify({
          name: "test-empty-project",
          type: "module",
        }),
        "src": {
          "entry.ts": `export const entry = "test";`,
        },
        "tsconfig.json": JSON.stringify(
          createTSConfig({
            exclude: ["node_modules"],
            include: ["**/*.js", "**/*.ts"],
          }),
        ),
      });

      const info = createRuleViolationInfo("no-console", true, {});
      const config = createConfig(
        {
          strategy: {
            entrypoints: ["src/entry.ts"],
            type: "import-graph",
          },
        },
        fixture.getPath("."),
      );

      const result = await importGraphBasedStrategy(info, config);

      expect(result).toEqual({
        meta: info.meta,
        violations: {},
      });
    });

    it("handles files not in module graph", async () => {
      await using fixture = await createFixture({
        "package.json": JSON.stringify({
          name: "test-partial-project",
          type: "module",
        }),
        "src": {
          "entry.ts": `export const entry = "test";`,
          "other.ts": `export const other = "separate";`,
        },
        "tsconfig.json": JSON.stringify(
          createTSConfig({
            exclude: ["node_modules"],
            include: ["**/*.js", "**/*.ts"],
          }),
        ),
      });

      const info = createRuleViolationInfo("no-console", true, {
        "src/entry.ts": { count: 1 },
        "src/nonexistent.ts": { count: 3 },
        "src/other.ts": { count: 2 },
      });
      const config = createConfig(
        {
          strategy: {
            entrypoints: ["src/entry.ts"],
            type: "import-graph",
          },
        },
        fixture.getPath("."),
      );

      const result = await importGraphBasedStrategy(info, config);

      expect(result.violations).toEqual({
        "src/entry.ts": { count: 1 },
        // "src/other.ts" and "src/nonexistent.ts" should be filtered out
      });
    });
  });
});
