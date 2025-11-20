// Standardized module interface for Dogule1
/* globals document, window */
import {
  createBadge,
  createButton,
  createCard,
  createEmptyState,
  createNotice,
  createSectionHeader,
} from "../shared/components/components.js";

const QUICK_ACTIONS = [
  { label: "Neuer Kurs", hash: "#/kurse" },
  { label: "Neuer Kunde", hash: "#/kunden" },
  { label: "Termin anlegen", hash: "#/kalender" },
];

const METRICS = [
  { label: "Kundenstatus", value: "Aktiv", badge: { text: "Stabil", variant: "info" } },
  { label: "Kurse heute", value: "6", badge: { text: "Planmäßig", variant: "ok" } },
  { label: "Offene Aufgaben", value: "0", badge: { text: "Alles erledigt", variant: "info" } },
];

export function initModule(container) {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  fragment.appendChild(
    createSectionHeader({
      title: "Dashboard",
      level: 1,
    })
  );

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
  if (!cardElement) {
    const fallback = document.createElement("div");
    fallback.textContent = "Fehler beim Laden der Daten.";
    return fallback;
  }

  const bodyEl = cardElement.querySelector(".ui-card__body");
  if (!bodyEl) {
    const fallback = document.createElement("p");
    fallback.textContent = "Fehler beim Laden der Daten.";
    cardElement.appendChild(fallback);
    return cardElement;
  }
  if (!QUICK_ACTIONS.length) {
    bodyEl.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
    return cardElement;
  }

  QUICK_ACTIONS.forEach((action) => {
    const button = createButton({
      label: action.label,
      variant: "primary",
      onClick: () => {
        if (action.hash) {
          window.location.hash = action.hash;
        }
      },
    });
    bodyEl.appendChild(button);
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
  if (!cardElement) {
    const fallback = document.createElement("div");
    fallback.textContent = "Fehler beim Laden der Daten.";
    return fallback;
  }

  const bodyEl = cardElement.querySelector(".ui-card__body");
  if (!bodyEl) {
    const fallback = document.createElement("p");
    fallback.textContent = "Fehler beim Laden der Daten.";
    cardElement.appendChild(fallback);
    return cardElement;
  }
  if (!METRICS.length) {
    bodyEl.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
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
