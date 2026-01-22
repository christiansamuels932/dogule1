// Simple hash-based router for Dogule1
/* globals window, document, console, DOMParser, requestAnimationFrame, fetch, AbortController, performance */
import "../../modules/shared/shared.css";
import "../../modules/shared/layout.css";
import fontanasLogoUrl from "./assets/fontanas-logo.png";
import layoutHtml from "../../modules/shared/layout.html?raw";
import templatesHtml from "../../modules/shared/components/templates.html?raw";
import { runIntegrityCheck } from "../../modules/shared/api/db/integrityCheck.js";
import {
  getSession,
  clearSession,
  syncWindowAuth,
  getAllowedNavModules,
  getDefaultModuleForRole,
  getAuthHeaders,
} from "../../modules/shared/auth/client.js";
import { isModuleAllowed, normalizeRole } from "../../modules/shared/auth/rbac.js";

import { getRouteInfoFromHash } from "./routerUtils.js";

const moduleLoaders = import.meta.glob("../../modules/*/index.js", { eager: false });
const TEMPLATE_HOST_ID = "dogule-shared-templates";
const INTEGRITY_FLAG = "__DOGULE_INTEGRITY_CHECK_DONE__";
const STATUS_ENDPOINT = "/healthz";
const STATUS_CHECK_INTERVAL_MS = 15000;
const STATUS_CHECK_TIMEOUT_MS = 3500;
const STATUS_SLOW_THRESHOLD_MS = 1200;
let layoutMain = null;
let layoutPromise = null;
let templatesPromise = null;
let statusIntervalId = null;
let statusRequestActive = false;

function ensureIntegrityOnce() {
  if (!import.meta?.env?.DEV) return;
  const scope = typeof globalThis !== "undefined" ? globalThis : window;
  if (scope[INTEGRITY_FLAG]) return;
  runIntegrityCheck();
  scope[INTEGRITY_FLAG] = true;
}

ensureIntegrityOnce();
installStorageProbe();

