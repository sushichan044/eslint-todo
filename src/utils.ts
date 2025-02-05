type MaybePromise<T> = Promise<T> | T;

// ref: https://github.com/antfu/eslint-config/blob/9a2a48bcda2e9ed026a9031924f8f6eae4af6728/src/utils.ts#L110-L113
export const interopDefault = async <T>(
  m: MaybePromise<T>
): Promise<T extends { default: infer U } ? U : T> => {
  const resolved = await m;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/strict-boolean-expressions
  return (resolved as any).default || resolved;
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
