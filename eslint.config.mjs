import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // E2E test specific rules - prevent race conditions
  {
    files: ["e2e/**/*.ts", "e2e/**/*.spec.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='waitForTimeout']",
          message:
            "Use deterministic waits (waitForData, waitForPageReady, waitForNavigation) instead of arbitrary timeouts. See e2e/helpers/deterministic-wait.ts",
        },
      ],
    },
  },
]);

export default eslintConfig;
