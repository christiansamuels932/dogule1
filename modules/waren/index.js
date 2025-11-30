/* globals document, window */
import {
  listWaren,
  getWarenById,
  createWaren,
  updateWaren,
  deleteWaren,
} from "../shared/api/waren.js";
import {
  createCard,
  createNotice,
  createEmptyState,
  createButton,
  createFormRow,
} from "../shared/components/components.js";

export function initModule(container, routeInfo = {}) {
  if (!container) return;

  clearAndScroll(container);

  const { mode, detailId } = parseRoute(routeInfo?.segments);
  const section = document.createElement("section");
  section.className = "dogule-section waren-section";

  const heading = document.createElement("h1");
  heading.textContent = "Waren";
  heading.tabIndex = -1;
  section.appendChild(heading);

  const placeholder = document.createElement("div");
  placeholder.className = "waren-placeholder";

  if (mode === "list") {
    appendSubheading(section, "Übersicht");
    placeholder.dataset.view = "list";
    renderListView(placeholder);
  } else if (mode === "create") {
    appendSubheading(section, "Neue Ware erstellen");
    placeholder.dataset.view = "create";
    renderFormView(placeholder, { mode: "create" });
  } else if (mode === "detail") {
    appendSubheading(section, "Details · Ware");
    placeholder.dataset.view = "detail";
    if (detailId) placeholder.dataset.id = detailId;
    renderDetailView(placeholder, detailId);
  } else if (mode === "edit") {
    appendSubheading(section, "Verkauf bearbeiten");
    placeholder.dataset.view = "edit";
    if (detailId) placeholder.dataset.id = detailId;
    renderFormView(placeholder, { mode: "edit", id: detailId });
  } else {
    appendSubheading(section, "Übersicht");
    placeholder.dataset.view = "list";
  }

  section.appendChild(placeholder);
  container.appendChild(section);
  focusHeading(section);
}

function parseRoute(segments = []) {
  const parts = Array.isArray(segments) ? segments.filter(Boolean) : [];
  if (!parts.length) {
    return { mode: "list", detailId: null };
  }
  if (parts[0] === "new") {
    return { mode: "create", detailId: null };
  }
  if (parts[1] === "edit") {
    return { mode: "edit", detailId: parts[0] || null };
  }
  return { mode: "detail", detailId: parts[0] || null };
}

function clearAndScroll(container) {
  container.innerHTML = "";
  if (typeof container.scrollTo === "function") {
    container.scrollTo({ top: 0, behavior: "auto" });
  } else {
    container.scrollTop = 0;
  }
}

function appendSubheading(section, text) {
  const h2 = document.createElement("h2");
  h2.textContent = text;
  section.appendChild(h2);
}

async function renderListView(target) {
  if (!target) return;
  target.innerHTML = "";

  const headerRow = document.createElement("div");
  headerRow.className = "waren-actions";
  headerRow.style.display = "flex";
  headerRow.style.alignItems = "center";
  headerRow.style.justifyContent = "flex-end";
  headerRow.style.gap = "0.5rem";
  headerRow.style.marginBottom = "1rem";

  const newBtn = createButton({
    label: "Neu",
    variant: "primary",
    onClick: () => {
      window.location.hash = "#/waren/new";
    },
  });
  headerRow.appendChild(newBtn);
  target.appendChild(headerRow);

  const listHost = document.createElement("div");
  listHost.className = "waren-list";
  target.appendChild(listHost);

  renderLoadingNotice(listHost);

  let waren = [];
  try {
    waren = await listWaren();
  } catch {
    renderErrorNotice(listHost);
    return;
  }

  if (!Array.isArray(waren) || !waren.length) {
    renderEmptyNotice(listHost);
    return;
  }

  listHost.innerHTML = "";
  const fragment = document.createDocumentFragment();
  waren.forEach((verkauf) => {
    const cardFragment = createCard({
      eyebrow: verkauf?.code || verkauf?.id || "",
      title: verkauf?.produktName || "Produkt",
      body: "",
      footer: "",
    });
    const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
    const body = card?.querySelector(".ui-card__body");
    if (body) {
      body.innerHTML = "";
      body.appendChild(buildDetailList(verkauf));
    }
    const footer = card?.querySelector(".ui-card__footer");
    if (footer) {
      footer.innerHTML = "";
      const linkBtn = createButton({
        label: "Details anzeigen",
        variant: "secondary",
        onClick: () => {
          window.location.hash = `#/waren/${verkauf?.id ?? ""}`;
        },
      });
      footer.appendChild(linkBtn);
    }
    fragment.appendChild(card || cardFragment);
  });
  listHost.appendChild(fragment);
}

