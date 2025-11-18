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
        subtitle: "Überblick über alle Hunde in der Hundeschule",
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
    container.appendChild(
      createNotice("Hunde konnten nicht geladen werden. Bitte später erneut versuchen.", {
        variant: "warn",
        role: "alert",
      })
    );
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

    body.appendChild(buildTable(hunde));
  } catch (error) {
    console.error("[HUNDE_ERR_LIST_FETCH]", error);
    body.innerHTML = "";
    body.appendChild(
      createNotice("Fehler beim Laden der Hunde. Bitte versuche es erneut.", {
        variant: "warn",
        role: "alert",
      })
    );
  }
}

function buildTable(hunde) {
  const table = document.createElement("table");
  table.className = "hunde-table";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Name", "Rasse", "Geburtsdatum", "Kunden-ID", "Aktionen"].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  hunde.forEach((hund) => {
    const row = document.createElement("tr");
    [
      hund.name || "–",
      hund.rasse || "–",
      formatDate(hund.geburtsdatum),
      hund.kundenId || "–",
    ].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    const detailsLink = document.createElement("a");
    detailsLink.href = `#/hunde/${hund.id}`;
    detailsLink.className = "ui-btn ui-btn--secondary";
    detailsLink.textContent = "Details";
    actionCell.appendChild(detailsLink);
    row.appendChild(actionCell);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  return table;
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
