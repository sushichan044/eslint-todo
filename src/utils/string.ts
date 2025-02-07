/**
 * Escape special characters in glob pattern.
 */
export const escapeGlobCharacters = (glob: string): string => {
  return glob
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/\?/g, "\\?")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\)/g, "\\)")
    .replace(/\(/g, "\\(")
    .replace(/\!/g, "\\!");
};

/**
 * Check if the ruleId is a non-empty string.
 */
export const isNonEmptyString = (
  maybeString: string | null | undefined,
): maybeString is string => {
  return maybeString != null && maybeString !== "";
};
