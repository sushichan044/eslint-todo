import type { Config } from "../../../config/config";
import type { MaybePromise } from "../../../utils/types";
import type { RuleViolationInfo } from "../index";

export type ViolationFilteringStrategy = (
  info: RuleViolationInfo,
  config: Config,
) => MaybePromise<RuleViolationInfo>;
