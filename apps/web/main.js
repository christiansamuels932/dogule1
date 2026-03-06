// Simple hash-based router for Dogule1
/* globals window, document, console, DOMParser, requestAnimationFrame, fetch, AbortController, performance */
import "../../modules/shared/shared.css";
import "../../modules/shared/layout.css";
import fontanasLogoUrl from "./assets/fontanas-logo.png";
import layoutHtml from "../../modules/shared/layout.html?raw";
import templatesHtml from "../../modules/shared/components/templates.html?raw";
import { runIntegrityCheck } from "../../modules/shared/api/db/integrityCheck.js";
import { recordSupportActivity } from "../../modules/shared/api/developer.js";
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
const ACTIVITY_FLUSH_INTERVAL_MS = 1200;
const ACTIVITY_BATCH_LIMIT = 20;
const ISSUE_MAX_LENGTH = 500;
let layoutMain = null;
let layoutPromise = null;
let templatesPromise = null;
let statusIntervalId = null;
let statusRequestActive = false;
let activityCaptureInstalled = false;
let activityFlushTimerId = null;
let activityQueue = [];
let lastActivitySignature = "";
let lastActivityAt = 0;

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
  const forceMobile = normalizedRole === "trainer" || normalizedRole === "trainer_rapport";
  document.documentElement.classList.toggle("force-mobile", forceMobile);
  document.body.classList.toggle("force-mobile", forceMobile);
  applyForceMobileStyles(forceMobile);
  const host = document.getElementById("dogule-auth");
  if (!host) return;
  host.innerHTML = "";
  if (normalizedRole !== "client_readonly") {
    host.appendChild(createIssueButton());
  }
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

function createIssueButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "dogule-auth__btn dogule-help-btn";
  button.textContent = "Achtung";
  button.addEventListener("click", () => {
    showIssueReporter();
  });
  return button;
}

function canAutoRecordActivity(session = getSession()) {
  const role = normalizeRole(session?.user?.role);
  return (
    Boolean(session?.user?.id) &&
    Boolean(role) &&
    role !== "developer" &&
    role !== "client_readonly"
  );
}

function queueActivity(event) {
  if (!canAutoRecordActivity()) return;
  const eventType = String(event?.eventType || "").trim();
  if (!eventType) return;
  const routeHash = String(event?.routeHash || window.location.hash || "").trim();
  const moduleId = String(event?.moduleId || window.__DOGULE_ROUTE__?.module || "").trim();
  const actionLabel = String(event?.actionLabel || "")
    .trim()
    .slice(0, 255);
  const details = String(event?.details || "").trim();
  const signature = `${eventType}|${routeHash}|${moduleId}|${actionLabel}|${details}`;
  const now = Date.now();
  if (signature === lastActivitySignature && now - lastActivityAt < 750) {
    return;
  }
  lastActivitySignature = signature;
  lastActivityAt = now;
  activityQueue.push({
    eventType,
    routeHash,
    moduleId,
    actionLabel,
    details,
  });
  if (activityQueue.length > ACTIVITY_BATCH_LIMIT * 3) {
    activityQueue = activityQueue.slice(-ACTIVITY_BATCH_LIMIT * 2);
  }
  scheduleActivityFlush();
}

function scheduleActivityFlush() {
  if (activityFlushTimerId) return;
  activityFlushTimerId = window.setTimeout(() => {
    activityFlushTimerId = null;
    void flushActivityQueue();
  }, ACTIVITY_FLUSH_INTERVAL_MS);
}

async function flushActivityQueue() {
  if (!activityQueue.length || !canAutoRecordActivity()) return;
  const batch = activityQueue.slice(0, ACTIVITY_BATCH_LIMIT);
  activityQueue = activityQueue.slice(batch.length);
  try {
    await recordSupportActivity(batch);
  } catch (error) {
    console.warn("[SUPPORT_ACTIVITY_FLUSH_FAILED]", error);
  }
  if (activityQueue.length) {
    scheduleActivityFlush();
  }
}

