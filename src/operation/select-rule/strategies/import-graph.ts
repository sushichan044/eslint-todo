import type { Config, CorrectModeConfig } from "../../../config/config";
import type { RuleViolationInfo } from "../index";
import type { CandidateCollectionStrategy } from "./types";

import { resolveModules } from "../../../utils/module-graph";
import { pick } from "../../../utils/object";

export const importGraphBasedStrategy: CandidateCollectionStrategy = async (
  violations: RuleViolationInfo[],
  config: Config,
): Promise<RuleViolationInfo[]> => {
  if (config.correct.strategy.type !== "import-graph") {
    return violations;
  }

  const { entrypoints } = config.correct.strategy;

  // 1. Build module graph
  const moduleResult = await resolveModules(entrypoints, {
    baseDir: config.root,
  });
  if (moduleResult.error != null) {
    console.warn(`Module resolution failed: ${moduleResult.error}`);
    return violations;
  }

  const reachableFiles = new Set(moduleResult.modules.map((m) => m.source));

  return violations.map(
    ({ originalViolations, selectableViolations: _, ...rest }) => {
      return {
        ...rest,
        originalViolations,
        selectableViolations: pick(originalViolations, [...reachableFiles]),
      };
    },
  );
};
