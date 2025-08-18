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

    await this.#resolveEntrypointsAndUpdateReachableFiles();
    return;
  }

  async run(info: RuleViolationInfo): Promise<RuleViolationInfo> {
    if (this.#context.config.correct.strategy.type !== "import-graph") {
      return info;
    }

    // Generate module graph if not cached
    if (this.#reachableFiles.size === 0) {
      const ok = await this.#resolveEntrypointsAndUpdateReachableFiles();
      if (!ok) return info;
    }

    return {
      meta: info.meta,
      violations: pick(info.violations, [...this.#reachableFiles]),
    };
  }

  /**
   * Resolve configured entrypoints and update reachable files cache
   * @returns whether resolution succeeded
   */
  async #resolveEntrypointsAndUpdateReachableFiles(): Promise<boolean> {
    const strategy = this.#context.config.correct.strategy;
    if (strategy.type !== "import-graph") return false;

    const moduleResult = await resolveModules(strategy.entrypoints, {
      baseDir: this.#context.config.root,
    });
    if (moduleResult.error !== null) {
      return false;
    }

    this.#reachableFiles = new Set(
      moduleResult.modules.map((moduleItem) => moduleItem.source),
    );
    return true;
  }
}
