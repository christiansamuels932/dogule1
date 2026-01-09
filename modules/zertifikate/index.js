/* globals document, window, URLSearchParams, console */
import {
  listZertifikate,
  getZertifikat,
  createZertifikat,
  updateZertifikat,
} from "../shared/api/zertifikate.js";
import { listKunden } from "../shared/api/kunden.js";
import { listHunde } from "../shared/api/hunde.js";
import { listKurse } from "../shared/api/kurse.js";
import { listTrainer } from "../shared/api/trainer.js";
import {
  createCard,
  createNotice,
  createEmptyState,
  createButton,
  createFormRow,
  createSectionHeader,
} from "../shared/components/components.js";
import { openCertificatePdf, validateCertificateSnapshot } from "./certificatePdf.js";

export function initModule(container, routeInfo = {}) {
  if (!container) return;
  container.innerHTML = "";
  container.scrollTo?.({ top: 0, behavior: "auto" });

  const { mode, detailId } = parseRoute(routeInfo?.segments);
  const section = document.createElement("section");
  section.className = "dogule-section zertifikate-section";

  const title = document.createElement("h1");
  title.textContent = "Zertifikate";
  title.tabIndex = -1;
  section.appendChild(title);

  if (mode === "list") {
    section.appendChild(
      createSectionHeader({ title: "Übersicht", subtitle: "", level: 2 })
    );
    renderListView(section);
  } else if (mode === "create") {
    section.appendChild(
      createSectionHeader({ title: "Zertifikat erstellen", subtitle: "", level: 2 })
    );
    renderCreateView(section);
  } else if (mode === "detail") {
    section.appendChild(createSectionHeader({ title: "Zertifikat", subtitle: "Details", level: 2 }));
    renderDetailView(section, detailId);
  } else if (mode === "edit") {
    section.appendChild(
      createSectionHeader({ title: "Zertifikat bearbeiten", subtitle: "", level: 2 })
    );
    renderEditView(section, detailId);
  } else {
    section.appendChild(
      createSectionHeader({ title: "Übersicht", subtitle: "", level: 2 })
    );
    renderListView(section);
  }

  container.appendChild(section);
  title.focus?.();
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

function parseHashQuery() {
  const raw = typeof window !== "undefined" ? window.location.hash || "" : "";
  const idx = raw.indexOf("?");
  if (idx === -1) return new URLSearchParams();
  return new URLSearchParams(raw.slice(idx + 1));
}

async function renderListView(section) {
  const actionsRow = document.createElement("div");
  actionsRow.className = "module-actions";
  const createBtn = createButton({
    label: "Zertifikat erstellen",
    variant: "primary",
    onClick: () => {
      window.location.hash = "#/zertifikate/new";
    },
  });
  actionsRow.appendChild(createBtn);
  section.appendChild(actionsRow);

  const cardFragment = createCard({
    eyebrow: "",
    title: "Zertifikate",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";
  const exportStatus = document.createElement("div");
  exportStatus.className = "zertifikate-export-status";
  body.appendChild(exportStatus);
  body.appendChild(createNotice("Lade Zertifikate...", { variant: "info", role: "status" }));
  section.appendChild(card);

  let zertifikate = [];
  try {
    zertifikate = await listZertifikate();
  } catch (error) {
    console.error("[ZERTIFIKATE_LIST_FAIL]", error);
    body.innerHTML = "";
    body.appendChild(createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" }));
    return;
  }

  if (!Array.isArray(zertifikate) || !zertifikate.length) {
    body.innerHTML = "";
    const empty = createEmptyState("Keine Zertifikate vorhanden.", "");
    body.appendChild(empty);
    return;
  }

  body.innerHTML = "";
  const tableWrapper = document.createElement("div");
  tableWrapper.className = "kunden-list-scroll";
  const table = document.createElement("table");
  table.className = "kunden-list-table";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  [
    "Code",
    "Kunde",
    "Hund",
    "Kurs",
    "Kursdatum",
    "Ausstellungsdatum",
  ].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  const tbody = document.createElement("tbody");
  zertifikate.forEach((entry) => {
    const row = document.createElement("tr");
    row.addEventListener("click", (event) => {
      if (event.target?.closest("a")) return;
      window.location.hash = `#/zertifikate/${entry.id}`;
    });
    row.appendChild(buildCell(entry.code || "–", true, entry.id));
    row.appendChild(buildCell(entry.kundeNameSnapshot || "–"));
    row.appendChild(buildCell(entry.hundNameSnapshot || "–"));
    row.appendChild(buildCell(entry.kursTitelSnapshot || "–"));
    row.appendChild(buildCell(entry.kursDatumSnapshot || "–"));
    row.appendChild(buildCell(entry.ausstellungsdatum || "–"));
    tbody.appendChild(row);
  });
  table.append(thead, tbody);
  tableWrapper.appendChild(table);
  body.appendChild(tableWrapper);
}

function buildCell(text, isLink = false, id = "") {
  const td = document.createElement("td");
  if (isLink) {
    const link = document.createElement("a");
    link.href = `#/zertifikate/${id}`;
    link.textContent = text || "–";
    td.appendChild(link);
  } else {
    td.textContent = text || "–";
  }
  return td;
}

async function renderDetailView(section, id) {
  const detailCard = createStandardCard("Stammdaten");
  const detailBody = detailCard?.querySelector(".ui-card__body");
  const actionsCard = createStandardCard("Aktionen");
  const actionsBody = actionsCard?.querySelector(".ui-card__body");
  const actionsWrap = document.createElement("div");
  actionsWrap.className = "module-actions";
  const exportStatus = document.createElement("div");
  exportStatus.className = "zertifikate-export-status";

  if (actionsBody) {
    actionsBody.innerHTML = "";
    actionsBody.append(actionsWrap, exportStatus);
  }
  if (detailBody) {
    detailBody.innerHTML = "";
    detailBody.appendChild(createNotice("Lade Zertifikat...", { variant: "info", role: "status" }));
  }
  if (detailCard) section.appendChild(detailCard);
  if (actionsCard) section.appendChild(actionsCard);

  if (!id) {
    if (detailBody) {
      detailBody.innerHTML = "";
      detailBody.appendChild(
        createNotice("Keine Zertifikat-ID angegeben.", { variant: "warn", role: "alert" })
      );
    }
    actionsWrap.append(
      createButton({
        label: "Zur Übersicht",
        variant: "quiet",
        onClick: () => {
          window.location.hash = "#/zertifikate";
        },
      })
    );
    return;
  }

  let zertifikat = null;
  try {
    zertifikat = await getZertifikat(id);
  } catch (error) {
    console.error("[ZERTIFIKATE_DETAIL_LOAD_FAIL]", error);
    if (detailBody) {
      detailBody.innerHTML = "";
      detailBody.appendChild(
        createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
      );
    }
    actionsWrap.append(
      createButton({
        label: "Zur Übersicht",
        variant: "quiet",
        onClick: () => {
          window.location.hash = "#/zertifikate";
        },
      })
    );
    return;
  }

  if (!zertifikat) {
    if (detailBody) {
      detailBody.innerHTML = "";
      detailBody.appendChild(
        createNotice("Zertifikat nicht gefunden.", { variant: "warn", role: "alert" })
      );
    }
    actionsWrap.append(
      createButton({
        label: "Zur Übersicht",
        variant: "quiet",
        onClick: () => {
          window.location.hash = "#/zertifikate";
        },
      })
    );
    return;
  }

  const subtitle = section.querySelector(".ui-section__subtitle");
  if (subtitle) {
    subtitle.textContent = zertifikat.code || "Details";
    subtitle.hidden = !subtitle.textContent;
  }

  if (detailBody) {
    detailBody.innerHTML = "";
    const rows = [
      { label: "ID", value: zertifikat.id },
      { label: "Code", value: zertifikat.code },
      {
        label: "Kunde",
        value: formatKundeWording(
          zertifikat.kundeNameSnapshot,
          zertifikat.kundeGeschlechtSnapshot
        ),
      },
      { label: "Kunde Geschlecht", value: formatGeschlechtLabel(zertifikat.kundeGeschlechtSnapshot) },
      { label: "Hund", value: zertifikat.hundNameSnapshot },
      { label: "Hund Rasse", value: zertifikat.hundRasseSnapshot },
      { label: "Hund Geschlecht", value: formatGeschlechtLabel(zertifikat.hundGeschlechtSnapshot) },
      { label: "Kurs", value: zertifikat.kursTitelSnapshot },
      { label: "Kurs Datum", value: zertifikat.kursDatumSnapshot },
      { label: "Kurs Ort", value: zertifikat.kursOrtSnapshot },
      { label: "Kursinhalt Theorie", value: zertifikat.kursInhaltTheorieSnapshot },
      { label: "Kursinhalt Praxis", value: zertifikat.kursInhaltPraxisSnapshot },
      {
        label: "Trainer 1",
        value: formatTrainerLabel(
          zertifikat.trainer1NameSnapshot,
          zertifikat.trainer1TitelSnapshot
        ),
      },
      {
        label: "Trainer 2",
        value: formatTrainerLabel(
          zertifikat.trainer2NameSnapshot,
          zertifikat.trainer2TitelSnapshot
        ),
      },
      { label: "Ausstellungsdatum", value: zertifikat.ausstellungsdatum },
      { label: "Bemerkungen", value: zertifikat.bemerkungen },
      { label: "Erstellt am", value: formatDateTime(zertifikat.createdAt) },
      { label: "Aktualisiert am", value: formatDateTime(zertifikat.updatedAt) },
    ];
    detailBody.appendChild(createDefinitionList(rows));
  }

  const editBtn = createButton({ label: "Bearbeiten", variant: "secondary" });
  editBtn.type = "button";
  editBtn.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Achtung: Bearbeiten überschreibt die gespeicherten Snapshot-Daten. Fortfahren?"
    );
    if (!confirmed) return;
    window.location.hash = `#/zertifikate/${zertifikat.id}/edit`;
  });
  const pdfBtn = createButton({ label: "PDF export", variant: "secondary" });
  pdfBtn.type = "button";
  pdfBtn.disabled = false;
  pdfBtn.addEventListener("click", () => {
    exportStatus.innerHTML = "";
    exportStatus.appendChild(
      createNotice("PDF wird vorbereitet...", { variant: "info", role: "status" })
    );
    try {
      const missing = validateCertificateSnapshot(zertifikat);
      if (missing.length) {
        exportStatus.appendChild(
          createNotice(
            `PDF kann nicht erstellt werden. Fehlende Felder: ${missing.join(", ")}.`,
            { variant: "warn", role: "alert" }
          )
        );
        return;
      }
      openCertificatePdf(zertifikat);
    } catch (error) {
      const message =
        error?.code === "POPUP_BLOCKED"
          ? "PDF-Fenster wurde blockiert. Bitte Pop-ups erlauben."
          : "PDF-Generierung fehlgeschlagen.";
      exportStatus.appendChild(createNotice(message, { variant: "warn", role: "alert" }));
      console.error("[ZERTIFIKAT_PDF_FAIL]", error);
    }
  });
  const backBtn = createButton({
    label: "Zur Übersicht",
    variant: "quiet",
    onClick: () => {
      window.location.hash = "#/zertifikate";
    },
  });
  actionsWrap.append(editBtn, pdfBtn, backBtn);
}

function buildDetailGroup(title, rows = []) {
  const wrapper = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = title;
  wrapper.appendChild(heading);
  const list = document.createElement("dl");
  list.className = "zertifikate-detail-list";
  rows.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value || "–";
    list.append(dt, dd);
  });
  wrapper.appendChild(list);
  return wrapper;
}

