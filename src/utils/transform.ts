import type { MaybePromise } from "./types";

type Transform<T, C> = (data: T, context: C) => MaybePromise<T>;

type TransformResult<T> =
  | {
      data: null;
      error: Error;
    }
  | {
      data: T;
      error: null;
    };

type TransformOptions<C> = {
  context: C;
};

export async function applyTransforms<T, C>(
  data: T,
  transforms: Array<Transform<T, C>>,
  options: TransformOptions<C>,
): Promise<TransformResult<T>> {
  let result: T = data;
  let error: Error | null = null;

  for (const transform of transforms) {
    try {
      result = await transform(result, options.context);
    } catch (error_) {
      error = error_ instanceof Error ? error_ : new Error(String(error_));
    }
  }

  if (error != null) {
    return {
      data: null,
      error,
    };
  }

  return {
    data: result,
    error: null,
  };
}
