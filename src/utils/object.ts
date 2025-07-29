export const pick = <T extends Record<PropertyKey, unknown>, K extends keyof T>(
  object: T,
  keys: K[],
): Pick<T, K> => {
  return Object.fromEntries(
    keys
      .filter((key) => Object.hasOwn(object, key))
      .map((key) => [key, object[key]]),
  ) as Pick<T, K>;
};
