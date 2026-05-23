// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";

// Plugins (pure; no rushstack/eslint-patch)
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import a11yPlugin from "eslint-plugin-jsx-a11y";

// TS meta package (brings parser + plugin + flat presets)
import tseslint from "typescript-eslint";

export default [
  // Hard ignores FIRST so build outputs are never linted
  {
    ignores: [
      "**/node_modules/**",
      "**/.claude/**",
      "**/.next/**",
      "**/dist-tests/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "scripts/**"
    ]
  },

  // Base JS rules + TypeScript (non type-aware, fast)
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // App ruleset for JS/TS + React + Next + a11y
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": a11yPlugin
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true }
        // leave project:false => faster; switch to ["./tsconfig.json"] if you want type-aware linting later
      }
    },
    rules: {
      // React/Hooks/a11y/Next recommended rules
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...a11yPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,

      // Modern React (Next) doesn't require React in scope for JSX
      "react/react-in-jsx-scope": "off"
    },
    settings: {
      react: { version: "detect" }
    }
  }
];
