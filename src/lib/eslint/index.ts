import type { ESLintConfig } from "@eslint/config-inspector/monkey-patch";
import type { Linter } from "eslint";

import { readConfig } from "@eslint/config-inspector/monkey-patch";

/**
 * Read the ESLint config with rule metadata.
 * @param root
 * Root directory of the project.
 * @returns
 * ESLint config with rule metadata.
 */
export const readESLintConfigWithMeta = async (
  root: string,
): Promise<ESLintConfig> => {
  return readConfig({
    chdir: true,
    cwd: root,
    globMatchedFiles: true,
  });
};

export type RuleSeverity = Extract<
  Linter.RuleSeverity,
  "error" | "off" | "warn"
>;
