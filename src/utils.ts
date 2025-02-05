import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

/**
 * Safely import a module and return the default export.
 * @param url
 * @returns
 */
export const importDefault = async <T>(url: string): Promise<T> => {
  return await jiti.import<T>(url, { default: true });
};

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
  maybeString: string | null | undefined
): maybeString is string => {
  return maybeString != null && maybeString !== "";
};
