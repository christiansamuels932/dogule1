// Simple hash-based router for Dogule1
/* globals window, document, fetch, console */

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

function getRouteFromHash() {
  const hash = window.location.hash.replace("#", "").trim();
  return hash && routes[hash] ? hash : "dashboard";
}

async function loadRoute(route) {
  const target = document.getElementById("content");
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

function handleRouteChange() {
  const route = getRouteFromHash();
  loadRoute(route);
}

window.addEventListener("hashchange", handleRouteChange);
window.addEventListener("DOMContentLoaded", handleRouteChange);
