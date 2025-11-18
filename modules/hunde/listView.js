/* globals document, console */
import {
  createCard,
  createEmptyState,
  createNotice,
  createSectionHeader,
} from "../shared/components/components.js";
import { listHunde } from "../shared/api/hunde.js";
import { injectHundToast } from "./formView.js";

export async function createHundeListView(container) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("hunde-view");

  try {
    container.appendChild(
      createSectionHeader({
        title: "Hunde",
        subtitle: "",
        level: 2,
      })
    );

    const noticeFragment = createNotice("Verwalte Hunde und ihre Besitzer.", {
      variant: "info",
    });
    container.appendChild(noticeFragment);
    injectHundToast(container);

    const actionCard = buildActionCard();
    const listCard = buildListCard();
    container.append(actionCard, listCard);

    await populateHundeTable(listCard);
    focusHeading(container);
  } catch (error) {
    console.error("[HUNDE_ERR_LIST_INIT]", error);
    container.innerHTML = "";
    const fallbackCard = buildListCard();
    const body = fallbackCard.querySelector(".ui-card__body");
    body.innerHTML = "";
    body.appendChild(
      createNotice("Fehler beim Laden der Daten.", {
        variant: "warn",
        role: "alert",
      })
    );
    container.appendChild(fallbackCard);
  }
}

function buildActionCard() {
  const fragment = createCard({
    eyebrow: "",
    title: "Aktionen",
    body: "",
    footer: "",
  });
  const card = fragment.querySelector(".ui-card") || fragment.firstElementChild;
  const body = card.querySelector(".ui-card__body");
  const link = document.createElement("a");
  link.href = "#/hunde/new";
  link.className = "ui-btn ui-btn--primary";
  link.textContent = "Neuer Hund";
  body.appendChild(link);
  return card;
}

function buildListCard() {
  const fragment = createCard({
    eyebrow: "",
    title: "Hundeübersicht",
    body: "<p>Hunde werden geladen ...</p>",
    footer: "",
  });
  return fragment.querySelector(".ui-card") || fragment.firstElementChild;
}

async function populateHundeTable(cardElement) {
  const body = cardElement.querySelector(".ui-card__body");
  body.textContent = "Hunde werden geladen ...";

  try {
    const hunde = await listHunde();
    body.innerHTML = "";
    if (!hunde.length) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
      return;
    }

    const listWrapper = document.createElement("div");
    listWrapper.className = "hunde-list";
    hunde.forEach((hund) => {
      const hundCardFragment = createCard({
        eyebrow: hund.kundenId || "–",
        title: hund.name || "Unbenannter Hund",
        body: `<p>${hund.rasse || "Unbekannte Rasse"} · ${formatDate(hund.geburtsdatum)}</p>`,
        footer: "",
      });
      const hundCard =
        hundCardFragment.querySelector(".ui-card") || hundCardFragment.firstElementChild;
      if (!hundCard) return;
      hundCard.classList.add("hunde-list-item");
      const link = document.createElement("a");
      link.href = `#/hunde/${hund.id}`;
      link.className = "hunde-list__link";
      link.appendChild(hundCard);
      listWrapper.appendChild(link);
    });
    body.appendChild(listWrapper);
  } catch (error) {
    console.error("[HUNDE_ERR_LIST_FETCH]", error);
    body.innerHTML = "";
    body.appendChild(
      createNotice("Fehler beim Laden der Daten.", {
        variant: "warn",
        role: "alert",
      })
    );
  }
}

function formatDate(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function focusHeading(container) {
  const heading = container.querySelector("h1, h2");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
}
