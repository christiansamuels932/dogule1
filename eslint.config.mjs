import js from "@eslint/js";

export default [
  {
    ignores: [
      "dist/**",
      "dogule1-alpha/**",
      "storage_candidate/**",
      "storage_reports/**",
      "worktrees/**",
    ],
  },
  js.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".husky/**",
      "pnpm-lock.yaml",
      "dogule1-alpha/**",
      "storage_candidate/**",
      "storage_reports/**",
      "worktrees/**",
    ],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    rules: {
      // DLX-ESLINT-BASE-001: Basiskonfiguration, später pro Modul erweiterbar.
    },
  },
  {
    files: ["*.cjs", "**/*.cjs", "vite.config.js", "vitest.config.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        module: "writable",
        require: "readonly",
        __dirname: "readonly",
      },
    },
  },
];
