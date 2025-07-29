export const pick = <T extends Record<PropertyKey, unknown>, K extends keyof T>(
  object: T,
  keys: K[],
): Pick<T, K> => {
  // eslint-disable-next-line unicorn/no-array-reduce
  return keys.reduce(
    (accumulator, key) => {
      if (Object.hasOwn(object, key)) {
        accumulator[key] = object[key];
      }
      return accumulator;
    },
    {} as Pick<T, K>,
  );
};
