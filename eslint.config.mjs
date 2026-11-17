import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    ".*/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    ".wrangler/**",
    ".astro/**",
    ".release-*/**",
    ".payment-*/**",
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
      "no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
