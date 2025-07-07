export type MaybePromise<T> = Promise<T> | T;

export type MaybePromisifyAllMethods<T> = {
  [K in keyof T]: T[K] extends (...arguments_: infer A) => infer R
    ? R extends PromiseLike<unknown>
      ? (...arguments_: A) => R
      : (...arguments_: A) => MaybePromise<R>
    : T[K];
};

export type IsNever<T> = T[] extends never[] ? true : false;

/**
 * Makes all properties in T required recursively.
 */
export type DeepRequired<T> = T extends readonly unknown[]
  ? T
  : T extends Record<PropertyKey, unknown>
    ? {
        [K in keyof T]-?: DeepRequired<T[K]>;
      }
    : T;
