import path from "node:path";

export function resolvePaths(options = {}) {
  const root = options.root || "/storage/v1";
  return {
    root,
    entityDir(entity) {
      return path.join(root, entity);
    },
    dataFile(entity, id) {
      return path.join(root, entity, `${id}.json`);
    },
    auditDir() {
      return path.join(root, "_audit");
    },
    auditFile(entity) {
      return path.join(root, "_audit", `${entity}.jsonl`);
    },
    manifestDir() {
      return path.join(root, "_manifests");
    },
    manifestFile(entity) {
      return path.join(root, "_manifests", `${entity}.json`);
    },
  };
}
