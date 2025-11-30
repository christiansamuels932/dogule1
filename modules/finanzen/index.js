// Finanzen module – list/detail/create/edit/delete flows with mock API
/* globals document, console, window */
import {
  listFinanzen,
  listFinanzenByKundeId,
  createFinanz,
  updateFinanz,
  deleteFinanz,
  getFinanz,
} from "../shared/api/finanzen.js";
import { listKunden } from "../shared/api/kunden.js";
import {
  createButton,
  createCard,
  createEmptyState,
  createNotice,
  createSectionHeader,
  createFormRow,
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
    const { detailId, filters, mode } = routeState;

    const section = document.createElement("section");
    section.className = "dogule-section finanzen-section";
    container.appendChild(section);

    const heading = createMainHeading("Finanzen");
    section.appendChild(heading);

    const contentHost = document.createElement("div");
    contentHost.setAttribute("data-fin-content", "host");
    section.appendChild(contentHost);

    void loadFinanzen(mode, detailId, filters);

    async function loadFinanzen(activeMode = "list", activeDetailId = null, activeFilters = {}) {
      contentHost.innerHTML = "";
      const loadingNotice = createNotice("Lade Finanzen...", { variant: "info", role: "status" });
      contentHost.appendChild(loadingNotice);

      try {
        const { finanzen, kundenMap } = await loadData(activeFilters);
        contentHost.innerHTML = "";
        await renderByMode({
          mode: activeMode,
          detailId: activeDetailId,
          finanzen,
          kundenMap,
          filters: activeFilters,
          target: contentHost,
          container,
          section,
          reload: (nextMode, nextId, nextFilters) =>
            loadFinanzen(
              nextMode || activeMode,
              nextId ?? activeDetailId,
              nextFilters ?? activeFilters
            ),
        });
      } catch (error) {
        console.error("FINANZEN_LOAD_FAILED", error);
        contentHost.innerHTML = "";
        const retryButton = createButton({
          label: "Erneut versuchen",
          onClick: () => loadFinanzen(activeMode, activeDetailId, activeFilters),
        });
        const errorNotice = createNotice("Fehler beim Laden der Daten.", {
          variant: "warn",
          role: "alert",
        });
        contentHost.append(errorNotice, retryButton);
      } finally {
        scrollToTop(container);
        focusHeading(section);
      }
    }
  } catch (error) {
    console.error("FINANZEN_INIT_FAILED", error);
  }
}

function parseRouteSegments(segments = []) {
  const normalized = (segments || []).filter(Boolean);
  const withoutPrefix = normalized[0] === "finanzen" ? normalized.slice(1) : normalized;

  if (!withoutPrefix.length) {
    return { mode: "list", detailId: null, filters: {} };
  }

  const [first, second] = withoutPrefix;
  if (first === "new") {
    return { mode: "create", detailId: null, filters: {} };
  }

  if (second === "edit") {
    return { mode: "edit", detailId: first || null, filters: {} };
  }

  return { mode: "detail", detailId: first || null, filters: {} };
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
    const sumZahlungen = sumByTyp(finanzen, "bezahlt");
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

  const actions = document.createElement("div");
  actions.className = "finanzen-list-actions";
  const newButton = createButton({
    label: "Neu",
    variant: "primary",
    onClick: () => {
      window.location.hash = "#/finanzen/new";
    },
  });
  actions.appendChild(newButton);
  target.appendChild(actions);

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
      tr.addEventListener("click", (event) => {
        const isLink = event.target?.closest("a");
        if (isLink) return;
        window.location.hash = `#/finanzen/${entry?.id || ""}`;
      });
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
      { value: "bezahlt", label: "Bezahlt" },
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
        reloadFn("list", nextFilters);
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
    const actions = document.createElement("div");
    actions.className = "finanzen-detail__actions";
    const editBtn = createButton({
      label: "Bearbeiten",
      variant: "primary",
      onClick: () => {
        window.location.hash = `#/finanzen/${entry.id}/edit`;
      },
    });
    const deleteBtn = createButton({
      label: "Löschen",
      variant: "quiet",
      onClick: () => {
        renderDeleteCard(target, entry);
      },
    });
    actions.append(editBtn, deleteBtn);
    footer.appendChild(actions);

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
  if (normalized === "zahlung") return "Bezahlt";
  if (normalized === "bezahlt") return "Bezahlt";
  if (normalized === "offen") return "Offen";
  return typ;
}

