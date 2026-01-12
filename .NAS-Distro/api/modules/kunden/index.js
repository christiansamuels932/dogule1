// Kunden module – list/detail/form flows with mock API
/* globals document, console, window, FileReader */
import {
  listKunden,
  getKunde,
  createKunde,
  updateKunde,
  deleteKunde,
} from "../shared/api/kunden.js";
import { listHunde, createHund } from "../shared/api/hunde.js";
import { listKurse } from "../shared/api/kurse.js";
import { listFinanzen } from "../shared/api/finanzen.js";
import { listWarenByKundeId } from "../shared/api/waren.js";
import { exportTableToXlsx } from "../shared/utils/xlsxExport.js";
import {
  createSectionHeader,
  createCard,
  createEmptyState,
  createNotice,
  createFormRow,
  createButton,
} from "../shared/components/components.js";

let kundenCache = [];
const TOAST_KEY = "__DOGULE_KUNDEN_TOAST__";
const COLUMN_STORAGE_KEY = "__DOGULE_KUNDEN_COLUMNS__";

function createSectionBlock({ title, subtitle = "", level = 2, className = "" } = {}) {
  const section = document.createElement("section");
  const baseClass = "dogule-section kunden-section";
  section.className = className ? `${baseClass} ${className}` : baseClass;
  section.appendChild(
    createSectionHeader({
      title,
      subtitle,
      level,
    })
  );
  return section;
}

function createStandardCard(title = "", eyebrow = "") {
  const fragment = createCard({
    eyebrow,
    title,
    body: "",
    footer: "",
  });
  return fragment.querySelector(".ui-card") || fragment.firstElementChild;
}

function createUiLink(label, href, variant = "primary") {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  link.className = "ui-btn";
  if (variant) {
    link.classList.add(`ui-btn--${variant}`);
  }
  return link;
}

function appendSharedEmptyState(target) {
  if (!target) return;
  const fragment = createEmptyState("Keine Daten vorhanden.", "");
  target.appendChild(fragment);
}

function createErrorNotice() {
  return createNotice("Fehler beim Laden der Daten.", {
    variant: "warn",
    role: "alert",
  });
}

function showErrorNotice(target, { replace = true } = {}) {
  if (!target) return;
  if (replace) {
    target.innerHTML = "";
  }
  target.appendChild(createErrorNotice());
}

function mapToneToNoticeVariant(tone = "info") {
  if (tone === "success") return "ok";
  if (tone === "error" || tone === "warn") return "warn";
  return "info";
}

function normalizeColumnOrder(order = [], defaults = []) {
  const unique = new Set(order.filter((key) => defaults.includes(key)));
  defaults.forEach((key) => {
    if (!unique.has(key)) unique.add(key);
  });
  return Array.from(unique);
}

function loadColumnOrder(defaults = []) {
  if (typeof window === "undefined" || !window.localStorage) {
    return [...defaults];
  }
  try {
    const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return [...defaults];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...defaults];
    return normalizeColumnOrder(parsed, defaults);
  } catch (error) {
    console.warn("[KUNDEN_COLUMNS_LOAD]", error);
    return [...defaults];
  }
}

function saveColumnOrder(order = []) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(order));
  } catch (error) {
    console.warn("[KUNDEN_COLUMNS_SAVE]", error);
  }
}

function buildHundeByKundeId(hunde = []) {
  const map = new Map();
  hunde.forEach((hund) => {
    if (!hund.kundenId) return;
    if (!map.has(hund.kundenId)) {
      map.set(hund.kundenId, []);
    }
    map.get(hund.kundenId).push(hund);
  });
  return map;
}

function formatHundName(hund = {}) {
  return hund.name || hund.rufname || hund.code || hund.hundeId || "";
}

function getHundeNamenString(kunde = {}, hundeByKundeId) {
  const hunde = hundeByKundeId?.get(kunde.id) || [];
  const names = hunde.map(formatHundName).filter((name) => name && name.trim());
  return names.length ? names.join(", ") : "";
}

function formatHundeNamenForKunde(kunde = {}, hundeByKundeId) {
  const names = getHundeNamenString(kunde, hundeByKundeId);
  return names || "–";
}