function renderLoadingNotice(target) {
  if (!target) return;
  target.innerHTML = "";
  target.appendChild(createNotice("Lade Waren...", { variant: "info", role: "status" }));
}

function renderErrorNotice(target) {
  if (!target) return;
  target.innerHTML = "";
  target.appendChild(
    createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
  );
}

function renderEmptyNotice(target) {
  if (!target) return;
  target.innerHTML = "";
  target.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
}

function buildDetailList(entry = {}) {
  const list = document.createElement("dl");
  list.className = "waren-details";
  list.appendChild(createRow("Code", entry.code || entry.id || "–"));
  list.appendChild(createRow("Produkt", entry.produktName || "Unbenannt"));
  list.appendChild(createRow("Menge", formatNumber(entry.menge)));
  list.appendChild(createRow("Preis", formatCurrency(entry.preis)));
  list.appendChild(createRow("Verkaufsdatum", entry.datum || "–"));
  return list;
}

function createRow(label, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "waren-details__row";
  const term = document.createElement("dt");
  term.textContent = label;
  const detail = document.createElement("dd");
  detail.textContent = value;
  wrapper.append(term, detail);
  return wrapper;
}

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return String(num);
}

function formatCurrency(value) {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  return `CHF ${safe.toFixed(2)}`;
}

async function renderDetailView(target, id) {
  if (!target) return;
  target.innerHTML = "";
  renderLoadingNotice(target);

  let record = null;
  try {
    record = id ? await getWarenById(id) : null;
  } catch {
    renderErrorNotice(target);
    return;
  }

  if (!record) {
    renderNotFound(target);
    return;
  }

  const cardFragment = createCard({
    eyebrow: record.code || record.id || "",
    title: record.produktName || "Produkt",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  const body = card?.querySelector(".ui-card__body");
  if (body) {
    body.innerHTML = "";
    const list = document.createElement("dl");
    list.className = "waren-details";
    list.appendChild(createRow("Code", record.code || record.id || "–"));
    list.appendChild(createRow("Produkt", record.produktName || "Unbenannt"));
    list.appendChild(createRow("Menge", formatNumber(record.menge)));
    list.appendChild(createRow("Preis", formatCurrency(record.preis)));
    list.appendChild(createRow("Verkaufsdatum", record.datum || "–"));
    if (record.beschreibung) {
      list.appendChild(createRow("Beschreibung", record.beschreibung));
    }
    body.appendChild(list);
  }

  const footer = card?.querySelector(".ui-card__footer");
  if (footer) {
    footer.innerHTML = "";
    const actions = document.createElement("div");
    actions.className = "waren-actions";
    const editBtn = createButton({
      label: "Bearbeiten",
      variant: "primary",
      onClick: () => {
        window.location.hash = `#/waren/${record.id}/edit`;
      },
    });
    const deleteBtn = createButton({
      label: "Löschen",
      variant: "secondary",
      onClick: () => handleDelete(record.id),
    });
    actions.append(editBtn, deleteBtn);
    footer.appendChild(actions);
  }

  target.innerHTML = "";
  target.appendChild(card || cardFragment);
}

function renderNotFound(target) {
  if (!target) return;
  target.innerHTML = "";
  target.appendChild(createNotice("Datensatz nicht gefunden.", { variant: "warn", role: "alert" }));
}

async function renderFormView(target, { mode = "create", id = null } = {}) {
  if (!target) return;
  target.innerHTML = "";

  if (mode === "edit") {
    renderLoadingNotice(target);
    let record = null;
    try {
      record = id ? await getWarenById(id) : null;
    } catch {
      renderErrorNotice(target);
      return;
    }
    if (!record) {
      renderNotFound(target);
      return;
    }
    target.innerHTML = "";
    const form = createFormShell(target);
    buildFormFields(form, record, mode);
    attachFormHandlers(form, mode, record.id);
    return;
  }

  const form = createFormShell(target);
  buildFormFields(form, {}, mode);
  attachFormHandlers(form, mode, null);
}

function buildFormFields(form, record = {}, mode = "create") {
  const fieldset = document.createElement("div");
  fieldset.className = "waren-form__fields";

  const codeRow = createFormRow({
    id: "waren-code",
    label: "Code",
    value: record.code || "",
    required: false,
  });
  const codeInput = codeRow.querySelector("input, textarea, select");
  if (codeInput) {
    codeInput.readOnly = mode === "create";
  }

  const produktRow = createFormRow({
    id: "waren-produkt",
    label: "Produktname",
    required: true,
    value: record.produktName || "",
  });

  const mengeRow = createFormRow({
    id: "waren-menge",
    label: "Menge",
    control: "input",
    type: "number",
    required: false,
    value: record.menge ?? "",
  });

  const preisRow = createFormRow({
    id: "waren-preis",
    label: "Preis",
    control: "input",
    type: "number",
    required: true,
    value: record.preis ?? "",
  });

  const datumRow = createFormRow({
    id: "waren-datum",
    label: "Verkaufsdatum",
    control: "input",
    type: "date",
    required: true,
    value: record.datum || "",
  });

  const beschreibungRow = createFormRow({
    id: "waren-beschreibung",
    label: "Beschreibung",
    control: "textarea",
    required: false,
    value: record.beschreibung || "",
  });

  fieldset.append(codeRow, produktRow, mengeRow, preisRow, datumRow, beschreibungRow);
  form.appendChild(fieldset);

  const actions = document.createElement("div");
  actions.className = "waren-form__actions";
  const submitBtn = createButton({
    label: mode === "edit" ? "Speichern" : "Erstellen",
    variant: "primary",
  });
  submitBtn.type = "submit";
  const cancelBtn = createButton({
    label: "Abbrechen",
    variant: "secondary",
    onClick: (event) => {
      event.preventDefault();
      window.location.hash = "#/waren";
    },
  });
  actions.append(submitBtn, cancelBtn);
  form.appendChild(actions);
}

function attachFormHandlers(form, mode, id) {
  if (!form) return;
  const statusRow = form.querySelector(".waren-form__status");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitBtn?.disabled) return;
    if (statusRow) statusRow.innerHTML = "";

    const payload = collectPayload(form);
    const errors = validatePayload(payload);
    if (errors.length) {
      statusRow.appendChild(createNotice(errors.join(" "), { variant: "warn", role: "alert" }));
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = mode === "edit" ? "Speichert ..." : "Erstellt ...";

    try {
      if (mode === "edit" && id) {
        const updated = await updateWaren(id, payload);
        if (updated?.id) {
          window.location.hash = `#/waren/${updated.id}`;
          return;
        }
      } else {
        const created = await createWaren(payload);
        if (created?.id) {
          window.location.hash = `#/waren/${created.id}`;
          return;
        }
      }
      throw new Error("Save failed");
    } catch {
      if (statusRow) {
        statusRow.appendChild(
          createNotice("Fehler beim Speichern.", { variant: "warn", role: "alert" })
        );
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = mode === "edit" ? "Speichern" : "Erstellen";
      }
    }
  });
}