async function renderCreateView(section, { mode = "create", existing = null } = {}) {
  const formCardFragment = createCard({
    eyebrow: "",
    title: "Zertifikat erstellen",
    body: "",
    footer: "",
  });
  const formCard = formCardFragment.querySelector(".ui-card") || formCardFragment.firstElementChild;
  const formBody = formCard.querySelector(".ui-card__body");
  formBody.innerHTML = "";
  const statusSlot = document.createElement("div");
  statusSlot.className = "zertifikate-form-status";
  formBody.appendChild(statusSlot);

  const form = document.createElement("form");
  form.noValidate = true;
  form.className = "zertifikate-form";
  form.id = "zertifikate-create-form";
  formBody.appendChild(form);

  if (mode === "edit" && existing) {
    const idRow = createFormRow({
      id: "zertifikate-id",
      label: "Zertifikat-ID",
      control: "input",
      type: "text",
      value: existing.id || "",
      required: false,
    });
    const idInput = idRow.querySelector("input");
    idInput.name = "zertifikatId";
    idInput.disabled = true;
    idRow.querySelector(".ui-form-row__hint")?.classList.add("sr-only");
    form.appendChild(idRow);

    const codeRow = createFormRow({
      id: "zertifikate-code",
      label: "Code",
      control: "input",
      type: "text",
      value: existing.code || "",
      required: false,
    });
    const codeInput = codeRow.querySelector("input");
    codeInput.name = "code";
    codeInput.disabled = true;
    codeRow.querySelector(".ui-form-row__hint")?.classList.add("sr-only");
    form.appendChild(codeRow);
  }

  const previewCardFragment = createCard({
    eyebrow: "",
    title: "Vorschau (Snapshot)",
    body: "",
    footer: "",
  });
  const previewCard =
    previewCardFragment.querySelector(".ui-card") || previewCardFragment.firstElementChild;
  const previewBody = previewCard.querySelector(".ui-card__body");

  const [kunden, hunde, kurse, trainer] = await Promise.all([
    listKunden().catch(() => []),
    listHunde().catch(() => []),
    listKurse().catch(() => []),
    listTrainer().catch(() => []),
  ]);

  const query = parseHashQuery();
  const preselect = {
    kundeId: existing?.kundeId || query.get("kundeId") || "",
    hundId: existing?.hundId || query.get("hundId") || "",
    kursId: existing?.kursId || query.get("kursId") || "",
    kursDatumSnapshot: existing?.kursDatumSnapshot || query.get("kursDatumSnapshot") || "",
    kursOrtSnapshot:
      existing?.kursOrtSnapshot || query.get("kursOrtSnapshot") || "Vorhard Döttingen",
  };

  const refs = {};

  const kundeSearchRow = createFormRow({
    id: "zertifikate-kunde-search",
    label: "Kunde suchen",
    control: "input",
    type: "search",
    placeholder: "Name, Code oder E-Mail",
    required: false,
  });
  const kundeSearchInput = kundeSearchRow.querySelector("input");
  kundeSearchInput.name = "kundeSearch";
  kundeSearchRow.querySelector(".ui-form-row__hint")?.classList.add("sr-only");
  form.appendChild(kundeSearchRow);

  const kundeRow = createFormRow({
    id: "zertifikate-kunde",
    label: "Kunde*",
    control: "select",
    required: true,
    options: buildKundenOptions(kunden, preselect.kundeId, ""),
  });
  const kundeSelect = kundeRow.querySelector("select");
  kundeSelect.name = "kundeId";
  refs.kundeId = { input: kundeSelect, hint: kundeRow.querySelector(".ui-form-row__hint") };
  form.appendChild(kundeRow);

  const hundRow = createFormRow({
    id: "zertifikate-hund",
    label: "Hund*",
    control: "select",
    required: true,
    options: buildHundeOptions(hunde, preselect.kundeId, preselect.hundId),
  });
  const hundSelect = hundRow.querySelector("select");
  hundSelect.name = "hundId";
  refs.hundId = { input: hundSelect, hint: hundRow.querySelector(".ui-form-row__hint") };
  form.appendChild(hundRow);

  const kursRow = createFormRow({
    id: "zertifikate-kurs",
    label: "Kurs*",
    control: "select",
    required: true,
    options: buildKursOptions(kurse, preselect.kursId),
  });
  const kursSelect = kursRow.querySelector("select");
  kursSelect.name = "kursId";
  refs.kursId = { input: kursSelect, hint: kursRow.querySelector(".ui-form-row__hint") };
  form.appendChild(kursRow);

  const kursDatumRow = createFormRow({
    id: "zertifikate-kurs-datum",
    label: "Kurs Datum*",
    control: "input",
    type: "date",
    required: true,
  });
  const kursDatumInput = kursDatumRow.querySelector("input");
  kursDatumInput.name = "kursDatumSnapshot";
  kursDatumInput.value = preselect.kursDatumSnapshot;
  refs.kursDatumSnapshot = {
    input: kursDatumInput,
    hint: kursDatumRow.querySelector(".ui-form-row__hint"),
  };
  form.appendChild(kursDatumRow);

  const kursOrtRow = createFormRow({
    id: "zertifikate-kurs-ort",
    label: "Kurs Ort*",
    control: "input",
    type: "text",
    required: true,
    value: preselect.kursOrtSnapshot,
  });
  const kursOrtInput = kursOrtRow.querySelector("input");
  kursOrtInput.name = "kursOrtSnapshot";
  refs.kursOrtSnapshot = {
    input: kursOrtInput,
    hint: kursOrtRow.querySelector(".ui-form-row__hint"),
  };
  form.appendChild(kursOrtRow);

  const trainer1Row = createFormRow({
    id: "zertifikate-trainer1",
    label: "Trainer 1*",
    control: "select",
    required: true,
    options: buildTrainerOptions(trainer, ""),
  });
  const trainer1Select = trainer1Row.querySelector("select");
  trainer1Select.name = "trainer1Id";
  refs.trainer1Id = {
    input: trainer1Select,
    hint: trainer1Row.querySelector(".ui-form-row__hint"),
  };
  form.appendChild(trainer1Row);

  const trainer1ModeRow = createFormRow({
    id: "zertifikate-trainer1-mode",
    label: "Trainer 1 manuell",
    control: "input",
    type: "checkbox",
  });
  const trainer1ModeInput = trainer1ModeRow.querySelector("input");
  trainer1ModeInput.name = "trainer1Manual";
  trainer1ModeRow.querySelector(".ui-form-row__hint")?.classList.add("sr-only");
  refs.trainer1Manual = { input: trainer1ModeInput, hint: null };
  form.appendChild(trainer1ModeRow);

  const trainer1NameRow = createFormRow({
    id: "zertifikate-trainer1-name",
    label: "Trainer 1 Name*",
    control: "input",
    type: "text",
    placeholder: "z. B. Martina Frei",
  });
  const trainer1NameInput = trainer1NameRow.querySelector("input");
  trainer1NameInput.name = "trainer1NameManual";
  trainer1NameInput.disabled = true;
  refs.trainer1NameManual = {
    input: trainer1NameInput,
    hint: trainer1NameRow.querySelector(".ui-form-row__hint"),
  };
  form.appendChild(trainer1NameRow);

  const trainer1TitelRow = createFormRow({
    id: "zertifikate-trainer1-titel",
    label: "Trainer 1 Titel",
    control: "input",
    type: "text",
    placeholder: "z. B. Dipl. Hundetrainer:in",
  });
  const trainer1TitelInput = trainer1TitelRow.querySelector("input");
  trainer1TitelInput.name = "trainer1TitelManual";
  trainer1TitelInput.disabled = true;
  trainer1TitelRow.querySelector(".ui-form-row__hint")?.classList.add("sr-only");
  refs.trainer1TitelManual = { input: trainer1TitelInput, hint: null };
  form.appendChild(trainer1TitelRow);

  const trainer2Row = createFormRow({
    id: "zertifikate-trainer2",
    label: "Trainer 2",
    control: "select",
    required: false,
    options: buildTrainerOptions(trainer, ""),
  });
  const trainer2Select = trainer2Row.querySelector("select");
  trainer2Select.name = "trainer2Id";
  refs.trainer2Id = {
    input: trainer2Select,
    hint: trainer2Row.querySelector(".ui-form-row__hint"),
  };
  form.appendChild(trainer2Row);

  const trainer2ModeRow = createFormRow({
    id: "zertifikate-trainer2-mode",
    label: "Trainer 2 manuell",
    control: "input",
    type: "checkbox",
  });
  const trainer2ModeInput = trainer2ModeRow.querySelector("input");
  trainer2ModeInput.name = "trainer2Manual";
  trainer2ModeRow.querySelector(".ui-form-row__hint")?.classList.add("sr-only");
  refs.trainer2Manual = { input: trainer2ModeInput, hint: null };
  form.appendChild(trainer2ModeRow);

  const trainer2NameRow = createFormRow({
    id: "zertifikate-trainer2-name",
    label: "Trainer 2 Name",
    control: "input",
    type: "text",
    placeholder: "z. B. Jonas Graf",
  });
  const trainer2NameInput = trainer2NameRow.querySelector("input");
  trainer2NameInput.name = "trainer2NameManual";
  trainer2NameInput.disabled = true;
  trainer2NameRow.querySelector(".ui-form-row__hint")?.classList.add("sr-only");
  refs.trainer2NameManual = { input: trainer2NameInput, hint: null };
  form.appendChild(trainer2NameRow);

  const trainer2TitelRow = createFormRow({
    id: "zertifikate-trainer2-titel",
    label: "Trainer 2 Titel",
    control: "input",
    type: "text",
    placeholder: "z. B. Dipl. Hundetrainer:in",
  });
  const trainer2TitelInput = trainer2TitelRow.querySelector("input");
  trainer2TitelInput.name = "trainer2TitelManual";
  trainer2TitelInput.disabled = true;
  trainer2TitelRow.querySelector(".ui-form-row__hint")?.classList.add("sr-only");
  refs.trainer2TitelManual = { input: trainer2TitelInput, hint: null };
  form.appendChild(trainer2TitelRow);

  const dateRow = createFormRow({
    id: "zertifikate-ausstellungsdatum",
    label: "Ausstellungsdatum*",
    control: "input",
    type: "date",
    required: true,
  });
  const dateInput = dateRow.querySelector("input");
  dateInput.name = "ausstellungsdatum";
  dateInput.value = existing?.ausstellungsdatum || todayIso();
  refs.ausstellungsdatum = { input: dateInput, hint: dateRow.querySelector(".ui-form-row__hint") };
  form.appendChild(dateRow);

  const bemerkungenRow = createFormRow({
    id: "zertifikate-bemerkungen",
    label: "Bemerkungen",
    control: "textarea",
    required: false,
  });
  const bemerkungenInput = bemerkungenRow.querySelector("textarea");
  bemerkungenInput.name = "bemerkungen";
  bemerkungenInput.value = existing?.bemerkungen || "";
  refs.bemerkungen = {
    input: bemerkungenInput,
    hint: bemerkungenRow.querySelector(".ui-form-row__hint"),
  };
  form.appendChild(bemerkungenRow);

  const footer = formCard.querySelector(".ui-card__footer");
  const actions = document.createElement("div");
  actions.className = "module-actions";
  const submitBtn = createButton({
    label: mode === "edit" ? "Speichern" : "Erstellen",
    variant: "primary",
  });
  submitBtn.type = "button";
  submitBtn.setAttribute("form", form.id);
  const cancelBtn = createButton({
    label: "Abbrechen",
    variant: "quiet",
    onClick: () => {
      window.location.hash = "#/zertifikate";
    },
  });
  actions.append(submitBtn, cancelBtn);
  footer.innerHTML = "";
  footer.appendChild(actions);

  const updatePreview = () => {
    const snapshot = buildSnapshot(refs, { kunden, hunde, kurse, trainer });
    previewBody.innerHTML = "";
    previewBody.appendChild(buildDetailGroup("Kunde", [
      ["Name", formatKundeWording(snapshot.kundeNameSnapshot, snapshot.kundeGeschlechtSnapshot)],
      ["Geschlecht", formatGeschlechtLabel(snapshot.kundeGeschlechtSnapshot)],
    ]));
    previewBody.appendChild(buildDetailGroup("Hund", [
      ["Name", snapshot.hundNameSnapshot || "–"],
      ["Rasse", snapshot.hundRasseSnapshot || "–"],
      ["Geschlecht", formatGeschlechtLabel(snapshot.hundGeschlechtSnapshot)],
    ]));
    previewBody.appendChild(buildDetailGroup("Kurs", [
      ["Titel", snapshot.kursTitelSnapshot || "–"],
      ["Datum", snapshot.kursDatumSnapshot || "–"],
      ["Ort", snapshot.kursOrtSnapshot || "–"],
    ]));
    previewBody.appendChild(buildDetailGroup("Trainer", [
      ["Trainer 1", formatTrainerLabel(snapshot.trainer1NameSnapshot, snapshot.trainer1TitelSnapshot)],
      ["Trainer 2", formatTrainerLabel(snapshot.trainer2NameSnapshot, snapshot.trainer2TitelSnapshot)],
    ]));
    previewBody.appendChild(buildDetailGroup("Ausstellung", [
      ["Ausstellungsdatum", snapshot.ausstellungsdatum || "–"],
      ["Bemerkungen", snapshot.bemerkungen || "–"],
    ]));
  };

  const syncTrainerMode = (manualRef, selectRef, nameRef, titelRef) => {
    const manual = Boolean(manualRef.input.checked);
    selectRef.input.disabled = manual;
    nameRef.input.disabled = !manual;
    titelRef.input.disabled = !manual;
    if (!manual) {
      nameRef.input.value = "";
      titelRef.input.value = "";
    } else {
      selectRef.input.value = "";
    }
  };

  refs.trainer1Manual.input.addEventListener("change", () => {
    syncTrainerMode(refs.trainer1Manual, refs.trainer1Id, refs.trainer1NameManual, refs.trainer1TitelManual);
    updatePreview();
  });
  refs.trainer2Manual.input.addEventListener("change", () => {
    syncTrainerMode(refs.trainer2Manual, refs.trainer2Id, refs.trainer2NameManual, refs.trainer2TitelManual);
    updatePreview();
  });

  const syncHundOptions = () => {
    const kundeId = refs.kundeId.input.value || "";
    const currentHundId = refs.hundId.input.value || "";
    const options = buildHundeOptions(hunde, kundeId, currentHundId);
    setSelectOptions(refs.hundId.input, options, currentHundId);
    if (!refs.hundId.input.value) {
      refs.hundId.input.value = options.find((opt) => opt.value)?.value || "";
    }
  };

  const updateKundenOptions = () => {
    const term = (kundeSearchInput.value || "").trim().toLowerCase();
    const selected = refs.kundeId.input.value || "";
    const options = buildKundenOptions(kunden, selected, term);
    setSelectOptions(refs.kundeId.input, options, selected);
  };

  kundeSearchInput.addEventListener("input", () => {
    updateKundenOptions();
  });

  const syncKursDefaults = () => {
    const kurs = kurse.find((entry) => entry.id === refs.kursId.input.value) || null;
    if (kurs && !refs.kursDatumSnapshot.input.value) {
      refs.kursDatumSnapshot.input.value = kurs.date || "";
    }
    if (kurs && refs.kursOrtSnapshot.input.value === "Vorhard Döttingen") {
      refs.kursOrtSnapshot.input.value =
        kurs.ort || kurs.location || refs.kursOrtSnapshot.input.value;
    }
  };

  refs.kundeId.input.addEventListener("change", () => {
    syncHundOptions();
    updatePreview();
  });
  refs.kursId.input.addEventListener("change", () => {
    syncKursDefaults();
    updatePreview();
  });
  [
    refs.hundId,
    refs.kursId,
    refs.kursDatumSnapshot,
    refs.kursOrtSnapshot,
    refs.trainer1Id,
    refs.trainer2Id,
    refs.ausstellungsdatum,
  ].forEach(
    (ref) => {
      ref.input.addEventListener("change", updatePreview);
    }
  );
  [refs.trainer1NameManual, refs.trainer1TitelManual, refs.trainer2NameManual, refs.trainer2TitelManual].forEach(
    (ref) => {
      ref.input.addEventListener("input", updatePreview);
    }
  );
  refs.bemerkungen.input.addEventListener("input", updatePreview);

  updateKundenOptions();
  syncKursDefaults();
  syncTrainerMode(refs.trainer1Manual, refs.trainer1Id, refs.trainer1NameManual, refs.trainer1TitelManual);
  syncTrainerMode(refs.trainer2Manual, refs.trainer2Id, refs.trainer2NameManual, refs.trainer2TitelManual);
  syncHundOptions();
  updatePreview();

  const handleSubmit = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    statusSlot.innerHTML = "";
    const values = collectValues(refs);
    const errors = validate(values, { kurse, trainer });
    applyErrors(refs, errors);
    if (Object.keys(errors).length) {
      const errorList = Object.values(errors).filter(Boolean).join(" ");
      const message = errorList
        ? `Bitte prüfen: ${errorList}`
        : "Bitte prüfe die Pflichtfelder.";
      statusSlot.appendChild(createNotice(message, { variant: "warn", role: "alert" }));
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = mode === "edit" ? "Speichere ..." : "Erstelle ...";

    try {
      const snapshot = buildSnapshot(refs, { kunden, hunde, kurse, trainer });
      const payload = {
        code: existing?.code || "",
        kundeId: values.kundeId,
        hundId: values.hundId,
        kursId: values.kursId,
        kundeNameSnapshot: snapshot.kundeNameSnapshot,
        kundeGeschlechtSnapshot: snapshot.kundeGeschlechtSnapshot,
        hundNameSnapshot: snapshot.hundNameSnapshot,
        hundRasseSnapshot: snapshot.hundRasseSnapshot,
        hundGeschlechtSnapshot: snapshot.hundGeschlechtSnapshot,
        kursTitelSnapshot: snapshot.kursTitelSnapshot,
        kursDatumSnapshot: values.kursDatumSnapshot,
        kursOrtSnapshot: values.kursOrtSnapshot,
        kursInhaltTheorieSnapshot: snapshot.kursInhaltTheorieSnapshot,
        kursInhaltPraxisSnapshot: snapshot.kursInhaltPraxisSnapshot,
        ausstellungsdatum: values.ausstellungsdatum,
        trainer1NameSnapshot: snapshot.trainer1NameSnapshot,
        trainer1TitelSnapshot: snapshot.trainer1TitelSnapshot,
        trainer2NameSnapshot: snapshot.trainer2NameSnapshot,
        trainer2TitelSnapshot: snapshot.trainer2TitelSnapshot,
        bemerkungen: values.bemerkungen,
      };
      if (mode === "edit") {
        await updateZertifikat(existing.id, payload);
        window.location.hash = `#/zertifikate/${existing.id}`;
      } else {
        const created = await createZertifikat(payload);
        if (!created?.id) {
          throw new Error("create_failed");
        }
        window.location.hash = `#/zertifikate/${created.id}`;
      }
    } catch (error) {
      console.error("[ZERTIFIKAT_CREATE_FAIL]", error);
      const missing = Array.isArray(error?.missing) ? error.missing.join(", ") : "";
      const message =
        error?.code === "TRAINER_TITEL_REQUIRED"
          ? "Trainer-Titel fehlt. Bitte Titel ergänzen."
          : missing
            ? `Zertifikat konnte nicht erstellt werden. Fehlende Felder: ${missing}.`
            : "Zertifikat konnte nicht erstellt werden.";
      statusSlot.appendChild(createNotice(message, { variant: "warn", role: "alert" }));
      submitBtn.disabled = false;
      submitBtn.textContent = mode === "edit" ? "Speichern" : "Erstellen";
    }
  };

  form.addEventListener("submit", handleSubmit);
  submitBtn.addEventListener("click", handleSubmit);

  section.appendChild(formCard);
  section.appendChild(previewCard);
}

