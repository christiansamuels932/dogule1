/* globals document, window, console */
import {
  createButton,
  createCard,
  createEmptyState,
  createNotice,
} from "../shared/components/components.js";
import {
  deleteDeveloperActivity,
  listDeveloperActivity,
  listDeveloperBackups,
  triggerDeveloperRestore,
} from "../shared/api/developer.js";
import { getSession } from "../shared/auth/client.js";

const SLOT_LABELS = {
  "24h": "Restore 24h",
  "72h": "Restore 72h",
};

const EVENT_LABELS = {
  admin_action: "Admin-Aktion",
  issue_report: "Problem",
  route_view: "Modul geöffnet",
  ui_click: "Klick",
};

function formatTimestamp(value) {
  if (!value) return "Nicht vorhanden";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nicht vorhanden";
  return date.toLocaleString("de-CH", { dateStyle: "medium", timeStyle: "short" });
}

function createStandardCard(title) {
  const cardFragment = createCard({
    eyebrow: "",
    title,
    body: "",
    footer: "",
  });
  return cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
}

function valueOrDash(value) {
  const normalized = String(value || "").trim();
  return normalized || "–";
}

function buildActorLabel(event) {
  const username = String(event?.actorUsername || "").trim();
  const actorId = String(event?.actorId || "").trim();
  const role = String(event?.actorRole || "").trim();
  const base = username || actorId || "Unbekannt";
  return role ? `${base} (${role})` : base;
}

function buildEventTypeLabel(eventType) {
  return EVENT_LABELS[eventType] || valueOrDash(eventType);
}

function parseIssueDetails(details = "") {
  const raw = String(details || "").trim();
  if (!raw) {
    return { message: "", screenshotUrl: "", activityLines: [] };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { message: raw, screenshotUrl: "", activityLines: [] };
    }
    return {
      message: String(parsed.message || "").trim(),
      screenshotUrl: String(parsed.screenshotUrl || "").trim(),
      capturedAt: String(parsed.capturedAt || "").trim(),
      activityLines: Array.isArray(parsed.activityLines)
        ? parsed.activityLines.map((line) => String(line || "").trim()).filter(Boolean)
        : [],
    };
  } catch {
    return { message: raw, screenshotUrl: "", activityLines: [] };
  }
}

function sortEvents(events = []) {
  return [...events].sort((a, b) =>
    String(b?.createdAt || "").localeCompare(String(a?.createdAt || ""))
  );
}

async function loadDeveloperData() {
  const [backupData, activityData] = await Promise.all([
    listDeveloperBackups(),
    listDeveloperActivity({ limit: 300 }),
  ]);
  return {
    slots: backupData?.slots || {},
    events: sortEvents(activityData?.events || []),
  };
}

function renderBackups(card, slots, statusSlot) {
  const body = card.querySelector(".ui-card__body");
  const footer = card.querySelector(".ui-card__footer");
  body.innerHTML = "";
  footer.innerHTML = "";

  const list = document.createElement("ul");
  list.className = "kunden-list";
  body.append(list, statusSlot);

  const actions = document.createElement("div");
  actions.className = "module-actions";
  footer.appendChild(actions);

  Object.keys(SLOT_LABELS).forEach((slot) => {
    const item = document.createElement("li");
    const label = document.createElement("strong");
    label.textContent = SLOT_LABELS[slot];
    const meta = document.createElement("span");
    meta.textContent = ` — ${formatTimestamp(slots?.[slot]?.mtime)}`;
    item.append(label, meta);
    list.appendChild(item);

    const btn = createButton({ label: SLOT_LABELS[slot], variant: "secondary" });
    btn.type = "button";
    btn.disabled = !slots?.[slot]?.exists;
    btn.addEventListener("click", async () => {
      const confirmed = window.confirm(
        "Datenbank wiederherstellen?\nAlle Änderungen nach diesem Snapshot gehen verloren. Der Dienst wird neu gestartet."
      );
      if (!confirmed) return;
      btn.disabled = true;
      btn.textContent = "Starte Restore ...";
      statusSlot.innerHTML = "";
      try {
        await triggerDeveloperRestore(slot);
        statusSlot.appendChild(
          createNotice("Restore gestartet. Der Dienst wird neu gestartet; bitte kurz warten.", {
            variant: "info",
            role: "status",
          })
        );
      } catch (error) {
        console.error("[DEVELOPER_RESTORE_FAILED]", error);
        statusSlot.appendChild(
          createNotice("Restore fehlgeschlagen.", { variant: "warn", role: "alert" })
        );
        btn.disabled = false;
        btn.textContent = SLOT_LABELS[slot];
      }
    });
    actions.appendChild(btn);
  });
}

