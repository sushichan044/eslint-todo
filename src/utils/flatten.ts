type PlainObjectLike = Record<PropertyKey, unknown>;

export type FlattenObject<T> = T extends PlainObjectLike
  ? {
      [K in FlattenKeys<T>]: K extends `${infer P}.${infer S}`
        ? P extends keyof T & string
          ? T[P] extends PlainObjectLike
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
      [K in keyof T & string]: T[K] extends readonly unknown[]
        ? K
        : T[K] extends PlainObjectLike
          ? `${K}.${FlattenKeys<T[K]>}`
          : K;
    }[keyof T & string]
  : never;