async function renderEditView(section, id) {
  const warning = createNotice(
    "Achtung: Änderungen überschreiben die gespeicherten Snapshot-Daten.",
    { variant: "warn", role: "alert" }
  );
  section.appendChild(warning);

  const zertifikat = await getZertifikat(id);
  if (!zertifikat) {
    section.appendChild(createNotice("Zertifikat nicht gefunden.", { variant: "warn", role: "alert" }));
    return;
  }
  const formSection = document.createElement("div");
  section.appendChild(formSection);
  await renderCreateView(formSection, { mode: "edit", existing: zertifikat });
}

function buildSnapshot(refs, { kunden = [], hunde = [], kurse = [], trainer = [] } = {}) {
  const kunde = kunden.find((entry) => entry.id === refs.kundeId.input.value) || null;
  const hund = hunde.find((entry) => entry.id === refs.hundId.input.value) || null;
  const kurs = kurse.find((entry) => entry.id === refs.kursId.input.value) || null;
  const manualTrainer1 = Boolean(refs.trainer1Manual?.input?.checked);
  const manualTrainer2 = Boolean(refs.trainer2Manual?.input?.checked);
  const trainer1 = manualTrainer1
    ? null
    : trainer.find((entry) => entry.id === refs.trainer1Id.input.value) || null;
  const trainer2 = manualTrainer2
    ? null
    : trainer.find((entry) => entry.id === refs.trainer2Id.input.value) || null;

  return {
    kundeNameSnapshot: formatKundeName(kunde),
    kundeGeschlechtSnapshot: kunde?.geschlecht || "",
    hundNameSnapshot: hund?.name || "",
    hundRasseSnapshot: hund?.rasse || "",
    hundGeschlechtSnapshot: hund?.geschlecht || "",
    kursTitelSnapshot: kurs?.title || "",
    kursDatumSnapshot:
      refs.kursDatumSnapshot?.input?.value?.trim() || kurs?.date || "",
    kursOrtSnapshot:
      refs.kursOrtSnapshot?.input?.value?.trim() || kurs?.ort || kurs?.location || "",
    kursInhaltTheorieSnapshot: (kurs?.inhaltTheorie || "").trim(),
    kursInhaltPraxisSnapshot: (kurs?.inhaltPraxis || "").trim(),
    ausstellungsdatum: refs.ausstellungsdatum.input.value || "",
    trainer1NameSnapshot: manualTrainer1
      ? refs.trainer1NameManual.input.value.trim()
      : trainer1?.name || "",
    trainer1TitelSnapshot: manualTrainer1
      ? refs.trainer1TitelManual.input.value.trim()
      : trainer1?.titel || "",
    trainer2NameSnapshot: manualTrainer2
      ? refs.trainer2NameManual.input.value.trim() || null
      : trainer2?.name || null,
    trainer2TitelSnapshot: manualTrainer2
      ? refs.trainer2TitelManual.input.value.trim() || null
      : trainer2?.titel || null,
    bemerkungen: refs.bemerkungen.input.value || "",
  };
}