function renderIssues(card, events = [], onChanged = null) {
  const body = card.querySelector(".ui-card__body");
  const footer = card.querySelector(".ui-card__footer");
  body.innerHTML = "";
  footer.innerHTML = "";
  const issues = events.filter((event) => event.eventType === "issue_report");
  if (!issues.length) {
    body.appendChild(createEmptyState("Keine Probleme gemeldet.", ""));
    return;
  }
  const list = document.createElement("div");
  list.className = "card-stack-compact";
  issues.forEach((event) => {
    const issueCard = createStandardCard(buildActorLabel(event));
    const issueBody = issueCard.querySelector(".ui-card__body");
    const issueFooter = issueCard.querySelector(".ui-card__footer");
    issueBody.innerHTML = "";
    const details = parseIssueDetails(event.details);
    const meta = document.createElement("p");
    meta.textContent = `${formatTimestamp(event.createdAt)} · ${valueOrDash(event.moduleId)}`;
    const text = document.createElement("p");
    text.textContent = valueOrDash(details.message);
    issueBody.append(meta, text);
    if (details.screenshotUrl) {
      const screenshotLink = document.createElement("a");
      screenshotLink.className = "developer-issue-screenshot";
      screenshotLink.href = details.screenshotUrl;
      screenshotLink.target = "_blank";
      screenshotLink.rel = "noopener noreferrer";
      const image = document.createElement("img");
      image.src = details.screenshotUrl;
      image.alt = "Pagescreenshot zur Problemmeldung";
      screenshotLink.appendChild(image);
      issueBody.appendChild(screenshotLink);
    }
    if (details.activityLines.length) {
      const logTitle = document.createElement("p");
      logTitle.className = "developer-issue-log__title";
      logTitle.textContent = "Aktivitätslog";
      const logList = document.createElement("ol");
      logList.className = "developer-issue-log";
      details.activityLines.slice(0, 15).forEach((line) => {
        const item = document.createElement("li");
        item.textContent = line;
        logList.appendChild(item);
      });
      issueBody.append(logTitle, logList);
    }
    const actions = document.createElement("div");
    actions.className = "module-actions";
    const status = document.createElement("div");
    status.className = "kunden-card-status";
    const confirmBtn = createButton({ label: "Bestätigen", variant: "secondary" });
    confirmBtn.type = "button";
    confirmBtn.addEventListener("click", async () => {
      const confirmed = window.confirm(
        "Problem als erledigt bestätigen und aus der Liste entfernen?"
      );
      if (!confirmed) return;
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Entferne ...";
      status.innerHTML = "";
      try {
        await deleteDeveloperActivity(event.id);
        if (typeof onChanged === "function") {
          await onChanged();
          return;
        }
        issueCard.remove();
      } catch (error) {
        console.error("[DEVELOPER_ISSUE_DELETE_FAILED]", error);
        status.appendChild(
          createNotice("Problem konnte nicht entfernt werden.", {
            variant: "warn",
            role: "alert",
          })
        );
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Bestätigen";
      }
    });
    actions.append(confirmBtn);
    issueFooter.innerHTML = "";
    issueFooter.append(actions, status);
    list.appendChild(issueCard);
  });
  body.appendChild(list);
}

