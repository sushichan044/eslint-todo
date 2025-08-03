import type { Config } from "../../../config/config";
import type { MaybePromise } from "../../../utils/types";
import type { RuleViolationInfo } from "../index";

/**
 * @package
 */
export interface IViolationFilteringStrategy {
  name: string;
  precompile?: () => MaybePromise<void>;
  run: (info: RuleViolationInfo) => MaybePromise<RuleViolationInfo>;
}

/**
 * @package
 */
export type ViolationFilteringStrategyContext = {
  config: Config;
};
