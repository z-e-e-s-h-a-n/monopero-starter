// This configuration only applies to the package manager root.
/** @type {import("eslint").Linter.Config} */
const config = {
  ignorePatterns: ["apps/**", "packages/**", "server/**"],
  extends: ["@workspace/config/eslint/base"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
};

export default config;
