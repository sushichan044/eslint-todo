import type { ESLintConfig } from "@sushichan044/eslint-config-array-resolver";
import type { Linter } from "eslint";

export interface ESLintConfigSubset {
  rules: Record<
    string,
    {
      fixable: boolean;
    }
  >;
}

export const createESLintConfigSubset = (config: ESLintConfig): ESLintConfigSubset => {
  return {
    rules: Object.fromEntries(
      Object.entries(config.payload.rules).map(([ruleId, rule]) => [
        ruleId,
        { fixable: rule.fixable != null },
      ]),
    ),
  };
};

export const isRuleFixable = (config: ESLintConfigSubset, ruleId: string) => {
  return config.rules[ruleId]?.fixable ?? false;
};

export type RuleSeverity = Extract<Linter.RuleSeverity, "error" | "off" | "warn">;