function validate(values = {}, { kurse = [], trainer = [] } = {}) {
  const errors = {};
  if (!values.kundeId) errors.kundeId = "Bitte Kunde auswählen.";
  if (!values.hundId) errors.hundId = "Bitte Hund auswählen.";
  if (!values.kursId) errors.kursId = "Bitte Kurs auswählen.";
  if (!values.kursDatumSnapshot) errors.kursDatumSnapshot = "Bitte Kurs Datum angeben.";
  if (!values.kursOrtSnapshot) {
    errors.kursOrtSnapshot = "Bitte Kurs Ort angeben.";
  }
  const kurs = Array.isArray(kurse) ? kurse.find((entry) => entry.id === values.kursId) : null;
  const kursTheorie = (kurs?.inhaltTheorie || "").trim();
  const kursPraxis = (kurs?.inhaltPraxis || "").trim();
  if (values.kursId && !kursTheorie) {
    errors.kursInhaltTheorieSnapshot = "Kursinhalt Theorie fehlt. Bitte Kurs aktualisieren.";
  }
  if (values.kursId && !kursPraxis) {
    errors.kursInhaltPraxisSnapshot = "Kursinhalt Praxis fehlt. Bitte Kurs aktualisieren.";
  }
  if (values.trainer1Manual) {
    if (!values.trainer1NameManual) errors.trainer1NameManual = "Bitte Trainername eingeben.";
    if (!values.trainer1TitelManual) {
      errors.trainer1TitelManual = "Trainer-Titel erforderlich.";
    }
  } else if (!values.trainer1Id) {
    errors.trainer1Id = "Bitte Trainer auswählen.";
  } else {
    const selectedTrainer =
      Array.isArray(trainer) && values.trainer1Id
        ? trainer.find((entry) => entry.id === values.trainer1Id)
        : null;
    if (!selectedTrainer?.titel) {
      errors.trainer1Id = "Trainer-Titel fehlt. Bitte Trainer ergänzen.";
    }
  }
  if (values.trainer2Manual) {
    if (values.trainer2NameManual && !values.trainer2TitelManual) {
      errors.trainer2TitelManual = "Trainer-Titel erforderlich.";
    }
  } else if (values.trainer2Id) {
    const selectedTrainer =
      Array.isArray(trainer) && values.trainer2Id
        ? trainer.find((entry) => entry.id === values.trainer2Id)
        : null;
    if (!selectedTrainer?.titel) {
      errors.trainer2Id = "Trainer-Titel fehlt. Bitte Trainer ergänzen.";
    }
  }
  if (!values.ausstellungsdatum) errors.ausstellungsdatum = "Bitte Datum angeben.";
  return errors;
}

