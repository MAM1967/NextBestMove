module.exports = {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/set-state-in-effect": "warn",
    "react/no-unescaped-entities": "warn",
    "@next/next/no-html-link-for-pages": "warn",
    "prefer-const": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
  },
  ignorePatterns: ["node_modules/", ".next/", "out/", "dist/"],
};

