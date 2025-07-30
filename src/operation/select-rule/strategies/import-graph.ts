import type { CorrectModeConfig } from "../../../config/config";
import type { RuleViolationInfo } from "../index";
import type { CandidateCollectionStrategy } from "./types";

import { resolveModules } from "../../../utils/module-graph";
import { pick } from "../../../utils/object";

export const importGraphBasedStrategy: CandidateCollectionStrategy = async (
  violations: RuleViolationInfo[],
  config: CorrectModeConfig,
): Promise<RuleViolationInfo[]> => {
  if (config.strategy?.type !== "import-graph") {
    return violations;
  }

  const { entrypoints } = config.strategy;

  // 1. Build module graph
  const moduleResult = await resolveModules(entrypoints);
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
