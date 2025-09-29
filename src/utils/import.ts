import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, {
  fsCache: false,
  interopDefault: true,
  moduleCache: false,
});

export async function importDefault<T>(id: string): Promise<T | undefined>;

export async function importDefault<T>(id: string, fallback: T): Promise<T>;

/**
 * Safely import a module and return the default export.
 * This result will be cached while the same process is running.
 * @param id - Module identifier.
 * @param fallback - Fallback value if the module is not found or failed to import.
 * @returns
 */
export async function importDefault<T>(
  id: string,
  fallback?: T,
): Promise<T | undefined> {
  return (await jiti.import<T>(id, { default: true, try: true })) ?? fallback;
}