function collectValues(refs = {}) {
  return {
    kundeId: refs.kundeId?.input?.value || "",
    hundId: refs.hundId?.input?.value || "",
    kursId: refs.kursId?.input?.value || "",
    kursDatumSnapshot: refs.kursDatumSnapshot?.input?.value?.trim() || "",
    kursOrtSnapshot: refs.kursOrtSnapshot?.input?.value?.trim() || "",
    trainer1Id: refs.trainer1Id?.input?.value || "",
    trainer2Id: refs.trainer2Id?.input?.value || "",
    trainer1Manual: Boolean(refs.trainer1Manual?.input?.checked),
    trainer2Manual: Boolean(refs.trainer2Manual?.input?.checked),
    trainer1NameManual: refs.trainer1NameManual?.input?.value?.trim() || "",
    trainer1TitelManual: refs.trainer1TitelManual?.input?.value?.trim() || "",
    trainer2NameManual: refs.trainer2NameManual?.input?.value?.trim() || "",
    trainer2TitelManual: refs.trainer2TitelManual?.input?.value?.trim() || "",
    ausstellungsdatum: refs.ausstellungsdatum?.input?.value || "",
    bemerkungen: refs.bemerkungen?.input?.value || "",
  };
}

function applyErrors(refs = {}, errors = {}) {
  Object.entries(refs).forEach(([key, ref]) => {
    const hint = ref.hint;
    const hasError = Boolean(errors[key]);
    if (hint) {
      hint.textContent = hasError ? errors[key] : "";
      hint.classList.toggle("sr-only", !hasError);
    }
    if (ref.input) {
      ref.input.setAttribute("aria-invalid", hasError ? "true" : "false");
    }
  });
}

