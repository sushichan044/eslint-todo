export type JSONValue =
  | JSONPrimitive
  | { readonly [key: string]: JSONValue }
  | readonly JSONValue[];

type JSONPrimitive = boolean | number | string | null;
