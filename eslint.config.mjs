import js from "@eslint/js";

export default [
  {
    ignores: [
      ".NAS-Distro/**",
      "dist/**",
      "exports/**",
      "dogule1-alpha/**",
      "storage_candidate/**",
      "storage_reports/**",
      "worktrees/**",
    ],
  },
  js.configs.recommended,
  {
    ignores: [
      ".NAS-Distro/**",
      "node_modules/**",
      "dist/**",
      "exports/**",
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
        console: "readonly",
        module: "writable",
        process: "readonly",
        require: "readonly",
        __dirname: "readonly",
      },
    },
  },
];
