/* globals document, window, console */
import { STORAGE_ERROR_CODES, StorageError } from "../shared/storage/errors.js";
import { createNotice, createEmptyState } from "../shared/components/components.js";

const TAB_CONFIG = [
  { id: "chats", label: "Chats", actionId: "kommunikation.chat.view" },
  { id: "infochannel", label: "Infochannel", actionId: "kommunikation.infochannel.view" },
  { id: "emails", label: "Emails", actionId: "kommunikation.email.view" },
  { id: "system", label: "System", actionId: "kommunikation.system.view" },
];

const PLACEHOLDER_DATA = {
  chats: [
    { id: "chat-1", title: "Chat mit Kunde K1", snippet: "Letzte Nachricht · vor 3 Std." },
    { id: "chat-2", title: "Team-Chat Trainer:innen", snippet: "Neue Info · vor 1 Tag" },
  ],
  infochannel: [
    { id: "info-1", title: "Info: Feiertage", snippet: "Betriebsferien nächste Woche." },
  ],
  emails: [{ id: "mail-1", title: "E-Mail an Kunde", snippet: "Betreff: Terminbestätigung" }],
  system: [{ id: "sys-1", title: "Systemhinweis", snippet: "Kein neuer Versand geplant." }],
};

export async function initModule(container, routeInfo = {}) {
  if (!container) return;
  clearAndScroll(container);

  const { tab, detailId } = parseRoute(routeInfo?.segments);
  const actor = resolveActor();

  const section = document.createElement("section");
  section.className = "dogule-section kommunikation-section";

  const heading = document.createElement("h1");
  heading.textContent = "Kommunikation";
  heading.tabIndex = -1;
  section.appendChild(heading);

  const tabs = renderTabs(tab);
  section.appendChild(tabs);

  const content = document.createElement("div");
  content.className = "kommunikation-content";
  content.setAttribute("data-tab", tab);
  section.appendChild(content);

  container.appendChild(section);

  // focus after mounting to preserve A11y behavior used across modules
  focusHeading(section);

  await renderTabContent({ host: content, tab, detailId, actor });
}

function parseRoute(segments = []) {
  const parts = Array.isArray(segments) ? segments.filter(Boolean) : [];
  const rawTab = parts[0] || "chats";
  const tab = TAB_CONFIG.some((t) => t.id === rawTab) ? rawTab : "chats";
  const detailId = parts.length > 1 ? parts.slice(1).join("/") : null;
  return { tab, detailId };
}

function renderTabs(activeTab) {
  const nav = document.createElement("nav");
  nav.className = "kommunikation-tabs";
  nav.setAttribute("aria-label", "Kommunikation Tabs");

  TAB_CONFIG.forEach((tab) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "kommunikation-tab";
    btn.textContent = tab.label;
    btn.setAttribute("data-tab", tab.id);
    if (tab.id === activeTab) {
      btn.classList.add("kommunikation-tab--active");
      btn.setAttribute("aria-current", "page");
    }
    btn.addEventListener("click", () => {
      if (tab.id === activeTab) return;
      window.location.hash = `#/kommunikation/${tab.id}`;
    });
    nav.appendChild(btn);
  });

  return nav;
}

async function renderTabContent({ host, tab, detailId, actor }) {
  if (!host) return;
  setLoading(host);

  const tabConfig = TAB_CONFIG.find((t) => t.id === tab) || TAB_CONFIG[0];
  const allowed = isAuthorized(tabConfig.actionId, actor);
  logNavigation({
    actionId: tabConfig.actionId,
    actor,
    targetId: detailId || "list",
    result: allowed ? "pending" : "denied",
  });

  if (!allowed) {
    renderBlocked(host);
    return;
  }

  try {
    const items = await loadTabData(tab);
    if (!items || items.length === 0) {
      renderEmpty(host, tab);
    } else if (detailId) {
      renderDetail(host, tab, detailId, items);
    } else {
      renderList(host, tab, items);
    }
    logNavigation({
      actionId: tabConfig.actionId,
      actor,
      targetId: detailId || "list",
      result: "success",
    });
  } catch (error) {
    if (isOffline(error)) {
      renderOffline(host);
    } else {
      renderError(host);
    }
    logNavigation({
      actionId: tabConfig.actionId,
      actor,
      targetId: detailId || "list",
      result: "error",
      metaCode: isOffline(error) ? "OFFLINE" : "LOAD_ERROR",
    });
  }
}

function setLoading(host) {
  host.innerHTML = "";
  host.appendChild(createNotice("Lade Ansicht...", { variant: "info", role: "status" }));
}

function renderBlocked(host) {
  host.innerHTML = "";
  host.appendChild(
    createNotice("Kein Zugriff. Bitte berechtigten Zugang anfordern.", {
      variant: "warn",
      role: "alert",
    })
  );
}

function renderOffline(host) {
  host.innerHTML = "";
  host.appendChild(
    createNotice("Offline. Verbindung zur Ablage derzeit nicht möglich.", {
      variant: "warn",
      role: "alert",
    })
  );
}

function renderError(host) {
  host.innerHTML = "";
  host.appendChild(
    createNotice("Fehler beim Laden der Kommunikation.", { variant: "warn", role: "alert" })
  );
}

