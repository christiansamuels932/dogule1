// Simple hash-based router for Dogule1
/* globals window, document, console, DOMParser, requestAnimationFrame */
import "../../modules/shared/shared.css";
import "../../modules/shared/layout.css";
import layoutHtml from "../../modules/shared/layout.html?raw";
import templatesHtml from "../../modules/shared/components/templates.html?raw";

// --- Simple hash router for Dogule1 Module Interfaces (Station 8) ---
const VALID_MODULES = new Set([
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

const moduleLoaders = import.meta.glob("../../modules/*/index.js", { eager: false });
const TEMPLATE_HOST_ID = "dogule-shared-templates";
let layoutMain = null;
let layoutPromise = null;
let templatesPromise = null;

function getRouteInfo() {
  const raw = (window.location.hash || "").replace(/^#\/?/, "").trim().toLowerCase();
  const segments = raw ? raw.split("/").filter(Boolean) : [];
  const moduleSlug = segments[0] || "dashboard";
  const route = VALID_MODULES.has(moduleSlug) ? moduleSlug : "dashboard";
  const params = route === moduleSlug ? segments.slice(1) : [];
  const info = { module: route, segments: params, raw };
  window.__DOGULE_ROUTE__ = info;
  return info;
}

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

async function handleNavigation() {
  const routeInfo = getRouteInfo();
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
