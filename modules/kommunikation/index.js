/* globals document, window, console */
import { STORAGE_ERROR_CODES, StorageError } from "../shared/storage/errors.js";
import {
  createNotice,
  createEmptyState,
  createFormRow,
  createButton,
} from "../shared/components/components.js";
import * as infochannelClient from "./infochannel/client.js";

const TAB_CONFIG = [
  { id: "infochannel", label: "Infochannel", actionId: "kommunikation.infochannel.view" },
];

const PLACEHOLDER_DATA = {
  infochannel: [
    { id: "info-1", title: "Info: Feiertage", snippet: "Betriebsferien nächste Woche." },
  ],
};


export async function initModule(container, routeInfo = {}) {
  if (!container) return;
  clearAndScroll(container);

  const { tab, detailId } = parseRoute(routeInfo?.segments);
  const actor = resolveActor();

  const section = document.createElement("section");
  section.className = "dogule-section kommunikation-section";

  if (TAB_CONFIG.length > 1) {
    const tabs = renderTabs(tab);
    section.appendChild(tabs);
  }

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
  const rawTab = parts[0] || "infochannel";
  const tab = TAB_CONFIG.some((t) => t.id === rawTab) ? rawTab : "infochannel";
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
    if (tab === "infochannel") {
      await renderInfochannel(host, detailId, actor);
    } else {
      const items = await loadTabData(tab);
      if (!items || items.length === 0) {
        renderEmpty(host, tab);
      } else if (detailId) {
        renderDetail(host, tab, detailId, items);
      } else {
        renderList(host, tab, items);
      }
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
    tab === "infochannel" ? "Keine Infochannel-Meldungen vorhanden." : "Keine Einträge vorhanden.";
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

async function renderInfochannel(host, detailId, actor) {
  try {
    await probeStorageAvailability("infochannel");
  } catch (error) {
    renderOffline(host);
    throw error;
  }

  if (!detailId) {
    await renderInfochannelList(host, actor);
    return;
  }
  await renderInfochannelDetail(host, detailId, actor);
}

async function renderInfochannelList(host, actor) {
  host.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "kommunikation-infochannel";

  const list = document.createElement("div");
  list.className = "kommunikation-list";

  if (isAuthorized("kommunikation.infochannel.publish", actor)) {
    const compose = document.createElement("form");
    compose.className = "infochannel-compose";
    const titleRow = createFormRow({
      id: "infochannel-title",
      label: "Titel",
      required: true,
      placeholder: "Kurze Zusammenfassung",
    });
    const bodyRow = createFormRow({
      id: "infochannel-body",
      label: "Nachricht",
      control: "textarea",
      required: true,
      placeholder: "Nachricht an alle Trainerinnen und Trainer",
    });
    const bodyControl = bodyRow.querySelector("textarea");
    if (bodyControl) bodyControl.rows = 5;
    const actions = document.createElement("div");
    actions.className = "infochannel-compose__actions";
    const status = document.createElement("span");
    status.className = "infochannel-compose__status";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "ui-btn";
    submit.textContent = "Meldung veröffentlichen";
    actions.appendChild(status);
    actions.appendChild(submit);
    compose.appendChild(titleRow);
    compose.appendChild(bodyRow);
    compose.appendChild(actions);
    compose.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "Veröffentlichen...";
      submit.disabled = true;
      const title = compose.querySelector("#infochannel-title")?.value || "";
      const body = compose.querySelector("#infochannel-body")?.value || "";
      try {
        await infochannelClient.createNotice({ title, body });
        status.textContent = "Meldung veröffentlicht.";
        compose.reset();
        await renderInfochannelList(host, actor);
      } catch (error) {
        if (error.code === "RATE_LIMITED") {
          status.textContent = "Zu viele Meldungen – bitte warten.";
        } else if (error.code === "INVALID_INPUT") {
          status.textContent = "Bitte Titel und Nachricht prüfen.";
        } else if (isOffline(error)) {
          status.textContent = "Offline. Veröffentlichung fehlgeschlagen.";
        } else {
          status.textContent = "Veröffentlichen fehlgeschlagen.";
        }
      } finally {
        submit.disabled = false;
      }
    });
    compose.style.marginBottom = "1rem";
    wrapper.appendChild(compose);
  }

  list.appendChild(createNotice("Infochannel wird geladen...", { variant: "info" }));
  wrapper.appendChild(list);
  host.appendChild(wrapper);

  try {
    const data = await infochannelClient.listNotices();
    list.innerHTML = "";
    const notices = data?.notices || [];
    if (!notices.length) {
      list.appendChild(createEmptyState("Leer", "Keine Infochannel-Meldungen vorhanden."));
      return;
    }
    notices.forEach((notice) => {
      const card = document.createElement("article");
      card.className = "kommunikation-card";
      const title = document.createElement("h3");
      title.className = "kommunikation-card__title";
      title.textContent = notice.title || "Infochannel";
      const snippet = document.createElement("p");
      snippet.className = "kommunikation-card__snippet";
      snippet.textContent = buildSnippet(notice.body);
      const meta = document.createElement("div");
      meta.className = "kommunikation-card__meta";
      const published = document.createElement("time");
      published.dateTime = notice.createdAt || "";
      published.textContent = notice.createdAt ? formatTime(notice.createdAt) : "";
      const statusText = buildInfochannelStatusText(notice, actor);
      meta.appendChild(published);
      if (statusText) {
        const status = document.createElement("span");
        status.className = "kommunikation-card__status";
        status.textContent = statusText;
        meta.appendChild(status);
      }
      card.appendChild(title);
      card.appendChild(snippet);
      card.appendChild(meta);
      if (canDeleteNotice(actor)) {
        const actions = document.createElement("div");
        actions.className = "module-actions";
        const deleteBtn = createButton({ label: "Löschen", variant: "secondary" });
        deleteBtn.type = "button";
        deleteBtn.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const ok = window.confirm(
            `Infochannel-Eintrag wirklich löschen?\n\n${notice.title || "Infochannel"}\n\nDieser Vorgang kann nicht rückgängig gemacht werden.`
          );
          if (!ok) return;
          deleteBtn.disabled = true;
          try {
            await infochannelClient.deleteNotice({ id: notice.id });
            card.remove();
            if (!list.children.length) {
              list.appendChild(
                createEmptyState("Leer", "Keine Infochannel-Meldungen vorhanden.")
              );
            }
          } catch (error) {
            console.error("[INFOCHANNEL_DELETE_FAILED]", error);
            deleteBtn.disabled = false;
            window.alert("Löschen fehlgeschlagen.");
          }
        });
        actions.appendChild(deleteBtn);
        card.appendChild(actions);
      }
      card.setAttribute("tabindex", "0");
      card.addEventListener("click", () => {
        window.location.hash = `#/kommunikation/infochannel/${notice.id}`;
      });
      card.addEventListener("keypress", (evt) => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          window.location.hash = `#/kommunikation/infochannel/${notice.id}`;
        }
      });
      list.appendChild(card);
    });
  } catch (error) {
    list.innerHTML = "";
    list.appendChild(
      createNotice(isOffline(error) ? "Offline. Laden fehlgeschlagen." : "Fehler beim Laden.", {
        variant: "warn",
        role: "alert",
      })
    );
  }
}

