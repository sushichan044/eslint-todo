import type { RuleViolationInfo } from "../index";
import type {
  IViolationFilteringStrategy,
  ViolationFilteringStrategyContext,
} from "./types";

import { resolveModules } from "../../../utils/module-graph";
import { pick } from "../../../utils/object";

export class ImportGraphBasedStrategy implements IViolationFilteringStrategy {
  public readonly name = "import-graph";

  readonly #context: ViolationFilteringStrategyContext;
  #reachableFiles: Set<string>;

  constructor(context: ViolationFilteringStrategyContext) {
    this.#context = context;
    this.#reachableFiles = new Set();
  }

  async precompile(): Promise<void> {
    if (this.#context.config.correct.strategy.type !== "import-graph") {
      return;
    }

    const { entrypoints } = this.#context.config.correct.strategy;
    const moduleResult = await resolveModules(entrypoints, {
      baseDir: this.#context.config.root,
    });
    if (moduleResult.error != null) {
      return;
    }

    this.#reachableFiles = new Set(moduleResult.modules.map((m) => m.source));
    return;
  }

  async run(info: RuleViolationInfo): Promise<RuleViolationInfo> {
    if (this.#context.config.correct.strategy.type !== "import-graph") {
      return info;
    }

    // Generate module graph if not cached
    if (this.#reachableFiles.size === 0) {
      const { entrypoints } = this.#context.config.correct.strategy;
      const moduleResult = await resolveModules(entrypoints, {
        baseDir: this.#context.config.root,
      });
      if (moduleResult.error != null) {
        return info;
      }

      this.#reachableFiles = new Set(moduleResult.modules.map((m) => m.source));
    }

    return {
      meta: info.meta,
      violations: pick(info.violations, [...this.#reachableFiles]),
    };
  }
}
