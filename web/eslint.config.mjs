import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
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
  // Disable no-explicit-any for next.config.ts (configuration file with complex type inference)
  // This file has legitimate uses of 'any' due to Next.js config types and dynamic env access
  // IMPORTANT: Put this LAST in the array so it overrides rules from nextTs
  {
    files: ["next.config.ts", "**/next.config.ts", "./next.config.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
