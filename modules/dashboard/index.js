// Dashboard has no form views; verified for Station 18
// Standardized module interface for Dogule1
/* globals document, console */
import {
  createBadge,
  createCard,
  createEmptyState,
  createNotice,
  createSectionHeader,
} from "../shared/components/components.js";

const QUICK_ACTIONS = [
  { label: "Zu den Kunden", href: "#/kunden" },
  { label: "Zu den Hunden", href: "#/hunde" },
  { label: "Zu den Kursen", href: "#/kurse" },
];

const METRICS = [
  { label: "Kundenstatus", value: "Aktiv", badge: { text: "Stabil", variant: "info" } },
  { label: "Kurse heute", value: "6", badge: { text: "Planmäßig", variant: "ok" } },
  { label: "Offene Aufgaben", value: "0", badge: { text: "Alles erledigt", variant: "info" } },
];

export function initModule(container) {
  if (!container) return;
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const overviewSection = document.createElement("section");
  overviewSection.className = "dogule-section";
  overviewSection.appendChild(
    createSectionHeader({
      title: "Übersicht",
      subtitle: "Schnellzugriff und Status",
      level: 1,
    })
  );
  const statusCard = createStandardCard();
  const statusBody = statusCard.querySelector(".ui-card__body");
  resetCardBody(statusBody);
  statusBody.appendChild(
    createNotice("Alles betriebsbereit.", {
      variant: "ok",
      role: "status",
    })
  );
  overviewSection.appendChild(statusCard);
  appendSectionCard(overviewSection, buildActionsCard, "[DASHBOARD_ERR_ACTIONS]");
  appendSectionCard(overviewSection, buildMetricsCard, "[DASHBOARD_ERR_METRICS]");
  fragment.appendChild(overviewSection);
  container.appendChild(fragment);
}

function buildActionsCard() {
  const cardElement = createStandardCard("Schnellaktionen");
  if (!cardElement) return document.createDocumentFragment();

  const bodyEl = cardElement.querySelector(".ui-card__body");
  resetCardBody(bodyEl);
  if (!QUICK_ACTIONS.length) {
    appendStandardEmptyState(bodyEl);
    return cardElement;
  }

  const list = document.createElement("ul");
  list.className = "dashboard-list";
  QUICK_ACTIONS.forEach((action) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "ui-btn ui-btn--primary";
    link.href = action.href;
    link.textContent = action.label;
    item.appendChild(link);
    list.appendChild(item);
  });
  bodyEl.appendChild(list);

  return cardElement;
}

function buildMetricsCard() {
  const cardElement = createStandardCard("Kennzahlen");
  if (!cardElement) return document.createDocumentFragment();

  const bodyEl = cardElement.querySelector(".ui-card__body");
  resetCardBody(bodyEl);
  if (!METRICS.length) {
    appendStandardEmptyState(bodyEl);
    return cardElement;
  }

  const list = document.createElement("ul");
  list.className = "dashboard-list";
  METRICS.forEach((metric) => {
    const item = document.createElement("li");
    const label = document.createElement("strong");
    label.textContent = metric.label;
    const value = document.createElement("span");
    value.textContent = metric.value;
    item.appendChild(label);
    item.appendChild(document.createTextNode(" "));
    item.appendChild(value);
    if (metric.badge) {
      item.appendChild(document.createTextNode(" "));
      item.appendChild(createBadge(metric.badge.text, metric.badge.variant));
    }
    list.appendChild(item);
  });

  bodyEl.appendChild(list);

  return cardElement;
}

function appendSectionCard(section, builder, errorCode) {
  try {
    const node = builder();
    if (node) {
      section.appendChild(node);
    }
  } catch (error) {
    console.error(errorCode, error);
    section.appendChild(buildErrorCard());
  }
}

function resetCardBody(target) {
  if (target) {
    target.innerHTML = "";
  }
}

function appendStandardEmptyState(target) {
  if (!target) return;
  target.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
}

function buildErrorCard() {
  const cardElement = createStandardCard("Fehler");
  if (!cardElement) return document.createDocumentFragment();
  const body = cardElement.querySelector(".ui-card__body");
  resetCardBody(body);
  body.appendChild(
    createNotice("Fehler beim Laden der Daten.", {
      variant: "warn",
      role: "alert",
    })
  );
  return cardElement;
}

function createStandardCard(title = "") {
  const cardFragment = createCard({
    eyebrow: "",
    title,
    body: "",
    footer: "",
  });
  return cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
}
