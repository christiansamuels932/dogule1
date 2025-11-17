// Standardized module interface for Dogule1
/* globals document */
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
      level: 2,
    })
  );

  overviewSection.appendChild(
    createNotice("Alles betriebsbereit.", {
      variant: "ok",
      role: "status",
    })
  );

  overviewSection.appendChild(buildActionsCard());
  overviewSection.appendChild(buildMetricsCard());

  fragment.appendChild(overviewSection);
  container.appendChild(fragment);
}

function buildActionsCard() {
  const cardFragment = createCard({
    eyebrow: "",
    title: "Schnellaktionen",
    body: "",
    footer: "",
  });
  const cardElement = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!cardElement) return document.createDocumentFragment();

  const bodyEl = cardElement.querySelector(".ui-card__body");
  if (!QUICK_ACTIONS.length) {
    bodyEl.appendChild(createEmptyState("Keine Daten vorhanden.", "Fügen Sie Inhalte hinzu."));
    return cardElement;
  }

  QUICK_ACTIONS.forEach((action) => {
    const link = document.createElement("a");
    link.className = "ui-btn ui-btn--primary";
    link.href = action.href;
    link.textContent = action.label;
    bodyEl.appendChild(link);
  });

  return cardElement;
}

function buildMetricsCard() {
  const cardFragment = createCard({
    eyebrow: "",
    title: "Kennzahlen",
    body: "",
    footer: "",
  });
  const cardElement = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!cardElement) return document.createDocumentFragment();

  const bodyEl = cardElement.querySelector(".ui-card__body");
  if (!METRICS.length) {
    bodyEl.appendChild(createEmptyState("Keine Daten vorhanden.", "Fügen Sie Inhalte hinzu."));
    return cardElement;
  }

  METRICS.forEach((metric) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<strong>${metric.label}</strong><p>${metric.value}</p>`;
    if (metric.badge) {
      const badge = createBadge(metric.badge.text, metric.badge.variant);
      wrapper.appendChild(badge);
    }
    bodyEl.appendChild(wrapper);
  });

  return cardElement;
}
