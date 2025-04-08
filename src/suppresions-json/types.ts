type ESLintSuppressedRule = {
  count: number;
};

type ESLintSuppression = {
  [ruleId: string]: ESLintSuppressedRule;
};

/**
 * Represents the ESLint suppressions JSON format.
 *
 * @see {@link https://eslint.org/blog/2025/04/introducing-bulk-suppressions}
 *
 * @see {@link https://eslint.org/docs/v9.x/use/suppressions}
 */
export interface ESLintSuppressionsJson {
  [filePath: string]: ESLintSuppression;
}
