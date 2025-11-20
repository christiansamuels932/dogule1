/* eslint-env node */
const path = require("node:path");
const { defineConfig } = require("vite");

const projectRoot = __dirname;

module.exports = defineConfig({
  root: path.resolve(projectRoot, "apps/web"),
  base: "./",
  build: {
    outDir: path.resolve(projectRoot, "dist"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      allow: [projectRoot],
    },
  },
  resolve: {
    alias: {
      "@modules": path.resolve(projectRoot, "modules"),
    },
  },
});
