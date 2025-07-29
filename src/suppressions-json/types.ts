/**
 * Represents the ESLint suppressions JSON format.
 *
 * @see {@link https://eslint.org/blog/2025/04/introducing-bulk-suppressions}
 *
 * @see {@link https://eslint.org/docs/v9.x/use/suppressions}
 */
export interface ESLintSuppressionsJson {
  [filePath: string]: {
    [ruleId: string]: {
      count: number;
    };
  };
}

/**
 * Represents the rule-based representation of suppressions for internal use.
 *
 * This format makes it easier to work with suppressions by rule ID.
 *
 * @internal
 */
export interface InternalRuleBasedSuppressionsJson {
  [ruleId: string]: {
    [filePath: string]: {
      count: number;
    };
  };
}
