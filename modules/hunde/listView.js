/* globals document, console, window */
import {
  createCard,
  createEmptyState,
  createNotice,
  createButton,
  createFormRow,
} from "../shared/components/components.js";
import { listHunde } from "../shared/api/hunde.js";
import { listKunden } from "../shared/api/kunden.js";
import { exportTableToXlsx } from "../shared/utils/xlsxExport.js";
import { getSession } from "../shared/auth/client.js";
import { injectHundToast } from "./formView.js";
import { matchesSearchQuery, normalizeSearchText } from "../shared/utils/search.js";

export async function createHundeListView(container) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("hunde-view", "hunde-list-view");

  try {
    injectHundToast(container);

    const role = getSession()?.user?.role || "";
    const canManage = role === "admin" || role === "developer";
    let exportHandler = null;
    const actionCard = canManage ? buildActionCard(() => exportHandler?.()) : null;
    const listCard = buildListCard();
    const section = document.createElement("section");
    section.className = "dogule-section hunde-section hunde-list-stack";
    if (actionCard) {
      section.appendChild(actionCard);
    }
    section.appendChild(listCard);
    container.appendChild(section);

    exportHandler = await populateHundeTable(listCard);
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
    const section = document.createElement("section");
    section.className = "dogule-section hunde-section hunde-list-stack";
    section.appendChild(fallbackCard);
    container.appendChild(section);
  }
}

