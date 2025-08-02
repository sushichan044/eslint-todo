import type { Config } from "../../../config/config";
import type { RuleViolationInfo } from "../index";
import type { ViolationFilteringStrategy } from "./types";

import { resolveModules } from "../../../utils/module-graph";
import { pick } from "../../../utils/object";

export const importGraphBasedStrategy: ViolationFilteringStrategy = async (
  info: RuleViolationInfo,
  config: Config,
): Promise<RuleViolationInfo> => {
  if (config.correct.strategy.type !== "import-graph") {
    return info;
  }

  const { entrypoints } = config.correct.strategy;

  // 1. Build module graph
  const moduleResult = await resolveModules(entrypoints, {
    baseDir: config.root,
  });
  if (moduleResult.error != null) {
    console.warn(`Module resolution failed: ${moduleResult.error}`);
    return info;
  }

  const reachableFiles = new Set(moduleResult.modules.map((m) => m.source));

  return {
    meta: info.meta,
    violations: pick(info.violations, [...reachableFiles]),
  };
};