async function renderInfochannelDetail(host, noticeId, actor) {
  host.innerHTML = "";
  const header = document.createElement("div");
  header.className = "kommunikation-chat-header";
  const back = createButton({ label: "Zurück", variant: "secondary" });
  back.type = "button";
  back.addEventListener("click", () => {
    window.location.hash = "#/kommunikation/infochannel";
  });
  const title = document.createElement("h2");
  title.textContent = "Infochannel";
  header.appendChild(back);
  header.appendChild(title);
  host.appendChild(header);

  const content = document.createElement("div");
  content.className = "kommunikation-detail infochannel-detail";
  content.appendChild(createNotice("Meldung wird geladen...", { variant: "info" }));
  host.appendChild(content);

  try {
    const detail = await infochannelClient.getNotice({ id: noticeId });
    const notice = detail.notice || {};
    content.innerHTML = "";

    const headline = document.createElement("h3");
    headline.textContent = notice.title || "Infochannel";
    const body = document.createElement("p");
    body.className = "infochannel-detail__body";
    body.textContent = notice.body || "";
    const meta = document.createElement("div");
    meta.className = "infochannel-detail__meta";
    const published = document.createElement("span");
    published.textContent = notice.createdAt
      ? `Veröffentlicht: ${formatTime(notice.createdAt)}`
      : "Veröffentlicht";
    meta.appendChild(published);

    const summary = document.createElement("div");
    summary.className = "infochannel-detail__summary";
    summary.textContent = `Bestätigt ${notice.confirmedCount || 0}/${notice.targetCount || 0}`;

    content.appendChild(headline);
    content.appendChild(body);
    content.appendChild(meta);
    content.appendChild(summary);

    if (actor.role === "trainer" || actor.role === "trainer_rapport") {
      const confirmWrap = document.createElement("div");
      confirmWrap.className = "infochannel-confirm";
      const status = document.createElement("span");
      status.className = "infochannel-confirm__status";
      const confirmation = detail.confirmation;
      if (confirmation) {
        status.textContent = `Bestätigt · ${formatTime(confirmation.confirmedAt)}`;
      } else {
        status.textContent = "Bestätigung ausstehend.";
      }
      confirmWrap.appendChild(status);

      if (!confirmation) {
        const confirmBtn = document.createElement("button");
        confirmBtn.type = "button";
        confirmBtn.className = "ui-btn";
        confirmBtn.textContent = "Jetzt bestätigen";
        confirmBtn.addEventListener("click", async () => {
          confirmBtn.disabled = true;
          status.textContent = "Bestätige...";
          try {
            const result = await infochannelClient.confirmNotice({ id: noticeId });
            const confirmedAt = result?.confirmation?.confirmedAt || new Date().toISOString();
            status.textContent = `Bestätigt · ${formatTime(confirmedAt)}`;
            confirmBtn.remove();
          } catch (error) {
            if (error.code === "RATE_LIMITED") {
              status.textContent = "Zu viele Bestätigungen – bitte warten.";
            } else if (error.code === "DENIED") {
              status.textContent = "Keine Berechtigung zum Bestätigen.";
            } else if (isOffline(error)) {
              status.textContent = "Offline. Bestätigung fehlgeschlagen.";
            } else {
              status.textContent = "Bestätigung fehlgeschlagen.";
            }
            confirmBtn.disabled = false;
          }
        });
        confirmWrap.appendChild(confirmBtn);
      }

      content.appendChild(confirmWrap);
    }

    if (actor.role === "admin" && Array.isArray(detail.targets)) {
      const targetsWrap = document.createElement("div");
      targetsWrap.className = "infochannel-targets";
      const heading = document.createElement("h4");
      heading.textContent = "Bestätigungen";
      const list = document.createElement("ul");
      list.className = "infochannel-targets__list";
      detail.targets.forEach((entry) => {
        const item = document.createElement("li");
        item.className = "infochannel-targets__item";
        const name = document.createElement("span");
        name.textContent = entry.trainerName || entry.trainerId;
        const status = document.createElement("span");
        status.className = "infochannel-targets__status";
        if (entry.status === "confirmed") {
          status.textContent = entry.confirmedAt
            ? `Bestätigt · ${formatTime(entry.confirmedAt)}`
            : "Bestätigt";
        } else {
          status.textContent = "Ausstehend";
        }
        item.appendChild(name);
        item.appendChild(status);
        list.appendChild(item);
      });
      targetsWrap.appendChild(heading);
      targetsWrap.appendChild(list);
      content.appendChild(targetsWrap);
    }
  } catch (error) {
    content.innerHTML = "";
    content.appendChild(
      createNotice(
        error.code === "NOT_FOUND"
          ? "Meldung nicht gefunden."
          : isOffline(error)
            ? "Offline. Laden fehlgeschlagen."
            : "Fehler beim Laden der Meldung.",
        { variant: "warn", role: "alert" }
      )
    );
  }
}

function formatTime(value) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("de-DE");
}

function buildSnippet(text, maxLength = 120) {
  const raw = (text || "").trim();
  if (raw.length <= maxLength) return raw;
  return `${raw.slice(0, maxLength).trim()}...`;
}

function buildInfochannelStatusText(notice, actor) {
  if (actor?.role === "trainer" || actor?.role === "trainer_rapport") {
    return "";
  }
  const target = Number(notice.targetCount || 0);
  const confirmed = Number(notice.confirmedCount || 0);
  const pending = Number(notice.pendingCount || Math.max(0, target - confirmed));
  const parts = [`Bestätigt ${confirmed}/${target}`];
  if (pending > 0) {
    parts.push(`${pending} offen`);
  }
  return parts.join(" · ");
}

function canDeleteNotice(actor) {
  return actor?.role === "admin";
}

async function loadTabData(tab) {
  await probeStorageAvailability(tab);
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
