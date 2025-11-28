// Finanzen module – list/detail flows with mock API
/* globals document, console, window */
import { listFinanzen, listFinanzenByKundeId } from "../shared/api/finanzen.js";
import { listKunden } from "../shared/api/kunden.js";
import {
  createButton,
  createCard,
  createEmptyState,
  createNotice,
  createSectionHeader,
} from "../shared/components/components.js";

let kundenMapCache = null;

export function initModule(container, routeInfo = {}) {
  if (!container) return;

  container.innerHTML = "";
  if (typeof container.scrollTo === "function") {
    container.scrollTo({ top: 0, behavior: "auto" });
  } else {
    container.scrollTop = 0;
  }

  try {
    const focusAnchor = document.createElement("div");
    focusAnchor.tabIndex = -1;
    focusAnchor.setAttribute("data-focus-anchor", "finanzen");
    container.appendChild(focusAnchor);
    if (typeof focusAnchor.focus === "function") {
      focusAnchor.focus({ preventScroll: true });
    }

    const segments = Array.isArray(routeInfo?.segments) ? routeInfo.segments : [];
    const routeState = parseRouteSegments(segments);
    const { detailId, filters } = routeState;

    const section = document.createElement("section");
    section.className = "dogule-section finanzen-section";
    container.appendChild(section);

    const heading = createMainHeading("Finanzen");
    section.appendChild(heading);

    const contentHost = document.createElement("div");
    contentHost.setAttribute("data-fin-content", "host");
    section.appendChild(contentHost);

    void loadFinanzen(detailId, filters);

    async function loadFinanzen(activeDetailId = null, activeFilters = {}) {
      contentHost.innerHTML = "";
      const loadingNotice = createNotice("Lade Finanzen...", { variant: "info", role: "status" });
      contentHost.appendChild(loadingNotice);

      try {
        const { finanzen, kundenMap } = await loadData(activeFilters);
        contentHost.innerHTML = "";
        if (!Array.isArray(finanzen) || finanzen.length === 0) {
          const empty = createEmptyState("Keine Daten vorhanden.", "");
          contentHost.appendChild(empty);
        } else {
          if (activeDetailId) {
            const match = finanzen.find((entry) => entry?.id === activeDetailId);
            if (!match) {
              const notFound = createEmptyState("Keine Daten vorhanden.", "");
              contentHost.appendChild(notFound);
            } else {
              renderDetailCard(contentHost, match, kundenMap);
            }
          } else {
            renderSummaryCard(contentHost, finanzen);
            renderFilterCard(contentHost, kundenMap, activeFilters, loadFinanzen);
            renderListCard(contentHost, finanzen, kundenMap);
          }
        }
        scrollToTop(container);
        focusHeading(section);
        return finanzen || [];
      } catch (error) {
        console.error("FINANZEN_LOAD_FAILED", error);
        contentHost.innerHTML = "";
        const retryButton = createButton({
          label: "Erneut versuchen",
          onClick: () => loadFinanzen(activeDetailId, activeFilters),
        });
        const errorNotice = createNotice("Fehler beim Laden der Daten.", {
          variant: "warn",
          role: "alert",
        });
        contentHost.append(errorNotice, retryButton);
        scrollToTop(container);
        focusHeading(section);
        return [];
      }
    }
  } catch (error) {
    console.error("FINANZEN_INIT_FAILED", error);
  }
}

function parseRouteSegments(segments = []) {
  const [detailId] = segments;
  return {
    detailId: detailId || null,
    filters: {},
  };
}

function createMainHeading(title = "") {
  const fragment = createSectionHeader({
    title,
    subtitle: "",
    level: 1,
  });
  const sectionEl = fragment.querySelector(".ui-section") || fragment.firstElementChild;
  const originalTitle = sectionEl?.querySelector(".ui-section__title");
  const h1 = document.createElement("h1");
  h1.className = originalTitle?.className || "ui-section__title";
  h1.textContent = title || "";
  h1.tabIndex = -1;
  if (originalTitle?.id) {
    h1.id = originalTitle.id;
  }
  if (originalTitle) {
    originalTitle.replaceWith(h1);
  } else if (sectionEl) {
    const header = sectionEl.querySelector(".ui-section__header") || sectionEl;
    header.prepend(h1);
  }
  return sectionEl || fragment;
}

function renderSummaryCard(target, finanzen = []) {
  if (!target) return;
  const fragment = createCard({
    eyebrow: "",
    title: "Übersicht",
    body: "",
    footer: "",
  });
  const card = fragment.querySelector(".ui-card") || fragment.firstElementChild;
  const body = card?.querySelector(".ui-card__body");
  if (body) {
    const sumZahlungen = sumByTyp(finanzen, "zahlung");
    const sumOffen = sumByTyp(finanzen, "offen");
    const saldo = sumZahlungen - sumOffen;

    const list = document.createElement("dl");
    list.className = "finanzen-summary";

    list.appendChild(createSummaryRow("Summe Zahlungen", sumZahlungen));
    list.appendChild(createSummaryRow("Summe Offen", sumOffen));
    list.appendChild(createSummaryRow("Saldo", saldo));

    body.innerHTML = "";
    body.appendChild(list);
  }
  target.appendChild(card || fragment);
}

