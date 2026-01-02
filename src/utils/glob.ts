import { normalize } from "pathe";
import picomatch from "picomatch";

/**
 * Extract file paths that match any of the given glob patterns.
 * @param filePaths - Array of file paths
 * @param patterns - Array of glob patterns
 * @returns Array of file paths that match any of the given glob patterns
 */
export const extractPathsByGlobs = (filePaths: string[], patterns: string[]): string[] => {
  if (patterns.length === 0) {
    return filePaths; // No patterns means return all file paths
  }

  return filePaths.filter((filePath) => pathMatchesGlobs(filePath, patterns));
};

/**
 * Check if a file path matches any of the given glob patterns.
 * @param filePath - The file path to check
 * @param patterns - Array of glob patterns
 * @returns true if the file matches any pattern, false otherwise
 *
 * @package
 */
export const pathMatchesGlobs = (filePath: string, patterns: string[]): boolean => {
  if (patterns.length === 0) {
    return true; // No patterns means include all files
  }

  const matchFunction = picomatch(patterns, {
    // Normalize paths
    format: (input: string) => normalize(input),
  });

  return matchFunction(filePath);
};