function extractActivityLabel(target) {
  if (!target) return "";
  const aria = String(target.getAttribute?.("aria-label") || "").trim();
  if (aria) return aria.slice(0, 255);
  const text = String(target.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
  if (text) return text.slice(0, 255);
  const value = String(target.value || "").trim();
  if (value) return value.slice(0, 255);
  const name = String(target.name || "").trim();
  if (name) return name.slice(0, 255);
  return "";
}

function installActivityCapture() {
  if (activityCaptureInstalled || typeof document === "undefined") return;
  activityCaptureInstalled = true;
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target?.closest?.(
        "button, a, [role='button'], input[type='button'], input[type='submit']"
      );
      if (!target) return;
      if (target.closest(".dogule-help-overlay")) return;
      const label = extractActivityLabel(target);
      if (!label) return;
      queueActivity({
        eventType: "ui_click",
        actionLabel: label,
      });
    },
    true
  );
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void flushActivityQueue();
    }
  });
}

function showIssueReporter() {
  const module = window.__DOGULE_ROUTE__?.module || "unbekannt";
  const session = getSession();
  const overlay = document.createElement("div");
  overlay.className = "dogule-help-overlay";
  const card = document.createElement("div");
  card.className = "dogule-help-card";
  const title = document.createElement("h2");
  title.textContent = "Achtung";
  const moduleLabel = document.createElement("p");
  moduleLabel.className = "dogule-help-card__module";
  moduleLabel.textContent = `Modul: ${module}`;
  const body = document.createElement("p");
  body.className = "dogule-help-card__text";
  body.textContent =
    "Kurz beschreiben, wo es klemmt. Die Meldung landet direkt im Developer-Modul zusammen mit deinem Aktivitätslog.";
  const form = document.createElement("form");
  form.className = "dogule-help-form";
  form.noValidate = true;
  const text = document.createElement("textarea");
  text.className = "dogule-help-textarea";
  text.maxLength = ISSUE_MAX_LENGTH;
  text.placeholder = "Kurze Problembeschreibung";
  text.rows = 5;
  const status = document.createElement("div");
  status.className = "dogule-help-status";
  const actions = document.createElement("div");
  actions.className = "module-actions";
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "dogule-help-card__close";
  submitBtn.textContent = "Senden";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "dogule-help-card__close";
  closeBtn.textContent = "Schliessen";
  closeBtn.addEventListener("click", () => overlay.remove());
  actions.append(submitBtn, closeBtn);
  form.append(text, status, actions);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.innerHTML = "";
    const details = String(text.value || "").trim();
    if (!session?.user) {
      status.textContent = "Bitte zuerst anmelden.";
      return;
    }
    if (!details) {
      status.textContent = "Bitte eine kurze Problembeschreibung eingeben.";
      return;
    }
    submitBtn.disabled = true;
    closeBtn.disabled = true;
    try {
      await recordSupportActivity([
        {
          eventType: "issue_report",
          routeHash: window.location.hash || "",
          moduleId: module,
          actionLabel: "Problem gemeldet",
          details,
        },
      ]);
      status.textContent = "Meldung gespeichert.";
      text.value = "";
    } catch (error) {
      console.warn("[SUPPORT_ISSUE_SUBMIT_FAILED]", error);
      status.textContent = "Meldung konnte nicht gespeichert werden.";
    } finally {
      submitBtn.disabled = false;
      closeBtn.disabled = false;
    }
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  card.append(title, moduleLabel, body, form);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  text.focus();
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
  queueActivity({
    eventType: "route_view",
    routeHash: hash,
    moduleId: routeInfo.module,
    actionLabel: routeInfo.module,
  });
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
    installActivityCapture();
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

function formatStorageMb(value) {
  if (!Number.isFinite(value)) return "";
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return ` · ${text} MB`;
}

function setStatusBadge(badge, state, latencyMs, statusCode, storageMb) {
  const baseClass = "dogule-status";
  const stateClass = `dogule-status--${state}`;
  badge.className = `${baseClass} ${stateClass}`;
  let text = "NAS Status";
  let detail = "";
  const storageDetail = formatStorageMb(storageMb);
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
  const label = `${text}${detail}${storageDetail}`;
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
    const payload = await res.json().catch(() => null);
    const storageMb = Number.isFinite(payload?.storageMb) ? payload.storageMb : null;
    if (!res.ok) {
      setStatusBadge(badge, "down", elapsed, res.status, storageMb);
      return;
    }
    if (elapsed >= STATUS_SLOW_THRESHOLD_MS) {
      setStatusBadge(badge, "slow", elapsed, null, storageMb);
      return;
    }
    setStatusBadge(badge, "ok", elapsed, null, storageMb);
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