function buildExportFilename(prefix) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.xlsx`;
}

export async function initModule(container, routeContext = { segments: [] }) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("kunden-view");
  const viewRoot = document.createElement("div");
  viewRoot.className = "kunden-view__content";
  container.appendChild(viewRoot);

  if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const { view, id } = resolveView(routeContext);

  try {
    if (view === "list") {
      await renderList(viewRoot);
    } else if (view === "detail" && id) {
      await renderDetail(viewRoot, id);
    } else if (view === "create" || (view === "edit" && id)) {
      await renderForm(viewRoot, view, id);
    } else {
      renderUnknownView(viewRoot);
    }
  } catch (error) {
    console.error("[KUNDEN_ERR_ROUTE]", error);
    renderLoadError(viewRoot);
  }
}

function renderUnknownView(root) {
  if (!root) return;
  root.innerHTML = "";
  const section = createSectionBlock({
    title: "Unbekannte Ansicht",
    subtitle: "Diese Route wird aktuell nicht unterstützt.",
    level: 1,
  });
  section.appendChild(createErrorNotice());
  const note = document.createElement("p");
  note.textContent = `Der Pfad "${window.location.hash}" wird noch nicht unterstützt.`;
  section.appendChild(note);
  section.appendChild(createUiLink("Zur Kundenliste", "#/kunden", "quiet"));
  root.appendChild(section);
  focusHeading(root);
}

function renderLoadError(root) {
  if (!root) return;
  root.innerHTML = "";
  const section = createSectionBlock({
    title: "Fehler",
    subtitle: "Die Kundenansicht konnte nicht geladen werden.",
    level: 1,
  });
  section.appendChild(createErrorNotice());
  section.appendChild(createUiLink("Zur Kundenliste", "#/kunden", "quiet"));
  root.appendChild(section);
  focusHeading(root);
}

function resolveView(routeContext = {}) {
  const segments = routeContext.segments || [];
  if (!segments.length) return { view: "list" };
  const [first, second] = segments;
  if (first === "new") return { view: "create" };
  if (second === "edit") return { view: "edit", id: first };
  return { view: "detail", id: first };
}

async function fetchKunden() {
  kundenCache = await listKunden();
  return kundenCache;
}

function focusHeading(root) {
  if (!root) return;
  const heading = root.querySelector("h1, h2");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }
}

async function renderList(root) {
  if (!root) return;
  root.innerHTML = "";

  const section = createSectionBlock({
    title: "Kunden",
    subtitle: "Übersicht über alle Kundinnen und Kunden",
    level: 1,
  });
  injectToast(section);
  section.appendChild(
    createNotice("Verwalte Stammdaten, verbundene Hunde und Kurse an einem Ort.", {
      variant: "info",
    })
  );

  const actionsCard = createStandardCard("Aktionen");
  const actionBody = actionsCard.querySelector(".ui-card__body");
  actionBody.innerHTML = "";
  const actionWrap = document.createElement("div");
  actionWrap.className = "module-actions";
  let exportHandler = null;
  let toggleColumnsHandler = null;
  let toggleColumnsButton = null;
  actionWrap.appendChild(
    createButton({
      label: "Neuer Kunde",
      variant: "primary",
      onClick: () => {
        window.location.hash = "#/kunden/new";
      },
    })
  );
  actionWrap.appendChild(
    createButton({
      label: "Export XLSX",
      variant: "secondary",
      onClick: () => exportHandler?.(),
    })
  );
  toggleColumnsButton = createButton({
    label: "Spalten anpassen",
    variant: "quiet",
    onClick: () => toggleColumnsHandler?.(),
  });
  toggleColumnsButton.type = "button";
  toggleColumnsButton.setAttribute("aria-expanded", "false");
  actionWrap.appendChild(toggleColumnsButton);
  actionBody.appendChild(actionWrap);

  const listCard = createStandardCard("Kundenliste");
  const listBody = listCard.querySelector(".ui-card__body");
  listBody.innerHTML = "";

  let kunden = [];
  let hunde = [];
  let hundeLoadFailed = false;
  try {
    kunden = await fetchKunden();
  } catch (error) {
    console.error("[KUNDEN_ERR_LIST_LOAD]", error);
    showErrorNotice(listBody);
    section.append(actionsCard, listCard);
    root.appendChild(section);
    focusHeading(root);
    return;
  }
  try {
    hunde = await listHunde();
  } catch (error) {
    hundeLoadFailed = true;
    hunde = [];
    console.error("[KUNDEN_ERR_LIST_HUNDE]", error);
  }

  if (!kunden.length) {
    appendSharedEmptyState(listBody);
    exportHandler = () => {
      window.alert("Keine Daten für den Export verfügbar.");
    };
    toggleColumnsHandler = () => {
      window.alert("Keine Spalten zum Anpassen verfügbar.");
    };
  } else {
    const hundeByKundeId = buildHundeByKundeId(hunde);
    const sortState = {
      key: "status",
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
      id: "kunden-search",
      label: "Suche",
      placeholder: "Name, E-Mail, Ort, Status ...",
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
      id: "kunden-status-filter",
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
      id: "kunden-page-size",
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
    listBody.appendChild(controlsWrap);
    if (hundeLoadFailed) {
      listBody.appendChild(
        createNotice("Hunde konnten nicht geladen werden. Die Spalte Hunde bleibt leer.", {
          variant: "warn",
        })
      );
    }
    const columnControls = document.createElement("div");
    columnControls.className = "kunden-columns-config";
    columnControls.hidden = true;
    columnControls.style.display = "none";
    toggleColumnsHandler = () => {
      const nextHidden = !columnControls.hidden;
      columnControls.hidden = nextHidden;
      columnControls.style.display = nextHidden ? "none" : "flex";
      columnControls.classList.toggle("is-open", !nextHidden);
      if (toggleColumnsButton) {
        toggleColumnsButton.textContent = nextHidden ? "Spalten anpassen" : "Spalten schließen";
        toggleColumnsButton.setAttribute("aria-expanded", String(!nextHidden));
      }
    };
    listBody.appendChild(columnControls);
    const tableWrapper = document.createElement("div");
    tableWrapper.className = "kunden-list-scroll";
    const table = document.createElement("table");
    table.className = "kunden-list-table";
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

    const columnDefinitions = {
      status: {
        key: "status",
        label: "Status",
        value: (kunde) => valueOrDash(formatKundenStatus(kunde.status)),
        sortValue: (kunde) => buildStatusSortValue(kunde),
      },
      nachname: {
        key: "nachname",
        label: "Name",
        value: (kunde) => valueOrDash(kunde.nachname),
        sortValue: (kunde) => (kunde.nachname || "").toLowerCase(),
        isLink: true,
      },
      vorname: {
        key: "vorname",
        label: "Vorname",
        value: (kunde) => valueOrDash(kunde.vorname),
        sortValue: (kunde) => (kunde.vorname || "").toLowerCase(),
      },
      hundeNamen: {
        key: "hundeNamen",
        label: "Hunde, Name",
        value: (kunde) => formatHundeNamenForKunde(kunde, hundeByKundeId),
        sortValue: (kunde) => getHundeNamenString(kunde, hundeByKundeId).toLowerCase(),
      },
      telefon: {
        key: "telefon",
        label: "Telefon",
        value: (kunde) => valueOrDash(kunde.telefon),
        sortValue: (kunde) => (kunde.telefon || "").toLowerCase(),
      },
      email: {
        key: "email",
        label: "E-Mail",
        value: (kunde) => valueOrDash(kunde.email),
        sortValue: (kunde) => (kunde.email || "").toLowerCase(),
      },
      ort: {
        key: "ort",
        label: "Ort",
        value: (kunde) => valueOrDash(extractTown(kunde.adresse || kunde.address || "")),
        sortValue: (kunde) => extractTown(kunde.adresse || kunde.address || "").toLowerCase(),
      },
    };
    const defaultColumnOrder = ["nachname", "vorname", "hundeNamen", "telefon", "email", "ort"];
    let columnOrder = loadColumnOrder(defaultColumnOrder);

    function getOrderedColumns() {
      return [
        columnDefinitions.status,
        ...columnOrder.map((key) => columnDefinitions[key]).filter(Boolean),
      ];
    }

    function normalizeSearch(value) {
      return String(value || "")
        .trim()
        .toLowerCase();
    }

    function buildStatusSortValue(kunde) {
      const normalized = String(kunde.status || "")
        .trim()
        .toLowerCase();
      let rank = 3;
      if (normalized === "aktiv") rank = 0;
      else if (normalized === "passiv") rank = 1;
      else if (normalized === "deaktiviert") rank = 2;
      const name = `${kunde.nachname || ""} ${kunde.vorname || ""}`.trim().toLowerCase();
      return `${String(rank).padStart(2, "0")}|${name}`;
    }

    function matchesSearch(kunde, query) {
      if (!query) return true;
      const haystack = [
        kunde.code,
        kunde.vorname,
        kunde.nachname,
        formatKundenStatus(kunde.status),
        kunde.status,
        getHundeNamenString(kunde, hundeByKundeId),
        kunde.email,
        kunde.telefon,
        extractTown(kunde.adresse || kunde.address || ""),
        kunde.adresse,
      ]
        .filter(Boolean)
        .map(normalizeSearch)
        .join(" ");
      return haystack.includes(query);
    }

    function matchesFilters(kunde) {
      if (filterState.status === "all") return true;
      return normalizeSearch(kunde.status) === filterState.status;
    }

    function renderColumnControls() {
      columnControls.innerHTML = "";
      const title = document.createElement("p");
      title.className = "kunden-columns-title";
      title.textContent = "Spaltenreihenfolge (Status bleibt fixiert).";
      columnControls.appendChild(title);

      columnOrder.forEach((key, index) => {
        const column = columnDefinitions[key];
        if (!column) return;
        const row = document.createElement("div");
        row.className = "kunden-columns-row";
        const label = document.createElement("span");
        label.textContent = column.label;
        const actions = document.createElement("div");
        actions.className = "kunden-columns-actions";
        const moveLeft = createButton({ label: "◀", variant: "quiet" });
        moveLeft.type = "button";
        moveLeft.classList.add("kunden-columns-move");
        moveLeft.disabled = index === 0;
        moveLeft.addEventListener("click", () => moveColumn(key, -1));
        const moveRight = createButton({ label: "▶", variant: "quiet" });
        moveRight.type = "button";
        moveRight.classList.add("kunden-columns-move");
        moveRight.disabled = index === columnOrder.length - 1;
        moveRight.addEventListener("click", () => moveColumn(key, 1));
        actions.append(moveLeft, moveRight);
        row.append(label, actions);
        columnControls.appendChild(row);
      });

      const resetWrap = document.createElement("div");
      resetWrap.className = "kunden-columns-reset";
      const resetBtn = createButton({
        label: "Standardspalten wiederherstellen",
        variant: "secondary",
        onClick: () => {
          columnOrder = [...defaultColumnOrder];
          saveColumnOrder(columnOrder);
          renderColumnControls();
          renderHeader();
          renderRows();
        },
      });
      resetBtn.type = "button";
      resetWrap.appendChild(resetBtn);
      columnControls.appendChild(resetWrap);
    }

    function moveColumn(key, direction) {
      const index = columnOrder.indexOf(key);
      if (index < 0) return;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= columnOrder.length) return;
      const nextOrder = [...columnOrder];
      nextOrder.splice(index, 1);
      nextOrder.splice(nextIndex, 0, key);
      columnOrder = nextOrder;
      saveColumnOrder(columnOrder);
      renderColumnControls();
      renderHeader();
      renderRows();
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
      const query = normalizeSearch(searchState.query);
      const filtered = kunden.filter(
        (kunde) => matchesSearch(kunde, query) && matchesFilters(kunde)
      );
      if (!filtered.length) return [];
      const column = columnDefinitions[sortState.key] || columnDefinitions.status;
      const getValue = column?.sortValue || column?.value;
      return filtered
        .map((kunde, index) => ({ kunde, index }))
        .sort((a, b) => {
          const aValue = (getValue ? getValue(a.kunde) : "").toString();
          const bValue = (getValue ? getValue(b.kunde) : "").toString();
          const compare = aValue.localeCompare(bValue, "de", { sensitivity: "base" });
          if (compare !== 0) {
            return sortState.direction === "asc" ? compare : -compare;
          }
          return a.index - b.index;
        })
        .map(({ kunde }) => kunde);
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

    function renderHeader() {
      const columns = getOrderedColumns();
      headerRow.innerHTML = "";
      columns.forEach((column) => {
        const th = document.createElement("th");
        th.dataset.sortKey = column.key;
        th.dataset.label = column.label;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "kunden-sort-btn";
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
      updateHeaderState();
    }

    function renderRows() {
      tbody.innerHTML = "";
      const columns = getOrderedColumns();
      const rows = getDisplayRows();
      const { rows: pageRows } = getPagedRows(rows);
      if (!pageRows.length) {
        const row = document.createElement("tr");
        row.className = "kunden-list-row";
        const cell = document.createElement("td");
        cell.colSpan = columns.length;
        cell.textContent = "Keine Treffer.";
        row.appendChild(cell);
        tbody.appendChild(row);
        renderPagination(rows);
        return;
      }

      pageRows.forEach((kunde) => {
        const row = document.createElement("tr");
        row.className = "kunden-list-row";
        columns.forEach((column) => {
          const cell = document.createElement("td");
          if (column.isLink) {
            const link = document.createElement("a");
            link.href = `#/kunden/${kunde.id}`;
            link.className = "kunden-list__link";
            link.textContent = column.value(kunde);
            link.setAttribute("aria-label", `${formatFullName(kunde)} öffnen`);
            cell.appendChild(link);
          } else {
            cell.textContent = column.value(kunde);
          }
          row.appendChild(cell);
        });
        tbody.appendChild(row);
      });
      renderPagination(rows);
    }

    thead.appendChild(headerRow);
    table.append(thead, tbody);
    tableWrapper.appendChild(table);
    listBody.appendChild(tableWrapper);
    listBody.appendChild(pagination);
    renderColumnControls();
    renderHeader();
    renderRows();

    exportHandler = async () => {
      const columns = getOrderedColumns();
      const rows = getDisplayRows();
      if (!rows.length) {
        window.alert("Keine Daten für den Export verfügbar.");
        return;
      }
      await exportTableToXlsx({
        fileName: buildExportFilename("kunden-uebersicht"),
        sheetName: "Kunden",
        columns,
        rows,
      });
    };
  }

  section.append(actionsCard, listCard);
  root.appendChild(section);
  focusHeading(root);
}

