import type { DeepPartial } from "./types";

import { sh } from "./command";

type HasGitChangesOptions = DeepPartial<{
  /**
   * The git diff mode.
   *
   * @default "working-and-staged"
   */
  between: "staged-and-latest-commit" | "working-and-staged";

  /**
   * The file to check the git changes.
   */
  file: string;
}>;

/**
 * Check if there are any changes in the git repository
 * @param options Options for the git command
 * @returns true if there are changes, false otherwise
 */
async function hasGitChanges(
  cwd: string,
  options: HasGitChangesOptions = {},
): Promise<boolean> {
  const { between = "working-and-staged", file = "" } = options;

  const command = ["git", "diff", "--quiet"];

  if (between === "staged-and-latest-commit") {
    command.push("--staged");
  }

  if (file !== "") {
    // git diff [OPTIONS] -- <file>
    command.push("--", file);
  }

  try {
    await sh(command, { cwd, silent: true });
    return false;
  } catch {
    return true;
  }
}

/**
 * Create a git API object for a given directory
 * @param cwd The working directory
 * @returns An object with git API methods
 */
export const initGitUtility = (cwd: string) => ({
  hasGitChanges: hasGitChanges.bind(null, cwd),
});
