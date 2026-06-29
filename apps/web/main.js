// Simple hash-based router for Dogule1
/* globals window, document, console, DOMParser, XMLSerializer, Image, requestAnimationFrame, fetch, AbortController, performance */
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
const STATUS_STORAGE_WARN_PERCENT = 75;
const STATUS_STORAGE_CRITICAL_PERCENT = 91;
const ACTIVITY_FLUSH_INTERVAL_MS = 1200;
const ACTIVITY_BATCH_LIMIT = 20;
const ISSUE_MAX_LENGTH = 500;
const ISSUE_DETAILS_MAX_LENGTH = 4000;
const ISSUE_ACTIVITY_LINE_LIMIT = 15;
const ISSUE_SCREENSHOT_MAX_WIDTH = 1600;
const ISSUE_SCREENSHOT_MAX_HEIGHT = 16000;
const ISSUE_SCREENSHOT_MAX_PIXELS = 32_000_000;
let layoutMain = null;
let layoutPromise = null;
let templatesPromise = null;
let statusIntervalId = null;
let statusRequestActive = false;
let activityCaptureInstalled = false;
let activityFlushTimerId = null;
let activityQueue = [];
let recentActivityLines = [];
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
  const eventType = String(event?.eventType || "").trim();
  if (!eventType) return;
  const routeHash = String(event?.routeHash || window.location.hash || "").trim();
  const moduleId = String(event?.moduleId || window.__DOGULE_ROUTE__?.module || "").trim();
  const actionLabel = String(event?.actionLabel || "")
    .trim()
    .slice(0, 255);
  const details = String(event?.details || "").trim();
  const normalizedEvent = {
    eventType,
    routeHash,
    moduleId,
    actionLabel,
    details,
  };
  rememberActivityLine(normalizedEvent);
  if (!canAutoRecordActivity()) return;
  const signature = `${eventType}|${routeHash}|${moduleId}|${actionLabel}|${details}`;
  const now = Date.now();
  if (signature === lastActivitySignature && now - lastActivityAt < 750) {
    return;
  }
  lastActivitySignature = signature;
  lastActivityAt = now;
  activityQueue.push(normalizedEvent);
  if (activityQueue.length > ACTIVITY_BATCH_LIMIT * 3) {
    activityQueue = activityQueue.slice(-ACTIVITY_BATCH_LIMIT * 2);
  }
  scheduleActivityFlush();
}

function rememberActivityLine(event) {
  const timestamp = new Date().toLocaleString("de-CH", {
    dateStyle: "short",
    timeStyle: "medium",
  });
  const label = event.details || event.actionLabel || event.eventType;
  const moduleText = event.moduleId ? ` · ${event.moduleId}` : "";
  const routeText = event.routeHash ? ` · ${event.routeHash}` : "";
  const line = `${timestamp} · ${event.eventType} · ${label}${moduleText}${routeText}`;
  recentActivityLines.push(line);
  if (recentActivityLines.length > 80) {
    recentActivityLines = recentActivityLines.slice(-60);
  }
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
  const diagnosticsPromise = prepareIssueDiagnostics(module);
  let diagnostics = {
    activityLines: getRecentActivityLines(),
    screenshotUrl: "",
    screenshotName: "",
    capturedAt: new Date().toISOString(),
  };
  let issueSubmitted = false;
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
  closeBtn.addEventListener("click", async () => {
    if (!issueSubmitted) {
      await cleanupIssueScreenshot(diagnostics);
    }
    overlay.remove();
  });
  actions.append(submitBtn, closeBtn);
  form.append(text, status, actions);
  status.textContent = "Screenshot und Aktivitätslog werden vorbereitet ...";
  diagnosticsPromise
    .then((result) => {
      diagnostics = result || diagnostics;
      status.textContent = diagnostics.screenshotUrl
        ? "Screenshot und Aktivitätslog wurden gespeichert."
        : "Aktivitätslog wurde gespeichert. Screenshot konnte nicht erstellt werden.";
    })
    .catch((error) => {
      console.warn("[SUPPORT_DIAGNOSTICS_FAILED]", error);
      status.textContent =
        "Aktivitätslog wurde gespeichert. Screenshot konnte nicht erstellt werden.";
    });
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
      diagnostics = (await diagnosticsPromise.catch(() => diagnostics)) || diagnostics;
      await recordSupportActivity([
        {
          eventType: "issue_report",
          routeHash: window.location.hash || "",
          moduleId: module,
          actionLabel: "Problem gemeldet",
          details: buildIssueDetails(details, diagnostics),
        },
      ]);
      issueSubmitted = true;
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
    if (event.target === overlay) {
      if (!issueSubmitted) {
        void cleanupIssueScreenshot(diagnostics);
      }
      overlay.remove();
    }
  });
  card.append(title, moduleLabel, body, form);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  text.focus();
}