async function renderDetail(root, id) {
  if (!root) return;
  let kunde = null;
  try {
    if (!kundenCache.length) {
      await fetchKunden();
    }
    kunde = kundenCache.find((k) => k.id === id);
    if (!kunde) {
      kunde = await getKunde(id);
    }
  } catch (error) {
    console.error("[KUNDEN_ERR_DETAIL_LOAD]", error);
    root.innerHTML = "";
    const fallbackSection = document.createElement("section");
    fallbackSection.className = "dogule-section kunden-section kunden-detail";
    fallbackSection.appendChild(
      createSectionHeader({
        title: "Kunde",
        subtitle: "",
        level: 1,
      })
    );
    const errorCard = createStandardCard("Stammdaten");
    const errorBody = errorCard.querySelector(".ui-card__body");
    showErrorNotice(errorBody);
    fallbackSection.appendChild(errorCard);
    root.appendChild(fallbackSection);
    focusHeading(root);
    return;
  }

  root.innerHTML = "";
  const detailSection = document.createElement("section");
  detailSection.className = "dogule-section kunden-section kunden-detail";
  detailSection.appendChild(
    createSectionHeader({
      title: "Kunde",
      subtitle: kunde ? formatFullName(kunde) : "",
      level: 1,
    })
  );

  if (!kunde) {
    detailSection.appendChild(
      createNotice(`Kein Eintrag mit ID ${id} vorhanden.`, {
        variant: "warn",
        role: "alert",
      })
    );
    detailSection.appendChild(createUiLink("Zur Kundenliste", "#/kunden", "quiet"));
    root.appendChild(detailSection);
    focusHeading(root);
    return;
  }

  injectToast(detailSection);
  const detailCard = createStandardCard("Stammdaten");
  const detailBody = detailCard.querySelector(".ui-card__body");
  const rows = [
    { label: "ID", value: kunde.id },
    { label: "Kundencode", value: kunde.kundenCode },
    { label: "Name", value: formatFullName(kunde) },
    { label: "Geschlecht", value: formatKundenGeschlecht(kunde.geschlecht) },
    { label: "E-Mail", value: kunde.email },
    { label: "Telefon", value: kunde.telefon },
    { label: "Adresse", value: kunde.adresse },
    { label: "Ausweis-ID", value: kunde.ausweisId || kunde.ausweisID },
    { label: "Status", value: formatKundenStatus(kunde.status) },
    {
      label: "Foto",
      render: () => renderOptionalLink(kunde.fotoUrl || kunde.foto || ""),
    },
    { label: "Notizen", value: kunde.notizen },
    {
      label: "Begleitpersonen",
      value: formatBegleitpersonen(kunde.begleitpersonen),
    },
    { label: "Erstellt am", value: formatDateTime(kunde.createdAt) },
    { label: "Aktualisiert am", value: formatDateTime(kunde.updatedAt) },
  ];
  detailBody.innerHTML = "";
  detailBody.appendChild(createDefinitionList(rows));
  detailSection.appendChild(detailCard);

  const actionsCard = createStandardCard("Aktionen");
  const actionsBody = actionsCard.querySelector(".ui-card__body");
  const actionsWrap = document.createElement("div");
  actionsWrap.className = "module-actions";
  const editBtn = createButton({
    label: "Bearbeiten",
    variant: "primary",
  });
  editBtn.type = "button";
  editBtn.addEventListener("click", () => {
    window.location.hash = `#/kunden/${id}/edit`;
  });
  const zertifikatBtn = createButton({
    label: "Zertifikat erstellen",
    variant: "secondary",
  });
  zertifikatBtn.type = "button";
  zertifikatBtn.addEventListener("click", () => {
    window.location.hash = `#/zertifikate/new?kundeId=${encodeURIComponent(id)}`;
  });
  const deleteBtn = createButton({
    label: "Löschen",
    variant: "secondary",
  });
  deleteBtn.type = "button";
  deleteBtn.dataset.action = "delete";
  const backBtn = createButton({
    label: "Zur Übersicht",
    variant: "quiet",
  });
  backBtn.type = "button";
  backBtn.addEventListener("click", () => {
    window.location.hash = "#/kunden";
  });
  actionsWrap.append(editBtn, zertifikatBtn, deleteBtn, backBtn);
  actionsBody.appendChild(actionsWrap);
  const actionStatus = document.createElement("div");
  actionStatus.className = "kunden-card-status";
  actionsBody.appendChild(actionStatus);
  detailSection.appendChild(actionsCard);

  root.appendChild(detailSection);

  let linkedHunde = [];
  let hundeLoadFailed = false;
  try {
    const hunde = await listHunde();
    linkedHunde = hunde.filter((hund) => hund.kundenId === id);
  } catch (error) {
    hundeLoadFailed = true;
    console.error("[KUNDEN_ERR_HUNDE_LOAD]", error);
  }

  let linkedKurse = [];
  let kurseLoadFailed = false;
  try {
    const kurse = await listKurse();
    const hundIds = new Set(linkedHunde.map((hund) => hund.id));
    const filtered = kurse.filter((kurs) => {
      const hasHundBezug =
        Array.isArray(kurs.hundIds) && kurs.hundIds.some((hundId) => hundIds.has(hundId));
      return hasHundBezug;
    });
    const unique = [];
    const seen = new Set();
    filtered.forEach((kurs) => {
      if (seen.has(kurs.id)) return;
      seen.add(kurs.id);
      unique.push(kurs);
    });
    linkedKurse = unique;
  } catch (error) {
    kurseLoadFailed = true;
    console.error("[KUNDEN_ERR_KURSE_LOAD]", error);
  }

  root.appendChild(renderKundenHundeSection(linkedHunde, hundeLoadFailed));
  root.appendChild(renderKundenKurseSection(linkedKurse, kurseLoadFailed));
  let finanzen = [];
  let finanzenLoadFailed = false;
  try {
    finanzen = await loadFinanzen(id);
  } catch (error) {
    finanzenLoadFailed = true;
    console.error("[KUNDEN_ERR_FINANZEN_LOAD]", error);
  }
  root.appendChild(renderFinanzOverview(finanzen, finanzenLoadFailed));
  root.appendChild(renderOffeneBetraege(finanzen, finanzenLoadFailed));
  root.appendChild(renderZahlungshistorie(finanzen, finanzenLoadFailed));
  let waren = [];
  let warenLoadFailed = false;
  try {
    waren = await listWarenByKundeId(id);
  } catch (error) {
    warenLoadFailed = true;
    console.error("[KUNDEN_ERR_WAREN_LOAD]", error);
  }
  root.appendChild(renderWarenSection(waren, warenLoadFailed));

  deleteBtn.addEventListener("click", async () => {
    if (deleteBtn.disabled) return;
    actionStatus.innerHTML = "";
    try {
      const [allHunde, allKurse, allFinanzen, kundeWaren] = await Promise.all([
        listHunde(),
        listKurse(),
        listFinanzen(),
        listWarenByKundeId(id),
      ]);
      const linkedHunde = allHunde.filter((hund) => hund.kundenId === id);
      const hundIds = new Set(linkedHunde.map((hund) => hund.id));
      const linkedKurse = allKurse.filter(
        (kurs) => Array.isArray(kurs.hundIds) && kurs.hundIds.some((hundId) => hundIds.has(hundId))
      );
      const linkedFinanzen = allFinanzen.filter((entry) => entry.kundeId === id);
      const linkedWaren = Array.isArray(kundeWaren) ? kundeWaren : [];
      const hasRelations =
        linkedHunde.length || linkedKurse.length || linkedFinanzen.length || linkedWaren.length;
      if (hasRelations) {
        const notice = createNotice(
          "Der Kunde kann nicht gelöscht werden, da noch verknüpfte Daten existieren.",
          { variant: "warn", role: "alert" }
        );
        actionStatus.appendChild(notice);
        return;
      }
    } catch (error) {
      console.error("[KUNDEN_ERR_DELETE_CHECK]", error);
      showErrorNotice(actionStatus);
      return;
    }
    const confirmed = window.confirm(`Soll "${formatFullName(kunde)}" wirklich gelöscht werden?`);
    if (!confirmed) return;
    deleteBtn.disabled = true;
    const originalLabel = deleteBtn.textContent;
    deleteBtn.textContent = "Lösche ...";
    let deleted = false;
    try {
      const result = await deleteKunde(id);
      if (!result?.ok) {
        throw new Error("Delete failed");
      }
      await fetchKunden();
      deleted = true;
      setToast("Kunde gelöscht.", "success");
      window.location.hash = "#/kunden";
    } catch (error) {
      console.error("[KUNDEN_ERR_DELETE]", error);
      showErrorNotice(actionStatus);
    } finally {
      if (!deleted) {
        deleteBtn.disabled = false;
        deleteBtn.textContent = originalLabel;
      }
    }
  });

  focusHeading(root);
}

