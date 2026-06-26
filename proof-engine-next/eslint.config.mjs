import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // French UI copy is full of apostrophes; escaping them in JSX hurts readability.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    // Hydrating client-only state (localStorage, viewport) after mount is the
    // intended pattern here and avoids SSR hydration mismatches.
    files: ["src/hooks/use-mobile.ts", "src/components/i18n/language-provider.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
