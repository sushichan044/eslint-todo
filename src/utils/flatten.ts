export type FlattenObject<T> = {
  [K in FlattenKeys<T>]: K extends `${infer P}.${infer S}`
    ? P extends keyof T
      ? T[P] extends Record<PropertyKey, unknown>
        ? S extends keyof FlattenObject<T[P]>
          ? FlattenObject<T[P]>[S]
          : never
        : never
      : never
    : K extends keyof T
      ? T[K]
      : never;
};

type FlattenKeys<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends readonly unknown[]
    ? K
    : T[K] extends Record<PropertyKey, unknown>
      ? `${K}.${FlattenKeys<T[K]>}`
      : K
  : never;
