/* globals document, window, console, crypto */
import { STORAGE_ERROR_CODES, StorageError } from "../shared/storage/errors.js";
import { createNotice, createEmptyState, createFormRow } from "../shared/components/components.js";
import * as groupchatClient from "./groupchat/client.js";
import * as infochannelClient from "./infochannel/client.js";

const TAB_CONFIG = [
  { id: "chats", label: "Chats", actionId: "kommunikation.chat.view" },
  { id: "infochannel", label: "Infochannel", actionId: "kommunikation.infochannel.view" },
  { id: "system", label: "System", actionId: "kommunikation.system.view" },
];

const MAX_LIST_PREVIEW = 1;
const MESSAGE_PAGE_LIMIT = 50;

const PLACEHOLDER_DATA = {
  infochannel: [
    { id: "info-1", title: "Info: Feiertage", snippet: "Betriebsferien nächste Woche." },
  ],
  system: [{ id: "sys-1", title: "Systemhinweis", snippet: "Kein neuer Versand geplant." }],
};

const chatState = {
  messages: [],
  nextCursor: null,
  unreadCount: 0,
  isLoading: false,
  error: null,
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
    if (tab === "chats") {
      await renderChats(host, detailId, actor);
    } else if (tab === "infochannel") {
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
    tab === "chats"
      ? "Keine Chats vorhanden."
      : tab === "infochannel"
        ? "Keine Infochannel-Meldungen vorhanden."
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

async function renderChats(host, detailId, actor) {
  try {
    await probeStorageAvailability("chats");
  } catch (error) {
    renderOffline(host);
    throw error;
  }

  if (!detailId) {
    await renderChatList(host, actor);
    return;
  }
  await renderChatDetail(host, actor);
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
    const slaRow = createFormRow({
      id: "infochannel-sla",
      label: "SLA (Stunden)",
      type: "number",
      value: "48",
      describedByText: "Frist für Bestätigung der Meldung.",
    });
    const bodyControl = bodyRow.querySelector("textarea");
    if (bodyControl) bodyControl.rows = 5;
    const slaControl = slaRow.querySelector("input");
    if (slaControl) {
      slaControl.min = "1";
      slaControl.step = "1";
    }
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
    compose.appendChild(slaRow);
    compose.appendChild(actions);
    compose.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "Veröffentlichen...";
      submit.disabled = true;
      const title = compose.querySelector("#infochannel-title")?.value || "";
      const body = compose.querySelector("#infochannel-body")?.value || "";
      const slaHours = compose.querySelector("#infochannel-sla")?.value || "";
      try {
        await infochannelClient.createNotice({ title, body, slaHours });
        status.textContent = "Meldung veröffentlicht.";
        compose.reset();
        const slaInput = compose.querySelector("#infochannel-sla");
        if (slaInput) slaInput.value = "48";
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
      const status = document.createElement("span");
      status.className = "kommunikation-card__status";
      status.textContent = buildInfochannelStatusText(notice, actor);
      if (notice.viewerOverdue || notice.overdueCount > 0) {
        status.classList.add("kommunikation-card__status--warn");
      } else if (notice.viewerConfirmation?.late || notice.lateCount > 0) {
        status.classList.add("kommunikation-card__status--late");
      }
      meta.appendChild(published);
      meta.appendChild(status);
      card.appendChild(title);
      card.appendChild(snippet);
      card.appendChild(meta);
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
  const back = document.createElement("button");
  back.type = "button";
  back.className = "kommunikation-back";
  back.textContent = "Zurück";
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
    const due = document.createElement("span");
    due.textContent = notice.slaDueAt ? `SLA bis: ${formatTime(notice.slaDueAt)}` : "SLA";
    meta.appendChild(published);
    meta.appendChild(due);

    const summary = document.createElement("div");
    summary.className = "infochannel-detail__summary";
    summary.textContent = `Bestätigt ${notice.confirmedCount || 0}/${notice.targetCount || 0}`;

    content.appendChild(headline);
    content.appendChild(body);
    content.appendChild(meta);
    content.appendChild(summary);

    if (actor.role === "trainer") {
      const confirmWrap = document.createElement("div");
      confirmWrap.className = "infochannel-confirm";
      const status = document.createElement("span");
      status.className = "infochannel-confirm__status";
      const confirmation = detail.confirmation;
      if (confirmation) {
        status.textContent = confirmation.late
          ? `Bestätigt (verspätet) · ${formatTime(confirmation.confirmedAt)}`
          : `Bestätigt · ${formatTime(confirmation.confirmedAt)}`;
      } else if (detail.overdue) {
        status.textContent = "SLA überschritten – Bestätigung ausstehend.";
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
            const late =
              notice.slaDueAt &&
              new Date(confirmedAt).getTime() > new Date(notice.slaDueAt).getTime();
            status.textContent = late
              ? `Bestätigt (verspätet) · ${formatTime(confirmedAt)}`
              : `Bestätigt · ${formatTime(confirmedAt)}`;
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
          status.textContent = entry.late
            ? `Bestätigt (verspätet) · ${formatTime(entry.confirmedAt)}`
            : `Bestätigt · ${formatTime(entry.confirmedAt)}`;
        } else if (entry.status === "overdue") {
          status.textContent = "SLA überschritten";
          status.classList.add("infochannel-targets__status--warn");
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

async function renderChatList(host) {
  host.innerHTML = "";
  const list = document.createElement("div");
  list.className = "kommunikation-list";
  const card = document.createElement("article");
  card.className = "kommunikation-card";
  const title = document.createElement("h3");
  title.className = "kommunikation-card__title";
  title.textContent = "Gruppenchat";

  const preview = document.createElement("p");
  preview.className = "kommunikation-card__snippet";
  preview.textContent = "Lade Nachrichten...";

  const meta = document.createElement("div");
  meta.className = "kommunikation-card__meta";

  const badge = document.createElement("span");
  badge.className = "kommunikation-card__badge";
  badge.hidden = true;

  meta.appendChild(badge);
  card.appendChild(title);
  card.appendChild(preview);
  card.appendChild(meta);
  card.setAttribute("tabindex", "0");
  card.addEventListener("click", () => {
    window.location.hash = "#/kommunikation/chats/global";
  });
  list.appendChild(card);
  host.appendChild(list);

  try {
    const summary = await groupchatClient.listMessages({ limit: MAX_LIST_PREVIEW });
    const last = summary.messages?.[summary.messages.length - 1];
    if (last) {
      preview.textContent = last.body || "Neue Nachricht";
      const time = new Date(last.createdAt);
      const timeLabel = isNaN(time.getTime()) ? "" : ` · ${time.toLocaleString("de-DE")}`;
      preview.textContent = `${last.body}${timeLabel}`;
    } else {
      preview.textContent = "Keine Nachrichten vorhanden.";
    }
    const unread = summary.unreadCount || 0;
    if (unread > 0) {
      badge.textContent = unread > 99 ? "99+" : String(unread);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  } catch (error) {
    preview.textContent = isOffline(error)
      ? "Offline. Laden fehlgeschlagen."
      : "Fehler beim Laden.";
  }
}

async function renderChatDetail(host, actor) {
  host.innerHTML = "";
  const header = document.createElement("div");
  header.className = "kommunikation-chat-header";
  const title = document.createElement("h2");
  title.textContent = "Gruppenchat";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "kommunikation-back";
  back.textContent = "Zurück";
  back.addEventListener("click", () => {
    window.location.hash = "#/kommunikation/chats";
  });
  header.appendChild(back);
  header.appendChild(title);
  host.appendChild(header);

  const banner = document.createElement("div");
  banner.className = "kommunikation-chat-banner";
  banner.hidden = true;
  host.appendChild(banner);

  const retentionNoticeFragment = createNotice("", { variant: "info", role: "status" });
  const retentionNotice = retentionNoticeFragment.firstElementChild;
  if (retentionNotice) {
    retentionNotice.classList.add("kommunikation-chat-retention");
    retentionNotice.hidden = true;
    host.appendChild(retentionNoticeFragment);
  }

  const truncationNoticeFragment = createNotice("", { variant: "warn", role: "status" });
  const truncationNotice = truncationNoticeFragment.firstElementChild;
  if (truncationNotice) {
    truncationNotice.classList.add("kommunikation-chat-retention");
    truncationNotice.hidden = true;
    host.appendChild(truncationNoticeFragment);
  }

  const list = document.createElement("div");
  list.className = "kommunikation-chat-messages";
  host.appendChild(list);

  const composer = document.createElement("div");
  composer.className = "kommunikation-chat-composer";
  composer.innerHTML = `
    <textarea rows="2" placeholder="Nachricht eingeben..."></textarea>
    <div class="kommunikation-composer-actions">
      <span class="kommunikation-composer-status" aria-live="polite"></span>
      <button type="button" class="kommunikation-send">Senden</button>
    </div>
  `;
  host.appendChild(composer);

  async function loadMessages() {
    banner.hidden = true;
    if (retentionNotice) retentionNotice.hidden = true;
    if (truncationNotice) truncationNotice.hidden = true;
    list.innerHTML = "";
    chatState.isLoading = true;
    try {
      const data = await groupchatClient.listMessages({ limit: MESSAGE_PAGE_LIMIT });
      chatState.messages = data.messages || [];
      chatState.nextCursor = data.nextCursor || null;
      chatState.unreadCount = data.unreadCount || 0;
      if (
        retentionNotice &&
        data.retention?.enabled &&
        Number.isInteger(data.retention.retentionDays)
      ) {
        const days = data.retention.retentionDays;
        retentionNotice.querySelector(".ui-notice__content").textContent =
          `Aufbewahrung: Nachrichten werden nach ${days} Tagen automatisch gelöscht.`;
        retentionNotice.hidden = false;
      }
      if (truncationNotice && data.truncated?.dueToRetention) {
        truncationNotice.querySelector(".ui-notice__content").textContent =
          "Ältere Nachrichten sind aufgrund der Aufbewahrungsfrist nicht mehr verfügbar.";
        truncationNotice.hidden = false;
      }
      renderMessages(list, chatState.messages, handleRetry);
      await markRead(chatState.messages);
    } catch (error) {
      chatState.error = error;
      if (isOffline(error)) {
        banner.textContent = "Offline. Verbindung zur Ablage derzeit nicht möglich.";
        banner.hidden = false;
      } else {
        banner.textContent = "Fehler beim Laden der Nachrichten.";
        banner.hidden = false;
      }
    } finally {
      chatState.isLoading = false;
    }
  }

  async function handleSend(bodyText, nonce, statusEl) {
    const trimmed = (bodyText || "").trim();
    if (!trimmed) return;
    const pending = {
      id: `pending-${nonce}`,
      body: trimmed,
      createdAt: new Date().toISOString(),
      authorActorId: actor.id || "ich",
      authorRole: actor.role || "staff",
      status: "pending",
      clientNonce: nonce,
    };
    chatState.messages = [...chatState.messages, pending];
    renderMessages(list, chatState.messages, handleRetry);
    try {
      const response = await groupchatClient.sendMessage({ body: trimmed, clientNonce: nonce });
      const committed = response.message;
      chatState.messages = chatState.messages
        .filter((m) => m.id !== pending.id)
        .concat(committed)
        .sort(compareMessageOrder);
      renderMessages(list, chatState.messages, handleRetry);
      await markRead(chatState.messages);
      statusEl.textContent = "";
    } catch (error) {
      const failed = { ...pending, status: "failed", error };
      chatState.messages = chatState.messages.filter((m) => m.id !== pending.id).concat(failed);
      renderMessages(list, chatState.messages, handleRetry);
      if (error.code === "RATE_LIMITED") {
        statusEl.textContent = "Zu viele Nachrichten – bitte warten.";
      } else if (isOffline(error)) {
        statusEl.textContent = "Offline. Wartet auf Verbindung.";
      } else {
        statusEl.textContent = "Senden fehlgeschlagen.";
      }
    }
  }

  composer.querySelector(".kommunikation-send").addEventListener("click", async () => {
    const textarea = composer.querySelector("textarea");
    const statusEl = composer.querySelector(".kommunikation-composer-status");
    const clientNonce = cryptoRandom();
    const current = textarea.value;
    textarea.value = "";
    await handleSend(current, clientNonce, statusEl);
  });

  await loadMessages();
}

function renderMessages(host, messages, onRetry) {
  host.innerHTML = "";
  if (!messages || messages.length === 0) {
    host.appendChild(createEmptyState("Keine Nachrichten", "Es gibt noch keine Nachrichten."));
    return;
  }
  messages.sort(compareMessageOrder).forEach((msg) => {
    const item = document.createElement("div");
    item.className = "kommunikation-message";
    const header = document.createElement("div");
    header.className = "kommunikation-message__meta";
    const author = document.createElement("span");
    author.textContent = msg.authorRole || msg.authorActorId || "Unbekannt";
    const ts = document.createElement("time");
    ts.dateTime = msg.createdAt;
    ts.textContent = formatTime(msg.createdAt);
    header.appendChild(author);
    header.appendChild(ts);

    const body = document.createElement("p");
    body.className = "kommunikation-message__body";
    body.textContent = msg.body || "";

    const status = document.createElement("span");
    status.className = "kommunikation-message__status";
    if (msg.status === "pending") {
      status.textContent = "Sendet...";
    } else if (msg.status === "failed") {
      status.textContent =
        msg.error?.code === "RATE_LIMITED"
          ? "Zu viele Nachrichten – bitte warten"
          : "Senden fehlgeschlagen – Erneut versuchen";
    }
    if (msg.status === "failed") {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "kommunikation-retry";
      retry.textContent = "Erneut senden";
      retry.addEventListener("click", async () => {
        if (typeof onRetry === "function") {
          const statusEl = host.parentElement?.querySelector(".kommunikation-composer-status");
          const nonce = msg.clientNonce || cryptoRandom();
          await onRetry(msg.body, nonce, statusEl, msg);
        }
      });
      status.appendChild(retry);
    }

    item.appendChild(header);
    item.appendChild(body);
    if (msg.status === "pending" || msg.status === "failed") {
      item.appendChild(status);
    }
    host.appendChild(item);
  });
}

async function handleRetry(bodyText, clientNonce, statusEl, failedMsg) {
  const actor = resolveActor();
  const trimmed = (bodyText || "").trim();
  if (!trimmed) return;
  chatState.messages = chatState.messages.filter((m) => m.id !== failedMsg.id);
  const host = document.querySelector(".kommunikation-chat-messages");
  renderMessages(host, chatState.messages, handleRetry);
  await (async () => {
    const pending = {
      id: `pending-${clientNonce}`,
      body: trimmed,
      createdAt: new Date().toISOString(),
      authorActorId: actor.id || "ich",
      authorRole: actor.role || "staff",
      status: "pending",
    };
    chatState.messages = [...chatState.messages, pending];
    renderMessages(host, chatState.messages, handleRetry);
    try {
      const response = await groupchatClient.sendMessage({ body: trimmed, clientNonce });
      const committed = response.message;
      chatState.messages = chatState.messages
        .filter((m) => m.id !== pending.id)
        .concat(committed)
        .sort(compareMessageOrder);
      renderMessages(host, chatState.messages, handleRetry);
      await markRead(chatState.messages);
      if (statusEl) statusEl.textContent = "";
    } catch (error) {
      const failed = { ...pending, status: "failed", error };
      chatState.messages = chatState.messages.filter((m) => m.id !== pending.id).concat(failed);
      renderMessages(host, chatState.messages, handleRetry);
      if (statusEl) {
        statusEl.textContent =
          error.code === "RATE_LIMITED"
            ? "Zu viele Nachrichten – bitte warten."
            : "Senden fehlgeschlagen.";
      }
    }
  })();
}

async function markRead(messages) {
  if (!messages || messages.length === 0) return;
  const latest = messages[messages.length - 1];
  try {
    await groupchatClient.setReadMarker({ messageId: latest.id });
  } catch (error) {
    // ignore marker errors to avoid blocking UI
    if (typeof console !== "undefined") {
      console.debug("Failed to update read marker", error);
    }
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
  if (actor?.role === "trainer") {
    if (notice.viewerConfirmation) {
      return notice.viewerConfirmation.late ? "Bestätigt (verspätet)" : "Bestätigt";
    }
    return notice.viewerOverdue ? "SLA überschritten" : "Bestätigung ausstehend";
  }
  const target = Number(notice.targetCount || 0);
  const confirmed = Number(notice.confirmedCount || 0);
  const pending = Number(notice.pendingCount || Math.max(0, target - confirmed));
  const parts = [`Bestätigt ${confirmed}/${target}`];
  if (notice.lateCount > 0) {
    parts.push(`${notice.lateCount} verspätet`);
  }
  if (notice.overdueCount > 0 || pending > 0) {
    parts.push(notice.overdueCount > 0 ? `${notice.overdueCount} überfällig` : `${pending} offen`);
  }
  return parts.join(" · ");
}

function compareMessageOrder(a, b) {
  if (a.createdAt < b.createdAt) return -1;
  if (a.createdAt > b.createdAt) return 1;
  return (a.id || "").localeCompare(b.id || "");
}

function cryptoRandom() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
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
