import type { CorrectModeConfig } from "../../config/config";
import type { MaybePromise } from "../../utils/types";
import type { RuleViolationInfo } from "../select-rule";

export type CandidateCollectionStrategy = (
  violations: RuleViolationInfo[],
  config: CorrectModeConfig,
) => MaybePromise<RuleViolationInfo[]>;
