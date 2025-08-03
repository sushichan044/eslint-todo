import picomatch from "picomatch";

import type { RuleViolationInfo } from "../index";
import type {
  IViolationFilteringStrategy,
  ViolationFilteringStrategyContext,
} from "./types";

import { pick } from "../../../utils/object";

export class IncludeExcludeFilter implements IViolationFilteringStrategy {
  public readonly name = "include-exclude";

  readonly #context: ViolationFilteringStrategyContext;
  #excludeFilePattern: RegExp[] = [];
  #includeFilePattern: RegExp[] = [];

  constructor(context: ViolationFilteringStrategyContext) {
    this.#context = context;
  }

  precompile(): void {
    this.#excludeFilePattern = picomatch
      .parse(this.#context.config.correct.exclude.files)
      .map((p) => picomatch.compileRe(p));

    this.#includeFilePattern = picomatch
      .parse(this.#context.config.correct.include.files)
      .map((p) => picomatch.compileRe(p));
  }

  run(info: RuleViolationInfo): RuleViolationInfo {
    const {
      correct: {
        autoFixableOnly,
        exclude: { rules: excludedRules },
        include: { rules: includedRules },
      },
    } = this.#context.config;

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
    if (this.#excludeFilePattern.length > 0) {
      filteredFiles = filteredFiles.filter((file) => {
        for (const pattern of this.#excludeFilePattern) {
          if (pattern.test(file)) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply include.files filtering
    if (this.#includeFilePattern.length > 0) {
      filteredFiles = filteredFiles.filter((file) => {
        for (const pattern of this.#includeFilePattern) {
          if (pattern.test(file)) {
            return true;
          }
        }
        return false;
      });
    }

    return {
      meta: info.meta,
      violations: pick(info.violations, filteredFiles),
    };
  }
}
