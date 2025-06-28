import { describe, expect, it } from "vitest";

import type { CorrectModeLimitType } from "../config/config.js";
import type { RuleCountInfo, SelectionResult } from "./select-rule.js";

import { selectOptimalRule } from "./select-rule.js";

const createRuleCountInfo = (
  ruleId: string,
  originalCount: number,
  filteredCount: number,
  filteredFiles: string[] = [],
  filteredViolations: Record<string, number> = {},
  isFixable = false, // Default to false for backward compatibility
): RuleCountInfo => ({
  eligibleCount: filteredCount,
  eligibleFiles: filteredFiles,
  filteredViolations,
  ruleId,
  supportsAutoFix: isFixable,
  totalCount: originalCount,
});

describe("selectOptimalRule", () => {
  describe("empty input", () => {
    it("returns not successful when no rules provided", () => {
      const result = selectOptimalRule([], 10, false);
      expect(result).toStrictEqual({ success: false });
    });
  });

  describe("full selection", () => {
    const tc: Array<{
      allowPartialSelection: boolean;
      expected: SelectionResult;
      limitCount: number;
      name: string;
      ruleCounts: RuleCountInfo[];
    }> = [
      {
        allowPartialSelection: false,
        expected: {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        },
        limitCount: 10,
        name: "selects rule with highest filtered count within limit",
        ruleCounts: [
          createRuleCountInfo("rule1", 5, 3),
          createRuleCountInfo("rule2", 8, 8), // Best option
          createRuleCountInfo("rule3", 6, 2),
        ],
      },
      {
        allowPartialSelection: false,
        expected: {
          selection: { ruleId: "rule1", type: "full" },
          success: true,
        },
        limitCount: 10,
        name: "selects first rule when multiple rules have same filtered count",
        ruleCounts: [
          createRuleCountInfo("rule1", 5, 8), // First with highest filtered count
          createRuleCountInfo("rule2", 7, 8), // Same filtered count
          createRuleCountInfo("rule3", 3, 2),
        ],
      },
      {
        allowPartialSelection: false,
        expected: {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        },
        limitCount: 10,
        name: "ignores rules that exceed original limit",
        ruleCounts: [
          createRuleCountInfo("rule1", 15, 10), // Exceeds limit
          createRuleCountInfo("rule2", 8, 5), // Within limit
        ],
      },
    ];

    it.each(tc)(
      "$name",
      ({ allowPartialSelection, expected, limitCount, ruleCounts }) => {
        const result = selectOptimalRule(
          ruleCounts,
          limitCount,
          allowPartialSelection,
        );
        expect(result).toStrictEqual(expected);
      },
    );
  });

  describe("partial selection disabled", () => {
    it("returns not successful when all rules exceed limit and partial selection disabled", () => {
      const ruleCounts = [
        createRuleCountInfo("rule1", 15, 10),
        createRuleCountInfo("rule2", 20, 8),
      ];
      const result = selectOptimalRule(ruleCounts, 10, false);
      expect(result).toStrictEqual({ success: false });
    });
  });

  describe("partial selection enabled", () => {
    describe("file limit type", () => {
      const tc: Array<{
        expected: SelectionResult;
        limitCount: number;
        limitType: CorrectModeLimitType;
        name: string;
        ruleCounts: RuleCountInfo[];
      }> = [
        {
          expected: {
            selection: {
              ruleId: "rule1",
              type: "partial",
              violations: { "file1.ts": 3, "file2.ts": 2, "file3.ts": 1 },
            },
            success: true,
          },
          limitCount: 3,
          limitType: "file" as const,
          name: "returns partial selection for first rule exceeding limit",
          ruleCounts: [
            createRuleCountInfo(
              "rule1",
              15, // exceeds limit
              10,
              ["file1.ts", "file2.ts", "file3.ts", "file4.ts", "file5.ts"],
              {
                "file1.ts": 3,
                "file2.ts": 2,
                "file3.ts": 1,
                "file4.ts": 4,
                "file5.ts": 2,
              },
            ),
            createRuleCountInfo("rule2", 8, 5), // within limit, but rule1 is first
          ],
        },
        {
          expected: {
            selection: { ruleId: "rule2", type: "full" },
            success: true,
          },
          limitCount: 5,
          limitType: "file" as const,
          name: "prefers full selection when available",
          ruleCounts: [
            createRuleCountInfo("rule1", 15, 10), // exceeds limit
            createRuleCountInfo("rule2", 3, 8), // within limit - should be selected
          ],
        },
      ];

      it.each(tc)(
        "$name",
        ({ expected, limitCount, limitType, ruleCounts }) => {
          const result = selectOptimalRule(
            ruleCounts,
            limitCount,
            true,
            limitType,
          );
          expect(result).toStrictEqual(expected);
        },
      );
    });

    describe("violation limit type", () => {
      const tc: Array<{
        expected: SelectionResult;
        limitCount: number;
        limitType: CorrectModeLimitType;
        name: string;
        ruleCounts: RuleCountInfo[];
      }> = [
        {
          expected: {
            selection: {
              ruleId: "rule1",
              type: "partial",
              violations: { "file1.ts": 3, "file2.ts": 4 }, // total: 7
            },
            success: true,
          },
          limitCount: 7,
          limitType: "violation" as const,
          name: "returns partial selection up to violation limit",
          ruleCounts: [
            createRuleCountInfo(
              "rule1",
              20, // exceeds limit
              15,
              ["file1.ts", "file2.ts", "file3.ts"],
              { "file1.ts": 3, "file2.ts": 4, "file3.ts": 8 }, // total: 15
            ),
          ],
        },
        {
          expected: {
            selection: {
              ruleId: "rule1",
              type: "partial",
              violations: { "file1.ts": 5, "file2.ts": 5 },
            },
            success: true,
          },
          limitCount: 10,
          limitType: "violation" as const,
          name: "stops at exact violation limit",
          ruleCounts: [
            createRuleCountInfo(
              "rule1",
              20,
              12,
              ["file1.ts", "file2.ts", "file3.ts"],
              { "file1.ts": 5, "file2.ts": 5, "file3.ts": 2 },
            ),
          ],
        },
        {
          expected: { success: false },
          limitCount: 10,
          limitType: "violation" as const,
          name: "returns not successful when no files can be selected within violation limit",
          ruleCounts: [
            createRuleCountInfo(
              "rule1",
              20,
              15,
              ["file1.ts"],
              { "file1.ts": 15 }, // First file alone exceeds limit
            ),
          ],
        },
      ];

      it.each(tc)(
        "$name",
        ({ expected, limitCount, limitType, ruleCounts }) => {
          const result = selectOptimalRule(
            ruleCounts,
            limitCount,
            true,
            limitType,
          );
          expect(result).toStrictEqual(expected);
        },
      );
    });

    it("returns not successful when no partial selection possible", () => {
      const ruleCounts = [
        createRuleCountInfo(
          "rule1",
          15,
          10,
          [],
          {}, // No filtered violations
        ),
      ];
      const result = selectOptimalRule(ruleCounts, 5, true);
      expect(result).toStrictEqual({ success: false });
    });
  });

  describe("auto-fixable rule prioritization", () => {
    describe("when autoFixableOnly is false", () => {
      it("prioritizes auto-fixable rules over non-fixable rules with same filtered count", () => {
        const ruleCounts = [
          createRuleCountInfo("non-fixable-rule", 5, 10, [], {}, false),
          createRuleCountInfo("fixable-rule", 5, 10, [], {}, true),
        ];

        const result = selectOptimalRule(ruleCounts, 20, false);

        expect(result).toStrictEqual({
          selection: { ruleId: "fixable-rule", type: "full" },
          success: true,
        });
      });

      it("prioritizes auto-fixable rule even with lower filtered count", () => {
        const ruleCounts = [
          createRuleCountInfo("non-fixable-rule", 5, 15, [], {}, false),
          createRuleCountInfo("fixable-rule", 5, 10, [], {}, true),
        ];

        const result = selectOptimalRule(ruleCounts, 20, false);

        expect(result).toStrictEqual({
          selection: { ruleId: "fixable-rule", type: "full" },
          success: true,
        });
      });

      it("falls back to filtered count when both rules have same fixability", () => {
        const ruleCounts = [
          createRuleCountInfo("rule-low-count", 5, 8, [], {}, true),
          createRuleCountInfo("rule-high-count", 5, 12, [], {}, true),
        ];

        const result = selectOptimalRule(ruleCounts, 20, false);

        expect(result).toStrictEqual({
          selection: { ruleId: "rule-high-count", type: "full" },
          success: true,
        });
      });

      it("uses rule id as tiebreaker when fixability and filtered count are same", () => {
        const ruleCounts = [
          createRuleCountInfo("z-rule", 5, 10, [], {}, true),
          createRuleCountInfo("a-rule", 5, 10, [], {}, true),
        ];

        const result = selectOptimalRule(ruleCounts, 20, false);

        expect(result).toStrictEqual({
          selection: { ruleId: "a-rule", type: "full" },
          success: true,
        });
      });

      it("handles mixed fixable and non-fixable rules correctly", () => {
        const ruleCounts = [
          createRuleCountInfo("non-fixable-high", 5, 20, [], {}, false),
          createRuleCountInfo("fixable-medium", 5, 15, [], {}, true),
          createRuleCountInfo("non-fixable-low", 5, 10, [], {}, false),
          createRuleCountInfo("fixable-low", 5, 5, [], {}, true),
        ];

        const result = selectOptimalRule(ruleCounts, 25, false);

        expect(result).toStrictEqual({
          selection: { ruleId: "fixable-medium", type: "full" },
          success: true,
        });
      });
    });

    describe("edge cases", () => {
      it("handles empty array", () => {
        const result = selectOptimalRule([], 10, false);
        expect(result).toStrictEqual({ success: false });
      });

      it("handles all non-fixable rules", () => {
        const ruleCounts = [
          createRuleCountInfo("rule1", 5, 10, [], {}, false),
          createRuleCountInfo("rule2", 5, 8, [], {}, false),
        ];

        const result = selectOptimalRule(ruleCounts, 15, false);

        expect(result).toStrictEqual({
          selection: { ruleId: "rule1", type: "full" },
          success: true,
        });
      });

      it("handles all fixable rules", () => {
        const ruleCounts = [
          createRuleCountInfo("rule1", 5, 8, [], {}, true),
          createRuleCountInfo("rule2", 5, 12, [], {}, true),
        ];

        const result = selectOptimalRule(ruleCounts, 15, false);

        expect(result).toStrictEqual({
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        });
      });
    });
  });
});
