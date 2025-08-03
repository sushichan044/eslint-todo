import type { RuleViolationInfo } from "../index";
import type {
  ViolationFilteringStrategy,
  ViolationFilteringStrategyContext,
} from "./types";

import { resolveModules } from "../../../utils/module-graph";
import { pick } from "../../../utils/object";

type ImportGraphBasedStrategyOptions = {
  /**
   * The set of files that are reachable from the entrypoints.
   *
   * If passed, the strategy will not resolve the module graph by itself.
   *
   * @example
   * ```
   * const reachableFiles = new Set(["src/index.ts", "src/utils/index.ts"]);
   * ```
   */
  reachableFiles: Set<string>;
};

export class ImportGraphBasedStrategy implements ViolationFilteringStrategy {
  public readonly name = "import-graph";
  #reachableFiles: Set<string>;

  constructor(options: Partial<ImportGraphBasedStrategyOptions> = {}) {
    this.#reachableFiles = options.reachableFiles ?? new Set();
  }

  async run(
    info: RuleViolationInfo,
    context: ViolationFilteringStrategyContext,
  ): Promise<RuleViolationInfo> {
    if (context.config.correct.strategy.type !== "import-graph") {
      return info;
    }

    const { entrypoints } = context.config.correct.strategy;

    // 1. Build module graph
    const moduleResult = await resolveModules(entrypoints, {
      baseDir: context.config.root,
    });
    if (moduleResult.error != null) {
      console.warn(`Module resolution failed: ${moduleResult.error}`);
      return info;
    }

    if (this.#reachableFiles.size === 0) {
      this.#reachableFiles = new Set(moduleResult.modules.map((m) => m.source));
    }

    return {
      meta: info.meta,
      violations: pick(info.violations, [...this.#reachableFiles]),
    };
  }
}
