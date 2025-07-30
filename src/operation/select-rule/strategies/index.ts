import type { Config } from "../../../config/config";
import type { CandidateCollectionStrategy } from "./types";

import { importGraphBasedStrategy } from "./import-graph";

export function createCandidateCollectionStrategy(
  config: Config,
): CandidateCollectionStrategy {
  switch (config.correct.strategy.type) {
    case "import-graph": {
      return importGraphBasedStrategy;
    }
    case "normal": {
      return (v) =>
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        v.map(({ originalViolations, selectableViolations: _, ...rest }) => ({
          ...rest,
          originalViolations,
          selectableViolations: originalViolations, // All violations are selectable
        }));
    }
    default: {
      // Exhaustive check
      throw new Error(
        `Unknown strategy type: ${JSON.stringify(
          config.correct.strategy satisfies never,
        )}`,
      );
    }
  }
}