function collectPayload(form) {
  const getValue = (selector) => {
    const el = form.querySelector(selector);
    return el ? el.value : "";
  };
  return {
    code: getValue("#waren-code"),
    produktName: getValue("#waren-produkt").trim(),
    menge: sanitizeNumber(getValue("#waren-menge")),
    preis: sanitizeNumber(getValue("#waren-preis")),
    datum: getValue("#waren-datum"),
    beschreibung: getValue("#waren-beschreibung").trim(),
  };
}

function sanitizeNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function validatePayload(payload = {}) {
  const errors = [];
  if (!payload.produktName) {
    errors.push("Produktname fehlt.");
  }
  if (!payload.preis && payload.preis !== 0) {
    errors.push("Preis fehlt.");
  }
  if (!payload.datum) {
    errors.push("Verkaufsdatum fehlt.");
  }
  return errors;
}

function createFormShell(target) {
  const form = document.createElement("form");
  form.className = "waren-form";
  target.appendChild(form);

  const statusRow = document.createElement("div");
  statusRow.className = "waren-form__status";
  form.appendChild(statusRow);

  return form;
}

async function handleDelete(id) {
  if (!id) return;
  const confirmed = window.confirm("Möchten Sie diesen Verkauf wirklich löschen?");
  if (!confirmed) return;
  try {
    const result = await deleteWaren(id);
    if (!result?.ok && result?.id !== id) {
      // Treat missing record as success
    }
    window.location.hash = "#/waren";
  } catch {
    // Swallow errors to keep console clean and avoid duplicate dialogs
    window.location.hash = "#/waren";
  }
}

function focusHeading(scope) {
  if (!scope) return;
  const target =
    scope.querySelector("h1") || scope.querySelector('[tabindex="-1"]') || scope.firstElementChild;
  if (target && typeof target.focus === "function") {
    target.focus({ preventScroll: true });
  }
}
