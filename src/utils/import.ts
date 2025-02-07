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
