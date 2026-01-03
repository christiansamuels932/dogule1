// Simple hash-based router for Dogule1
/* globals window, document, console, DOMParser, requestAnimationFrame, fetch */
import "../../modules/shared/shared.css";
import "../../modules/shared/layout.css";
import layoutHtml from "../../modules/shared/layout.html?raw";
import templatesHtml from "../../modules/shared/components/templates.html?raw";
import { runIntegrityCheck } from "../../modules/shared/api/db/integrityCheck.js";
import {
  getSession,
  clearSession,
  syncWindowAuth,
  getAllowedNavModules,
  getDefaultModuleForRole,
} from "../../modules/shared/auth/client.js";
import { isModuleAllowed, normalizeRole } from "../../modules/shared/auth/rbac.js";

import { getRouteInfoFromHash } from "./routerUtils.js";

const moduleLoaders = import.meta.glob("../../modules/*/index.js", { eager: false });
const TEMPLATE_HOST_ID = "dogule-shared-templates";
const INTEGRITY_FLAG = "__DOGULE_INTEGRITY_CHECK_DONE__";
let layoutMain = null;
let layoutPromise = null;
let templatesPromise = null;

function ensureIntegrityOnce() {
  if (!import.meta?.env?.DEV) return;
  const scope = typeof globalThis !== "undefined" ? globalThis : window;
  if (scope[INTEGRITY_FLAG]) return;
  runIntegrityCheck();
  scope[INTEGRITY_FLAG] = true;
}

ensureIntegrityOnce();

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