async function renderForm(root, view, id) {
  if (!root) return;
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  try {
    if (!kundenCache.length) {
      await fetchKunden();
    }
  } catch (error) {
    console.error("[KUNDEN_ERR_FORM_INIT]", error);
    root.innerHTML = "";
    const fallbackSection = createSectionBlock({
      title: "Kundenformular",
      subtitle: "",
      level: 1,
    });
    const card = createStandardCard("Stammdaten");
    const body = card.querySelector(".ui-card__body");
    showErrorNotice(body);
    fallbackSection.appendChild(card);
    root.appendChild(fallbackSection);
    focusHeading(root);
    return;
  }
  const mode = view === "create" ? "create" : "edit";
  let existing = null;

  if (mode === "edit") {
    try {
      existing = kundenCache.find((k) => k.id === id) || (await getKunde(id));
    } catch (error) {
      console.error("[KUNDEN_ERR_FORM_LOAD]", error);
      root.innerHTML = "";
      const section = createSectionBlock({
        title: "Kunde bearbeiten",
        subtitle: "",
        level: 1,
      });
      const card = createStandardCard("Stammdaten");
      const body = card.querySelector(".ui-card__body");
      showErrorNotice(body);
      section.appendChild(card);
      root.appendChild(section);
      focusHeading(root);
      return;
    }
    if (!existing) {
      root.innerHTML = "";
      const section = createSectionBlock({
        title: "Kunde nicht gefunden",
        subtitle: `ID ${id} ist nicht verfügbar.`,
        level: 1,
      });
      section.appendChild(
        createNotice("Kein Eintrag vorhanden. Kehre zur Liste zurück und versuche es erneut.", {
          variant: "warn",
          role: "alert",
        })
      );
      section.appendChild(createUiLink("Zur Kundenliste", "#/kunden", "quiet"));
      root.appendChild(section);
      focusHeading(root);
      return;
    }
  }

  root.innerHTML = "";
  const section = createSectionBlock({
    title: mode === "create" ? "Neuer Kunde" : "Kunde bearbeiten",
    subtitle: mode === "edit" ? formatFullName(existing) : "Formular für neue Kundendaten",
    level: 1,
  });
  injectToast(section);

  const formCard = createStandardCard("Stammdaten");
  const formBody = formCard.querySelector(".ui-card__body");
  formBody.innerHTML = "";
  const formStatusSlot = document.createElement("div");
  formStatusSlot.className = "kunden-card-status";
  formBody.appendChild(formStatusSlot);

  const form = document.createElement("form");
  form.noValidate = true;
  const formId = `kunden-form-${mode}-${id || "new"}`;
  form.id = formId;
  form.className = "kunden-form";
  formBody.appendChild(form);

  let hundeListe = [];
  if (mode === "create") {
    try {
      hundeListe = await listHunde();
    } catch (error) {
      console.error("[KUNDEN_ERR_HUNDE_FOR_FORM]", error);
    }
  }

  const kundenCodeValue = mode === "edit" ? (existing?.kundenCode ?? existing?.code ?? "") : "";
  const defaultKundenCode = mode === "edit" ? kundenCodeValue : generateNextKundenCode(kundenCache);
  let isCodeOverrideEnabled = false;

  const fields = [
    {
      name: "kundenCode",
      label: "Kundencode*",
      required: true,
      readOnly: true,
      value: kundenCodeValue,
      describedByText:
        'Standardmäßig automatisch. Mit "Code manuell ändern" aktivierst du die Bearbeitung.',
    },
    {
      name: "vorname",
      label: "Vorname*",
      required: true,
      placeholder: "z. B. Julia",
    },
    {
      name: "nachname",
      label: "Nachname*",
      required: true,
      placeholder: "z. B. Keller",
    },
    {
      name: "status",
      label: "Status",
      control: "select",
      options: [
        { value: "", label: "Bitte wählen" },
        { value: "aktiv", label: "Aktiv" },
        { value: "passiv", label: "Passiv" },
        { value: "deaktiviert", label: "Deaktiviert" },
      ],
    },
    {
      name: "geschlecht",
      label: "Geschlecht",
      control: "select",
      options: [
        { value: "", label: "Bitte wählen" },
        { value: "weiblich", label: "Weiblich" },
        { value: "männlich", label: "Männlich" },
      ],
    },
    {
      name: "email",
      label: "E-Mail*",
      required: true,
      type: "email",
      placeholder: "z. B. julia.keller@example.com",
    },
    {
      name: "telefon",
      label: "Telefon",
      placeholder: "z. B. +41 44 123 45 67",
    },
    {
      name: "adresse",
      label: "Adresse",
      placeholder: "z. B. Hauptstrasse 10, 8000 Zürich",
    },
    {
      name: "ausweisId",
      label: "Ausweis-ID",
      placeholder: "z. B. ID-123456",
    },
    {
      name: "foto",
      label: "Foto",
      type: "file",
      accept: "image/*",
    },
    {
      name: "notizen",
      label: "Notizen",
      textarea: true,
      placeholder: "Optionale Ergänzungen zum Kundenprofil",
    },
  ];

  const refs = {};
  fields.forEach((field) => {
    const row = createFormRow({
      id: `kunden-${field.name}`,
      label: field.label,
      control: field.control || (field.textarea ? "textarea" : "input"),
      type: field.type || "text",
      placeholder: field.placeholder || "",
      required: Boolean(field.required),
      describedByText: field.describedByText || "",
      options: field.options || [],
    });
    const input = row.querySelector("input, textarea");
    const select = row.querySelector("select");
    const control = input || select;
    if (!control) return;
    control.name = field.name;
    const initialValue = field.value !== undefined ? field.value : (existing?.[field.name] ?? "");
    if (select) {
      const match = Array.from(select.options).find((opt) => opt.value === initialValue);
      if (match) match.selected = true;
    } else if (input) {
      if (input.type === "file") {
        input.value = "";
      } else {
        input.value = initialValue || "";
      }
    }
    if (field.accept && input) {
      input.setAttribute("accept", field.accept);
    }
    if (field.readOnly) {
      if (input) input.readOnly = true;
    }
    const hint = row.querySelector(".ui-form-row__hint");
    if (!field.describedByText) {
      hint.classList.add("sr-only");
    }
    if (field.name === "kundenCode") {
      if (input) input.setAttribute("aria-readonly", "true");
      const toggleWrap = document.createElement("div");
      toggleWrap.className = "kunden-id-toggle";
      const toggleButton = createButton({
        label: "Code manuell ändern",
        variant: "secondary",
      });
      toggleButton.type = "button";
      toggleButton.addEventListener("click", () => {
        isCodeOverrideEnabled = !isCodeOverrideEnabled;
        if (isCodeOverrideEnabled) {
          if (input) {
            input.readOnly = false;
            input.removeAttribute("aria-readonly");
          }
          toggleButton.textContent = "Automatischen Code verwenden";
          if (input) input.focus();
        } else {
          if (input) {
            input.readOnly = true;
            input.setAttribute("aria-readonly", "true");
          }
          toggleButton.textContent = "Code manuell ändern";
          if (input && !input.value.trim()) {
            input.value = defaultKundenCode;
          }
        }
      });
      toggleWrap.appendChild(toggleButton);
      row.appendChild(toggleWrap);
    }
    refs[field.name] = { input: control, hint };
    form.appendChild(row);
  });

  const vornameInput = refs.vorname?.input;
  const geschlechtSelect = refs.geschlecht?.input;
  if (vornameInput && geschlechtSelect) {
    const syncGeschlecht = () => {
      if (geschlechtSelect.value) return;
      const inferred = inferGeschlechtFromVorname(vornameInput.value);
      if (inferred) {
        geschlechtSelect.value = inferred;
      }
    };
    syncGeschlecht();
    vornameInput.addEventListener("blur", syncGeschlecht);
  }

  const hundeDrafts = [];
  if (mode === "create") {
    const hundeBlock = document.createElement("div");
    hundeBlock.className = "kunden-hunde-drafts-block";
    const hundeTitle = document.createElement("h2");
    hundeTitle.textContent = "Hunde hinzufügen (optional)";
    hundeBlock.appendChild(hundeTitle);
    const hundeIntro = document.createElement("p");
    hundeIntro.textContent =
      "Du kannst direkt beim Anlegen Hunde erfassen. Mindestens der Name ist nötig; Codes werden automatisch vergeben.";
    hundeBlock.appendChild(hundeIntro);

    const hundeList = document.createElement("div");
    hundeList.className = "kunden-hunde-drafts";
    hundeBlock.appendChild(hundeList);

    const addHundButton = createButton({
      label: "Hund hinzufügen",
      variant: "secondary",
    });
    addHundButton.type = "button";
    addHundButton.classList.add("kunden-hunde-add");
    addHundButton.addEventListener("click", () => {
      const draft = appendHundDraftRow(hundeList, hundeListe, hundeDrafts);
      hundeDrafts.push(draft);
    });
    hundeBlock.appendChild(addHundButton);
    form.appendChild(hundeBlock);
  }

  const actions = document.createElement("div");
  actions.className = "module-actions kunden-actions";
  const submit = createButton({
    label: mode === "create" ? "Erstellen" : "Speichern",
    variant: "primary",
  });
  submit.type = "submit";
  submit.setAttribute("form", formId);
  const cancel = createButton({
    label: "Abbrechen",
    variant: "quiet",
  });
  cancel.type = "button";
  cancel.addEventListener("click", () => {
    window.location.hash = mode === "create" ? "#/kunden" : `#/kunden/${id}`;
  });
  actions.append(submit, cancel);
  const footer = formCard.querySelector(".ui-card__footer");
  footer.innerHTML = "";
  footer.appendChild(actions);

  section.appendChild(formCard);
  root.appendChild(section);

  const submitContext = {
    mode,
    id,
    refs,
    submit,
    formStatusSlot,
    hundeDrafts,
    hundeListe,
    existing,
  };
  form.addEventListener("submit", (event) => handleKundeFormSubmit(event, submitContext));

  focusHeading(root);
}

