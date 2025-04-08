import type { Linter } from "eslint";

import type { FlatConfigItem, Payload } from "./resolve";

import { readFlatConfig } from "./resolve";

export interface ESLintConfig {
  configs: FlatConfigItem[];
  dependencies: string[];
  payload: Payload;
}

export interface ESLintConfigSubset {
  rules: Record<
    string,
    {
      fixable: boolean;
    }
  >;
}

/**
 * Read the ESLint config subset.
 * @param root
 * Root directory of the project.
 */
export const readESLintConfig = async (root: string): Promise<ESLintConfig> => {
  return readFlatConfig(root);
};

export const createESLintConfigSubset = (
  config: ESLintConfig,
): ESLintConfigSubset => {
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

export type RuleSeverity = Extract<
  Linter.RuleSeverity,
  "error" | "off" | "warn"
>;
