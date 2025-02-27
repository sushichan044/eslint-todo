export type MaybePromise<T> = Promise<T> | T;

export type MaybePromisifyAllMethods<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? R extends PromiseLike<unknown>
      ? (...args: A) => R
      : (...args: A) => MaybePromise<R>
    : T[K];
};

export type IsNever<T> = T[] extends never[] ? true : false;