function setToast(message, tone = "info") {
  window[TOAST_KEY] = { message, tone };
}

function injectToast(section) {
  if (!section) return;
  section.querySelectorAll(".kunden-toast").forEach((node) => node.remove());
  const toast = window[TOAST_KEY];
  if (!toast) return;
  delete window[TOAST_KEY];
  const { message, tone = "info" } =
    typeof toast === "string" ? { message: toast, tone: "info" } : toast;
  const fragment = createNotice(message, {
    variant: mapToneToNoticeVariant(tone),
    role: tone === "error" ? "alert" : "status",
  });
  const noticeElement = fragment.firstElementChild || fragment;
  if (noticeElement.classList) {
    noticeElement.classList.add("kunden-toast");
  }
  section.prepend(fragment);
}

async function handleKundeFormSubmit(event, context = {}) {
  if (event) event.preventDefault();
  const {
    mode,
    id,
    refs,
    submit,
    formStatusSlot,
    hundeDrafts = [],
    hundeListe = [],
    existing,
  } = context;
  if (!refs || !submit) return;

  if (formStatusSlot) {
    formStatusSlot.innerHTML = "";
  }

  const codeInput = refs.kundenCode?.input;
  const isManualCode = codeInput ? !codeInput.readOnly : false;
  const values = collectValues(refs);
  if (!isManualCode && !values.kundenCode) {
    const nextCode = generateNextKundenCode(kundenCache);
    values.kundenCode = nextCode;
    if (codeInput) {
      codeInput.value = nextCode;
    }
  }
  const errors = validate(values, { isManualCode });
  applyErrors(refs, errors);
  if (Object.keys(errors).length) {
    if (formStatusSlot) {
      const msg =
        errors.kundenCode || "Bitte prüfen Sie die Eingaben und ergänzen Sie fehlende Felder.";
      formStatusSlot.appendChild(
        createNotice(msg, {
          variant: "warn",
          role: "alert",
        })
      );
    }
    const firstError = Object.values(refs).find(
      (ref) => ref.hint && ref.hint.textContent && !ref.hint.classList.contains("sr-only")
    );
    if (firstError) {
      firstError.input.focus();
    }
    return;
  }

  const defaultLabel = mode === "create" ? "Erstellen" : "Speichern";
  const busyLabel = mode === "create" ? "Erstelle ..." : "Speichere ...";
  submit.disabled = true;
  submit.textContent = busyLabel;

  try {
    const photoInput = refs.foto?.input;
    if (photoInput && photoInput.files && photoInput.files[0]) {
      values.fotoUrl = await readFileAsDataUrl(photoInput.files[0]);
    } else if (mode === "edit") {
      values.fotoUrl = existing?.fotoUrl || existing?.foto || "";
    }
    delete values.foto;
    const result = mode === "create" ? await createKunde(values) : await updateKunde(id, values);
    if (!result || !result.id) {
      throw new Error("Save failed");
    }

    let createdDogs = 0;
    let failedDogs = 0;
    if (mode === "create" && Array.isArray(hundeDrafts) && hundeDrafts.length) {
      const hundDraftValues = collectHundDraftValues(hundeDrafts).map((hund) => ({
        ...hund,
        kundenId: result.id,
      }));
      let nextHundNumber = generateNextHundCodeFromLists(hundeListe, hundDraftValues);
      for (const hund of hundDraftValues) {
        const payload = {
          name: hund.name,
          rufname: hund.rufname || "",
          code: hund.code || buildHundCode(nextHundNumber++),
          kundenId: hund.kundenId,
        };
        try {
          await createHund(payload);
          createdDogs += 1;
        } catch (dogError) {
          console.error("[KUNDEN_ERR_CREATE_HUND]", dogError);
          failedDogs += 1;
        }
      }
    }

    await fetchKunden();
    if (mode === "create") {
      if (failedDogs > 0 && createdDogs === 0) {
        setToast("Kunde erstellt. Hunde konnten nicht angelegt werden.", "warn");
      } else if (failedDogs > 0) {
        setToast(
          `Kunde erstellt. ${createdDogs} Hund(e) angelegt, ${failedDogs} fehlgeschlagen.`,
          "warn"
        );
      } else if (createdDogs > 0) {
        setToast(`Kunde erstellt. ${createdDogs} Hund(e) hinzugefügt.`, "success");
      } else {
        setToast("Kunde erstellt.", "success");
      }
      window.location.hash = "#/kunden";
    } else {
      setToast("Änderungen gespeichert.", "success");
      window.location.hash = `#/kunden/${id}`;
    }
  } catch (error) {
    console.error("[KUNDEN_ERR_FORM_SAVE]", error);
    if (formStatusSlot) {
      showErrorNotice(formStatusSlot, { replace: true });
    }
    submit.disabled = false;
    submit.textContent = defaultLabel;
  }
}