function setSelectOptions(select, options, selectedValue) {
  select.innerHTML = "";
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    option.selected = opt.value === selectedValue;
    select.appendChild(option);
  });
}

function buildKundenOptions(kunden = [], selectedId = "", searchTerm = "") {
  const base = [{ value: "", label: "Bitte wählen" }];
  const safeTerm = String(searchTerm || "").trim().toLowerCase();
  const list = (Array.isArray(kunden) ? kunden : [])
    .filter((kunde) => {
      if (!safeTerm) return true;
      const haystack = [
        kunde.code,
        kunde.kundenCode,
        kunde.vorname,
        kunde.nachname,
        kunde.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(safeTerm);
    })
    .map((kunde) => ({
      value: kunde.id,
      label: formatKundeLabel(kunde),
    }));
  return [...base, ...list].map((opt) => ({ ...opt, selected: opt.value === selectedId }));
}

function buildHundeOptions(hunde = [], kundeId = "", selectedId = "") {
  const filtered = (Array.isArray(hunde) ? hunde : []).filter(
    (hund) => !kundeId || hund.kundenId === kundeId
  );
  const base = [{ value: "", label: kundeId ? "Bitte wählen" : "Bitte zuerst Kunde wählen" }];
  const list = filtered.map((hund) => ({
    value: hund.id,
    label: formatHundLabel(hund),
  }));
  return [...base, ...list].map((opt) => ({ ...opt, selected: opt.value === selectedId }));
}

function buildKursOptions(kurse = [], selectedId = "") {
  const base = [{ value: "", label: "Bitte wählen" }];
  const list = (Array.isArray(kurse) ? kurse : []).map((kurs) => ({
    value: kurs.id,
    label: formatKursLabel(kurs),
  }));
  return [...base, ...list].map((opt) => ({ ...opt, selected: opt.value === selectedId }));
}

function buildTrainerOptions(trainer = [], selectedId = "") {
  const base = [{ value: "", label: "Bitte wählen" }];
  const list = (Array.isArray(trainer) ? trainer : []).map((entry) => ({
    value: entry.id,
    label: formatTrainerLabel(entry.name, entry.titel, entry.code),
  }));
  return [...base, ...list].map((opt) => ({ ...opt, selected: opt.value === selectedId }));
}

function formatKundeName(kunde) {
  if (!kunde) return "";
  return `${kunde.vorname || ""} ${kunde.nachname || ""}`.trim();
}

function formatKundeLabel(kunde) {
  if (!kunde) return "–";
  const code = kunde.code || kunde.kundenCode || kunde.id || "";
  const name = formatKundeName(kunde) || "Unbenannt";
  return code ? `${code} – ${name}` : name;
}

function formatHundLabel(hund) {
  if (!hund) return "–";
  const code = hund.code || hund.id || "";
  const name = hund.name || hund.rufname || "Unbenannt";
  return code ? `${code} – ${name}` : name;
}

function formatKursLabel(kurs) {
  if (!kurs) return "–";
  const code = kurs.code || kurs.id || "";
  const date = kurs.date ? ` (${kurs.date})` : "";
  const title = kurs.title || "Kurs";
  return code ? `${code} – ${title}${date}` : `${title}${date}`;
}

function formatTrainerLabel(name = "", titel = "", code = "") {
  const safeName = name || "";
  const codePart = code ? ` (${code})` : "";
  const titelPart = titel ? `, ${titel}` : "";
  if (!safeName && !titel && !code) return "–";
  return `${safeName}${titelPart}${codePart}`.trim();
}

function formatGeschlechtLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Unbekannt";
  if (normalized === "weiblich") return "Weiblich";
  if (normalized === "männlich") return "Männlich";
  return value;
}

function formatKundeWording(name, geschlecht) {
  const base = name || "–";
  const normalized = String(geschlecht || "").trim().toLowerCase();
  if (normalized === "weiblich") return `Kundin ${base}`;
  if (normalized === "männlich") return `Kunde ${base}`;
  return `Kunde ${base}`;
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

function formatDateTime(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleString("de-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function valueOrDash(value) {
  if (value === null || value === undefined) return "–";
  const str = typeof value === "string" ? value.trim() : String(value);
  return str || "–";
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
