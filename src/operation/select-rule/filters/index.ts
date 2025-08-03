import type { RuleViolationInfo } from "..";
import type { Config } from "../../../config/config";
import type {
  IViolationFilteringStrategy,
  ViolationFilteringStrategyContext,
} from "./types";

import { applyTransforms } from "../../../utils/transform";
import { ImportGraphBasedStrategy } from "./import-graph";
import { IncludeExcludeFilter } from "./include-exclude";

export const applyViolationFilters = async (
  infos: RuleViolationInfo[],
  config: Config,
): Promise<RuleViolationInfo[]> => {
  const strategies: IViolationFilteringStrategy[] = [];
  if (config.correct.strategy.type === "import-graph") {
    strategies.push(new ImportGraphBasedStrategy({ config }));
  }
  strategies.push(new IncludeExcludeFilter({ config }));

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
