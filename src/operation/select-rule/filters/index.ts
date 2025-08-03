import type { RuleViolationInfo } from "..";
import type { Config } from "../../../config/config";
import type {
  ViolationFilteringStrategy,
  ViolationFilteringStrategyContext,
} from "./types";

import { resolveModules } from "../../../utils/module-graph";
import { applyTransforms } from "../../../utils/transform";
import { ImportGraphBasedStrategy } from "./import-graph";
import { IncludeExcludeFilter } from "./include-exclude";

export const applyViolationFilters = async (
  infos: RuleViolationInfo[],
  config: Config,
): Promise<RuleViolationInfo[]> => {
  const strategies: ViolationFilteringStrategy[] = [new IncludeExcludeFilter()];
  if (config.correct.strategy.type === "import-graph") {
    const resolvedModules = await resolveModules(
      config.correct.strategy.entrypoints,
      {
        baseDir: config.root,
      },
    );
    if (resolvedModules.error == null) {
      strategies.unshift(
        new ImportGraphBasedStrategy({
          reachableFiles: new Set(resolvedModules.modules.map((m) => m.source)),
        }),
      );
    }
  }

  const result: RuleViolationInfo[] = [];

  for (const info of infos) {
    const transformed = await applyTransforms<
      RuleViolationInfo,
      ViolationFilteringStrategyContext
    >(info, strategies, { context: { config } });

    if (transformed.error != null) {
      // Log the error but continue processing other violations
      console.warn(
        `Filter error for rule ${info.meta.ruleId}: ${transformed.error.message}`,
      );
      // Use original info as fallback when filtering fails
      result.push(info);
      continue;
    }

    if (Object.keys(transformed.data.violations).length === 0) {
      // drop if all violations were wiped out
      continue;
    }

    result.push(transformed.data);
  }

  return result;
};
