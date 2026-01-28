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
      const healthPath = pathToFileURL(
        path.resolve(projectRoot, "modules/shared/server/health.js")
      ).href;
      const storagePath = pathToFileURL(
        path.resolve(projectRoot, "modules/shared/storage/storage.js")
      ).href;
      const { createApiRouter } = await import(routerPath);
      const { createHealthHandlers } = await import(healthPath);
      const { createStorage } = await import(storagePath);
      const storage = createStorage({ mode: "mariadb" });
      const router = createApiRouter({ storage });
      const healthHandlers = createHealthHandlers({
        storageUsage: async () => {
          const pool = storage?.pool;
          if (!pool?.query) return null;
          const dbName = process.env.DOGULE1_MARIADB_DATABASE || "dogule1";
          const rows = await pool.query(
            "SELECT SUM(data_length + index_length) AS bytes FROM information_schema.tables WHERE table_schema = ?",
            [dbName]
          );
          const bytesRaw = rows?.[0]?.bytes ?? 0;
          const bytes = Number(bytesRaw);
          if (!Number.isFinite(bytes)) return null;
          return Math.round((bytes / 1024 / 1024) * 10) / 10;
        },
      });
      server.middlewares.use(async (req, res, next) => {
        try {
          if ((req.url || "").startsWith("/healthz")) {
            await healthHandlers.handleHealthz(req, res);
            return;
          }
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
