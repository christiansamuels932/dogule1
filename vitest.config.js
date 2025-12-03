/* eslint-env node */
const path = require("node:path");
const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      "@modules": path.resolve(__dirname, "modules"),
    },
  },
  test: {
    root: __dirname,
    include: ["apps/web/**/*.{test,spec}.{js,ts}", "modules/**/*.{test,spec}.{js,ts}"],
    environment: "happy-dom",
  },
});
