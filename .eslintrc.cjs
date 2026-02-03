module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module", project: "./tsconfig.eslint.json" },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  overrides: [
    {
      files: ["*.cjs", "*.config.js"],
      parser: "espree",
      parserOptions: { ecmaVersion: 2022 },
      extends: ["eslint:recommended"],
    },
    {
      files: ["src/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      },
    },
  ],
  ignorePatterns: ["dist", "node_modules"],
};