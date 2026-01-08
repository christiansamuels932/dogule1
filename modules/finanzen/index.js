// Finanzen module – list/detail/create/edit/delete flows with mock API
/* globals document, console, window */
import {
  listFinanzen,
  listFinanzenByKundeId,
  createFinanz,
  updateFinanz,
  deleteFinanz,
  getFinanz,
  resolveFinanzenWithRelations,
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
import { listKurse } from "../shared/api/kurse.js";

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

    const heading = createMainHeading("Rechnungen");
    section.appendChild(heading);

    const contentHost = document.createElement("div");
    contentHost.setAttribute("data-fin-content", "host");
    section.appendChild(contentHost);

    void loadFinanzen(mode, detailId, filters);

    async function loadFinanzen(activeMode = "list", activeDetailId = null, activeFilters = {}) {
      contentHost.innerHTML = "";
      const loadingNotice = createNotice("Lade Rechnungen...", { variant: "info", role: "status" });
      contentHost.appendChild(loadingNotice);

      try {
        const { finanzen, kundenMap, relationMap } = await loadData(activeFilters);
        contentHost.innerHTML = "";
        await renderByMode({
          mode: activeMode,
          detailId: activeDetailId,
          finanzen,
          kundenMap,
          relationMap,
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

    list.appendChild(createSummaryRow("Summe Bezahlt", sumZahlungen));
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

function formatCurrency(value, currency = "CHF") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed && !Number.isFinite(Number(trimmed))) return trimmed;
  }
  const parsed = Number(value);
  const number = Number.isFinite(parsed) ? parsed : 0;
  const label = currency || "CHF";
  return `${number.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${label}`;
}

function renderListActions(target) {
  if (!target) return;
  const actions = document.createElement("div");
  actions.className = "finanzen-list-actions";
  const newButton = createButton({
    label: "Neue Rechnung",
    variant: "primary",
    onClick: () => {
      window.location.hash = "#/finanzen/new";
    },
  });
  actions.appendChild(newButton);
  target.appendChild(actions);
}

function renderListCard(target, finanzen = [], kundenMap = new Map(), relationMap = new Map()) {
  if (!target) return;

  const fragment = createCard({
    eyebrow: "",
    title: "Rechnungsverlauf",
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
    [
      "Rechnung",
      "Kunde",
      "Kurs",
      "Status",
      "Total",
      "Rechnungsdatum",
      "Leistungszeitraum",
      "Fällig",
      "",
    ].forEach((label) => {
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
      const relation = relationMap.get(entry.id) || {};
      const kursLabel = formatKursLabel(relation.kurs);
      const cells = [
        entry?.code || "–",
        kundeLabel,
        kursLabel,
        formatStatus(entry?.typ),
        formatCurrency(entry?.betrag, entry?.waehrung),
        entry?.datum || "–",
        formatLeistungszeitraum(entry?.leistungVon, entry?.leistungBis),
        entry?.zahlungsfrist || "–",
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
    const kundeOptions = [{ value: "", label: "Alle Kunden", selected: !filters?.kundeId }];
    kundenMap.forEach((kunde, id) => {
      kundeOptions.push({
        value: id,
        label: formatKundeLabel(id, kundenMap),
        selected: filters?.kundeId === id,
      });
    });
    const kundeRow = createFormRow({
      id: "finanzen-filter-kunde",
      label: "Kunde",
      control: "select",
      options: kundeOptions,
    });
    const kundeSelect = kundeRow.querySelector("select");

    const statusRow = createFormRow({
      id: "finanzen-filter-typ",
      label: "Status",
      control: "select",
      options: [
        { value: "", label: "Alle Status", selected: (filters?.typ || "") === "" },
        { value: "bezahlt", label: "Bezahlt", selected: (filters?.typ || "") === "bezahlt" },
        { value: "offen", label: "Offen", selected: (filters?.typ || "") === "offen" },
      ],
    });
    const typSelect = statusRow.querySelector("select");

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
    controls.className = "list-controls";
    controls.append(kundeRow, statusRow);
    body.innerHTML = "";
    body.appendChild(controls);
  }
  target.appendChild(card || fragment);
}

function renderDetailCard(target, entry, kundenMap = new Map(), relation = {}) {
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
    list.appendChild(createDetailRow("Rechnungsnummer", entry.code || "–"));

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

    list.appendChild(createDetailRow("Status", formatStatus(entry.typ)));
    list.appendChild(createDetailRow("Rechnungsdatum", entry.datum || "–"));
    list.appendChild(
      createDetailRow(
        "Leistungszeitraum",
        formatLeistungszeitraum(entry.leistungVon, entry.leistungBis)
      )
    );
    list.appendChild(createDetailRow("Total", formatCurrency(entry.betrag, entry.waehrung)));
    list.appendChild(createDetailRow("Netto", formatCurrency(entry.nettoBetrag, entry.waehrung)));
    list.appendChild(createDetailRow("MWST", formatMwstSummary(entry.mwstSatz, entry.mwstBetrag)));
    list.appendChild(createDetailRow("Beschreibung", entry.beschreibung || "–"));
    list.appendChild(
      createDetailRow("Zahlungsfrist", entry.zahlungsfrist ? `${entry.zahlungsfrist} Tage` : "–")
    );
    list.appendChild(createDetailRow("IBAN", entry.iban || "–"));
    list.appendChild(
      createDetailRow("Aussteller", buildIssuerSummary(entry.issuerName, entry.issuerAdresse))
    );

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
    const backBtn = createButton({
      label: "Zur Übersicht",
      variant: "ghost",
      onClick: () => {
        window.location.hash = "#/finanzen";
      },
    });
    actions.append(editBtn, deleteBtn);
    footer.appendChild(actions);
    footer.appendChild(backBtn);
  }

  target.appendChild(card || fragment);

  renderTrainerCard(target, entry, relation);
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

function renderTrainerCard(target, entry, relation = {}) {
  if (!entry?.kursId) return;
  const { kurs, trainer } = relation;
  const fragment = createCard({
    eyebrow: "",
    title: "Kurs & Trainer",
    body: "",
    footer: "",
  });
  const card = fragment.querySelector(".ui-card") || fragment.firstElementChild;
  const body = card?.querySelector(".ui-card__body");
  const footer = card?.querySelector(".ui-card__footer");

  if (body) {
    body.innerHTML = "";
    if (!kurs) {
      body.appendChild(createNotice("Kurs nicht gefunden.", { variant: "warn", role: "status" }));
    } else {
      const list = document.createElement("dl");
      list.className = "finanzen-trainer-detail";
      list.appendChild(createDetailRow("Kurs", kurs.title || kurs.code || kurs.id || "–"));
      list.appendChild(createDetailRow("Kursdatum", kurs.date || "–"));
      list.appendChild(createDetailRow("Kurspreis", formatCurrency(kurs.price, "CHF")));
      if (!trainer) {
        list.appendChild(createDetailRow("Trainer", "Kein Trainer zugewiesen."));
      } else {
        list.appendChild(createDetailRow("Trainer", formatTrainerLabel(trainer)));
      }
      body.appendChild(list);
    }
  }

  if (footer && trainer) {
    footer.innerHTML = "";
    const link = createButton({
      label: "Zum Trainer",
      variant: "primary",
      onClick: () => {
        window.location.hash = `#/trainer/${trainer.id}`;
      },
    });
    footer.appendChild(link);
  }

  target.appendChild(card || fragment);
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

function formatTrainerLabel(trainer) {
  if (!trainer) return "Kein Trainer zugewiesen.";
  const code = trainer.code || trainer.id || "—";
  const name = trainer.name || "Unbenannter Trainer";
  return `${code} – ${name}`;
}

function formatKursLabel(kurs) {
  if (!kurs) return "–";
  const title = kurs.title || kurs.code || kurs.id || "–";
  const date = kurs.date ? ` (${kurs.date})` : "";
  return `${title}${date}`;
}

function formatLeistungszeitraum(start, end) {
  if (!start && !end) return "–";
  if (start && end && start !== end) return `${start} – ${end}`;
  return start || end || "–";
}

function formatMwstSummary(satz, betrag, hinweis) {
  if (!satz && !betrag && !hinweis) return "–";
  const parsedSatz = Number(satz);
  const parsedBetrag = Number(betrag);
  const parts = [];
  if (Number.isFinite(parsedSatz) && parsedSatz > 0) {
    parts.push(`${parsedSatz.toFixed(1)} %`);
  }
  if (Number.isFinite(parsedBetrag) && parsedBetrag > 0) {
    parts.push(`${parsedBetrag.toFixed(2)} CHF`);
  }
  if (hinweis) {
    parts.push(hinweis);
  }
  return parts.join(" • ") || "–";
}

function buildIssuerSummary(name, adresse) {
  const cleanedName = (name || "").trim();
  const cleanedAdresse = (adresse || "").trim();
  if (!cleanedName && !cleanedAdresse) return "–";
  if (!cleanedName) return cleanedAdresse;
  if (!cleanedAdresse) return cleanedName;
  return `${cleanedName} — ${cleanedAdresse}`;
}

function formatStatus(typ) {
  if (!typ) return "–";
  const normalized = String(typ).toLowerCase();
  if (normalized === "bezahlt") return "Bezahlt";
  if (normalized === "offen") return "Offen";
  return typ;
}

async function renderByMode({
  mode,
  detailId,
  finanzen,
  kundenMap,
  relationMap,
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
      finanzen,
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
      finanzen,
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
      const relation = relationMap?.get(entry.id) || {};
      renderDetailCard(target, entry, kundenMap, relation);
    }
    scrollToTop(container);
    focusHeading(section);
    return;
  }

  if (!Array.isArray(finanzen) || finanzen.length === 0) {
    renderListActions(target);
    renderFilterCard(target, kundenMap, filters, (nextMode, nextFilters) =>
      reload(nextMode || "list", null, nextFilters)
    );
    target.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
  } else {
    renderListActions(target);
    renderSummaryCard(target, finanzen);
    renderFilterCard(target, kundenMap, filters, (nextMode, nextFilters) =>
      reload(nextMode || "list", null, nextFilters)
    );
    renderListCard(target, finanzen, kundenMap, relationMap);
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
  label.textContent = "Nummer manuell bearbeiten";

  const setState = (enabled) => {
    if (enabled) {
      codeInput.removeAttribute("readonly");
      codeInput.removeAttribute("disabled");
      codeInput.dataset.auto = "false";
      codeInput.focus();
    } else {
      codeInput.setAttribute("readonly", "true");
      codeInput.setAttribute("disabled", "true");
      if (codeInput.dataset.auto !== "false") {
        codeInput.dataset.auto = "true";
      }
    }
  };

  setState(false);
  checkbox.addEventListener("change", () => setState(checkbox.checked));

  wrapper.append(checkbox, label);
  return wrapper;
}

async function renderFormCard({ kundenMap, finanzen = [], mode, entry = {}, onSave, onCancel }) {
  const fragment = createCard({
    eyebrow: "",
    title: mode === "edit" ? "Rechnung bearbeiten" : "Neue Rechnung",
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

  const kundeOptions = buildKundenOptions(kundenMap);
  let kursOptions = [{ value: "", label: "Kein Kurs verknüpft" }];
  let kursMap = new Map();
  try {
    const kurse = await listKurse();
    kursMap = new Map((kurse || []).map((kurs) => [kurs.id, kurs]));
    kursOptions = buildKursOptions(kurse);
  } catch (error) {
    console.error("FINANZEN_KURSE_LOAD_FAILED", error);
  }

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
    label: "Rechnungsnummer",
    type: "text",
    placeholder: "YYMMDD-001",
  });
  const codeInput = codeRow.querySelector("input");
  codeInput.name = "code";
  codeInput.value = entry.code || "";
  codeInput.dataset.auto = entry.code ? "false" : "true";
  form.appendChild(codeRow);
  const toggle = buildCodeToggle(codeInput);
  form.appendChild(toggle);
  codeInput.addEventListener("input", () => {
    codeInput.dataset.auto = "false";
  });

  const kundeSearchRow = createFormRow({
    id: "finanzen-kunde-search",
    label: "Kunde suchen",
    placeholder: "Name, E-Mail, Ort ...",
  });
  const kundeSearchInput = kundeSearchRow.querySelector("input");
  if (kundeSearchInput) {
    kundeSearchInput.type = "search";
  }
  form.appendChild(kundeSearchRow);

  const kundeRow = createFormRow({
    id: "finanzen-kunde",
    label: "Kunde",
    control: "select",
    options: kundeOptions,
  });
  const kundeSelect = kundeRow.querySelector("select");
  kundeSelect.name = "kundeId";
  kundeSelect.value = entry.kundeId || "";
  form.appendChild(kundeRow);
  if (kundeSearchInput) {
    kundeSearchInput.addEventListener("input", () => {
      const options = filterKundenOptions(kundenMap, kundeSearchInput.value);
      populateKundenSelect(kundeSelect, options, kundeSelect.value);
    });
  }

  const kursRow = createFormRow({
    id: "finanzen-kurs",
    label: "Kurs",
    control: "select",
    options: kursOptions,
  });
  const kursSelect = kursRow.querySelector("select");
  kursSelect.name = "kursId";
  kursSelect.value = entry.kursId || "";
  form.appendChild(kursRow);

  const typRow = createFormRow({
    id: "finanzen-typ",
    label: "Status",
    control: "select",
    options: [
      { value: "", label: "Bitte auswählen" },
      { value: "bezahlt", label: "Bezahlt" },
      { value: "offen", label: "Offen" },
    ],
  });
  const typSelect = typRow.querySelector("select");
  typSelect.name = "typ";
  typSelect.value = normalizeTyp(entry.typ) || "offen";
  form.appendChild(typRow);

  const datumRow = createFormRow({
    id: "finanzen-datum",
    label: "Rechnungsdatum",
    type: "date",
  });
  const datumInput = datumRow.querySelector("input");
  datumInput.name = "datum";
  datumInput.value = entry.datum || "";
  form.appendChild(datumRow);

  const leistungVonRow = createFormRow({
    id: "finanzen-leistung-von",
    label: "Leistungsdatum",
    type: "date",
  });
  const leistungVonInput = leistungVonRow.querySelector("input");
  leistungVonInput.name = "leistungVon";
  leistungVonInput.value = entry.leistungVon || "";
  form.appendChild(leistungVonRow);

  const nettoRow = createFormRow({
    id: "finanzen-netto",
    label: "Netto",
    type: "number",
    placeholder: "z. B. 110",
  });
  const nettoInput = nettoRow.querySelector("input");
  nettoInput.name = "nettoBetrag";
  nettoInput.step = "0.01";
  nettoInput.min = "0";
  nettoInput.value = entry.nettoBetrag ?? "";
  form.appendChild(nettoRow);

  const mwstSatzRow = createFormRow({
    id: "finanzen-mwst-satz",
    label: "MWST-Satz (%)",
    type: "number",
    placeholder: "z. B. 8.1",
  });
  const mwstSatzInput = mwstSatzRow.querySelector("input");
  mwstSatzInput.name = "mwstSatz";
  mwstSatzInput.step = "0.1";
  mwstSatzInput.min = "0";
  mwstSatzInput.value = entry.mwstSatz ?? "";
  form.appendChild(mwstSatzRow);

  const mwstBetragRow = createFormRow({
    id: "finanzen-mwst-betrag",
    label: "MWST-Betrag",
    type: "number",
    placeholder: "z. B. 8.50",
  });
  const mwstBetragInput = mwstBetragRow.querySelector("input");
  mwstBetragInput.name = "mwstBetrag";
  mwstBetragInput.step = "0.01";
  mwstBetragInput.min = "0";
  mwstBetragInput.value = entry.mwstBetrag ?? "";
  mwstBetragInput.readOnly = true;
  form.appendChild(mwstBetragRow);

  const beschreibungRow = createFormRow({
    id: "finanzen-beschreibung",
    label: "Beschreibung der Leistung",
    control: "textarea",
    placeholder: "Optional",
  });
  const beschreibungInput = beschreibungRow.querySelector("textarea");
  beschreibungInput.name = "beschreibung";
  beschreibungInput.value = entry.beschreibung || "";
  form.appendChild(beschreibungRow);

  const zahlungsfristRow = createFormRow({
    id: "finanzen-zahlungsfrist",
    label: "Zahlungsfrist (Tage)",
    type: "number",
    placeholder: "z. B. 30",
  });
  const zahlungsfristInput = zahlungsfristRow.querySelector("input");
  zahlungsfristInput.name = "zahlungsfrist";
  zahlungsfristInput.min = "0";
  zahlungsfristInput.step = "1";
  zahlungsfristInput.value = entry.zahlungsfrist || "30";
  form.appendChild(zahlungsfristRow);

  const ibanRow = createFormRow({
    id: "finanzen-iban",
    label: "IBAN",
    type: "text",
    placeholder: "CH..",
  });
  const ibanInput = ibanRow.querySelector("input");
  ibanInput.name = "iban";
  ibanInput.value = entry.iban || "";
  form.appendChild(ibanRow);

  const issuerNameRow = createFormRow({
    id: "finanzen-issuer-name",
    label: "Aussteller Name/Firma",
    type: "text",
  });
  const issuerNameInput = issuerNameRow.querySelector("input");
  issuerNameInput.name = "issuerName";
  issuerNameInput.value = entry.issuerName || "";
  form.appendChild(issuerNameRow);

  const issuerAdresseRow = createFormRow({
    id: "finanzen-issuer-adresse",
    label: "Aussteller Adresse",
    control: "textarea",
    placeholder: "Strasse, PLZ Ort",
  });
  const issuerAdresseInput = issuerAdresseRow.querySelector("textarea");
  issuerAdresseInput.name = "issuerAdresse";
  issuerAdresseInput.value = entry.issuerAdresse || "";
  form.appendChild(issuerAdresseRow);

  const betragRow = createFormRow({
    id: "finanzen-betrag",
    label: "Total",
    type: "number",
    placeholder: "Automatisch berechnet",
  });
  const betragInput = betragRow.querySelector("input");
  betragInput.name = "betrag";
  betragInput.step = "0.01";
  betragInput.min = "0";
  betragInput.value = entry.betrag ?? "";
  betragInput.readOnly = true;
  form.appendChild(betragRow);

  const applyAutoCode = () => {
    if (codeInput.dataset.auto !== "true") return;
    const nextCode = buildRechnungsnummer(datumInput.value, finanzen);
    if (nextCode) {
      codeInput.value = nextCode;
    }
  };

  const formatMoneyValue = (value) => {
    if (!Number.isFinite(value)) return "";
    return value.toFixed(2);
  };

  const recalculateTotals = () => {
    const nettoValue = Number.parseFloat(nettoInput.value);
    if (!Number.isFinite(nettoValue)) {
      mwstBetragInput.value = "";
      betragInput.value = "";
      return;
    }
    const satzValue = Number.parseFloat(mwstSatzInput.value);
    const satz = Number.isFinite(satzValue) ? satzValue : 0;
    const mwstValue = nettoValue * (satz / 100);
    mwstBetragInput.value = formatMoneyValue(mwstValue);
    betragInput.value = formatMoneyValue(nettoValue + mwstValue);
  };

  const applyKursDefaults = () => {
    const kurs = kursMap.get(kursSelect.value);
    if (!kurs) return;
    if (!beschreibungInput.value && kurs.title) {
      beschreibungInput.value = kurs.title;
    }
    const kursPrice = Number(kurs.price);
    if ((!nettoInput.value || Number(nettoInput.value) === 0) && Number.isFinite(kursPrice)) {
      nettoInput.value = String(kursPrice);
    }
    if (!leistungVonInput.value && kurs.date) {
      leistungVonInput.value = kurs.date;
    }
    if (!datumInput.value && kurs.date) {
      datumInput.value = kurs.date;
      applyAutoCode();
    }
    recalculateTotals();
  };

  datumInput.addEventListener("change", applyAutoCode);
  kursSelect.addEventListener("change", applyKursDefaults);
  nettoInput.addEventListener("input", recalculateTotals);
  mwstSatzInput.addEventListener("input", recalculateTotals);
  applyAutoCode();
  recalculateTotals();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorSlot.innerHTML = "";
    applyAutoCode();
    recalculateTotals();
    const payload = {
      code: codeInput.value || "",
      kundeId: kundeSelect.value || "",
      kursId: kursSelect.value || null,
      typ: typSelect.value || "",
      betrag: Number.parseFloat(betragInput.value),
      datum: datumInput.value || "",
      beschreibung: beschreibungInput.value || "",
      leistungVon: leistungVonInput.value || "",
      leistungBis: leistungVonInput.value || "",
      waehrung: "CHF",
      nettoBetrag: safeNumber(nettoInput.value),
      mwstSatz: safeNumber(mwstSatzInput.value),
      mwstBetrag: safeNumber(mwstBetragInput.value),
      zahlungsfrist: zahlungsfristInput.value || "",
      iban: ibanInput.value || "",
      issuerName: issuerNameInput.value || "",
      issuerAdresse: issuerAdresseInput.value || "",
    };

    const missing = [];
    if (!payload.kundeId) missing.push("Kunde");
    if (!payload.typ) missing.push("Status");
    if (!Number.isFinite(payload.betrag)) missing.push("Total");
    if (!payload.datum) missing.push("Rechnungsdatum");
    if (!payload.beschreibung) missing.push("Beschreibung");
    if (!payload.code) missing.push("Rechnungsnummer");

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

function filterKundenOptions(kundenMap = new Map(), query = "") {
  const normalized = String(query || "")
    .trim()
    .toLowerCase();
  if (!normalized) return buildKundenOptions(kundenMap);
  const options = [{ value: "", label: "Bitte auswählen" }];
  kundenMap.forEach((kunde, id) => {
    const haystack = [
      kunde?.code,
      kunde?.name,
      kunde?.vorname,
      kunde?.nachname,
      kunde?.email,
      kunde?.telefon,
      kunde?.adresse,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (haystack.includes(normalized)) {
      options.push({ value: id, label: formatKundeLabel(id, kundenMap), selected: false });
    }
  });
  return options;
}

function populateKundenSelect(select, options, selectedValue) {
  if (!select) return;
  select.innerHTML = "";
  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    opt.selected = option.value === selectedValue;
    select.appendChild(opt);
  });
}

function buildKursOptions(kurse = []) {
  const options = [{ value: "", label: "Kein Kurs verknüpft" }];
  (kurse || []).forEach((kurs) => {
    options.push({
      value: kurs.id,
      label: formatKursLabel(kurs),
      selected: false,
    });
  });
  return options;
}

function renderDeleteCard(target, entry) {
  const fragment = createCard({
    eyebrow: "",
    title: "Rechnung löschen?",
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

async function getKundenMap({ force = false } = {}) {
  const hasCache = kundenMapCache && kundenMapCache.size > 0;
  if (hasCache && !force) return kundenMapCache;
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
    return kundenMapCache || new Map();
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
    kundenMap = await getKundenMap({ force: true });
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

  let relationMap = new Map();
  try {
    const relations = await resolveFinanzenWithRelations(finanzen);
    relationMap = new Map(
      relations.map(({ finanz, kurs, trainer }) => [finanz.id, { kurs, trainer }])
    );
  } catch (error) {
    console.error("FINANZEN_RELATION_RESOLVE_FAILED", error);
  }

  return { finanzen, kundenMap, relationMap };
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

function safeNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildRechnungsnummer(dateValue, finanzen = []) {
  if (!dateValue) return "";
  const parts = String(dateValue).split("-");
  if (parts.length !== 3) return "";
  const year = parts[0].slice(2);
  const month = parts[1];
  const day = parts[2];
  if (!year || !month || !day) return "";
  const prefix = `${year}${month}${day}`;
  let max = 0;
  (finanzen || []).forEach((entry) => {
    const code = String(entry?.code || "");
    const match = code.match(new RegExp(`^${prefix}-(\\d{3})$`));
    if (!match) return;
    const value = Number.parseInt(match[1], 10);
    if (Number.isFinite(value) && value > max) {
      max = value;
    }
  });
  const next = max + 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

function normalizeTyp(typ) {
  const normalized = String(typ || "").toLowerCase();
  if (normalized === "zahlung") return "bezahlt";
  if (normalized === "bezahlt") return "bezahlt";
  if (normalized === "offen") return "offen";
  return normalized || "";
}
