import type { Config } from "../../../config/config";
import type { MaybePromise } from "../../../utils/types";
import type { RuleViolationInfo } from "../index";

/**
 * @package
 */
export type ViolationFilteringStrategy = {
  name: string;
  run: (
    info: RuleViolationInfo,
    context: ViolationFilteringStrategyContext,
  ) => MaybePromise<RuleViolationInfo>;
};

/**
 * @package
 */
export type ViolationFilteringStrategyContext = {
  config: Config;
};