function collectValues(refs) {
  const values = {};
  Object.entries(refs).forEach(([key, ref]) => {
    if (!ref?.input) return;
    if (ref.input.type === "file") return;
    values[key] = ref.input.value.trim();
  });
  return values;
}

function validate(values, { isManualCode = false } = {}) {
  const errors = {};
  if (!values.kundenCode) {
    errors.kundenCode = isManualCode
      ? "Bitte einen gültigen Kundencode eingeben."
      : "Kundencode fehlt.";
  }
  if (!values.vorname) errors.vorname = "Bitte den Vornamen ausfüllen.";
  if (!values.nachname) errors.nachname = "Bitte den Nachnamen ausfüllen.";
  return errors;
}

function applyErrors(refs, errors) {
  Object.entries(refs).forEach(([key, ref]) => {
    const hint = ref.hint;
    if (errors[key]) {
      if (hint) {
        hint.textContent = errors[key];
        hint.classList.remove("sr-only");
      }
      ref.input.setAttribute("aria-invalid", "true");
    } else {
      if (hint) {
        hint.textContent = "";
        hint.classList.add("sr-only");
      }
      ref.input.setAttribute("aria-invalid", "false");
    }
  });
}

function appendHundDraftRow(container, existingHunde = [], drafts = []) {
  if (!container) return null;
  const draftIndex = drafts.length + 1;
  const wrapper = document.createElement("div");
  wrapper.className = "kunden-hunde-draft";

  const currentDraftValues = collectHundDraftValues(drafts, { includeEmpty: true });
  const nextNumber = generateNextHundCodeFromLists(existingHunde, currentDraftValues);
  const suggestedCode = buildHundCode(nextNumber);

  const codeRow = createFormRow({
    id: `kunden-hund-code-${draftIndex}`,
    label: "Hundecode",
    placeholder: "Wird automatisch vergeben",
    describedByText: "Read-only, wird automatisch vorgeschlagen.",
  });
  const codeInput = codeRow.querySelector("input");
  codeInput.name = `hund-code-${draftIndex}`;
  codeInput.value = suggestedCode;
  codeInput.readOnly = true;
  codeInput.setAttribute("aria-readonly", "true");

  const nameRow = createFormRow({
    id: `kunden-hund-name-${draftIndex}`,
    label: "Name*",
    placeholder: "z. B. Bello",
    required: true,
  });
  const nameInput = nameRow.querySelector("input");
  nameInput.name = `hund-name-${draftIndex}`;
  const nameHint = nameRow.querySelector(".ui-form-row__hint");
  nameHint.classList.add("sr-only");

  const rufRow = createFormRow({
    id: `kunden-hund-rufname-${draftIndex}`,
    label: "Rufname",
    placeholder: "Optional",
  });
  const rufInput = rufRow.querySelector("input");
  rufInput.name = `hund-rufname-${draftIndex}`;
  const rufHint = rufRow.querySelector(".ui-form-row__hint");
  rufHint.classList.add("sr-only");

  const removeButton = createButton({
    label: "Entfernen",
    variant: "quiet",
  });
  removeButton.type = "button";

  const header = document.createElement("div");
  header.className = "kunden-hunde-draft__header";
  const draftLabel = document.createElement("p");
  draftLabel.textContent = `Hund ${draftIndex}`;
  header.append(draftLabel, removeButton);

  wrapper.append(header, codeRow, nameRow, rufRow);
  container.appendChild(wrapper);

  const draftRef = {
    code: codeInput,
    name: nameInput,
    rufname: rufInput,
    wrapper,
  };

  removeButton.addEventListener("click", () => {
    wrapper.remove();
    const idx = drafts.indexOf(draftRef);
    if (idx >= 0) {
      drafts.splice(idx, 1);
    }
  });

  return draftRef;
}

