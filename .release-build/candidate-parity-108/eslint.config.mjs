import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    ".wrangler/**",
    ".astro/**",
    "next-env.d.ts",
    "**/*.css",
    "*.js",
    "*.mjs",
    "scripts/**",
    "tests/**",
    "test-results/**",
  ]),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "JSXAttribute[name.name=/className|style/] Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message:
            "Hardcoded hex color in JSX className/style. Use design tokens (var(--green), var(--yellow), var(--blue), var(--ink)). Token file: src/styles/tokens.css.",
        },
        {
          selector:
            "JSXAttribute[name.name=/className|style/] Literal[value=/rgba?\\(\\s*\\d+/]",
          message:
            "Hardcoded rgb() color in JSX. Use CSS variable tokens (var(--color-*)) instead.",
        },
        {
          selector:
            "JSXAttribute[name.name=/className|style/] Literal[value=/hsla?\\(\\s*\\d+/]",
          message:
            "Hardcoded hsl() color in JSX. Use CSS variable tokens (var(--color-*)) instead.",
        },
      ],
    },
  },
]);

export default eslintConfig;
