import prettier from "@virtual-live-lab/prettier-config";

/**
 * @type {import("prettier").Config}
 */
export default {
  ...prettier,
  plugins: [...(prettier.plugins ?? []), "@prettier/plugin-oxc"],
};
