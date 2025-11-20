// Dashboard has no entity IDs; ID override controls are not applicable (Station 18 verification).
// Dashboard has no form views; verified for Station 18
// Standardized module interface for Dogule1
/* globals document, window, console */
import {
  createBadge,
  createCard,
  createEmptyState,
  createNotice,
  createSectionHeader,
} from "../shared/components/components.js";
import { listKunden } from "../shared/api/kunden.js";
import { listHunde } from "../shared/api/hunde.js";
import { listKurse } from "../shared/api/kurse.js";

export async function initModule(container) {
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

  const [actionsCard, metricsCard] = await Promise.all([buildActionsCard(), buildMetricsCard()]);

  overviewSection.appendChild(actionsCard);
  overviewSection.appendChild(metricsCard);

  fragment.appendChild(overviewSection);
  container.appendChild(fragment);

  window.scrollTo(0, 0);
  const heading = container.querySelector(".ui-section__title");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }
}

async function buildActionsCard() {
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
  try {
    const [kunden, hunde, kurse] = await Promise.all([listKunden(), listHunde(), listKurse()]);
    const quickActions = [
      { label: `Kunden (${kunden.length})`, hash: "#/kunden" },
      { label: `Hunde (${hunde.length})`, hash: "#/hunde" },
      { label: `Kurse (${kurse.length})`, hash: "#/kurse" },
    ];
    if (!quickActions.length) {
      bodyEl.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
      return cardElement;
    }

    quickActions.forEach((action) => {
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
  } catch (error) {
    console.error("DASHBOARD_ACTIONS_LOAD_FAILED", error);
    bodyEl.textContent = "Fehler beim Laden der Daten.";
  }

  return cardElement;
}

async function buildMetricsCard() {
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
  try {
    const [kunden, hunde, kurse] = await Promise.all([listKunden(), listHunde(), listKurse()]);
    const offeneKurse = kurse.filter((kurs) => kurs.status === "offen").length;
    const metrics = [
      {
        label: "Kunden",
        value: String(kunden.length),
        badge: kunden.length
          ? { text: "Aktiv", variant: "ok" }
          : { text: "Keine Kunden", variant: "warn" },
      },
      {
        label: "Hunde",
        value: String(hunde.length),
        badge: hunde.length
          ? { text: "Betreuung läuft", variant: "info" }
          : { text: "Keine Hunde", variant: "warn" },
      },
      {
        label: "Kurse offen",
        value: String(offeneKurse),
        badge: { text: `${kurse.length} gesamt`, variant: "info" },
      },
    ];
    if (!metrics.length) {
      bodyEl.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
      return cardElement;
    }

    metrics.forEach((metric) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `<strong>${metric.label}</strong><p>${metric.value}</p>`;
      if (metric.badge) {
        const badge = createBadge(metric.badge.text, metric.badge.variant);
        wrapper.appendChild(badge);
      }
      bodyEl.appendChild(wrapper);
    });
  } catch (error) {
    console.error("DASHBOARD_METRICS_LOAD_FAILED", error);
    bodyEl.textContent = "Fehler beim Laden der Daten.";
  }

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
    // Console output stays limited to standardized dashboard error codes.
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