function collectHundDraftValues(drafts = [], { includeEmpty = false } = {}) {
  return drafts
    .map((draft) => ({
      code: draft?.code?.value?.trim() || "",
      name: draft?.name?.value?.trim() || "",
      rufname: draft?.rufname?.value?.trim() || "",
    }))
    .filter((draft) => includeEmpty || draft.name);
}

function generateNextHundCodeFromLists(existingHunde = [], drafts = []) {
  const codes = [];
  existingHunde.forEach((hund) => {
    const code = (hund.code || hund.hundeId || "").trim();
    if (code) codes.push(code);
  });
  drafts.forEach((draft) => {
    if (draft?.code) {
      codes.push(draft.code);
    }
  });
  let max = 0;
  codes.forEach((code) => {
    const num = extractHundCodeNumber(code);
    if (Number.isFinite(num) && num > max) {
      max = num;
    }
  });
  return max + 1;
}

function extractHundCodeNumber(code = "") {
  const match = (code || "").match(/(\d+)/);
  if (!match) return 0;
  const num = Number.parseInt(match[1], 10);
  return Number.isFinite(num) ? num : 0;
}

function buildHundCode(num) {
  const safe = Number.isFinite(num) ? num : 1;
  return `H-${String(safe).padStart(3, "0")}`;
}

function renderKundenHundeSection(hunde = [], hasError = false) {
  const section = createSectionBlock({
    title: "Hunde dieses Kunden",
    subtitle: "",
    level: 2,
  });
  const card = createStandardCard("Hunde");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (hasError) {
    showErrorNotice(body);
  } else if (!hunde.length) {
    appendSharedEmptyState(body);
  } else {
    const list = document.createElement("ul");
    list.className = "kunden-hunde-list";
    hunde.forEach((hund) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#/hunde/${hund.id}`;
      link.className = "kunden-hunde-link";
      link.setAttribute("aria-label", `Hund ${hund.name || hund.code || hund.id} öffnen`);

      const title = document.createElement("p");
      title.className = "kunden-hunde-title";
      const name = (hund.name || "").trim() || "Unbenannter Hund";
      const rufname = (hund.rufname || "").trim();
      title.textContent = rufname ? `${name} (${rufname})` : name;

      const meta = document.createElement("p");
      meta.className = "kunden-hunde-meta";
      meta.textContent = `Rasse: ${hund.rasse || "unbekannt"}`;

      link.append(title, meta);
      item.appendChild(link);
      list.appendChild(item);
    });
    body.appendChild(list);
  }

  section.appendChild(card);
  return section;
}

function generateNextKundenCode(list = []) {
  let max = 0;
  list.forEach((kunde) => {
    const source = (kunde.kundenCode || "").trim();
    const match = source.match(/(\d+)/);
    if (!match) return;
    const num = Number.parseInt(match[1], 10);
    if (Number.isFinite(num) && num > max) {
      max = num;
    }
  });
  const nextNumber = max + 1;
  return `K-${String(nextNumber).padStart(3, "0")}`;
}

function renderKundenKurseSection(kurse = [], hasError = false) {
  const section = createSectionBlock({
    title: "Kurse dieses Kunden",
    subtitle: "",
    level: 2,
  });
  const card = createStandardCard("Kurse");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (hasError) {
    showErrorNotice(body);
  } else if (!kurse.length) {
    appendSharedEmptyState(body);
  } else {
    kurse.forEach((kurs) => {
      const kursCardFragment = createCard({
        eyebrow: formatDateTime(kurs.date),
        title: kurs.title || "Ohne Titel",
        body: "",
        footer: "",
      });
      const kursCard =
        kursCardFragment.querySelector(".ui-card") || kursCardFragment.firstElementChild;
      if (!kursCard) return;
      const cardBody = kursCard.querySelector(".ui-card__body");
      if (cardBody) {
        cardBody.innerHTML = "";
        const ort = document.createElement("p");
        ort.textContent = kurs.location || "Ort folgt";
        const meta = document.createElement("p");
        meta.className = "kunden-kurs-meta";
        const kursCode = kurs.code || kurs.kursId || "–";
        meta.textContent = `ID: ${kurs.id || "–"} · Code: ${kursCode} · Hunde: ${formatIdList(kurs.hundIds)}`;
        cardBody.append(ort, meta);
      }
      kursCard.classList.add("kunden-kurs-item");
      const kursLink = document.createElement("a");
      kursLink.className = "kunden-kurs-link";
      kursLink.href = `#/kurse/${kurs.id}`;
      kursLink.setAttribute("aria-label", `Kurs ${kurs.title || kurs.id} öffnen`);
      kursLink.appendChild(kursCard);
      body.appendChild(kursLink);
    });
  }

  section.appendChild(card);
  return section;
}

function formatIdList(value) {
  if (Array.isArray(value) && value.length) return value.join(", ");
  if (typeof value === "string" && value.trim()) return value;
  return "–";
}

async function loadFinanzen(kundeId) {
  const finanzen = await listFinanzen();
  return finanzen.filter((entry) => entry.kundeId === kundeId);
}

