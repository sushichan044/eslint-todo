import type { MaybePromise } from "./types";

type Transform<T, C> = {
  precompile?: (context: C) => MaybePromise<void>;
  run: (data: T, context: C) => MaybePromise<T>;
};

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

  // Precompile all transformers
  await Promise.all(
    transforms.map(async (transform) => {
      try {
        await transform.precompile?.(options.context);
      } catch (error_) {
        error = error_ instanceof Error ? error_ : new Error(String(error_));
      }
    }),
  );

  // Run all transformers
  for (const transform of transforms) {
    try {
      result = await transform.run(result, options.context);
    } catch (error_) {
      // abort immediately on error
      error = error_ instanceof Error ? error_ : new Error(String(error_));
      break;
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
