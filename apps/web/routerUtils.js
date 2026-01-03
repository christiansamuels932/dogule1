export const VALID_MODULES = new Set([
  "auth",
  "dashboard",
  "kommunikation",
  "kurse",
  "kunden",
  "hunde",
  "kalender",
  "trainer",
  "finanzen",
  "waren",
]);

export const DEFAULT_MODULE = "dashboard";

export function parseHash(rawHash = "") {
  const info = getRouteInfoFromHash(rawHash);
  return { route: info.module, segments: info.segments };
}

export function getRouteInfoFromHash(rawHash = "") {
  const raw = rawHash.replace(/^#\/?/, "").trim().toLowerCase();
  const segments = raw ? raw.split("/").filter(Boolean) : [];
  const moduleSlug = segments[0] || DEFAULT_MODULE;
  const route = VALID_MODULES.has(moduleSlug) ? moduleSlug : DEFAULT_MODULE;
  const params = route === moduleSlug ? segments.slice(1) : [];
  return {
    module: route,
    segments: params,
    raw,
  };
}
