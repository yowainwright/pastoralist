import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "*.js",
      "page/*",
      "src/index.ts",
      "tests/scripts.test.ts",
    ],
  },
  eslintPluginPrettierRecommended,
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
