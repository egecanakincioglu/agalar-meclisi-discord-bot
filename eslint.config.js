import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    ignores: ["dist/**", "node_modules/**", "data/**", "config/**", "drizzle.config.ts"],
  },

  ...tseslint.configs["flat/recommended"],

  {
    files: ["src/**/*.ts"],
    ...tseslint.configs["flat/recommended-type-checked"]?.[0],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-empty-object-type": "off",

      "no-console": "off",
      "no-unused-vars": "off",
      "prefer-const": "warn",
      "no-var": "error",

      semi: ["warn", "always"],
      quotes: ["warn", "double", { avoidEscape: true }],
      "comma-dangle": ["warn", "always-multiline"],
      "eol-last": ["warn", "always"],
      "no-multiple-empty-lines": ["warn", { max: 1 }],
      "no-trailing-spaces": "warn",
    },
  },

  {
    files: ["*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
];
