/* globals document, console, window */
import {
  createCard,
  createEmptyState,
  createNotice,
  createSectionHeader,
  createButton,
  createFormRow,
} from "../shared/components/components.js";
import { listHunde } from "../shared/api/hunde.js";
import { injectHundToast } from "./formView.js";

export async function createHundeListView(container) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("hunde-view");

  try {
    const header = createSectionHeader({
      title: "Hunde",
      subtitle: "",
      level: 1,
    });
    container.appendChild(header);

    const noticeFragment = createNotice("Verwalte Hunde und ihre Besitzer.", {
      variant: "info",
    });
    container.appendChild(noticeFragment);
    injectHundToast(container);

    const actionCard = buildActionCard();
    const listCard = buildListCard();
    container.append(actionCard, listCard);

    await populateHundeTable(listCard);
    focusHeading(header);
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
  body.innerHTML = "";
  const actions = document.createElement("div");
  actions.className = "module-actions";
  actions.appendChild(
    createButton({
      label: "Neuer Hund",
      variant: "primary",
      onClick: () => {
        window.location.hash = "#/hunde/new";
      },
    })
  );
  body.appendChild(actions);
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

    const sortState = {
      key: "name",
      direction: "asc",
    };
    const searchState = {
      query: "",
    };
    const searchRow = createFormRow({
      id: "hunde-search",
      label: "Suche",
      placeholder: "Name, Rasse, Geschlecht ...",
      value: "",
      required: false,
    });
    const searchInput = searchRow.querySelector("input");
    if (searchInput) {
      searchInput.type = "search";
      searchInput.addEventListener("input", (event) => {
        searchState.query = event.target.value || "";
        renderRows();
      });
    }
    body.appendChild(searchRow);
    const tableWrapper = document.createElement("div");
    tableWrapper.className = "hunde-list-scroll";
    const table = document.createElement("table");
    table.className = "hunde-list-table";
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const tbody = document.createElement("tbody");

    const columns = [
      {
        key: "status",
        label: "Status",
        value: (hund) => hund.status || "–",
        sortValue: (hund) => (hund.status || "").toLowerCase(),
      },
      {
        key: "name",
        label: "Name",
        value: (hund) => hund.name || "Unbenannter Hund",
        sortValue: (hund) => (hund.name || "").toLowerCase(),
        isLink: true,
      },
      {
        key: "rasse",
        label: "Rasse",
        value: (hund) => hund.rasse || "Unbekannt",
        sortValue: (hund) => (hund.rasse || "").toLowerCase(),
      },
      {
        key: "geschlecht",
        label: "Geschlecht",
        value: (hund) => hund.geschlecht || "–",
        sortValue: (hund) => (hund.geschlecht || "").toLowerCase(),
      },
      {
        key: "geburtsdatum",
        label: "Geburtsdatum",
        value: (hund) => formatDate(hund.geburtsdatum),
        sortValue: (hund) => formatSortDate(hund.geburtsdatum),
      },
    ];

    function normalizeSearch(value) {
      return String(value || "")
        .trim()
        .toLowerCase();
    }

    function matchesSearch(hund, query) {
      if (!query) return true;
      const haystack = [
        hund.code,
        hund.name,
        hund.rufname,
        hund.rasse,
        hund.geschlecht,
        hund.geburtsdatum,
      ]
        .filter(Boolean)
        .map(normalizeSearch)
        .join(" ");
      return haystack.includes(query);
    }

    function updateHeaderState() {
      headerRow.querySelectorAll("th").forEach((th) => {
        const key = th.dataset.sortKey;
        if (!key) return;
        const isActive = key === sortState.key;
        th.setAttribute(
          "aria-sort",
          isActive ? (sortState.direction === "asc" ? "ascending" : "descending") : "none"
        );
        const button = th.querySelector("button");
        if (!button) return;
        const indicator = isActive ? (sortState.direction === "asc" ? "↑" : "↓") : "";
        button.textContent = indicator
          ? `${th.dataset.label} ${indicator}`
          : th.dataset.label || "";
      });
    }

    function renderRows() {
      tbody.innerHTML = "";
      const query = normalizeSearch(searchState.query);
      const filtered = hunde.filter((hund) => matchesSearch(hund, query));
      if (!filtered.length) {
        const row = document.createElement("tr");
        row.className = "hunde-list-row";
        const cell = document.createElement("td");
        cell.colSpan = columns.length;
        cell.textContent = "Keine Treffer.";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
      }

      const rows = filtered
        .map((hund, index) => ({ hund, index }))
        .sort((a, b) => {
          const column = columns.find((col) => col.key === sortState.key);
          const getValue = column?.sortValue || column?.value;
          const aValue = (getValue ? getValue(a.hund) : "").toString();
          const bValue = (getValue ? getValue(b.hund) : "").toString();
          const compare = aValue.localeCompare(bValue, "de", { sensitivity: "base" });
          if (compare !== 0) {
            return sortState.direction === "asc" ? compare : -compare;
          }
          return a.index - b.index;
        });

      rows.forEach(({ hund }) => {
        const row = document.createElement("tr");
        row.className = "hunde-list-row";
        columns.forEach((column) => {
          const cell = document.createElement("td");
          if (column.isLink) {
            const link = document.createElement("a");
            link.href = `#/hunde/${hund.id}`;
            link.className = "hunde-list__link";
            link.textContent = column.value(hund);
            link.setAttribute("aria-label", `Hund ${hund.name || hund.code || hund.id} öffnen`);
            cell.appendChild(link);
          } else {
            cell.textContent = column.value(hund);
          }
          row.appendChild(cell);
        });
        tbody.appendChild(row);
      });
    }

    columns.forEach((column) => {
      const th = document.createElement("th");
      th.dataset.sortKey = column.key;
      th.dataset.label = column.label;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hunde-sort-btn";
      button.addEventListener("click", () => {
        if (sortState.key === column.key) {
          sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
        } else {
          sortState.key = column.key;
          sortState.direction = "asc";
        }
        updateHeaderState();
        renderRows();
      });
      th.appendChild(button);
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.append(thead, tbody);
    tableWrapper.appendChild(table);
    body.appendChild(tableWrapper);
    updateHeaderState();
    renderRows();
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

function formatSortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString();
}

function focusHeading(container) {
  const heading = container.querySelector("h1, h2");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
}

// owner helpers removed (list view is now standalone)