async function loadAndRender(routeInfo) {
  const route = routeInfo.module;
  const container = await resolveRenderContainer();
  if (!container) {
    console.error("Router error: #dogule-main not found in layout.");
    return;
  }
  await ensureTemplates();

  try {
    const loader = moduleLoaders[`../../modules/${route}/index.js`];
    if (!loader) {
      throw new Error(`Module loader for "${route}" not found`);
    }
    const mod = await loader();
    const entry = typeof mod.initModule === "function" ? mod.initModule : mod.default;
    if (typeof entry !== "function") {
      throw new Error(`Module "${route}" missing export initModule(container) or default export`);
    }
    const result = await entry(container, routeInfo);
    if (container && result) {
      if (result instanceof window.Node) {
        container.innerHTML = "";
        container.appendChild(result);
      } else if (typeof result === "string") {
        container.innerHTML = result;
      }
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <section class="dogule-section">
        <h1>Fehler</h1>
        <p>Konnte Modul <code>${route}</code> nicht laden.</p>
      </section>
    `;
  } finally {
    setActiveLink(route);
  }
}

function setActiveLink(route) {
  const links = document.querySelectorAll("a.nav__link[data-route]");
  links.forEach((link) => {
    const isActive = link.dataset.route === route;
    if (isActive) {
      link.classList.add("nav__link--active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("nav__link--active");
      link.removeAttribute("aria-current");
    }
  });
}

function updateNavVisibility(role) {
  const links = document.querySelectorAll("a.nav__link[data-route]");
  const allowed = getAllowedNavModules(role);
  links.forEach((link) => {
    const isAllowed = allowed.includes(link.dataset.route);
    link.hidden = !isAllowed;
    link.setAttribute("aria-hidden", isAllowed ? "false" : "true");
  });
}

async function handleLogout(session) {
  if (!session?.refreshToken) {
    clearSession();
    window.location.hash = "#/auth";
    return;
  }
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
  } catch (error) {
    console.warn("[AUTH_LOGOUT_FAILED]", error);
  } finally {
    clearSession();
    window.location.hash = "#/auth";
  }
}

function updateAuthHeader(session) {
  syncWindowAuth(session);
  const normalizedRole = normalizeRole(session?.user?.role);
  const forceMobile =
    normalizedRole === "trainer" || normalizedRole === "trainer_rapport";
  document.documentElement.classList.toggle("force-mobile", forceMobile);
  document.body.classList.toggle("force-mobile", forceMobile);
  applyForceMobileStyles(forceMobile);
  const host = document.getElementById("dogule-auth");
  if (!host) return;
  host.innerHTML = "";
  if (!session?.user) {
    const loginBtn = document.createElement("button");
    loginBtn.type = "button";
    loginBtn.className = "dogule-auth__btn";
    loginBtn.textContent = "Anmelden";
    loginBtn.addEventListener("click", () => {
      window.location.hash = "#/auth";
    });
    host.appendChild(loginBtn);
    return;
  }

  const name = document.createElement("span");
  name.className = "dogule-auth__user";
  name.textContent = session.user.username || session.user.id || "User";
  const role = document.createElement("span");
  role.className = "dogule-auth__role";
  role.textContent = session.user.role || "";
  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "dogule-auth__btn";
  logoutBtn.textContent = "Abmelden";
  logoutBtn.addEventListener("click", () => handleLogout(session));
  host.append(name, role, logoutBtn);
}

function applyForceMobileStyles(forceMobile) {
  const html = document.documentElement;
  const body = document.body;
  const headerInner = document.querySelector(".dogule-header-inner");
  const main = document.getElementById("dogule-main");
  const footer = document.querySelector(".dogule-footer");
  const clear = (el, props) => {
    if (!el) return;
    props.forEach((prop) => el.style.removeProperty(prop));
  };

  if (forceMobile) {
    html.style.setProperty("font-size", "19px");
    body.style.setProperty("font-size", "19px");
    body.style.setProperty("line-height", "1.75");
    if (headerInner) {
      headerInner.style.setProperty("max-width", "none");
      headerInner.style.setProperty("width", "100%");
      headerInner.style.setProperty("box-sizing", "border-box");
      headerInner.style.setProperty("padding", "0.75rem 0.6rem");
    }
    if (main) {
      main.style.setProperty("max-width", "none");
      main.style.setProperty("width", "100%");
      main.style.setProperty("box-sizing", "border-box");
      main.style.setProperty("padding", "1rem 0.6rem 1.5rem");
    }
    if (footer) {
      footer.style.setProperty("width", "100%");
      footer.style.setProperty("box-sizing", "border-box");
      footer.style.setProperty("padding", "0.75rem 0.6rem");
    }
  } else {
    clear(html, ["font-size"]);
    clear(body, ["font-size", "line-height"]);
    clear(headerInner, ["max-width", "width", "box-sizing", "padding"]);
    clear(main, ["max-width", "width", "box-sizing", "padding"]);
    clear(footer, ["width", "box-sizing", "padding"]);
  }
}

function installStorageProbe() {
  if (typeof window === "undefined") return;
  window.__DOGULE_STORAGE_PROBE__ = async () => {
    const session = getSession();
    if (!session?.accessToken) return;
    const res = await fetch("/api/kommunikation/infochannel/notices?limit=1", {
      method: "GET",
      headers: { ...getAuthHeaders() },
    });
    if (res.status === 401 || res.status === 403) {
      return;
    }
    if (!res.ok) {
      throw new Error(`storage_probe_failed:${res.status}`);
    }
  };
}

async function handleNavigation() {
  const hash = window.location.hash || "";
  const routeInfo = getRouteInfoFromHash(hash);
  window.__DOGULE_ROUTE__ = routeInfo;
  const session = getSession();
  const role = normalizeRole(session?.user?.role);
  updateAuthHeader(session);
  updateNavVisibility(role);

  if (!session?.user?.role && routeInfo.module !== "auth") {
    window.location.hash = "#/auth";
    return;
  }
  if (session?.user?.role && routeInfo.module !== "auth") {
    if (!isModuleAllowed(role, routeInfo.module)) {
      const fallback = getDefaultModuleForRole(role);
      window.location.hash = `#/${fallback}`;
      return;
    }
  }
  await loadAndRender(routeInfo);
}

window.addEventListener("hashchange", handleNavigation);
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", handleNavigation);
} else {
  handleNavigation();
}

async function resolveRenderContainer() {
  const layoutContainer = await ensureLayout();
  await waitForLayoutAttachment();
  const target = document.getElementById("dogule-main") || layoutContainer;
  return target;
}

async function ensureLayout() {
  if (layoutMain) return layoutMain;
  if (!layoutPromise) {
    layoutPromise = mountLayout();
  }
  return layoutPromise;
}

