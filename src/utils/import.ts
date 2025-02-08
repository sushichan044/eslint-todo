import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, {
  interopDefault: true,
  moduleCache: false,
});

/**
 * Safely import a module and return the default export.
 * This result will be cached while the same process is running.
 * @param url
 * @returns
 */
export const importDefault = async <T>(url: string): Promise<T> => {
  return await jiti.import<T>(url, { default: true });
};