function getRecentActivityLines() {
  return recentActivityLines.slice(-ISSUE_ACTIVITY_LINE_LIMIT).reverse();
}

async function prepareIssueDiagnostics(moduleId) {
  const activityLines = getRecentActivityLines();
  const capturedAt = new Date().toISOString();
  void flushActivityQueue();
  const screenshotDataUrl = await capturePageScreenshot({ moduleId, activityLines, capturedAt });
  const upload = screenshotDataUrl ? await uploadIssueScreenshot(screenshotDataUrl) : null;
  return {
    activityLines,
    capturedAt,
    screenshotUrl: upload?.url || "",
    screenshotName: upload?.name || "",
  };
}

function buildIssueDetails(message, diagnostics = {}) {
  const payload = {
    message: String(message || "").trim(),
    screenshotUrl: diagnostics.screenshotUrl || "",
    screenshotName: diagnostics.screenshotName || "",
    capturedAt: diagnostics.capturedAt || new Date().toISOString(),
    activityLines: Array.isArray(diagnostics.activityLines)
      ? diagnostics.activityLines.slice(0, ISSUE_ACTIVITY_LINE_LIMIT)
      : [],
  };
  let serialized = JSON.stringify(payload);
  while (serialized.length > ISSUE_DETAILS_MAX_LENGTH && payload.activityLines.length) {
    payload.activityLines.pop();
    serialized = JSON.stringify(payload);
  }
  if (serialized.length > ISSUE_DETAILS_MAX_LENGTH) {
    payload.message = payload.message.slice(0, Math.max(0, payload.message.length - 200));
    serialized = JSON.stringify(payload);
  }
  return serialized.slice(0, ISSUE_DETAILS_MAX_LENGTH);
}

async function uploadIssueScreenshot(dataUrl) {
  const res = await fetch("/api/support/screenshots", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ dataUrl }),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(json?.message || "screenshot_upload_failed");
  }
  return json;
}

