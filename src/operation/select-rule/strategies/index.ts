import type { CorrectModeConfig } from "../../../config/config";
import type { CandidateCollectionStrategy } from "./types";

import { importGraphBasedStrategy } from "./import-graph";

export function createCandidateCollectionStrategy(
  config: CorrectModeConfig,
): CandidateCollectionStrategy {
  switch (config.strategy.type) {
    case "import-graph": {
      return importGraphBasedStrategy;
    }
    case "normal": {
      return (v) => v; // no additional filtering
    }
    default: {
      // Exhaustive check
      throw new Error(
        `Unknown strategy type: ${JSON.stringify(config.strategy satisfies never)}`,
      );
    }
  }
}
