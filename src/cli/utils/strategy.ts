import type { CommandContext } from "gunshi";

import type { CorrectModeUserConfig } from "../../config/config";
import type { correctModeArguments } from "../commands/common-arguments";

export const buildStrategyFromCLI = (
  context: CommandContext<{
    args: typeof correctModeArguments;
    extensions: Record<never, never>;
  }>,
): CorrectModeUserConfig["strategy"] => {
  switch (context.values["correct.strategy.type"]) {
    case "import-graph": {
      return {
        entrypoints: context.values["correct.strategy.entrypoints"] ?? [],
        type: "import-graph",
      };
    }
    case "normal": {
      return { type: "normal" };
    }
    default: {
      return undefined;
    }
  }
};
