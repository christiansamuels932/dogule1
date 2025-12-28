/* eslint-env node */
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { defineConfig } = require("vite");

const projectRoot = __dirname;

function doguleApiPlugin() {
  return {
    name: "dogule1-api",
    async configureServer(server) {
      const routerPath = pathToFileURL(
        path.resolve(projectRoot, "modules/shared/server/apiRouter.js")
      ).href;
      const { createApiRouter } = await import(routerPath);
      const router = createApiRouter();
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await router.handle(req, res);
          if (!handled) next();
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

module.exports = defineConfig({
  root: path.resolve(projectRoot, "apps/web"),
  base: "./",
  build: {
    outDir: path.resolve(projectRoot, "dist"),
    emptyOutDir: true,
  },
  plugins: [doguleApiPlugin()],
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