async function cleanupIssueScreenshot(diagnostics = {}) {
  const name = String(diagnostics.screenshotName || "").trim();
  if (!name) return;
  try {
    await fetch(`/api/support/screenshots/${encodeURIComponent(name)}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.warn("[SUPPORT_SCREENSHOT_CLEANUP_FAILED]", error);
  }
}

async function capturePageScreenshot({ moduleId = "", activityLines = [], capturedAt = "" } = {}) {
  const { width, height, scale, naturalWidth, naturalHeight } = getIssueScreenshotDimensions();
  try {
    const css = collectDocumentCss();
    const bodyClone = document.body.cloneNode(true);
    bodyClone.querySelectorAll(".dogule-help-overlay, script").forEach((node) => node.remove());
    bodyClone.setAttribute(
      "style",
      `margin:0;width:${naturalWidth}px;min-height:${naturalHeight}px;overflow:visible;background:#fff;`
    );
    const serializedBody = new XMLSerializer().serializeToString(bodyClone);
    const transform = scale === 1 ? "" : `transform:scale(${scale});transform-origin:top left;`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${naturalWidth}px;height:${naturalHeight}px;overflow:visible;background:#fff;${transform}">
          <style>${escapeCssForSvg(css)}</style>
          ${serializedBody}
        </div>
      </foreignObject>
    </svg>`;
    return await renderSvgToPngDataUrl(svg, width, height);
  } catch (error) {
    console.warn("[SUPPORT_SCREENSHOT_DOM_FAILED]", error);
    return createFallbackScreenshot({
      width,
      height,
      moduleId,
      activityLines,
      capturedAt,
      pageWidth: naturalWidth,
      pageHeight: naturalHeight,
    });
  }
}

function getIssueScreenshotDimensions() {
  const doc = document.documentElement;
  const body = document.body;
  const naturalWidth = Math.max(
    320,
    window.innerWidth || 0,
    doc?.clientWidth || 0,
    doc?.scrollWidth || 0,
    body?.clientWidth || 0,
    body?.scrollWidth || 0
  );
  const naturalHeight = Math.max(
    240,
    window.innerHeight || 0,
    doc?.clientHeight || 0,
    doc?.scrollHeight || 0,
    doc?.offsetHeight || 0,
    body?.clientHeight || 0,
    body?.scrollHeight || 0,
    body?.offsetHeight || 0
  );
  const scale = Math.min(
    1,
    ISSUE_SCREENSHOT_MAX_WIDTH / naturalWidth,
    ISSUE_SCREENSHOT_MAX_HEIGHT / naturalHeight,
    Math.sqrt(ISSUE_SCREENSHOT_MAX_PIXELS / (naturalWidth * naturalHeight))
  );
  return {
    width: Math.max(1, Math.ceil(naturalWidth * scale)),
    height: Math.max(1, Math.ceil(naturalHeight * scale)),
    scale,
    naturalWidth,
    naturalHeight,
  };
}

function collectDocumentCss() {
  const chunks = [];
  Array.from(document.styleSheets || []).forEach((sheet) => {
    try {
      Array.from(sheet.cssRules || []).forEach((rule) => chunks.push(rule.cssText));
    } catch {
      // Cross-origin stylesheets cannot be read; the fallback still keeps the report useful.
    }
  });
  return chunks.join("\n");
}

function escapeCssForSvg(css = "") {
  return String(css).replace(/<\/style/gi, "<\\/style");
}

function renderSvgToPngDataUrl(svg, width, height) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("svg_screenshot_failed"));
    image.src = svgUrl;
  });
}

function createFallbackScreenshot({
  width,
  height,
  moduleId,
  activityLines,
  capturedAt,
  pageWidth,
  pageHeight,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#1f2933";
  ctx.font = "700 22px sans-serif";
  ctx.fillText("Dogule Problem-Snapshot", 24, 42);
  ctx.font = "16px sans-serif";
  const lines = [
    `Route: ${window.location.hash || "#/"}`,
    `Modul: ${moduleId || "unbekannt"}`,
    `Zeit: ${capturedAt || new Date().toISOString()}`,
    `Screenshot: ${width} x ${height}`,
    `Seite: ${pageWidth || width} x ${pageHeight || height}`,
    "",
    "Aktivitätslog:",
    ...(activityLines || []),
  ];
  let y = 78;
  lines.forEach((line) => {
    ctx.fillText(String(line).slice(0, 150), 24, y);
    y += 24;
  });
  return canvas.toDataURL("image/png");
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

function formatStorageUnitFromMb(value) {
  if (!Number.isFinite(value)) return "";
  if (value >= 1024) {
    const gb = value / 1024;
    const roundedGb = gb >= 10 ? Math.round(gb) : Math.round(gb * 10) / 10;
    return `${Number.isInteger(roundedGb) ? roundedGb : roundedGb.toFixed(1)} GB`;
  }
  const roundedMb = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${Number.isInteger(roundedMb) ? roundedMb : roundedMb.toFixed(1)} MB`;
}

function normalizeStoragePayload(storage, storageMb) {
  if (storage && typeof storage === "object") {
    const usedMb = Number(storage.usedMb);
    const totalMb = Number(storage.totalMb);
    const usedPercent = Number(storage.usedPercent);
    const storageState = String(storage.state || "").trim();
    return {
      usedMb: Number.isFinite(usedMb) ? usedMb : null,
      totalMb: Number.isFinite(totalMb) ? totalMb : null,
      usedPercent: Number.isFinite(usedPercent) ? usedPercent : null,
      state: storageState || "",
    };
  }
  const legacyUsedMb = Number(storageMb);
  return {
    usedMb: Number.isFinite(legacyUsedMb) ? legacyUsedMb : null,
    totalMb: null,
    usedPercent: null,
    state: "",
  };
}

function resolveStorageState(storage) {
  if (storage?.state === "critical" || storage?.state === "warn") return storage.state;
  const usedPercent = Number(storage?.usedPercent);
  if (!Number.isFinite(usedPercent)) return "";
  if (usedPercent >= STATUS_STORAGE_CRITICAL_PERCENT) return "critical";
  if (usedPercent >= STATUS_STORAGE_WARN_PERCENT) return "warn";
  return "ok";
}

function formatStorageDetail(storage) {
  if (!Number.isFinite(storage?.usedMb)) return "";
  const used = formatStorageUnitFromMb(storage.usedMb);
  if (Number.isFinite(storage.totalMb) && Number.isFinite(storage.usedPercent)) {
    const total = formatStorageUnitFromMb(storage.totalMb);
    const percent = Math.round(storage.usedPercent * 10) / 10;
    const percentText = Number.isInteger(percent) ? String(percent) : percent.toFixed(1);
    return ` · Speicher: ${used} / ${total} (${percentText}%)`;
  }
  return ` · Speicher: ${used}`;
}

function setStatusBadge(badge, state, latencyMs, statusCode, storagePayload, storageMb) {
  const baseClass = "dogule-status";
  const storage = normalizeStoragePayload(storagePayload, storageMb);
  const storageState = state === "ok" ? resolveStorageState(storage) : "";
  let visualState = state;
  if (storageState === "warn") visualState = "slow";
  if (storageState === "critical") visualState = "down";
  const stateClass = `dogule-status--${visualState}`;
  badge.className = `${baseClass} ${stateClass}`;
  let text = "VPS Status";
  let detail = "";
  const storageDetail = formatStorageDetail(storage);
  if (state === "ok") {
    if (storageState === "critical") {
      text = "VPS Speicher kritisch";
    } else if (storageState === "warn") {
      text = "VPS Speicher hoch";
    } else {
      text = "VPS OK";
    }
    detail = typeof latencyMs === "number" ? ` · ${latencyMs} ms` : "";
  } else if (state === "slow") {
    text = "VPS langsam";
    detail = typeof latencyMs === "number" ? ` · ${latencyMs} ms` : "";
  } else if (state === "down") {
    text = "VPS offline";
    detail = statusCode ? ` · ${statusCode}` : "";
  } else if (state === "checking") {
    text = "VPS prüfen";
  }
  const label = `${text}${detail}${storageDetail}`;
  badge.textContent = label;
  badge.setAttribute("aria-label", `VPS Status: ${label}`);
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
    const storage = payload?.storage || null;
    const storageMb = Number.isFinite(payload?.storageMb) ? payload.storageMb : null;
    if (!res.ok) {
      setStatusBadge(badge, "down", elapsed, res.status, storage, storageMb);
      return;
    }
    if (elapsed >= STATUS_SLOW_THRESHOLD_MS) {
      setStatusBadge(badge, "slow", elapsed, null, storage, storageMb);
      return;
    }
    setStatusBadge(badge, "ok", elapsed, null, storage, storageMb);
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