function renderEmpty(host, tab) {
  host.innerHTML = "";
  const hint =
    tab === "chats"
      ? "Keine Chats vorhanden."
      : tab === "infochannel"
        ? "Keine Infochannel-Meldungen vorhanden."
        : tab === "emails"
          ? "Keine Emails vorhanden."
          : "Keine Systemmeldungen vorhanden.";
  host.appendChild(createEmptyState("Leer", hint));
}

function renderList(host, tab, items) {
  host.innerHTML = "";
  const list = document.createElement("div");
  list.className = "kommunikation-list";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "kommunikation-card";
    const title = document.createElement("h3");
    title.className = "kommunikation-card__title";
    title.textContent = item.title || "Eintrag";
    const snippet = document.createElement("p");
    snippet.className = "kommunikation-card__snippet";
    snippet.textContent = item.snippet || "";
    card.appendChild(title);
    card.appendChild(snippet);
    card.setAttribute("tabindex", "0");
    card.addEventListener("click", () => {
      window.location.hash = `#/kommunikation/${tab}/${item.id}`;
    });
    card.addEventListener("keypress", (evt) => {
      if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault();
        window.location.hash = `#/kommunikation/${tab}/${item.id}`;
      }
    });
    list.appendChild(card);
  });

  host.appendChild(list);
}

function renderDetail(host, tab, detailId, items) {
  host.innerHTML = "";
  const entry = items.find((item) => item.id === detailId) || null;
  if (!entry) {
    host.appendChild(
      createNotice("Eintrag nicht gefunden oder nicht verfügbar.", {
        variant: "warn",
        role: "alert",
      })
    );
    return;
  }
  const wrapper = document.createElement("div");
  wrapper.className = "kommunikation-detail";
  const title = document.createElement("h3");
  title.textContent = entry.title || "Details";
  const meta = document.createElement("p");
  meta.className = "kommunikation-detail__meta";
  meta.textContent = entry.snippet || "Keine weiteren Details.";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "ui-btn ui-btn--secondary";
  back.textContent = "Zurück";
  back.addEventListener("click", () => {
    window.location.hash = `#/kommunikation/${tab}`;
  });
  wrapper.appendChild(title);
  wrapper.appendChild(meta);
  wrapper.appendChild(back);
  host.appendChild(wrapper);
}

async function loadTabData(tab) {
  await probeStorageAvailability(tab);
  // Return placeholder, read-only data
  return Array.isArray(PLACEHOLDER_DATA[tab]) ? PLACEHOLDER_DATA[tab] : [];
}

function resolveActor() {
  const fromWindow = (typeof window !== "undefined" && window.__DOGULE_ACTOR__) || {};
  const role = fromWindow.role || null;
  const id = fromWindow.id || null;
  const type = role ? "user" : "anonymous";
  return { type, id, role };
}

function isAuthorized(actionId, actor) {
  if (!actionId) return false;
  if (actor?.role === "admin") return true;
  const allowed = (typeof window !== "undefined" && window.__DOGULE_AUTHZ__?.allowedActions) || [];
  if (Array.isArray(allowed) && (allowed.includes(actionId) || allowed.includes("*"))) {
    return true;
  }
  return false;
}

function isOffline(error) {
  if (!error) return false;
  if (error instanceof StorageError) {
    return (
      error.code === STORAGE_ERROR_CODES.STORAGE_ROOT_MISSING ||
      error.code === STORAGE_ERROR_CODES.STORAGE_ERROR
    );
  }
  const message = error?.message || "";
  return /network|offline|fetch|unreachable/i.test(message);
}

function logNavigation({ actionId, actor, targetId, result, metaCode }) {
  try {
    emitClientLog({
      actionId,
      actor,
      targetId,
      result,
      metaCode,
    });
  } catch (err) {
    // logging must not break UI
    if (typeof console !== "undefined") {
      console.warn("Kommunikation logging failed", err);
    }
  }
}

function clearAndScroll(container) {
  container.innerHTML = "";
  if (typeof container.scrollTo === "function") {
    container.scrollTo({ top: 0, behavior: "auto" });
  } else {
    container.scrollTop = 0;
  }
}

function focusHeading(section) {
  const heading = section?.querySelector("h1");
  if (heading) {
    heading.focus({ preventScroll: true });
  }
}

async function probeStorageAvailability(tab) {
  if (typeof window !== "undefined" && typeof window.__DOGULE_STORAGE_PROBE__ === "function") {
    await window.__DOGULE_STORAGE_PROBE__({ tab });
    return;
  }
  throw new StorageError(
    STORAGE_ERROR_CODES.STORAGE_ERROR,
    "Storage probe unavailable (no SAL context)"
  );
}

function emitClientLog({ actionId, actor, targetId, result, metaCode }) {
  const payload = {
    actionId,
    actor: {
      type: actor?.type || "anonymous",
      id: actor?.id || null,
      role: actor?.role || null,
    },
    target: { type: "kommunikation", id: targetId || "unknown" },
    result: result || "success",
    level: "info",
    severity: "INFO",
    message: "KOMMUNIKATION-VIEW",
    meta: metaCode ? { code: metaCode } : undefined,
  };

  const externalLogger =
    (typeof window !== "undefined" && window.__DOGULE_LOGGER__) || window?.console?.info;
  if (typeof externalLogger === "function") {
    externalLogger(payload);
  }
}
