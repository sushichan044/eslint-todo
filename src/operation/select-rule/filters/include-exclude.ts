import type { RuleViolationInfo } from "../index";
import type {
  ViolationFilteringStrategy,
  ViolationFilteringStrategyContext,
} from "./types";

import { extractPathsByGlobs } from "../../../utils/glob";
import { pick } from "../../../utils/object";

export class IncludeExcludeFilter implements ViolationFilteringStrategy {
  public readonly name = "include-exclude";

  run(
    info: RuleViolationInfo,
    context: ViolationFilteringStrategyContext,
  ): RuleViolationInfo {
    const {
      correct: {
        autoFixableOnly,
        exclude: { files: excludeGlobs, rules: excludedRules },
        include: { files: includeGlobs, rules: includedRules },
      },
    } = context.config;

    // Guard clause: Check if rule is auto-fixable when required
    if (autoFixableOnly && !info.meta.isFixable) {
      return {
        meta: info.meta,
        violations: {},
      };
    }

    // Guard clause: Check if rule is excluded
    if (excludedRules.includes(info.meta.ruleId)) {
      return {
        meta: info.meta,
        violations: {},
      };
    }

    // Guard clause: Check if rule is included when include filter is specified
    if (includedRules.length > 0 && !includedRules.includes(info.meta.ruleId)) {
      return {
        meta: info.meta,
        violations: {},
      };
    }

    // Apply file filtering: first exclude files, then apply include filter
    let filteredFiles: string[] = Object.keys(info.violations);
    // Exclude files that match exclude.files patterns
    if (excludeGlobs.length > 0) {
      const excludedMatches = extractPathsByGlobs(filteredFiles, excludeGlobs);
      filteredFiles = filteredFiles.filter(
        (file) => !excludedMatches.includes(file),
      );
    }

    // Apply include.files filtering
    if (includeGlobs.length > 0) {
      filteredFiles = extractPathsByGlobs(filteredFiles, includeGlobs);
    }

    return {
      meta: info.meta,
      violations: pick(info.violations, filteredFiles),
    };
  }
}