function renderFinanzOverview(finanzen = [], hasError = false) {
  const section = createSectionBlock({
    title: "Finanzübersicht",
    subtitle: "",
    level: 2,
  });
  const card = createStandardCard("Zusammenfassung");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (hasError) {
    showErrorNotice(body);
  } else if (!finanzen.length) {
    appendSharedEmptyState(body);
  } else {
    const payments = finanzen
      .filter((entry) => entry.typ === "bezahlt")
      .slice()
      .reverse();
    const latest = payments.length ? payments[payments.length - 1] : null;
    const openSum = finanzen
      .filter((entry) => entry.typ === "offen")
      .reduce((total, entry) => total + Number(entry.betrag || 0), 0);
    const infoList = document.createElement("dl");
    infoList.className = "kunden-finanz-info";
    const addInfoRow = (label, value) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      infoList.append(dt, dd);
    };
    addInfoRow(
      "Letzte Zahlung",
      latest
        ? `${formatDateTime(latest.datum)} – CHF ${Number(latest.betrag || 0).toFixed(2)}`
        : "Keine Zahlungen"
    );
    addInfoRow("Offen gesamt", `CHF ${openSum.toFixed(2)}`);
    body.appendChild(infoList);
    if (latest?.beschreibung) {
      const note = document.createElement("p");
      note.textContent = latest.beschreibung;
      body.appendChild(note);
    }
  }

  section.appendChild(card);
  return section;
}

function renderOffeneBetraege(finanzen = [], hasError = false) {
  const section = createSectionBlock({
    title: "Offene Beträge",
    subtitle: "",
    level: 2,
  });
  const card = createStandardCard("Offene Posten");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (hasError) {
    showErrorNotice(body);
  } else {
    const openEntries = finanzen.filter((entry) => entry.typ === "offen");
    if (!openEntries.length) {
      appendSharedEmptyState(body);
    } else {
      const sum = openEntries.reduce((total, entry) => total + Number(entry.betrag || 0), 0);
      const summary = document.createElement("p");
      const summaryLabel = document.createElement("span");
      summaryLabel.textContent = "Total offen:";
      summary.append(summaryLabel, document.createTextNode(` CHF ${sum.toFixed(2)}`));
      body.appendChild(summary);

      const list = document.createElement("ul");
      list.className = "kunden-offene-liste";
      openEntries.forEach((entry) => {
        const item = document.createElement("li");
        const title = document.createElement("span");
        title.textContent = entry.beschreibung || "Posten";
        const amountText = document.createTextNode(
          ` – CHF ${Number(entry.betrag || 0).toFixed(2)} (${formatDateTime(entry.datum)})`
        );
        item.append(title, amountText);
        list.appendChild(item);
      });
      body.appendChild(list);
    }
  }

  section.appendChild(card);
  return section;
}

function renderZahlungshistorie(finanzen = [], hasError = false) {
  const section = createSectionBlock({
    title: "Zahlungshistorie",
    subtitle: "",
    level: 2,
  });
  const card = createStandardCard("Zahlungen");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (hasError) {
    showErrorNotice(body);
  } else {
    const payments = finanzen.filter((entry) => entry.typ === "bezahlt");
    if (!payments.length) {
      appendSharedEmptyState(body);
    } else {
      const list = document.createElement("ul");
      list.className = "kunden-zahlungsliste";
      payments.forEach((entry) => {
        const item = document.createElement("li");
        const time = document.createElement("span");
        time.textContent = formatDateTime(entry.datum);
        const amountText = document.createTextNode(
          ` – CHF ${Number(entry.betrag || 0).toFixed(2)} (${entry.beschreibung || "Zahlung"})`
        );
        item.append(time, amountText);
        list.appendChild(item);
      });
      body.appendChild(list);
    }
  }

  section.appendChild(card);
  return section;
}

function renderWarenSection(waren = [], hasError = false) {
  const section = createSectionBlock({
    title: "Waren",
    subtitle: "",
    level: 2,
  });
  const card = createStandardCard("Warenverkäufe");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (hasError) {
    showErrorNotice(body);
  } else if (!waren.length) {
    appendSharedEmptyState(body);
  } else {
    const list = document.createElement("ul");
    list.className = "kunden-waren-liste";
    waren.forEach((verkauf) => {
      const item = document.createElement("li");
      const title = document.createElement("span");
      title.textContent = verkauf.produktName || "Produkt";
      const meta = document.createElement("span");
      meta.textContent = ` – ${formatDateTime(verkauf.datum)} · CHF ${formatCurrency(
        verkauf.preis
      )}`;
      item.append(title, meta);
      if (verkauf.beschreibung) {
        const desc = document.createElement("div");
        desc.textContent = verkauf.beschreibung;
        item.appendChild(desc);
      }
      list.appendChild(item);
    });
    body.appendChild(list);
  }

  section.appendChild(card);
  return section;
}

function createDefinitionList(rows = []) {
  const list = document.createElement("dl");
  list.className = "kunden-details";
  rows.forEach(({ label, value, render }) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    if (typeof render === "function") {
      dd.appendChild(render());
    } else {
      dd.textContent = valueOrDash(value);
    }
    list.append(dt, dd);
  });
  return list;
}

function formatFullName(kunde = {}) {
  const fullName = `${kunde.nachname ?? ""} ${kunde.vorname ?? ""}`.trim();
  return fullName || "Unbenannt";
}

function extractTown(address = "") {
  if (typeof address !== "string") return "";
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return "";
  const townRaw = parts[parts.length - 1];
  const cleaned = townRaw.replace(/^\d+\s*/, "").trim();
  return cleaned || townRaw;
}

function valueOrDash(value) {
  if (value === null || value === undefined) return "–";
  const str = typeof value === "string" ? value.trim() : String(value);
  return str || "–";
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toFixed(2);
}

function formatDateTime(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleString("de-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatKundenStatus(status) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "–";
  if (normalized === "aktiv") return "Aktiv";
  if (normalized === "deaktiviert") return "Deaktiviert";
  if (normalized === "passiv") return "Passiv";
  return status;
}

function formatKundenGeschlecht(geschlecht) {
  const normalized = String(geschlecht || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "Unbekannt";
  if (normalized === "weiblich") return "Weiblich";
  if (normalized === "männlich") return "Männlich";
  if (normalized === "unbekannt") return "Unbekannt";
  return geschlecht;
}

const FEMALE_VORNAMEN = new Set([
  "anna",
  "andrea",
  "lea",
  "lara",
  "laura",
  "maria",
  "marie",
  "sara",
  "sarah",
  "julia",
  "juliane",
  "lena",
  "eva",
  "nina",
  "sophie",
  "sofie",
  "luisa",
]);

const MALE_VORNAMEN = new Set([
  "thomas",
  "mark",
  "marco",
  "marcus",
  "lukas",
  "luca",
  "jan",
  "jonas",
  "michael",
  "peter",
  "tim",
  "timo",
  "daniel",
  "andreas",
]);

function inferGeschlechtFromVorname(vorname) {
  const trimmed = String(vorname || "")
    .trim()
    .toLowerCase();
  if (!trimmed) return "";
  if (FEMALE_VORNAMEN.has(trimmed)) return "weiblich";
  if (MALE_VORNAMEN.has(trimmed)) return "männlich";
  if (trimmed.endsWith("a")) return "weiblich";
  return "";
}

function formatBegleitpersonen(list = []) {
  if (!Array.isArray(list) || !list.length) return "–";
  return list
    .map((person) => {
      if (!person) return "–";
      const name = `${person.nachname ?? ""} ${person.vorname ?? ""}`.trim() || "–";
      const hundLabel = person.hundName || person.hundId || "";
      return hundLabel ? `${name} (Hund: ${hundLabel})` : name;
    })
    .join(", ");
}

function renderOptionalLink(value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return document.createTextNode("Keines");
  const link = document.createElement("a");
  link.href = text;
  link.textContent = "Verfügbar";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}
