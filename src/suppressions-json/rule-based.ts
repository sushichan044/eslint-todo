import type { ESLintSuppressionsJson, InternalRuleBasedSuppressionsJson } from "./types";

/**
 * Convert from the official ESLint suppressions JSON format to rule-based format.
 * This makes it easier to work with suppressions by rule ID.
 *
 * @param json The official ESLint suppressions JSON
 * @returns Rule-based representation of the suppressions
 */
export function toRuleBasedSuppression(
  json: ESLintSuppressionsJson,
): InternalRuleBasedSuppressionsJson {
  const ruleBased: InternalRuleBasedSuppressionsJson = {};

  for (const [filePath, rules] of Object.entries(json)) {
    for (const [ruleId, { count }] of Object.entries(rules)) {
      ruleBased[ruleId] ??= {};

      if (Object.hasOwn(ruleBased[ruleId], filePath)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ruleBased[ruleId][filePath]!.count += count;
        continue;
      }

      ruleBased[ruleId][filePath] = { count };
    }
  }

  return ruleBased;
}

/**
 * Convert from rule-based format to the official ESLint suppressions JSON format.
 *
 * @param ruleBased Rule-based representation of the suppressions
 * @returns The official ESLint suppressions JSON
 */
export function toESLintSuppressionsJson(
  ruleBased: InternalRuleBasedSuppressionsJson,
): ESLintSuppressionsJson {
  const result: ESLintSuppressionsJson = {};

  for (const [ruleId, files] of Object.entries(ruleBased)) {
    for (const [filePath, { count }] of Object.entries(files)) {
      result[filePath] ??= {};

      if (Object.hasOwn(result[filePath], ruleId)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result[filePath][ruleId]!.count += count;
        continue;
      }

      result[filePath][ruleId] = { count };
    }
  }

  return result;
}