function buildActionCard(onExport) {
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
  actions.appendChild(
    createButton({
      label: "Export XLSX",
      variant: "secondary",
      onClick: () => onExport?.(),
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
    const [hunde, kunden] = await Promise.all([listHunde(), listKunden()]);
    const kundenById = new Map((kunden || []).map((kunde) => [kunde.id, kunde]));
    body.innerHTML = "";
    if (!hunde.length) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
      return () => {
        window.alert("Keine Daten für den Export verfügbar.");
      };
    }

    const sortState = {
      key: "name",
      direction: "asc",
    };
    const searchState = {
      query: "",
    };
    const filterState = {
      status: "all",
    };
    const paginationState = {
      page: 1,
      pageSize: 50,
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
        paginationState.page = 1;
        renderRows();
      });
    }
    const controlsWrap = document.createElement("div");
    controlsWrap.className = "list-controls";
    controlsWrap.appendChild(searchRow);
    const statusRow = createFormRow({
      id: "hunde-status-filter",
      label: "Status",
      control: "select",
      options: [
        { value: "all", label: "Alle", selected: true },
        { value: "aktiv", label: "Aktiv" },
        { value: "passiv", label: "Passiv" },
        { value: "deaktiviert", label: "Deaktiviert" },
      ],
    });
    const statusSelect = statusRow.querySelector("select");
    if (statusSelect) {
      statusSelect.addEventListener("change", (event) => {
        filterState.status = event.target.value || "all";
        paginationState.page = 1;
        renderRows();
      });
    }
    controlsWrap.appendChild(statusRow);
    const pageSizeRow = createFormRow({
      id: "hunde-page-size",
      label: "Pro Seite",
      control: "select",
      options: [
        { value: "25", label: "25" },
        { value: "50", label: "50", selected: true },
        { value: "100", label: "100" },
        { value: "200", label: "200" },
      ],
    });
    const pageSizeSelect = pageSizeRow.querySelector("select");
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", (event) => {
        const nextSize = Number(event.target.value) || 50;
        paginationState.pageSize = nextSize;
        paginationState.page = 1;
        renderRows();
      });
    }
    controlsWrap.appendChild(pageSizeRow);
    body.appendChild(controlsWrap);
    const tableWrapper = document.createElement("div");
    tableWrapper.className = "hunde-list-scroll";
    const table = document.createElement("table");
    table.className = "hunde-list-table";
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const tbody = document.createElement("tbody");
    const pagination = document.createElement("div");
    pagination.className = "list-pagination";
    const paginationInfo = document.createElement("div");
    paginationInfo.className = "list-pagination__info";
    const paginationActions = document.createElement("div");
    paginationActions.className = "list-pagination__actions";
    const prevBtn = createButton({ label: "Zurück", variant: "secondary" });
    prevBtn.type = "button";
    const pageLabel = document.createElement("span");
    pageLabel.className = "list-pagination__page";
    const nextBtn = createButton({ label: "Weiter", variant: "secondary" });
    nextBtn.type = "button";
    prevBtn.addEventListener("click", () => {
      if (paginationState.page > 1) {
        paginationState.page -= 1;
        renderRows();
      }
    });
    nextBtn.addEventListener("click", () => {
      paginationState.page += 1;
      renderRows();
    });
    paginationActions.append(prevBtn, pageLabel, nextBtn);
    pagination.append(paginationInfo, paginationActions);

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

    function matchesSearch(hund, query) {
      const owner = kundenById.get(hund.kundenId || hund.kundeId || "") || null;
      return matchesSearchQuery(query, {
        textFields: [
          hund.code,
          hund.name,
          hund.rufname,
          hund.rasse,
          hund.geschlecht,
          hund.geburtsdatum,
          hund.herkunft,
          owner?.vorname,
          owner?.nachname,
          owner?.email,
          owner?.ort,
          owner?.adresse,
        ],
        phoneFields: [owner?.telefon, owner?.mobile],
      });
    }

    function matchesFilters(hund) {
      if (filterState.status === "all") return true;
      return normalizeSearchText(hund.status) === filterState.status;
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

    function getDisplayRows() {
      const query = normalizeSearchText(searchState.query);
      const filtered = hunde.filter((hund) => matchesSearch(hund, query) && matchesFilters(hund));
      if (!filtered.length) return [];
      const column = columns.find((col) => col.key === sortState.key) || columns[0];
      const getValue = column?.sortValue || column?.value;
      return filtered
        .map((hund, index) => ({ hund, index }))
        .sort((a, b) => {
          const aValue = (getValue ? getValue(a.hund) : "").toString();
          const bValue = (getValue ? getValue(b.hund) : "").toString();
          const compare = aValue.localeCompare(bValue, "de", { sensitivity: "base" });
          if (compare !== 0) {
            return sortState.direction === "asc" ? compare : -compare;
          }
          return a.index - b.index;
        })
        .map(({ hund }) => hund);
    }

    function getPagedRows(rows) {
      const total = rows.length;
      const pageSize = paginationState.pageSize;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (paginationState.page > totalPages) paginationState.page = totalPages;
      if (paginationState.page < 1) paginationState.page = 1;
      if (!total) {
        return { rows: [], total, totalPages, startIndex: 0, endIndex: 0 };
      }
      const startIndex = (paginationState.page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, total);
      return {
        rows: rows.slice(startIndex, endIndex),
        total,
        totalPages,
        startIndex,
        endIndex,
      };
    }

    function renderPagination(rows = getDisplayRows()) {
      const { total, totalPages, startIndex, endIndex } = getPagedRows(rows);
      const startLabel = total ? startIndex + 1 : 0;
      const endLabel = total ? endIndex : 0;
      paginationInfo.textContent = `Zeige ${startLabel}\u2013${endLabel} von ${total}`;
      pageLabel.textContent = `Seite ${paginationState.page} von ${totalPages}`;
      prevBtn.disabled = !total || paginationState.page <= 1;
      nextBtn.disabled = !total || paginationState.page >= totalPages;
    }

    function renderRows() {
      tbody.innerHTML = "";
      const rows = getDisplayRows();
      const { rows: pageRows } = getPagedRows(rows);
      if (!pageRows.length) {
        const row = document.createElement("tr");
        row.className = "hunde-list-row";
        const cell = document.createElement("td");
        cell.colSpan = columns.length;
        cell.textContent = "Keine Treffer.";
        row.appendChild(cell);
        tbody.appendChild(row);
        renderPagination(rows);
        return;
      }

      pageRows.forEach((hund) => {
        const row = document.createElement("tr");
        row.className = "hunde-list-row";
        row.tabIndex = 0;
        row.addEventListener("click", (event) => {
          if (event.target && event.target.closest("a")) return;
          window.location.hash = `#/hunde/${hund.id}`;
        });
        row.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            window.location.hash = `#/hunde/${hund.id}`;
          }
        });
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
      renderPagination(rows);
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
    body.appendChild(pagination);
    updateHeaderState();
    renderRows();
    return async () => {
      const rows = getDisplayRows();
      if (!rows.length) {
        window.alert("Keine Daten für den Export verfügbar.");
        return;
      }
      await exportTableToXlsx({
        fileName: buildExportFilename("hunde-uebersicht"),
        sheetName: "Hunde",
        columns,
        rows,
      });
    };
  } catch (error) {
    console.error("[HUNDE_ERR_LIST_FETCH]", error);
    body.innerHTML = "";
    body.appendChild(
      createNotice("Fehler beim Laden der Daten.", {
        variant: "warn",
        role: "alert",
      })
    );
    return () => {
      window.alert("Keine Daten für den Export verfügbar.");
    };
  }
}

function buildExportFilename(prefix) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.xlsx`;
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