async function renderByMode({
  mode,
  detailId,
  finanzen,
  kundenMap,
  filters,
  target,
  container,
  section,
  reload,
}) {
  const effectiveMode = mode || "list";

  if (effectiveMode === "create") {
    const form = await renderFormCard({
      kundenMap,
      mode: "create",
      onSave: async (payload, setError) => {
        try {
          const created = await createFinanz(payload);
          window.location.hash = `#/finanzen/${created.id}`;
        } catch (error) {
          console.error("FINANZEN_CREATE_FAILED", error);
          setError("Fehler beim Speichern.");
        }
      },
      onCancel: () => {
        window.location.hash = "#/finanzen";
      },
    });
    target.appendChild(form);
    scrollToTop(container);
    focusHeading(section);
    return;
  }

  if (effectiveMode === "edit") {
    const entry = finanzen.find((item) => item.id === detailId) || (await getFinanz(detailId));
    if (!entry) {
      target.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
      scrollToTop(container);
      focusHeading(section);
      return;
    }
    const form = await renderFormCard({
      kundenMap,
      mode: "edit",
      entry,
      onSave: async (payload, setError) => {
        try {
          const updated = await updateFinanz(detailId, payload);
          if (!updated) {
            setError("Fehler beim Speichern.");
            return;
          }
          window.location.hash = `#/finanzen/${detailId}`;
        } catch (error) {
          console.error("FINANZEN_UPDATE_FAILED", error);
          setError("Fehler beim Speichern.");
        }
      },
      onCancel: () => {
        window.location.hash = `#/finanzen/${detailId}`;
      },
    });
    target.appendChild(form);
    scrollToTop(container);
    focusHeading(section);
    return;
  }

  if (effectiveMode === "detail") {
    const entry = finanzen.find((item) => item.id === detailId) || (await getFinanz(detailId));
    if (!entry) {
      target.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
    } else {
      renderDetailCard(target, entry, kundenMap);
    }
    scrollToTop(container);
    focusHeading(section);
    return;
  }

  if (!Array.isArray(finanzen) || finanzen.length === 0) {
    renderFilterCard(target, kundenMap, filters, (nextMode, nextFilters) =>
      reload(nextMode || "list", null, nextFilters)
    );
    target.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
  } else {
    renderSummaryCard(target, finanzen);
    renderFilterCard(target, kundenMap, filters, (nextMode, nextFilters) =>
      reload(nextMode || "list", null, nextFilters)
    );
    renderListCard(target, finanzen, kundenMap);
  }
  scrollToTop(container);
  focusHeading(section);
}

function buildCodeToggle(codeInput) {
  const wrapper = document.createElement("div");
  wrapper.className = "finanzen-code-toggle";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "finanzen-code-toggle";
  const label = document.createElement("label");
  label.setAttribute("for", "finanzen-code-toggle");
  label.textContent = "Code manuell bearbeiten";

  const setState = (enabled) => {
    if (enabled) {
      codeInput.removeAttribute("readonly");
      codeInput.removeAttribute("disabled");
      codeInput.focus();
    } else {
      codeInput.setAttribute("readonly", "true");
      codeInput.setAttribute("disabled", "true");
    }
  };

  setState(false);
  checkbox.addEventListener("change", () => setState(checkbox.checked));

  wrapper.append(checkbox, label);
  return wrapper;
}

