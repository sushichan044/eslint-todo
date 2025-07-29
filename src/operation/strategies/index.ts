import type { CorrectModeConfig } from "../../config/config";
import type { CandidateCollectionStrategy } from "./types";

export function createCandidateCollectionStrategy(
  config: CorrectModeConfig,
): CandidateCollectionStrategy {
  switch (config.strategy.type) {
    case "normal": {
      return (v) => v; // no additional filtering
    }
    case "import-graph": {
      throw new Error("Import graph strategy not yet implemented");
    }
    default: {
      // Exhaustive check
      throw new Error(
        `Unknown strategy type: ${JSON.stringify(config.strategy satisfies never)}`,
      );
    }
  }
}
