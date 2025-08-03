import type { Matcher } from "picomatch";

import { normalize } from "pathe";
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

  #matchFileIsExcluded: Matcher | undefined;
  #matchFileIsInclude: Matcher | undefined;

  constructor(context: ViolationFilteringStrategyContext) {
    this.#context = context;
  }

  precompile(): void {
    const {
      correct: {
        exclude: { files: excludeGlobs },
        include: { files: includeGlobs },
      },
    } = this.#context.config;

    if (excludeGlobs.length > 0) {
      this.#matchFileIsExcluded = picomatch(excludeGlobs, {
        format: (input: string) => normalize(input),
      });
    }
    if (includeGlobs.length > 0) {
      this.#matchFileIsInclude = picomatch(includeGlobs, {
        format: (input: string) => normalize(input),
      });
    }
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

    if (this.#matchFileIsExcluded != null) {
      filteredFiles = filteredFiles.filter(
        // this.#isExcludedFile is guaranteed by if statement above
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (file) => !this.#matchFileIsExcluded!(file),
      );
    }

    if (this.#matchFileIsInclude != null) {
      filteredFiles = filteredFiles.filter((file) =>
        // this.#isIncludedFile is guaranteed by if statement above
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.#matchFileIsInclude!(file),
      );
    }

    return {
      meta: info.meta,
      violations: pick(info.violations, filteredFiles),
    };
  }
}