async function renderFormCard({ kundenMap, mode, entry = {}, onSave, onCancel }) {
  const fragment = createCard({
    eyebrow: "",
    title: mode === "edit" ? "Buchung bearbeiten" : "Neue Buchung",
    body: "",
    footer: "",
  });
  const card = fragment.querySelector(".ui-card") || fragment.firstElementChild;
  const body = card?.querySelector(".ui-card__body");
  const footer = card?.querySelector(".ui-card__footer");
  const errorSlot = document.createElement("div");
  errorSlot.className = "finanzen-form__errors";

  const form = document.createElement("form");
  form.className = "finanzen-form";

  const idRow = createFormRow({
    id: "finanzen-id",
    label: "ID",
    type: "text",
    placeholder: "System generiert",
  });
  const idInput = idRow.querySelector("input");
  idInput.name = "id";
  idInput.value = entry.id || "Wird automatisch vergeben";
  idInput.readOnly = true;
  idInput.disabled = true;
  form.appendChild(idRow);

  const codeRow = createFormRow({
    id: "finanzen-code",
    label: "Code",
    type: "text",
    placeholder: "Optionaler Code",
  });
  const codeInput = codeRow.querySelector("input");
  codeInput.name = "code";
  codeInput.value = entry.code || "";
  form.appendChild(codeRow);
  const toggle = buildCodeToggle(codeInput);
  form.appendChild(toggle);

  const kundeRow = createFormRow({
    id: "finanzen-kunde",
    label: "Kunde",
    control: "select",
    options: buildKundenOptions(kundenMap),
  });
  const kundeSelect = kundeRow.querySelector("select");
  kundeSelect.name = "kundeId";
  kundeSelect.value = entry.kundeId || "";
  form.appendChild(kundeRow);

  const typRow = createFormRow({
    id: "finanzen-typ",
    label: "Typ",
    control: "select",
    options: [
      { value: "", label: "Bitte auswählen" },
      { value: "bezahlt", label: "Bezahlt" },
      { value: "offen", label: "Offen" },
    ],
  });
  const typSelect = typRow.querySelector("select");
  typSelect.name = "typ";
  typSelect.value = normalizeTyp(entry.typ) || "";
  form.appendChild(typRow);

  const betragRow = createFormRow({
    id: "finanzen-betrag",
    label: "Betrag (CHF)",
    type: "number",
    placeholder: "z. B. 120",
  });
  const betragInput = betragRow.querySelector("input");
  betragInput.name = "betrag";
  betragInput.step = "0.01";
  betragInput.min = "0";
  betragInput.value = entry.betrag ?? "";
  form.appendChild(betragRow);

  const datumRow = createFormRow({
    id: "finanzen-datum",
    label: "Datum",
    type: "date",
  });
  const datumInput = datumRow.querySelector("input");
  datumInput.name = "datum";
  datumInput.value = entry.datum || "";
  form.appendChild(datumRow);

  const beschreibungRow = createFormRow({
    id: "finanzen-beschreibung",
    label: "Beschreibung",
    control: "textarea",
    placeholder: "Optional",
  });
  const beschreibungInput = beschreibungRow.querySelector("textarea");
  beschreibungInput.name = "beschreibung";
  beschreibungInput.value = entry.beschreibung || "";
  form.appendChild(beschreibungRow);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorSlot.innerHTML = "";
    const payload = {
      code: codeInput.value || "",
      kundeId: kundeSelect.value || "",
      typ: typSelect.value || "",
      betrag: Number.parseFloat(betragInput.value),
      datum: datumInput.value || "",
      beschreibung: beschreibungInput.value || "",
    };

    const missing = [];
    if (!payload.kundeId) missing.push("Kunde");
    if (!payload.typ) missing.push("Typ");
    if (!Number.isFinite(payload.betrag)) missing.push("Betrag");
    if (!payload.datum) missing.push("Datum");

    if (missing.length) {
      errorSlot.appendChild(
        createNotice(`Bitte ausfüllen: ${missing.join(", ")}`, { variant: "warn", role: "alert" })
      );
      return;
    }

    if (typeof onSave === "function") {
      await onSave(payload, (message) => {
        errorSlot.innerHTML = "";
        errorSlot.appendChild(
          createNotice(message || "Fehler beim Speichern.", { variant: "warn", role: "alert" })
        );
      });
    }
  });

  if (body) {
    body.innerHTML = "";
    body.append(errorSlot, form);
  }

  if (footer) {
    footer.innerHTML = "";
    const actions = document.createElement("div");
    actions.className = "finanzen-form__actions";
    const saveBtn = createButton({ label: "Speichern", variant: "primary" });
    saveBtn.type = "submit";
    saveBtn.addEventListener("click", () => form.requestSubmit());
    const cancelBtn = createButton({ label: "Abbrechen", variant: "quiet" });
    cancelBtn.type = "button";
    cancelBtn.addEventListener("click", () => {
      if (typeof onCancel === "function") onCancel();
    });
    actions.append(saveBtn, cancelBtn);
    footer.appendChild(actions);
  }

  return card || fragment;
}

function buildKundenOptions(kundenMap = new Map()) {
  const options = [{ value: "", label: "Bitte auswählen" }];
  kundenMap.forEach((kunde, id) => {
    options.push({
      value: id,
      label: formatKundeLabel(id, kundenMap),
      selected: false,
    });
  });
  return options;
}

function renderDeleteCard(target, entry) {
  const fragment = createCard({
    eyebrow: "",
    title: "Buchung löschen?",
    body: "",
    footer: "",
  });
  const card = fragment.querySelector(".ui-card") || fragment.firstElementChild;
  const body = card?.querySelector(".ui-card__body");
  const footer = card?.querySelector(".ui-card__footer");

  if (body) {
    body.innerHTML = "";
    body.appendChild(
      createNotice("Dieser Vorgang kann nicht rückgängig gemacht werden.", {
        variant: "warn",
        role: "alert",
      })
    );
  }

  if (footer) {
    footer.innerHTML = "";
    const actions = document.createElement("div");
    actions.className = "finanzen-delete__actions";
    const confirm = createButton({
      label: "Löschen",
      variant: "primary",
      onClick: async () => {
        try {
          await deleteFinanz(entry.id);
          window.location.hash = "#/finanzen";
        } catch (error) {
          console.error("FINANZEN_DELETE_FAILED", error);
          footer.appendChild(
            createNotice("Fehler beim Löschen.", { variant: "warn", role: "alert" })
          );
        }
      },
    });
    const cancel = createButton({
      label: "Abbrechen",
      variant: "quiet",
      onClick: () => {
        window.location.hash = `#/finanzen/${entry.id}`;
      },
    });
    actions.append(confirm, cancel);
    footer.appendChild(actions);
  }

  target.innerHTML = "";
  target.appendChild(card || fragment);
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

  if (!kundenMap || kundenMap.size === 0) {
    kundenMap = await getKundenMap();
  }

  finanzen = finanzen.map((entry) => ({
    ...entry,
    kundeId: entry?.kundeId || entry?.kundenId || "",
    typ: normalizeTyp(entry?.typ),
  }));

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

function normalizeTyp(typ) {
  const normalized = String(typ || "").toLowerCase();
  if (normalized === "zahlung") return "bezahlt";
  if (normalized === "bezahlt") return "bezahlt";
  if (normalized === "offen") return "offen";
  return normalized || "";
}
