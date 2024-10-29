import eslintPluginPrettier from "eslint-plugin-prettier"
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
	{ ignores: ["dist", "*.js", "page/*"] },
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			prettier: eslintPluginPrettier,
		},
		extends: [
			"eslint:recommended",
			"plugin:@typescript-eslint/recommended",
			"plugin:prettier/recommended",
		],
		rules: {
			"prettier/prettier": "error",
		},
	},
)
