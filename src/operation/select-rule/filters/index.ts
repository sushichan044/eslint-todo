import type { RuleViolationInfo } from "..";
import type { Config } from "../../../config/config";
import type { ViolationFilteringStrategy } from "./types";

import { applyTransforms } from "../../../utils/transform";
import { importGraphBasedStrategy } from "./import-graph";
import { includeExcludeFilter } from "./include-exclude";

const getViolationFilterStrategies = (
  config: Config,
): ViolationFilteringStrategy[] => {
  const filters: ViolationFilteringStrategy[] = [];

  if (config.correct.strategy.type === "import-graph") {
    filters.push(importGraphBasedStrategy);
  }

  // this should be the last filter
  filters.push(includeExcludeFilter);

  return filters;
};

export const applyViolationFilters = async (
  infos: RuleViolationInfo[],
  config: Config,
): Promise<RuleViolationInfo[]> => {
  const strategies = getViolationFilterStrategies(config);

  const result: RuleViolationInfo[] = [];

  for (const info of infos) {
    const transformed = await applyTransforms<RuleViolationInfo, Config>(
      info,
      strategies,
      { context: config },
    );

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
