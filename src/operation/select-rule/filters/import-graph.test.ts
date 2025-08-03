import { createFixture } from "fs-fixture";
import { describe, expect, it } from "vitest";

import { applyViolationFilters } from ".";
import { createTSConfig } from "../../../../tests/utils/tsconfig";
import { configWithDefault } from "../../../config/config";
import { ImportGraphBasedStrategy } from "./import-graph";

// ============================================================================
// Tests
// ============================================================================

describe("importGraphBasedStrategy", () => {
  describe("strategy type validation", () => {
    it("returns unchanged info when strategy type is not import-graph", async () => {
      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "src/entry.ts": { count: 1 },
          "src/unused.ts": { count: 2 },
        },
      };
      const config = configWithDefault({
        correct: {
          strategy: { type: "normal" },
        },
      });

      const strategy = new ImportGraphBasedStrategy({
        config,
      });
      const result = await applyViolationFilters([info], [strategy], config);

      expect(result.at(0)).toEqual(info);
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

      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "src/entry.ts": { count: 1 },
          "src/helper.ts": { count: 2 },
          "src/unused.ts": { count: 3 },
        },
      };
      const config = configWithDefault({
        correct: {
          strategy: {
            entrypoints: ["src/entry.ts"],
            type: "import-graph",
          },
        },
        root: fixture.getPath("."),
      });
      const strategy = new ImportGraphBasedStrategy({
        config,
      });
      const result = await applyViolationFilters([info], [strategy], config);

      expect(result.at(0)?.meta).toEqual(info.meta);
      expect(result.at(0)?.violations).toEqual({
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

      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "src/api/service.ts": { count: 3 },
          "src/app.ts": { count: 1 },
          "src/config.ts": { count: 2 },
          "src/standalone.ts": { count: 6 },
          "src/utils/format.ts": { count: 4 },
          "src/utils/unused.ts": { count: 5 },
        },
      };
      const config = configWithDefault({
        correct: {
          strategy: {
            entrypoints: ["src/app.ts"],
            type: "import-graph",
          },
        },
        root: fixture.getPath("."),
      });
      const strategy = new ImportGraphBasedStrategy({
        config,
      });

      const result = await applyViolationFilters([info], [strategy], config);

      expect(result.at(0)?.violations).toEqual({
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

      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {},
      };
      const config = configWithDefault({
        correct: {
          strategy: {
            entrypoints: ["src/entry.ts"],
            type: "import-graph",
          },
        },
        root: fixture.getPath("."),
      });
      const strategy = new ImportGraphBasedStrategy({
        config,
      });

      const result = await applyViolationFilters([info], [strategy], config);

      expect(result.at(0)).toEqual({
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

      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "src/entry.ts": { count: 1 },
          "src/nonexistent.ts": { count: 3 },
          "src/other.ts": { count: 2 },
        },
      };
      const config = configWithDefault({
        correct: {
          strategy: {
            entrypoints: ["src/entry.ts"],
            type: "import-graph",
          },
        },
        root: fixture.getPath("."),
      });
      const strategy = new ImportGraphBasedStrategy({
        config,
      });

      const result = await applyViolationFilters([info], [strategy], config);

      expect(result.at(0)?.violations).toEqual({
        "src/entry.ts": { count: 1 },
        // "src/other.ts" and "src/nonexistent.ts" should be filtered out
      });
    });
  });
});
