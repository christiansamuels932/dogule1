// Simple hash-based router for Dogule1
/* globals window, document, fetch, console, DOMParser */

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

const LAYOUT_URL = "../../modules/shared/layout.html";
let layoutMain = null;
let layoutPromise = null;

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
  const layoutContainer = await ensureLayout();
  const container = layoutContainer || document.getElementById("dogule-main");
  if (!container) {
    console.error("Router error: #dogule-main not found in layout.");
    return;
  }

  try {
    const mod = await import(`/modules/${route}/index.js`);
    if (typeof mod.initModule !== "function") {
      throw new Error(`Module "${route}" missing export initModule(container)`);
    }
    await mod.initModule(container, routeInfo);
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
window.addEventListener("DOMContentLoaded", handleNavigation);

async function ensureLayout() {
  if (layoutMain) return layoutMain;
  if (!layoutPromise) {
    layoutPromise = mountLayout();
  }
  return layoutPromise;
}

async function mountLayout() {
  try {
    const response = await fetch(LAYOUT_URL);
    if (!response.ok) {
      throw new Error(`Failed to load layout: ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const layoutDoc = parser.parseFromString(html, "text/html");

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