async function mountLayout() {
  try {
    const parser = new DOMParser();
    const layoutDoc = parser.parseFromString(layoutHtml, "text/html");
    if (!layoutDoc) {
      throw new Error("Failed to parse layout HTML");
    }

    layoutDoc.querySelectorAll("link[href]").forEach((link) => link.remove());
    adoptHeadContent(layoutDoc);

    // Station 7 – Load modules into persistent layout (header/footer stay)
    // Purpose: unify page frame and route changes without reloading or losing layout.
    applyLayoutBody(layoutDoc.body);
    hydrateBranding();
    startStatusMonitor();
    const session = getSession();
    updateAuthHeader(session);
    updateNavVisibility(normalizeRole(session?.user?.role));

    layoutMain = document.getElementById("dogule-main");
    if (!layoutMain) {
      throw new Error("Missing #dogule-main in layout");
    }
    return layoutMain;
  } catch (error) {
    console.error("DOGULE1_ROUTER_002 layout bootstrap failed", error);
    layoutPromise = null;
    return null;
  }
}

function hydrateBranding() {
  const logo = document.getElementById("dogule-logo");
  if (logo) {
    logo.src = fontanasLogoUrl;
  }
}

function startStatusMonitor() {
  if (statusIntervalId) return;
  const badge = document.getElementById("dogule-status");
  if (!badge) return;
  setStatusBadge(badge, "checking");
  const runCheck = () => checkStatus(badge);
  runCheck();
  statusIntervalId = window.setInterval(runCheck, STATUS_CHECK_INTERVAL_MS);
}

function setStatusBadge(badge, state, latencyMs, statusCode) {
  const baseClass = "dogule-status";
  const stateClass = `dogule-status--${state}`;
  badge.className = `${baseClass} ${stateClass}`;
  let text = "NAS Status";
  let detail = "";
  if (state === "ok") {
    text = "NAS OK";
    detail = typeof latencyMs === "number" ? ` · ${latencyMs} ms` : "";
  } else if (state === "slow") {
    text = "NAS langsam";
    detail = typeof latencyMs === "number" ? ` · ${latencyMs} ms` : "";
  } else if (state === "down") {
    text = "NAS offline";
    detail = statusCode ? ` · ${statusCode}` : "";
  } else if (state === "checking") {
    text = "NAS prüfen";
  }
  const label = `${text}${detail}`;
  badge.textContent = label;
  badge.setAttribute("aria-label", `NAS Status: ${label}`);
  badge.setAttribute("title", `Letzte Prüfung: ${label}`);
}

async function checkStatus(badge) {
  if (statusRequestActive) return;
  statusRequestActive = true;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), STATUS_CHECK_TIMEOUT_MS);
  const startedAt = performance.now();
  try {
    const res = await fetch(STATUS_ENDPOINT, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    const elapsed = Math.round(performance.now() - startedAt);
    if (!res.ok) {
      setStatusBadge(badge, "down", elapsed, res.status);
      return;
    }
    if (elapsed >= STATUS_SLOW_THRESHOLD_MS) {
      setStatusBadge(badge, "slow", elapsed);
      return;
    }
    setStatusBadge(badge, "ok", elapsed);
  } catch (error) {
    if (error?.name === "AbortError") {
      setStatusBadge(badge, "down", null, "timeout");
    } else {
      setStatusBadge(badge, "down");
    }
  } finally {
    window.clearTimeout(timeoutId);
    statusRequestActive = false;
  }
}

function adoptHeadContent(layoutDoc) {
  const title = layoutDoc.querySelector("title");
  if (title) {
    document.title = title.textContent || document.title;
  }

  const existingLinks = new Set(
    Array.from(document.head.querySelectorAll("link[href]")).map((link) =>
      link.getAttribute("href")
    )
  );

  layoutDoc.querySelectorAll("link[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || existingLinks.has(href)) return;
    const clone = link.cloneNode(true);
    document.head.appendChild(clone);
    existingLinks.add(href);
  });
}

function applyLayoutBody(layoutBody) {
  if (!layoutBody) return;
  document.body.className = layoutBody.className;
  document.body.id = layoutBody.id || "";
  document.body.innerHTML = layoutBody.innerHTML;
}

async function ensureTemplates() {
  if (document.getElementById(TEMPLATE_HOST_ID)) {
    return true;
  }
  if (!templatesPromise) {
    templatesPromise = loadTemplates();
  }
  return templatesPromise;
}

async function loadTemplates() {
  try {
    let host = document.getElementById(TEMPLATE_HOST_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = TEMPLATE_HOST_ID;
      host.hidden = true;
      document.body.appendChild(host);
    }
    host.innerHTML = templatesHtml;
    return true;
  } catch (error) {
    console.error("DOGULE1_TEMPLATES_FAILED", error);
    templatesPromise = null;
    return false;
  }
}

function waitForLayoutAttachment() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}
