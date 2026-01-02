import { describe, expect, it } from "vitest";

import { extractPathsByGlobs, pathMatchesGlobs } from "./glob";

describe("glob utilities", () => {
  describe("pathMatchesGlobs", () => {
    it("should return true when no patterns provided", () => {
      expect(pathMatchesGlobs("any/file.ts", [])).toBe(true);
    });

    it("should match exact file paths", () => {
      expect(pathMatchesGlobs("src/index.ts", ["src/index.ts"])).toBe(true);
      expect(pathMatchesGlobs("src/index.js", ["src/index.ts"])).toBe(false);
    });

    it("should match wildcard patterns", () => {
      expect(pathMatchesGlobs("src/file.ts", ["src/*.ts"])).toBe(true);
      expect(pathMatchesGlobs("src/file.js", ["src/*.ts"])).toBe(false);
      expect(pathMatchesGlobs("src/nested/file.ts", ["src/*.ts"])).toBe(false);
    });

    it("should match double wildcard patterns", () => {
      expect(pathMatchesGlobs("src/file.ts", ["src/**/*.ts"])).toBe(true);
      expect(pathMatchesGlobs("src/nested/file.ts", ["src/**/*.ts"])).toBe(true);
      expect(pathMatchesGlobs("src/deeply/nested/file.ts", ["src/**/*.ts"])).toBe(true);
      expect(pathMatchesGlobs("other/file.ts", ["src/**/*.ts"])).toBe(false);
    });

    it("should match multiple patterns", () => {
      const patterns = ["src/**/*.ts", "app/**/*.tsx"];
      expect(pathMatchesGlobs("src/file.ts", patterns)).toBe(true);
      expect(pathMatchesGlobs("app/component.tsx", patterns)).toBe(true);
      expect(pathMatchesGlobs("lib/file.js", patterns)).toBe(false);
    });

    it("should handle complex patterns", () => {
      expect(pathMatchesGlobs("pages/user.tsx", ["pages/*.tsx"])).toBe(true);
      expect(pathMatchesGlobs("pages/index.tsx", ["pages/user.tsx"])).toBe(false);
      // Test literal bracket matching by escaping
      expect(pathMatchesGlobs("pages/[id].tsx", [String.raw`pages/\[id\].tsx`])).toBe(true);
    });

    it("should handle relative paths", () => {
      expect(pathMatchesGlobs("./src/file.ts", ["src/**/*.ts"])).toBe(true);
      expect(pathMatchesGlobs("./src/file.ts", ["./**/*.ts"])).toBe(true);
    });
  });

  describe("extractPathsByGlobs", () => {
    const files = [
      "src/index.ts",
      "src/utils/helper.ts",
      "src/components/Button.tsx",
      "app/page.tsx",
      "app/layout.tsx",
      "lib/utils.js",
      "test/example.test.ts",
    ];

    it("should return all files when no patterns provided", () => {
      expect(extractPathsByGlobs(files, [])).toStrictEqual(files);
    });

    it("should filter by single pattern", () => {
      const result = extractPathsByGlobs(files, ["src/**/*.ts"]);
      expect(result).toStrictEqual(["src/index.ts", "src/utils/helper.ts"]);
    });

    it("should filter by multiple patterns", () => {
      const result = extractPathsByGlobs(files, ["src/**/*.ts", "app/**/*.tsx"]);
      expect(result).toStrictEqual([
        "src/index.ts",
        "src/utils/helper.ts",
        "app/page.tsx",
        "app/layout.tsx",
      ]);
    });

    it("should handle patterns that match nothing", () => {
      const result = extractPathsByGlobs(files, ["non-existent/**/*.py"]);
      expect(result).toStrictEqual([]);
    });

    it("should handle complex patterns", () => {
      const result = extractPathsByGlobs(files, ["**/*.{ts,tsx}"]);
      expect(result).toStrictEqual([
        "src/index.ts",
        "src/utils/helper.ts",
        "src/components/Button.tsx",
        "app/page.tsx",
        "app/layout.tsx",
        "test/example.test.ts",
      ]);
    });
  });
});