function createSummaryRow(label, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "finanzen-summary__row";
  const term = document.createElement("dt");
  term.textContent = label;
  const detail = document.createElement("dd");
  detail.textContent = formatCurrency(value);
  wrapper.append(term, detail);
  return wrapper;
}

function sumByTyp(list, typ) {
  if (!Array.isArray(list)) return 0;
  const normalizedTyp = String(typ || "").toLowerCase();
  return list
    .filter((item) => (item?.typ || "").toLowerCase() === normalizedTyp)
    .reduce((acc, item) => acc + (Number(item?.betrag) || 0), 0);
}

function formatCurrency(value) {
  const number = Number.isFinite(value) ? value : 0;
  return `${number.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF`;
}

function renderListCard(target, finanzen = [], kundenMap = new Map()) {
  if (!target) return;
  const fragment = createCard({
    eyebrow: "",
    title: "Einträge",
    body: "",
    footer: "",
  });
  const card = fragment.querySelector(".ui-card") || fragment.firstElementChild;
  const body = card?.querySelector(".ui-card__body");
  if (body) {
    const table = document.createElement("table");
    table.className = "finanzen-table";
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["ID", "Code", "Kunde", "Typ", "Betrag", "Datum", "Beschreibung", ""].forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    finanzen.forEach((entry) => {
      const tr = document.createElement("tr");
      tr.className = "finanzen-table__row";
      const kundeLabel = formatKundeLabel(entry.kundeId, kundenMap);
      const cells = [
        entry?.id || "–",
        entry?.code || "–",
        kundeLabel,
        formatTyp(entry?.typ),
        formatCurrency(entry?.betrag),
        entry?.datum || "–",
        entry?.beschreibung || "–",
      ];
      cells.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      const actionTd = document.createElement("td");
      const link = document.createElement("a");
      link.href = `#/finanzen/${entry?.id || ""}`;
      link.className = "ui-btn ui-btn--ghost";
      link.textContent = "Details";
      actionTd.appendChild(link);
      tr.appendChild(actionTd);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    body.innerHTML = "";
    body.appendChild(table);
  }
  target.appendChild(card || fragment);
}

function renderFilterCard(target, kundenMap = new Map(), filters = {}, reloadFn) {
  if (!target) return;
  const fragment = createCard({
    eyebrow: "",
    title: "Filter",
    body: "",
    footer: "",
  });
  const card = fragment.querySelector(".ui-card") || fragment.firstElementChild;
  const body = card?.querySelector(".ui-card__body");
  if (body) {
    const form = document.createElement("div");
    form.className = "finanzen-filters";

    const kundeLabel = document.createElement("label");
    kundeLabel.textContent = "Kunde";
    kundeLabel.setAttribute("for", "finanzen-filter-kunde");
    const kundeSelect = document.createElement("select");
    kundeSelect.id = "finanzen-filter-kunde";
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Alle Kunden";
    kundeSelect.appendChild(allOption);
    kundenMap.forEach((kunde, id) => {
      const option = document.createElement("option");
      option.value = id;
      const label = formatKundeLabel(id, kundenMap);
      option.textContent = label;
      option.selected = filters?.kundeId === id;
      kundeSelect.appendChild(option);
    });

    const typLabel = document.createElement("label");
    typLabel.textContent = "Typ";
    typLabel.setAttribute("for", "finanzen-filter-typ");
    const typSelect = document.createElement("select");
    typSelect.id = "finanzen-filter-typ";
    [
      { value: "", label: "Alle Typen" },
      { value: "zahlung", label: "Zahlung" },
      { value: "offen", label: "Offen" },
    ].forEach(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = (filters?.typ || "") === value;
      typSelect.appendChild(option);
    });

    const applyFilters = () => {
      const nextFilters = {
        kundeId: kundeSelect.value || null,
        typ: typSelect.value || "",
      };
      if (typeof reloadFn === "function") {
        reloadFn(null, nextFilters);
      }
    };

    kundeSelect.addEventListener("change", applyFilters);
    typSelect.addEventListener("change", applyFilters);

    const controls = document.createElement("div");
    controls.className = "finanzen-filters__controls";
    controls.append(kundeLabel, kundeSelect, typLabel, typSelect);
    form.appendChild(controls);
    body.innerHTML = "";
    body.appendChild(form);
  }
  target.appendChild(card || fragment);
}

function renderDetailCard(target, entry, kundenMap = new Map()) {
  if (!target || !entry) return;
  const fragment = createCard({
    eyebrow: "",
    title: "Details",
    body: "",
    footer: "",
  });
  const card = fragment.querySelector(".ui-card") || fragment.firstElementChild;
  const body = card?.querySelector(".ui-card__body");
  const footer = card?.querySelector(".ui-card__footer");
  if (body) {
    const list = document.createElement("dl");
    list.className = "finanzen-detail";

    list.appendChild(createDetailRow("ID", entry.id || "–"));
    list.appendChild(createDetailRow("Code", entry.code || "–"));

    const kundeRow = document.createElement("div");
    kundeRow.className = "finanzen-detail__row";
    const kundeTerm = document.createElement("dt");
    kundeTerm.textContent = "Kunde";
    const kundeValue = document.createElement("dd");
    const kunde = kundenMap.get(entry.kundeId);
    if (kunde) {
      const link = document.createElement("a");
      link.href = `#/kunden/${entry.kundeId}`;
      link.textContent = formatKundeLabel(entry.kundeId, kundenMap);
      link.className = "ui-link";
      kundeValue.appendChild(link);
    } else {
      kundeValue.textContent = formatKundeLabel(entry.kundeId, kundenMap);
    }
    kundeRow.append(kundeTerm, kundeValue);
    list.appendChild(kundeRow);

    list.appendChild(createDetailRow("Typ", formatTyp(entry.typ)));
    list.appendChild(createDetailRow("Betrag", formatCurrency(entry.betrag)));
    list.appendChild(createDetailRow("Datum", entry.datum || "–"));
    list.appendChild(createDetailRow("Beschreibung", entry.beschreibung || "–"));

    body.innerHTML = "";
    body.appendChild(list);
  }

  if (footer) {
    const backLink = document.createElement("a");
    backLink.href = "#/finanzen";
    backLink.className = "ui-btn ui-btn--ghost";
    backLink.textContent = "Zur Übersicht";
    footer.appendChild(backLink);
  }

  target.appendChild(card || fragment);
}

function createDetailRow(label, value) {
  const row = document.createElement("div");
  row.className = "finanzen-detail__row";
  const term = document.createElement("dt");
  term.textContent = label;
  const detail = document.createElement("dd");
  detail.textContent = value;
  row.append(term, detail);
  return row;
}

function formatKundeLabel(kundeId, kundenMap = new Map()) {
  if (!kundeId) return "Kein Kunde verknüpft";
  const kunde = kundenMap.get(kundeId);
  if (!kunde) {
    return `Unbekannter Kunde (${kundeId})`;
  }
  const code = kunde.code || kunde.id || "–";
  const name = kunde.name || `${kunde.vorname || ""} ${kunde.nachname || ""}`.trim() || "Unbenannt";
  return `${code} – ${name}`;
}

function formatTyp(typ) {
  if (!typ) return "–";
  const normalized = String(typ).toLowerCase();
  if (normalized === "zahlung") return "Zahlung";
  if (normalized === "offen") return "Offen";
  return typ;
}

async function getKundenMap() {
  if (kundenMapCache) return kundenMapCache;
  try {
    const kunden = await listKunden();
    const map = new Map();
    kunden.forEach((kunde) => {
      const code = kunde?.code || kunde?.kundenCode || kunde?.id || "";
      const name = `${kunde?.vorname || ""} ${kunde?.nachname || ""}`.trim();
      map.set(kunde.id, { ...kunde, code, name });
    });
    kundenMapCache = map;
    return kundenMapCache;
  } catch (error) {
    console.error("FINANZEN_KUNDEN_LOAD_FAILED", error);
    kundenMapCache = new Map();
    return kundenMapCache;
  }
}

async function loadData(filters = {}) {
  const kundeId = filters?.kundeId || null;
  let finanzen = [];
  let kundenMap = await getKundenMap();
  if (kundeId) {
    try {
      finanzen = await listFinanzenByKundeId(kundeId);
    } catch (error) {
      console.error("FINANZEN_FILTER_KUNDE_FAILED", error);
      finanzen = [];
    }
  } else {
    finanzen = await listFinanzen();
  }

  // Refresh kundenMap if empty (in case earlier fetch failed)
  if (!kundenMap || kundenMap.size === 0) {
    kundenMap = await getKundenMap();
  }

  const typFilter = (filters?.typ || "").toLowerCase();
  if (typFilter) {
    finanzen = finanzen.filter((entry) => (entry?.typ || "").toLowerCase() === typFilter);
  }

  return { finanzen, kundenMap };
}

function scrollToTop(node) {
  if (!node) return;
  if (
    typeof window !== "undefined" &&
    node === document.body &&
    typeof window.scrollTo === "function"
  ) {
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }
  if (typeof node.scrollTo === "function") {
    node.scrollTo({ top: 0, behavior: "auto" });
  } else {
    node.scrollTop = 0;
  }
}

function focusHeading(scope) {
  if (!scope) return;
  const heading = scope.querySelector("h1, h2");
  if (heading) {
    heading.tabIndex = heading.tabIndex || -1;
    heading.focus();
  }
}
