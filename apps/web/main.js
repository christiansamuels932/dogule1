// Simple hash-based router for Dogule1
/* globals window, document, fetch, console, DOMParser */

const routes = {
  dashboard: "/modules/dashboard/index.html",
  kommunikation: "/modules/kommunikation/index.html",
  kurse: "/modules/kurse/index.html",
  kunden: "/modules/kunden/index.html",
  hunde: "/modules/hunde/index.html",
  kalender: "/modules/kalender/index.html",
  trainer: "/modules/trainer/index.html",
  finanzen: "/modules/finanzen/index.html",
  waren: "/modules/waren/index.html",
};

const LAYOUT_URL = "../../modules/shared/layout.html";
let layoutMain = null;
let layoutPromise = null;

function getRouteFromHash() {
  const hash = window.location.hash.replace("#", "").trim();
  return hash && routes[hash] ? hash : "dashboard";
}

async function loadRoute(route) {
  const target = await ensureLayout();
  if (!target) return;

  const url = routes[route] || routes.dashboard;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      target.innerHTML = "<p>Fehler beim Laden des Moduls.</p>";
      setActiveLink(route);
      return;
    }

    const html = await response.text();
    target.innerHTML = html;
    setActiveLink(route);
  } catch (err) {
    console.error("DOGULE1_ROUTER_001 fetch failed", err);
    target.innerHTML = "<p>Technischer Fehler beim Laden des Moduls.</p>";
    setActiveLink(route);
  }
}

function setActiveLink(route) {
  const links = document.querySelectorAll("[data-route]");
  links.forEach((link) => {
    const isActive = link.dataset.route === route;
    if (isActive) {
      link.classList.add("nav-link-active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("nav-link-active");
      link.removeAttribute("aria-current");
    }
  });
}

async function handleRouteChange() {
  const route = getRouteFromHash();
  await loadRoute(route);
}

window.addEventListener("hashchange", handleRouteChange);
window.addEventListener("DOMContentLoaded", handleRouteChange);

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
