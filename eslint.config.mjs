import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["node_modules/**", "dist/**", ".husky/**", "pnpm-lock.yaml"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    rules: {
      // DLX-ESLINT-BASE-001: Basiskonfiguration, später pro Modul erweiterbar.
    },
  },
];
