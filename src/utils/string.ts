/**
 * Escape special characters in glob pattern.
 */
export const escapeGlobCharacters = (glob: string): string => {
  return glob
    .replaceAll("\\", "\\\\")
    .replaceAll("*", String.raw`\*`)
    .replaceAll("?", String.raw`\?`)
    .replaceAll("[", String.raw`\[`)
    .replaceAll("]", String.raw`\]`)
    .replaceAll("{", String.raw`\{`)
    .replaceAll("}", String.raw`\}`)
    .replaceAll(")", String.raw`\)`)
    .replaceAll("(", String.raw`\(`)
    .replaceAll("!", String.raw`\!`);
};

/**
 * Check if the ruleId is a non-empty string.
 */
export const isNonEmptyString = (maybeString?: unknown): maybeString is string => {
  return typeof maybeString === "string" && maybeString !== "";
};
