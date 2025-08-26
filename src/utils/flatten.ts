type PlainObjectLike = Record<PropertyKey, unknown>;

type AnyFunction = (...arguments_: never) => unknown;

export type FlattenObject<T> = T extends readonly unknown[]
  ? T
  : T extends AnyFunction
    ? T
    : T extends PlainObjectLike
      ? {
          [K in FlattenKeys<T>]: K extends `${infer P}.${infer S}`
            ? P extends keyof T & string
              ? T[P] extends AnyFunction | readonly unknown[]
                ? T[P]
                : T[P] extends PlainObjectLike
                  ? S extends keyof FlattenObject<T[P]>
                    ? FlattenObject<T[P]>[S]
                    : never
                  : never
              : never
            : K extends keyof T & string
              ? T[K]
              : never;
        }
      : never;

type FlattenKeys<T> = T extends PlainObjectLike
  ? {
      [K in Extract<keyof T, string>]: T[K] extends readonly unknown[]
        ? K
        : T[K] extends AnyFunction
          ? K
          : T[K] extends PlainObjectLike
            ? `${K}.${FlattenKeys<T[K]>}`
            : K;
    }[Extract<keyof T, string>]
  : never;