function renderActivity(card, events = []) {
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";
  if (!events.length) {
    body.appendChild(createEmptyState("Keine Aktivität vorhanden.", ""));
    return;
  }

  const filterRow = document.createElement("div");
  filterRow.className = "module-actions";

  const actorSelect = document.createElement("select");
  const eventSelect = document.createElement("select");
  const actorOptions = new Map();

  events.forEach((event) => {
    const key = event.actorId || "";
    if (!key || actorOptions.has(key)) return;
    actorOptions.set(key, buildActorLabel(event));
  });

  [
    { value: "", label: "Alle Benutzer" },
    ...Array.from(actorOptions.entries()).map(([value, label]) => ({ value, label })),
  ].forEach((option) => {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    actorSelect.appendChild(el);
  });

  [
    { value: "", label: "Alle Typen" },
    { value: "route_view", label: buildEventTypeLabel("route_view") },
    { value: "ui_click", label: buildEventTypeLabel("ui_click") },
    { value: "issue_report", label: buildEventTypeLabel("issue_report") },
    { value: "admin_action", label: buildEventTypeLabel("admin_action") },
  ].forEach((option) => {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    eventSelect.appendChild(el);
  });

  const logWrap = document.createElement("div");
  logWrap.className = "developer-activity-log";
  const list = document.createElement("ul");
  list.className = "developer-activity-log__list";

  const renderList = () => {
    list.innerHTML = "";
    const filtered = events.filter((event) => {
      if (actorSelect.value && event.actorId !== actorSelect.value) return false;
      if (eventSelect.value && event.eventType !== eventSelect.value) return false;
      return true;
    });
    if (!filtered.length) {
      const item = document.createElement("li");
      item.className = "developer-activity-log__item developer-activity-log__item--empty";
      item.textContent = "Keine passenden Einträge.";
      list.appendChild(item);
      return;
    }
    filtered.forEach((event) => {
      const item = document.createElement("li");
      item.className = "developer-activity-log__item";
      const line = document.createElement("div");
      line.className = "developer-activity-log__line";
      const summary =
        event.eventType === "issue_report"
          ? valueOrDash(event.details)
          : valueOrDash(event.actionLabel);
      const moduleText = event.moduleId ? ` · ${valueOrDash(event.moduleId)}` : "";
      const routeText = event.routeHash ? ` · ${event.routeHash}` : "";
      line.textContent = `${formatTimestamp(event.createdAt)} · ${buildActorLabel(event)} · ${buildEventTypeLabel(event.eventType)} · ${summary}${moduleText}${routeText}`;
      item.appendChild(line);
      list.appendChild(item);
    });
  };

  actorSelect.addEventListener("change", renderList);
  eventSelect.addEventListener("change", renderList);
  filterRow.append(actorSelect, eventSelect);
  logWrap.appendChild(list);
  body.append(filterRow, logWrap);
  renderList();
}

export async function initModule(container) {
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "dogule-section developer-section card-stack-compact";
  container.appendChild(section);

  const role = getSession()?.user?.role || "";
  if (role !== "developer") {
    section.appendChild(createNotice("Keine Berechtigung.", { variant: "warn", role: "alert" }));
    return;
  }

  const backupCard = createStandardCard("Backups");
  const issuesCard = createStandardCard("Gemeldete Probleme");
  const activityCard = createStandardCard("Aktivitätslog");
  const refreshCard = createStandardCard("Aktionen");
  const refreshBody = refreshCard.querySelector(".ui-card__body");
  refreshBody.innerHTML = "";
  const refreshActions = document.createElement("div");
  refreshActions.className = "module-actions";
  const refreshBtn = createButton({ label: "Aktualisieren", variant: "secondary" });
  refreshBtn.type = "button";
  refreshActions.appendChild(refreshBtn);
  refreshBody.appendChild(refreshActions);

  const backupStatus = document.createElement("div");
  section.append(refreshCard, backupCard, issuesCard, activityCard);

  const render = async () => {
    const cards = [backupCard, issuesCard, activityCard];
    cards.forEach((card) => {
      const body = card.querySelector(".ui-card__body");
      if (body) {
        body.innerHTML = "";
        body.appendChild(createNotice("Lade Daten ...", { variant: "info", role: "status" }));
      }
      const footer = card.querySelector(".ui-card__footer");
      if (footer) footer.innerHTML = "";
    });
    backupStatus.innerHTML = "";
    try {
      const data = await loadDeveloperData();
      renderBackups(backupCard, data.slots, backupStatus);
      renderIssues(issuesCard, data.events, render);
      renderActivity(activityCard, data.events);
    } catch (error) {
      console.error("[DEVELOPER_LOAD_FAILED]", error);
      cards.forEach((card) => {
        const body = card.querySelector(".ui-card__body");
        if (!body) return;
        body.innerHTML = "";
        body.appendChild(
          createNotice("Daten konnten nicht geladen werden.", {
            variant: "warn",
            role: "alert",
          })
        );
      });
    }
  };

  refreshBtn.addEventListener("click", render);
  await render();
}
