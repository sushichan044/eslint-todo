import prettier from "@virtual-live-lab/prettier-config";

/**
 * @type {import("prettier").Config}
 */
export default {
  ...prettier,
  overrides: [
    {
      files: ["*.yaml", "*.yml"],
      options: {
        singleQuote: true,
      },
    },
  ],
};
