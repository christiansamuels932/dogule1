// Kurse module – list/detail flows with mock API
/* globals document, console, window, URLSearchParams */
import {
  createButton,
  createCard,
  createEmptyState,
  createFormRow,
  createNotice,
} from "../shared/components/components.js";

const createEmpty = () => createEmptyState("Keine Daten vorhanden.", "", {});
const createErrorNotice = () =>
  createNotice("Fehler beim Laden der Daten.", {
    variant: "warn",
    role: "alert",
  });
import {
  listKurse,
  getKurs,
  createKurs,
  updateKurs,
  deleteKurs,
  listKursTeilnehmer,
  createKursTeilnehmer,
  deleteKursTeilnehmer,
  listKunden,
  listHunde,
  listFinanzen,
  listTrainer,
} from "../shared/api/index.js";
import { runIntegrityCheck } from "../shared/api/db/integrityCheck.js";
import {
  describeCertificateBackground,
  getCertificateBackgroundForKurs,
  getCertificateBackgroundOptions,
  resolveCertificateBackgroundUrl,
} from "../shared/certificates/backgrounds.js";

let kursCache = [];
let trainerCache = [];
const TOAST_KEY = "__DOGULE_KURSE_TOAST__";
const STATUS_OPTIONS = [
  { value: "aktiv", label: "Aktiv" },
  { value: "deaktiviert", label: "Deaktiviert" },
];

async function fetchTrainer(force = false) {
  if (trainerCache.length && !force) {
    return trainerCache;
  }
  try {
    trainerCache = await listTrainer();
  } catch (error) {
    console.error("[KURSE_ERR_TRAINER_FETCH]", error);
    trainerCache = [];
  }
  return trainerCache;
}

async function hydrateKurseWithTrainer(kurse = []) {
  const trainers = await fetchTrainer();
  const trainerMap = new Map(trainers.map((trainer) => [trainer.id, trainer]));
  return (Array.isArray(kurse) ? kurse : []).map((kurs) => {
    const trainerIds = Array.isArray(kurs?.trainerIds)
      ? kurs.trainerIds.filter(Boolean)
      : kurs?.trainerId
        ? [kurs.trainerId]
        : [];
    const trainerNames = trainerIds.map((id) => trainerMap.get(id)?.name).filter(Boolean);
    const trainer = kurs?.trainerId ? trainerMap.get(kurs.trainerId) || null : null;
    const trainerLabel = trainerNames.length
      ? trainerNames.join(", ")
      : formatTrainerLabel(trainer, kurs?.trainerName, kurs?.trainerId);
    return {
      ...kurs,
      trainer,
      trainerName: trainer?.name || kurs.trainerName || "",
      trainerCode: trainer?.code || "",
      trainerIds,
      trainerNames,
      trainerLabel,
    };
  });
}

function findTrainerById(trainerId, trainerList = trainerCache) {
  const safeId = (trainerId || "").trim();
  if (!safeId) return null;
  const list = Array.isArray(trainerList) ? trainerList : trainerCache;
  return list.find((trainer) => trainer.id === safeId) || null;
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

function createZertifikatHintergrundPreview(value = "") {
  const url = resolveCertificateBackgroundUrl(value);
  if (!url) return null;
  const wrap = document.createElement("div");
  wrap.className = "kurse-zertifikat-preview";
  const image = document.createElement("img");
  image.className = "kurse-zertifikat-preview__image";
  image.alt = "Vorschau Zertifikat Hintergrund";
  image.src = url;
  wrap.appendChild(image);
  return wrap;
}

function formatDate(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-CH", { dateStyle: "medium" });
}

function createTeilnehmerFormCard() {
  const card = createStandardCard("Neuer Teilnehmer");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  const form = document.createElement("form");
  form.className = "kurse-teilnehmer-form";
  form.noValidate = true;

  const status = document.createElement("div");
  status.className = "kurse-teilnehmer-status";
  form.appendChild(status);

  const searchRow = createFormRow({
    id: "kurs-teilnehmer-kunde-search",
    label: "Kunde suchen",
    placeholder: "Name, Vorname, Ort ...",
    value: "",
    required: false,
  });
  const searchInput = searchRow.querySelector("input");
  if (searchInput) searchInput.type = "search";
  form.appendChild(searchRow);

  const kundeRow = createFormRow({
    id: "kurs-teilnehmer-kunde",
    label: "Kunde",
    control: "select",
    required: true,
    options: [{ value: "", label: "— Kunde auswählen —", selected: true }],
  });
  const kundeSelect = kundeRow.querySelector("select");
  form.appendChild(kundeRow);

  const hundRow = createFormRow({
    id: "kurs-teilnehmer-hund",
    label: "Hund",
    control: "select",
    required: true,
    options: [{ value: "", label: "— Hund auswählen —", selected: true }],
  });
  const hundSelect = hundRow.querySelector("select");
  form.appendChild(hundRow);

  const startRow = createFormRow({
    id: "kurs-teilnehmer-start",
    label: "Startdatum",
    placeholder: "TT.MM.JJJJ",
    value: "",
    required: true,
  });
  const startInput = startRow.querySelector("input");
  if (startInput) startInput.type = "date";
  form.appendChild(startRow);

  const actions = document.createElement("div");
  actions.className = "module-actions";
  const submitBtn = createButton({ label: "Teilnehmer eintragen", variant: "primary" });
  submitBtn.type = "submit";
  const closeBtn = createButton({ label: "Schließen", variant: "quiet" });
  closeBtn.type = "button";
  actions.append(submitBtn, closeBtn);
  form.appendChild(actions);

  body.appendChild(form);

  let kunden = [];
  let hunde = [];

  const setStatus = (message = "", tone = "info") => {
    status.textContent = message;
    status.className = `kurse-teilnehmer-status kurse-teilnehmer-status--${tone}`;
  };

  const buildKundeLabel = (kunde = {}) => {
    const name = [kunde.nachname, kunde.vorname].filter(Boolean).join(" ").trim();
    const ort = kunde.ort || "";
    return ort ? `${name || "Kunde"} · ${ort}` : name || "Kunde";
  };

  const setSelectOptions = (select, options = [], selectedValue = "") => {
    if (!select) return;
    select.innerHTML = "";
    options.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      if (option.value === selectedValue) opt.selected = true;
      select.appendChild(opt);
    });
  };

  const updateKundeOptions = (query = "") => {
    const normalized = String(query || "").trim().toLowerCase();
    const filtered = normalized
      ? kunden.filter((kunde) => {
          const text = [
            kunde.nachname,
            kunde.vorname,
            kunde.ort,
            kunde.email,
            kunde.telefon,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return text.includes(normalized);
        })
      : kunden;
    const options = [
      { value: "", label: "— Kunde auswählen —" },
      ...filtered.map((kunde) => ({
        value: kunde.id,
        label: buildKundeLabel(kunde),
      })),
    ];
    setSelectOptions(kundeSelect, options, kundeSelect?.value || "");
  };

  const updateHundOptions = (kundeId = "") => {
    const relevant = kundeId
      ? hunde.filter((hund) => (hund.kundenId || hund.kundeId) === kundeId)
      : [];
    const options = [
      { value: "", label: "— Hund auswählen —" },
      ...relevant.map((hund) => ({
        value: hund.id,
        label: hund.name || hund.rufname || "Hund",
      })),
    ];
    setSelectOptions(hundSelect, options, "");
  };

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      updateKundeOptions(event.target.value || "");
    });
  }
  if (kundeSelect) {
    kundeSelect.addEventListener("change", (event) => {
      updateHundOptions(event.target.value || "");
    });
  }

  const api = {
    card,
    open() {
      card.hidden = false;
    },
    close() {
      card.hidden = true;
    },
    setData(nextKunden = [], nextHunde = []) {
      kunden = Array.isArray(nextKunden) ? nextKunden : [];
      hunde = Array.isArray(nextHunde) ? nextHunde : [];
      updateKundeOptions(searchInput?.value || "");
      updateHundOptions(kundeSelect?.value || "");
      setStatus("");
    },
    setStatus,
    focus() {
      searchInput?.focus();
    },
    onSubmit(handler) {
      form.addEventListener("submit", handler);
    },
    onClose(handler) {
      closeBtn.addEventListener("click", handler);
    },
    getValues() {
      return {
        kundeId: kundeSelect?.value || "",
        hundId: hundSelect?.value || "",
        startDatum: startInput?.value || "",
      };
    },
    getKundeById(id) {
      return kunden.find((item) => item.id === id) || null;
    },
    getHundById(id) {
      return hunde.find((item) => item.id === id) || null;
    },
    reset() {
      if (kundeSelect) kundeSelect.value = "";
      updateHundOptions("");
      if (startInput) startInput.value = "";
    },
  };

  return api;
}

function renderKursHistorieRows(
  tbody,
  entries = [],
  { onDelete, onCreateZertifikat, filter = "" } = {}
) {
  if (!tbody) return;
  tbody.innerHTML = "";
  const normalizedFilter = String(filter || "").trim().toLowerCase();
  const visibleEntries = normalizedFilter
    ? entries.filter((entry) => {
        const searchText = [
          entry?.kundeNachname,
          entry?.kundeVorname,
          entry?.hundName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchText.includes(normalizedFilter);
      })
    : entries;
  if (!visibleEntries.length) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 8;
    emptyCell.textContent = "Keine Einträge vorhanden.";
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    return;
  }

  visibleEntries.forEach((entry) => {
    const row = document.createElement("tr");
    row.className = "kunden-list-row";
    if (entry?.kundeId) {
      row.tabIndex = 0;
      row.addEventListener("click", (event) => {
        if (event.target && event.target.closest("button")) return;
        window.location.hash = `#/kunden/${entry.kundeId}`;
      });
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          window.location.hash = `#/kunden/${entry.kundeId}`;
        }
      });
    }
    const cells = [
      entry?.kundeNachname,
      entry?.kundeVorname,
      entry?.kundeOrt,
      entry?.hundName,
      formatDate(entry?.startDatum),
      formatDate(entry?.createdAt),
    ];
    cells.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = valueOrDash(value);
      row.appendChild(td);
    });
    const actionCell = document.createElement("td");
    actionCell.className = "kurs-historie-actions";
    const zertifikatBtn = createButton({ label: "Zertifikat erstellen", variant: "primary" });
    zertifikatBtn.type = "button";
    zertifikatBtn.addEventListener("click", () => onCreateZertifikat?.(entry));
    actionCell.appendChild(zertifikatBtn);
    const deleteBtn = createButton({ label: "Löschen", variant: "quiet" });
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", () => onDelete?.(entry));
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);
    tbody.appendChild(row);
  });
}

function buildKursHistorieCard(kurs = {}, { onDelete, onCreateZertifikat } = {}) {
  const card = createStandardCard("Kurs Historie");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  const searchRow = createFormRow({
    id: "kurs-historie-search",
    label: "Suche",
    placeholder: "Kunde oder Hund suchen",
    value: "",
    required: false,
  });
  const searchInput = searchRow.querySelector("input");
  if (searchInput) searchInput.type = "search";
  body.appendChild(searchRow);

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "kunden-list-scroll";
  const table = document.createElement("table");
  table.className = "kunden-list-table";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const tbody = document.createElement("tbody");

  ["Name", "Vorname", "Ort", "Hund", "Startdatum", "Eintrag vom", ""].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  const entries = Array.isArray(kurs.teilnehmerLog) ? kurs.teilnehmerLog : [];
  let filter = "";
  renderKursHistorieRows(tbody, entries, { onDelete, onCreateZertifikat, filter });
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      filter = event.target.value || "";
      renderKursHistorieRows(tbody, entries, { onDelete, onCreateZertifikat, filter });
    });
  }

  table.append(thead, tbody);
  tableWrapper.appendChild(table);
  body.appendChild(tableWrapper);
  return {
    card,
    tbody,
    setEntries(nextEntries = []) {
      const list = Array.isArray(nextEntries) ? nextEntries : [];
      renderKursHistorieRows(tbody, list, { onDelete, onCreateZertifikat, filter });
    },
  };
}

export async function initModule(container, routeContext = { segments: [] }) {
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "dogule-section kurse-view";
  container.appendChild(section);

  const { view, id } = resolveView(routeContext);

  try {
    if (view === "detail" && id) {
      await renderDetail(section, id);
    } else if (view === "create" || (view === "edit" && id)) {
      await renderForm(section, view, id);
    } else {
      await renderList(section);
    }
  } catch (error) {
    console.error("[KURSE_ERR_VIEW]", error);
    section.innerHTML = "";
    scrollToTop();
    const errorCardFragment = createCard({
      eyebrow: "",
      title: "",
      body: "",
      footer: "",
    });
    const errorCard =
      errorCardFragment.querySelector(".ui-card") || errorCardFragment.firstElementChild;
    if (errorCard) {
      const body = errorCard.querySelector(".ui-card__body");
      body.innerHTML = "";
      body.appendChild(createErrorNotice());
      const footer = errorCard.querySelector(".ui-card__footer");
      if (footer) footer.innerHTML = "";
      section.appendChild(errorCard);
    }
    focusHeading(section);
  }
}

function resolveView(routeContext = {}) {
  const segments = routeContext.segments || [];
  if (!segments.length) return { view: "list" };
  const [first, second] = segments;
  if (first === "new") return { view: "create" };
  if (second === "edit") return { view: "edit", id: first };
  return { view: "detail", id: first };
}

async function renderList(section) {
  if (!section) return;
  section.innerHTML = "";
  section.classList.add("card-stack-compact");
  scrollToTop();
  await fetchTrainer(true);
  injectToast(section);

  const toolbar = buildCourseToolbarCard();
  if (toolbar) {
    section.appendChild(toolbar);
  }
  const listCardFragment = createCard({
    eyebrow: "",
    title: "Kursübersicht",
    body: "",
    footer: "",
  });
  const listCard = listCardFragment.querySelector(".ui-card") || listCardFragment.firstElementChild;
  if (listCard) {
    const cardBody = listCard.querySelector(".ui-card__body");
    cardBody.innerHTML = "";
    section.appendChild(listCard);
    await populateCourses(cardBody);
  }
  focusHeading(section);
}

async function renderDetail(section, id) {
  if (!section) return;
  section.innerHTML = "";
  scrollToTop();
  await fetchTrainer(true);
  const detailSection = document.createElement("section");
  detailSection.className = "dogule-section kurse-section kurse-detail card-stack-compact";
  section.appendChild(detailSection);

  try {
    if (!kursCache.length) await fetchKurse();
    let kurs = kursCache.find((k) => k.id === id);
    if (!kurs) kurs = await getKurs(id);
    if (!kurs) {
      throw new Error(`Kurs ${id} nicht gefunden`);
    }
    if (!kurs?.trainer) {
      const hydrated = await hydrateKurseWithTrainer([kurs]);
      kurs = hydrated[0] || kurs;
    }
    try {
      kurs.teilnehmerLog = await listKursTeilnehmer(kurs.id);
    } catch (error) {
      console.error("[KURSE_ERR_TEILNEHMER_LIST]", error);
      kurs.teilnehmerLog = [];
    }

    injectToast(detailSection);
    const actionsCard = createStandardCard("Aktionen");
    const actionsBody = actionsCard.querySelector(".ui-card__body");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "module-actions";
    const teilnehmerBtn = createButton({
      label: "+ neuer Teilnehmer",
      variant: "secondary",
    });
    teilnehmerBtn.type = "button";
    const editBtn = createButton({
      label: "Kurs bearbeiten",
      variant: "primary",
    });
    editBtn.type = "button";
    editBtn.addEventListener("click", () => {
      window.location.hash = `#/kurse/${kurs.id}/edit`;
    });
    const deleteBtn = createButton({
      label: "Kurs löschen",
      variant: "secondary",
    });
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", () => handleDeleteKurs(section, kurs.id, deleteBtn));
    const backBtn = createButton({
      label: "Zur Übersicht",
      variant: "quiet",
    });
    backBtn.type = "button";
    backBtn.addEventListener("click", () => {
      window.location.hash = "#/kurse";
    });
    actionsWrap.append(teilnehmerBtn, editBtn, deleteBtn, backBtn);
    actionsBody.appendChild(actionsWrap);
    detailSection.appendChild(actionsCard);

    const teilnehmerForm = createTeilnehmerFormCard();
    teilnehmerForm.card.hidden = true;
    detailSection.appendChild(teilnehmerForm.card);

    let teilnehmerLoaded = false;
    const refreshTeilnehmer = async () => {
      try {
        const list = await listKursTeilnehmer(kurs.id);
        kurs.teilnehmerLog = list;
        const cacheIndex = kursCache.findIndex((item) => item.id === kurs.id);
        if (cacheIndex >= 0) {
          kursCache[cacheIndex] = { ...kursCache[cacheIndex], teilnehmerLog: list };
        }
        kursHistorie.setEntries(list);
      } catch (error) {
        console.error("[KURSE_ERR_TEILNEHMER_REFRESH]", error);
      }
    };
    const handleDeleteTeilnehmer = async (entry) => {
      if (!entry) return;
      const confirmed = window.confirm("Teilnehmer wirklich löschen?");
      if (!confirmed) return;
      try {
        await deleteKursTeilnehmer(kurs.id, entry.id);
        await refreshTeilnehmer();
      } catch (error) {
        console.error("[KURSE_ERR_TEILNEHMER_DELETE]", error);
        showInlineToast(detailSection, "Teilnehmer konnte nicht gelöscht werden.", "error");
        return;
      }
      const wantsRapport = window.confirm("Kunden Rapport erstellen?");
      if (wantsRapport && entry.kundeId) {
        window.__DOGULE_RAPPORT_TARGET__ = entry.kundeId;
        window.location.hash = `#/kunden/${entry.kundeId}`;
      }
    };
    teilnehmerForm.onClose(() => {
      teilnehmerForm.close();
    });
    teilnehmerForm.onSubmit(async (event) => {
      event.preventDefault();
      const { kundeId, hundId, startDatum } = teilnehmerForm.getValues();
      if (!kundeId || !hundId || !startDatum) {
        teilnehmerForm.setStatus("Bitte Kunde, Hund und Startdatum auswählen.", "warn");
        return;
      }
      const kunde = teilnehmerForm.getKundeById(kundeId);
      const hund = teilnehmerForm.getHundById(hundId);
      try {
        await createKursTeilnehmer({
          kursId: kurs.id,
          kundeId,
          hundId,
          kundeNachname: kunde?.nachname || "",
          kundeVorname: kunde?.vorname || "",
          kundeOrt: kunde?.ort || kunde?.heimatort || kunde?.heimatOrt || "",
          hundName: hund?.rufname || hund?.name || "",
          startDatum,
        });
        await refreshTeilnehmer();
        teilnehmerForm.setStatus("Teilnehmer eingetragen.", "success");
        teilnehmerForm.reset();
      } catch (error) {
        console.error("[KURSE_ERR_TEILNEHMER_CREATE]", error);
        const detail = error?.code ? ` (${error.code})` : "";
        teilnehmerForm.setStatus(`Teilnehmer konnte nicht gespeichert werden.${detail}`, "warn");
      }
    });
    teilnehmerBtn.addEventListener("click", async () => {
      const isHidden = teilnehmerForm.card.hidden;
      teilnehmerForm.card.hidden = !isHidden;
      if (isHidden) {
        teilnehmerForm.setStatus("Kunden werden geladen ...", "info");
        teilnehmerForm.focus();
        if (!teilnehmerLoaded) {
          try {
            const [kunden, hunde] = await Promise.all([listKunden(), listHunde()]);
            teilnehmerForm.setData(kunden, hunde);
            teilnehmerLoaded = true;
          } catch (error) {
            console.error("[KURSE_ERR_TEILNEHMER_LOAD]", error);
            teilnehmerForm.setStatus("Kunden/Hunde konnten nicht geladen werden.", "warn");
          }
        } else {
          teilnehmerForm.setStatus("");
        }
      }
    });

    const detailCard = createStandardCard("Stammdaten");
    const detailBody = detailCard.querySelector(".ui-card__body");
    const zertifikatHintergrund = getCertificateBackgroundForKurs(kurs);
    const rows = [
      { label: "ID", value: kurs.id },
      { label: "Kurscode", value: kurs.code },
      { label: "Kursname", value: kurs.title },
      { label: "Trainer", render: () => renderTrainerInline(kurs) },
      {
        label: "Weitere Trainer 1",
        render: () =>
          renderTrainerLinkById(
            (Array.isArray(kurs.trainerIds) ? kurs.trainerIds : []).filter(
              (trainerId) => trainerId && trainerId !== kurs.trainerId
            )[0] || ""
          ),
      },
      {
        label: "Weitere Trainer 2",
        render: () =>
          renderTrainerLinkById(
            (Array.isArray(kurs.trainerIds) ? kurs.trainerIds : []).filter(
              (trainerId) => trainerId && trainerId !== kurs.trainerId
            )[1] || ""
          ),
      },
      {
        label: "Weitere Trainer 3",
        render: () =>
          renderTrainerLinkById(
            (Array.isArray(kurs.trainerIds) ? kurs.trainerIds : []).filter(
              (trainerId) => trainerId && trainerId !== kurs.trainerId
            )[2] || ""
          ),
      },
      {
        label: "Weitere Trainer 4",
        render: () =>
          renderTrainerLinkById(
            (Array.isArray(kurs.trainerIds) ? kurs.trainerIds : []).filter(
              (trainerId) => trainerId && trainerId !== kurs.trainerId
            )[3] || ""
          ),
      },
      { label: "Abo-Form", value: kurs.aboForm },
      { label: "Alter Hund", value: kurs.alterHund },
      { label: "Aufbauend", value: kurs.aufbauend },
      { label: "Preis", value: formatPrice(kurs.price) },
      { label: "Status", value: formatStatusLabel(kurs.status) },
      { label: "Notizen", value: kurs.notes },
      {
        label: "Zertifikat Hintergrund",
        value: zertifikatHintergrund
          ? describeCertificateBackground(zertifikatHintergrund)
          : "Kein Zertifikat-Hintergrund zugewiesen",
      },
      { label: "Kursinhalt Theorie", value: kurs.inhaltTheorie },
      { label: "Kursinhalt Praxis", value: kurs.inhaltPraxis },
      { label: "Erstellt am", value: formatDateTime(kurs.createdAt) },
      { label: "Aktualisiert am", value: formatDateTime(kurs.updatedAt) },
    ];
    detailBody.innerHTML = "";
    detailBody.appendChild(createDefinitionList(rows));
    detailSection.appendChild(detailCard);
    const preview = createZertifikatHintergrundPreview(zertifikatHintergrund);
    if (preview) {
      const backgroundCard = createStandardCard("Zertifikat Hintergrund");
      const backgroundBody = backgroundCard.querySelector(".ui-card__body");
      const collapsible = document.createElement("details");
      collapsible.className = "dogule-collapsible";
      const summary = document.createElement("summary");
      summary.textContent = "Zertifikat Hintergrund anzeigen";
      const content = document.createElement("div");
      content.className = "dogule-collapsible__content";
      content.appendChild(preview);
      collapsible.append(summary, content);
      backgroundBody.innerHTML = "";
      backgroundBody.appendChild(collapsible);
      detailSection.appendChild(backgroundCard);
    } else {
      detailSection.appendChild(
        createNotice("Kein Zertifikat-Hintergrund zugewiesen.", { variant: "warn", role: "status" })
      );
    }

    const handleCreateZertifikat = (entry) => {
      if (!entry?.kundeId || !entry?.hundId) return;
      const params = new URLSearchParams();
      params.set("kundeId", entry.kundeId);
      params.set("hundId", entry.hundId);
      params.set("kursId", kurs.id);
      if (kurs.date) params.set("kursDatumSnapshot", kurs.date);
      if (kurs.ort || kurs.location) params.set("kursOrtSnapshot", kurs.ort || kurs.location);
      window.location.hash = `#/zertifikate/new?${params.toString()}`;
    };
    const kursHistorie = buildKursHistorieCard(kurs, {
      onDelete: handleDeleteTeilnehmer,
      onCreateZertifikat: handleCreateZertifikat,
    });
    detailSection.appendChild(kursHistorie.card);
  } catch (error) {
    console.error("[KURSE_ERR_DETAIL]", error);
    const errorCard = createStandardCard("Stammdaten");
    const errorBody = errorCard.querySelector(".ui-card__body");
    if (errorBody) {
      errorBody.innerHTML = "";
      errorBody.appendChild(createErrorNotice());
    }
    detailSection.appendChild(errorCard);
  }

  focusHeading(section);
}

function formatTrainerLabel(trainer = {}, fallbackName = "", fallbackId = "") {
  const name = trainer?.name || fallbackName || "";
  const code = trainer?.code || "";
  if (name && code) return `${code} · ${name}`;
  if (name) return name;
  if (code) return code;
  return fallbackId || "Noch nicht zugewiesen";
}

function renderTrainerInline(kurs = {}) {
  const trainerIds = Array.isArray(kurs.trainerIds)
    ? kurs.trainerIds.filter(Boolean)
    : kurs.trainerId
      ? [kurs.trainerId]
      : [];
  if (!trainerIds.length) {
    const span = document.createElement("span");
    span.textContent = "Noch nicht zugewiesen";
    return span;
  }
  if (trainerIds.length === 1) {
    const label = formatTrainerLabel(kurs.trainer, kurs.trainerName, kurs.trainerId);
    const link = document.createElement("a");
    link.href = `#/trainer/${trainerIds[0]}`;
    link.textContent = label;
    return link;
  }
  const wrapper = document.createElement("span");
  trainerIds.forEach((trainerId, index) => {
    const trainer = findTrainerById(trainerId, trainerCache);
    const label = formatTrainerLabel(trainer, "", trainerId);
    const link = document.createElement("a");
    link.href = `#/trainer/${trainerId}`;
    link.textContent = label;
    wrapper.appendChild(link);
    if (index < trainerIds.length - 1) {
      wrapper.appendChild(document.createTextNode(", "));
    }
  });
  return wrapper;
}

function renderTrainerLinkById(trainerId = "") {
  const resolvedId = String(trainerId || "").trim();
  if (!resolvedId) {
    const span = document.createElement("span");
    span.textContent = "–";
    return span;
  }
  const trainer = findTrainerById(resolvedId, trainerCache);
  const label = formatTrainerLabel(trainer, "", resolvedId);
  const link = document.createElement("a");
  link.href = `#/trainer/${resolvedId}`;
  link.textContent = label;
  return link;
}

function createCourseListItem(course = {}) {
  if (!course.id) return null;
  const link = document.createElement("a");
  link.href = `#/kurse/${course.id}`;
  link.className = "kurse-list__item";
  const cardFragment = createCard({
    eyebrow: course.code || "Code folgt",
    title: course.title || "Ohne Titel",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return null;
  card.classList.add("kurse-list-item");
  const body = card.querySelector(".ui-card__body");
  const footer = card.querySelector(".ui-card__footer");
  if (body) {
    body.innerHTML = "";
    const metaList = document.createElement("ul");
    metaList.className = "kurse-list__meta";
    const trainerLabel =
      course.trainerLabel ||
      formatTrainerLabel(course.trainer, course.trainerName, course.trainerId);
    [
      {
        label: "Trainer",
        value: trainerLabel,
        link: course.trainerId ? `#/trainer/${course.trainerId}` : "",
      },
      { label: "Alter Hund", value: course.alterHund || "–" },
      { label: "Preis", value: formatPrice(course.price) },
    ].forEach(({ label, value, link }) => {
      const item = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = `${label}: `;
      const span = document.createElement("span");
      if (link) {
        const anchor = document.createElement("a");
        anchor.href = link;
        anchor.textContent = value;
        span.appendChild(anchor);
      } else {
        span.textContent = value;
      }
      item.append(strong, span);
      metaList.appendChild(item);
    });
    body.appendChild(metaList);
  }
  if (footer) {
    footer.innerHTML = "";
  }
  link.appendChild(card);
  return link;
}

async function renderForm(section, view, id) {
  if (!section) return;
  const mode = view === "create" ? "create" : "edit";
  section.innerHTML = "";
  scrollToTop();
  injectToast(section);
  await fetchTrainer(true);

  let existing = null;
  if (mode === "edit") {
    const loadingCardFragment = createCard({
      eyebrow: "",
      title: "",
      body: "<p>Kurs wird geladen ...</p>",
      footer: "",
    });
    const loadingCard =
      loadingCardFragment.querySelector(".ui-card") || loadingCardFragment.firstElementChild;
    if (loadingCard) {
      section.appendChild(loadingCard);
    }
    try {
      if (!kursCache.length) await fetchKurse();
      existing = kursCache.find((kurs) => kurs.id === id) || (await getKurs(id));
      if (!existing) {
        throw new Error(`Kurs ${id} nicht gefunden`);
      }
    } catch (error) {
      console.error("[KURSE_ERR_FORM_LOAD]", error);
      if (loadingCard?.parentNode === section) {
        section.removeChild(loadingCard);
      }
      const errorCardFragment = createCard({
        eyebrow: "",
        title: "",
        body: "",
        footer: "",
      });
      const errorCard =
        errorCardFragment.querySelector(".ui-card") || errorCardFragment.firstElementChild;
      if (errorCard) {
        const body = errorCard.querySelector(".ui-card__body");
        body.innerHTML = "";
        body.appendChild(createErrorNotice());
        const footer = errorCard.querySelector(".ui-card__footer");
        if (footer) footer.innerHTML = "";
        section.appendChild(errorCard);
      }
      focusHeading(section);
      return;
    }
    if (loadingCard?.parentNode === section) {
      section.removeChild(loadingCard);
    }
  }
  if (mode === "create" && !kursCache.length) {
    try {
      await fetchKurse();
    } catch (error) {
      console.error("[KURSE_ERR_FORM_INIT_FETCH]", error);
    }
  }

  const formCardFragment = createCard({
    eyebrow: "",
    title: "Stammdaten",
    body: "",
    footer: "",
  });
  const formCard = formCardFragment.querySelector(".ui-card") || formCardFragment.firstElementChild;
  if (!formCard) return;
  section.appendChild(formCard);

  const form = document.createElement("form");
  const formId = `kurse-form-${mode}-${id || "new"}`;
  form.id = formId;
  form.noValidate = true;
  form.dataset.kursForm = "true";
  const body = formCard.querySelector(".ui-card__body");
  body.innerHTML = "";
  body.appendChild(form);

  const kursCodeValue = mode === "edit" ? (existing?.code ?? "") : generateNextKursCode(kursCache);
  let trainerOptions = [];
  let trainerList = [];
  try {
    trainerList = await fetchTrainer();
    trainerOptions = buildTrainerOptions(trainerList, existing);
  } catch (error) {
    console.error("[KURSE_ERR_FORM_TRAINER]", error);
  }
  if (!trainerOptions.length) {
    const errorCardFragment = createCard({
      eyebrow: "",
      title: "Keine Trainer gefunden",
      body: "",
      footer: "",
    });
    const errorCard =
      errorCardFragment.querySelector(".ui-card") || errorCardFragment.firstElementChild;
    if (errorCard) {
      const errorBody = errorCard.querySelector(".ui-card__body");
      errorBody.innerHTML = "";
      errorBody.appendChild(
        createNotice(
          "Ohne Trainer kann kein Kurs erstellt werden. Bitte zuerst einen Trainer anlegen.",
          {
            variant: "warn",
            role: "alert",
          }
        )
      );
      const errorFooter = errorCard.querySelector(".ui-card__footer");
      if (errorFooter) {
        const backLink = createButton({ label: "Zur Trainer-Übersicht", variant: "secondary" });
        backLink.type = "button";
        backLink.addEventListener("click", () => {
          window.location.hash = "#/trainer";
        });
        errorFooter.appendChild(backLink);
      }
      section.appendChild(errorCard);
      focusHeading(section);
      return;
    }
  }
  let isCodeOverrideEnabled = false;
  const fields = buildFormFields(existing, {
    defaultCode: kursCodeValue,
    trainerOptions,
  });
  const refs = {};
  fields.forEach((field) => {
    const row = createFormRow(field.config);
    const controlHost = row.querySelector(".ui-form-row__control");
    const input = row.querySelector("input, select, textarea");
    if (field.name === "inhaltTheorie" || field.name === "inhaltPraxis") {
      const lines = String(field.value ?? "").split(/\r?\n/);
      const inputs = [];
      const lineGroup = document.createElement("div");
      lineGroup.className = "kurse-inhalt-lines";
      for (let i = 0; i < 5; i += 1) {
        const lineInput = document.createElement("input");
        lineInput.type = "text";
        lineInput.className = "kurse-inhalt-line";
        lineInput.maxLength = 24;
        lineInput.size = 24;
        lineInput.value = lines[i] || "";
        lineInput.setAttribute("aria-label", `${field.config.label} Zeile ${i + 1}`);
        inputs.push(lineInput);
        lineGroup.appendChild(lineInput);
      }
      controlHost.innerHTML = "";
      controlHost.appendChild(lineGroup);
      const hint = row.querySelector(".ui-form-row__hint");
      if (!field.config.describedByText) {
        hint.classList.add("sr-only");
      }
      refs[field.name] = {
        inputs,
        hint,
        row,
        getValue: () =>
          inputs
            .map((lineInput) => lineInput.value)
            .join("\n")
            .trim(),
      };
      form.appendChild(row);
      return;
    }
    input.name = field.name;
    if (field.multiple && input && input.tagName === "SELECT") {
      input.multiple = true;
    }
    if (field.readOnly) {
      input.readOnly = true;
      input.setAttribute("aria-readonly", "true");
    }
    if (field.config.type === "number") {
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      if (field.step) input.step = field.step;
    }
    if (field.setValue) {
      field.setValue(input);
    } else if (field.value !== undefined) {
      if (input.multiple && Array.isArray(field.value)) {
        const values = new Set(field.value.map((value) => String(value)));
        Array.from(input.options).forEach((option) => {
          option.selected = values.has(option.value);
        });
      } else {
        input.value = field.value;
      }
    }
    const hint = row.querySelector(".ui-form-row__hint");
    if (!field.config.describedByText) {
      hint.classList.add("sr-only");
    }
    refs[field.name] = { input, hint, row };
    if (field.name === "kursCode") {
      input.setAttribute("aria-readonly", "true");
      const toggleButton = createButton({
        label: "Code manuell ändern",
        variant: "secondary",
      });
      toggleButton.type = "button";
      toggleButton.addEventListener("click", () => {
        isCodeOverrideEnabled = !isCodeOverrideEnabled;
        if (isCodeOverrideEnabled) {
          input.readOnly = false;
          input.removeAttribute("aria-readonly");
          toggleButton.textContent = "Automatischen Code verwenden";
          input.focus();
        } else {
          input.readOnly = true;
          input.setAttribute("aria-readonly", "true");
          toggleButton.textContent = "Code manuell ändern";
          if (!input.value.trim()) {
            input.value = kursCodeValue;
          }
        }
      });
      row.appendChild(toggleButton);
    }
    form.appendChild(row);
  });

  const backgroundRef = refs.zertifikatHintergrund;
  if (backgroundRef?.row) {
    const collapsible = document.createElement("details");
    collapsible.className = "dogule-collapsible";
    const summary = document.createElement("summary");
    summary.textContent = "Zertifikat Hintergrund anzeigen";
    const content = document.createElement("div");
    content.className = "dogule-collapsible__content";
    const preview = document.createElement("div");
    preview.className = "kurse-zertifikat-preview";
    const previewImage = document.createElement("img");
    previewImage.className = "kurse-zertifikat-preview__image";
    previewImage.alt = "Vorschau Zertifikat Hintergrund";
    const previewEmpty = document.createElement("p");
    previewEmpty.className = "kurse-zertifikat-preview__empty";
    previewEmpty.textContent = "Kein Zertifikat-Hintergrund zugewiesen.";
    preview.append(previewImage, previewEmpty);
    content.appendChild(preview);
    collapsible.append(summary, content);
    backgroundRef.row.appendChild(collapsible);

    const updatePreview = () => {
      const url = resolveCertificateBackgroundUrl(backgroundRef.input.value);
      if (url) {
        previewImage.src = url;
        previewImage.hidden = false;
        previewEmpty.hidden = true;
      } else {
        previewImage.removeAttribute("src");
        previewImage.hidden = true;
        previewEmpty.hidden = false;
      }
    };
    updatePreview();
    backgroundRef.input.addEventListener("change", updatePreview);
  }

  const actions = document.createElement("div");
  actions.className = "module-actions kurse-form-actions";
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
  cancel.setAttribute("form", formId);
  cancel.addEventListener("click", (event) => {
    event.preventDefault();
    const target = mode === "create" ? "#/kurse" : `#/kurse/${id}`;
    if (typeof window !== "undefined") {
      window.location.hash = target;
    }
  });
  actions.append(submit, cancel);
  const footerHost = formCard.querySelector(".ui-card__footer");
  footerHost.innerHTML = "";
  footerHost.appendChild(actions);

  const submitContext = {
    mode,
    id,
    refs,
    section,
    submit,
    trainerList,
  };

  form.addEventListener("submit", (event) => handleKursFormSubmit(event, submitContext));

  focusHeading(section);
}

async function fetchKurse() {
  try {
    const kurse = await listKurse();
    kursCache = await hydrateKurseWithTrainer(kurse);
    return kursCache;
  } catch (error) {
    console.error("[KURSE_ERR_FETCH_LIST]", error);
    kursCache = [];
    throw error;
  }
}

function buildCourseToolbarCard() {
  const cardFragment = createCard({
    eyebrow: "",
    title: "Aktionen",
    body: "",
    footer: "",
  });
  const cardElement = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!cardElement) return document.createDocumentFragment();

  const body = cardElement.querySelector(".ui-card__body");
  body.innerHTML = "";
  const actions = document.createElement("div");
  actions.className = "module-actions";
  actions.appendChild(
    createButton({
      label: "Neuer Kurs",
      variant: "primary",
      onClick: () => {
        window.location.hash = "#/kurse/new";
      },
    })
  );
  actions.appendChild(
    createButton({
      label: "Plan exportieren",
      variant: "secondary",
    })
  );
  body.appendChild(actions);

  return cardElement;
}

async function populateCourses(container) {
  if (!container) return;
  container.innerHTML = "";
  const loading = document.createElement("p");
  loading.textContent = "Kurse werden geladen ...";
  container.appendChild(loading);
  try {
    const courses = await fetchKurse();
    container.innerHTML = "";
    if (!courses.length) {
      container.appendChild(createEmpty());
      return;
    }

    const searchState = {
      query: "",
    };
    const filterState = {
      status: "all",
    };
    const sortState = {
      key: "status",
      direction: "asc",
    };
    const paginationState = {
      page: 1,
      pageSize: 25,
    };
    const controlsWrap = document.createElement("div");
    controlsWrap.className = "list-controls";
    const searchRow = createFormRow({
      id: "kurse-search",
      label: "Suche",
      placeholder: "Titel, Code, Trainer ...",
      value: "",
      required: false,
    });
    const searchInput = searchRow.querySelector("input");
    if (searchInput) {
      searchInput.type = "search";
      searchInput.addEventListener("input", (event) => {
        searchState.query = event.target.value || "";
        paginationState.page = 1;
        renderList();
      });
    }
    controlsWrap.appendChild(searchRow);
    const statusRow = createFormRow({
      id: "kurse-status-filter",
      label: "Status",
      control: "select",
      options: [
        { value: "all", label: "Alle", selected: true },
        ...STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
      ],
    });
    const statusSelect = statusRow.querySelector("select");
    if (statusSelect) {
      statusSelect.addEventListener("change", (event) => {
        filterState.status = event.target.value || "all";
        paginationState.page = 1;
        renderList();
      });
    }
    controlsWrap.appendChild(statusRow);
    const sortKeyRow = createFormRow({
      id: "kurse-sort-key",
      label: "Sortierung",
      control: "select",
      options: [
        { value: "status", label: "Status", selected: true },
        { value: "title", label: "Titel" },
        { value: "code", label: "Code" },
        { value: "trainer", label: "Trainer" },
        { value: "createdAt", label: "Erstellt am" },
      ],
    });
    const sortKeySelect = sortKeyRow.querySelector("select");
    if (sortKeySelect) {
      sortKeySelect.addEventListener("change", (event) => {
        sortState.key = event.target.value || "status";
        paginationState.page = 1;
        renderList();
      });
    }
    controlsWrap.appendChild(sortKeyRow);
    const sortDirRow = createFormRow({
      id: "kurse-sort-dir",
      label: "Richtung",
      control: "select",
      options: [
        { value: "asc", label: "Aufsteigend", selected: true },
        { value: "desc", label: "Absteigend" },
      ],
    });
    const sortDirSelect = sortDirRow.querySelector("select");
    if (sortDirSelect) {
      sortDirSelect.addEventListener("change", (event) => {
        sortState.direction = event.target.value === "desc" ? "desc" : "asc";
        renderList();
      });
    }
    controlsWrap.appendChild(sortDirRow);
    const pageSizeRow = createFormRow({
      id: "kurse-page-size",
      label: "Pro Seite",
      control: "select",
      options: [
        { value: "25", label: "25", selected: true },
        { value: "50", label: "50" },
        { value: "100", label: "100" },
      ],
    });
    const pageSizeSelect = pageSizeRow.querySelector("select");
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", (event) => {
        const nextSize = Number(event.target.value) || 25;
        paginationState.pageSize = nextSize;
        paginationState.page = 1;
        renderList();
      });
    }
    controlsWrap.appendChild(pageSizeRow);
    container.appendChild(controlsWrap);

    const listHost = document.createElement("div");
    listHost.className = "kurse-list";
    container.appendChild(listHost);

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
        renderList();
      }
    });
    nextBtn.addEventListener("click", () => {
      paginationState.page += 1;
      renderList();
    });
    paginationActions.append(prevBtn, pageLabel, nextBtn);
    pagination.append(paginationInfo, paginationActions);
    container.appendChild(pagination);

    function normalizeSearch(value) {
      return String(value || "")
        .trim()
        .toLowerCase();
    }

    function normalizeStatusValue(value) {
      const normalized = normalizeSearch(value);
      if (["geplant", "offen", "ausgebucht"].includes(normalized)) return "aktiv";
      if (normalized === "abgesagt") return "deaktiviert";
      return normalized;
    }

    function matchesSearch(course, query) {
      if (!query) return true;
      const haystack = [
        course.code,
        course.title,
        course.trainerName,
        course.trainerCode,
        course.trainerLabel,
        course.status,
        course.aboForm,
        course.alterHund,
        course.aufbauend,
        course.price,
      ]
        .filter(Boolean)
        .map(normalizeSearch)
        .join(" ");
      return haystack.includes(query);
    }

    function matchesFilters(course) {
      if (filterState.status === "all") return true;
      return normalizeStatusValue(course.status) === filterState.status;
    }

    function buildStatusSortKey(course) {
      const normalized = normalizeStatusValue(course.status);
      const order = {
        aktiv: 0,
        deaktiviert: 1,
      };
      const rank = order[normalized] ?? 9;
      const title = normalizeSearch(course.title);
      return `${String(rank).padStart(2, "0")}|${title}`;
    }

    function getSortValue(course) {
      switch (sortState.key) {
        case "title":
          return normalizeSearch(course.title);
        case "code":
          return normalizeSearch(course.code);
        case "trainer":
          return normalizeSearch(course.trainerName || course.trainerCode);
        case "createdAt": {
          const date = new Date(course.createdAt || "");
          return Number.isNaN(date.getTime()) ? "" : date.toISOString();
        }
        case "status":
        default:
          return buildStatusSortKey(course);
      }
    }

    function getDisplayRows() {
      const query = normalizeSearch(searchState.query);
      const filtered = courses.filter(
        (course) => matchesSearch(course, query) && matchesFilters(course)
      );
      if (!filtered.length) return [];
      return filtered
        .map((course, index) => ({ course, index }))
        .sort((a, b) => {
          const aValue = getSortValue(a.course);
          const bValue = getSortValue(b.course);
          const compare = String(aValue).localeCompare(String(bValue), "de", {
            sensitivity: "base",
          });
          if (compare !== 0) {
            return sortState.direction === "asc" ? compare : -compare;
          }
          return a.index - b.index;
        })
        .map(({ course }) => course);
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

    function renderList() {
      listHost.innerHTML = "";
      const rows = getDisplayRows();
      const { rows: pageRows } = getPagedRows(rows);
      if (!pageRows.length) {
        listHost.appendChild(createNotice("Keine Treffer.", { variant: "info" }));
        renderPagination(rows);
        return;
      }
      pageRows.forEach((course) => {
        const listItem = createCourseListItem(course);
        if (listItem) listHost.appendChild(listItem);
      });
      renderPagination(rows);
    }

    renderList();
  } catch (error) {
    console.error("[KURSE_ERR_LIST_FETCH]", error);
    container.innerHTML = "";
    container.appendChild(createErrorNotice());
  }
}

function formatStatusLabel(status) {
  const normalized = (status || "").toLowerCase();
  switch (normalized) {
    case "aktiv":
      return "Aktiv";
    case "deaktiviert":
    case "abgesagt":
      return "Deaktiviert";
    case "geplant":
    case "offen":
    case "ausgebucht":
      return "Aktiv";
    default:
      return "Aktiv";
  }
}

function formatPrice(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "–";
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
  }).format(amount);
}

function generateNextKursCode(list = []) {
  let max = 0;
  list.forEach((kurs) => {
    const source = (kurs.code || "").trim();
    const match = source.match(/(\d+)/);
    if (!match) return;
    const num = Number.parseInt(match[1], 10);
    if (Number.isFinite(num) && num > max) {
      max = num;
    }
  });
  const nextNumber = max + 1;
  return `KS-${String(nextNumber).padStart(3, "0")}`;
}

function buildTrainerOptions(trainerList = [], existing = {}) {
  const options = (Array.isArray(trainerList) ? trainerList : []).map((trainer) => ({
    value: trainer.id,
    label: formatTrainerLabel(trainer, "", trainer.id),
  }));
  if (
    existing?.trainerId &&
    !options.some((option) => option.value === existing.trainerId) &&
    existing.trainerName
  ) {
    options.push({
      value: existing.trainerId,
      label: formatTrainerLabel({ name: existing.trainerName }, "", existing.trainerId),
    });
  }
  if (!options.some((opt) => opt.value === "")) {
    options.unshift({ value: "", label: "Bitte wählen" });
  }
  return options;
}

function buildTrainerSelectOptions(options = [], selectedId = "") {
  const safeOptions = Array.isArray(options) ? options : [];
  const hasPlaceholder = safeOptions.some((opt) => opt.value === "");
  const base = hasPlaceholder
    ? safeOptions
    : [{ value: "", label: "Bitte wählen" }, ...safeOptions];
  return base.map((opt) => ({
    value: opt.value,
    label: opt.label,
    selected: opt.value === selectedId,
  }));
}

function buildAdditionalTrainerOptions(options = [], selectedId = "") {
  const safeOptions = Array.isArray(options) ? options : [];
  const list = safeOptions.filter((opt) => opt.value !== "");
  return [{ value: "", label: "Keiner" }, ...list].map((opt) => ({
    value: opt.value,
    label: opt.label,
    selected: opt.value === selectedId,
  }));
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

function buildFormFields(existing = {}, { defaultCode = "", trainerOptions = [] } = {}) {
  const statusValue = existing?.status ?? "aktiv";
  const aufbauendValue = existing?.aufbauend ?? "";
  const existingTrainerId = existing?.trainerId ?? "";
  const existingTrainerIds = Array.isArray(existing?.trainerIds)
    ? existing.trainerIds.filter(Boolean)
    : existingTrainerId
      ? [existingTrainerId]
      : [];
  const additionalTrainerIds = existingTrainerIds.filter((id) => id !== existingTrainerId);
  const additionalTrainerSlots = [
    additionalTrainerIds[0] || "",
    additionalTrainerIds[1] || "",
    additionalTrainerIds[2] || "",
    additionalTrainerIds[3] || "",
  ];
  const backgroundValue = getCertificateBackgroundForKurs(existing);
  return [
    {
      name: "kursId",
      value: existing?.id ?? "",
      readOnly: true,
      config: {
        id: "kurs-id",
        label: "Kurs-ID",
        placeholder: "Wird automatisch vergeben",
        describedByText: "ID ist schreibgeschützt und wird vom System vergeben.",
        required: false,
      },
    },
    {
      name: "kursCode",
      value: existing?.code ?? defaultCode,
      readOnly: true,
      config: {
        id: "kurs-code",
        label: "Kurscode",
        placeholder: "Wird automatisch vergeben",
        describedByText:
          'Standardmäßig automatisch. Mit "Code manuell ändern" aktivierst du die Bearbeitung.',
        required: false,
      },
    },
    {
      name: "title",
      value: existing?.title ?? "",
      config: {
        id: "kurs-title",
        label: "Kursname",
        placeholder: "z. B. Welpenschule & Prägung",
        required: true,
      },
    },
    {
      name: "ort",
      value: existing?.ort ?? existing?.location ?? "",
      config: {
        id: "kurs-ort",
        label: "Ort",
        placeholder: "z. B. Platz Nord, Zürich",
        required: true,
      },
    },
    {
      name: "trainerId",
      value: existingTrainerId,
      config: {
        id: "kurs-trainer-id",
        label: "Haupttrainer",
        control: "select",
        required: true,
        describedByText: "Trainer ist Pflichtfeld. Bitte auswählen.",
        options: buildTrainerSelectOptions(trainerOptions, existing?.trainerId),
      },
    },
    {
      name: "trainerIds1",
      value: additionalTrainerSlots[0],
      config: {
        id: "kurs-trainer-ids-1",
        label: "Weitere Trainer 1",
        control: "select",
        required: false,
        describedByText: "Optional.",
        options: buildAdditionalTrainerOptions(trainerOptions, additionalTrainerSlots[0]),
      },
    },
    {
      name: "trainerIds2",
      value: additionalTrainerSlots[1],
      config: {
        id: "kurs-trainer-ids-2",
        label: "Weitere Trainer 2",
        control: "select",
        required: false,
        describedByText: "Optional.",
        options: buildAdditionalTrainerOptions(trainerOptions, additionalTrainerSlots[1]),
      },
    },
    {
      name: "trainerIds3",
      value: additionalTrainerSlots[2],
      config: {
        id: "kurs-trainer-ids-3",
        label: "Weitere Trainer 3",
        control: "select",
        required: false,
        describedByText: "Optional.",
        options: buildAdditionalTrainerOptions(trainerOptions, additionalTrainerSlots[2]),
      },
    },
    {
      name: "trainerIds4",
      value: additionalTrainerSlots[3],
      config: {
        id: "kurs-trainer-ids-4",
        label: "Weitere Trainer 4",
        control: "select",
        required: false,
        describedByText: "Optional.",
        options: buildAdditionalTrainerOptions(trainerOptions, additionalTrainerSlots[3]),
      },
    },
    {
      name: "aboForm",
      value: existing?.aboForm ?? "",
      config: {
        id: "kurs-abo-form",
        label: "Abo-Form",
        placeholder: "z. B. 10er-Abo / Einzel / 6 Stunden",
      },
    },
    {
      name: "alterHund",
      value: existing?.alterHund ?? "",
      config: {
        id: "kurs-alter-hund",
        label: "Alter Hund",
        placeholder: "z. B. Ab 9 Monaten",
      },
    },
    {
      name: "price",
      value: existing?.price ? String(existing.price) : "",
      config: {
        id: "kurs-price",
        label: "Preis",
        placeholder: "z. B. 380.- / 38.-",
      },
    },
    {
      name: "aufbauend",
      value: aufbauendValue,
      config: {
        id: "kurs-aufbauend",
        label: "Aufbauend",
        control: "select",
        options: [
          { value: "", label: "Bitte wählen", selected: !aufbauendValue },
          { value: "aufbauend", label: "Aufbauend", selected: aufbauendValue === "aufbauend" },
          {
            value: "nicht aufbauend",
            label: "Nicht aufbauend",
            selected: aufbauendValue === "nicht aufbauend",
          },
        ],
      },
    },
    {
      name: "status",
      config: {
        id: "kurs-status",
        label: "Status",
        control: "select",
        required: false,
        options: STATUS_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
          selected: option.value === statusValue,
        })),
      },
    },
    {
      name: "zertifikatHintergrund",
      value: backgroundValue,
      config: {
        id: "kurs-zertifikat-hintergrund",
        label: "Zertifikat Hintergrund (PNG)",
        control: "select",
        required: false,
        describedByText: "PNG muss in attachments/material/Material liegen.",
        options: getCertificateBackgroundOptions(backgroundValue),
      },
    },
    {
      name: "notes",
      value: existing?.notes ?? "",
      config: {
        id: "kurs-notes",
        label: "Notizen",
        control: "textarea",
        placeholder: "Besondere Hinweise zum Ablauf",
      },
    },
    {
      name: "inhaltTheorie",
      value: existing?.inhaltTheorie ?? "",
      config: {
        id: "kurs-inhalt-theorie",
        label: "Kursinhalt Theorie",
        control: "textarea",
        placeholder: "Eine Zeile pro Bullet",
      },
    },
    {
      name: "inhaltPraxis",
      value: existing?.inhaltPraxis ?? "",
      config: {
        id: "kurs-inhalt-praxis",
        label: "Kursinhalt Praxis",
        control: "textarea",
        placeholder: "Eine Zeile pro Bullet",
      },
    },
  ];
}

function ensureString(value, fallback = "") {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function collectFormValues(refs) {
  const values = {};
  Object.entries(refs).forEach(([key, ref]) => {
    if (typeof ref.getValue === "function") {
      values[key] = ref.getValue();
      return;
    }
    if (ref.inputs) {
      values[key] = ref.inputs.filter((input) => input.checked).map((input) => input.value);
      return;
    }
    const raw = ref.input ? ref.input.value : "";
    if (ref.input?.multiple) {
      values[key] = Array.from(ref.input.selectedOptions || []).map((opt) => opt.value);
    } else {
      values[key] = typeof raw === "string" ? raw.trim() : raw;
    }
  });
  return values;
}

function collectAdditionalTrainerIds(values = {}) {
  const rawValues = [
    values.trainerIds1,
    values.trainerIds2,
    values.trainerIds3,
    values.trainerIds4,
  ];
  const seen = new Set();
  const ids = [];
  rawValues.forEach((value) => {
    const trimmed = ensureString(value).trim();
    if (!trimmed) return;
    if (seen.has(trimmed)) return;
    seen.add(trimmed);
    ids.push(trimmed);
  });
  return ids;
}

function validate(values = {}, { trainers = [] } = {}) {
  const safeValues = { ...values };
  safeValues.kursCode = ensureString(values.kursCode).trim();
  const errors = {};
  safeValues.title = ensureString(values.title, "").trim();
  if (!safeValues.title) {
    errors.title = "Bitte Kursnamen eingeben.";
  }
  safeValues.ort = ensureString(values.ort, "").trim();
  if (!safeValues.ort) {
    errors.ort = "Bitte Ort angeben.";
  }
  const trainerId = ensureString(values.trainerId).trim();
  let trainerIds = collectAdditionalTrainerIds(values);
  const validTrainerIds = Array.isArray(trainers) ? trainers.map((trainer) => trainer.id) : [];
  if (!trainerId) {
    errors.trainerId = "Bitte Trainer auswählen.";
  } else if (validTrainerIds.length && !validTrainerIds.includes(trainerId)) {
    errors.trainerId = "Ausgewählter Trainer ist ungültig.";
  }
  trainerIds = trainerIds.filter((id) => id !== trainerId);
  const invalidAdditional = trainerIds.filter(
    (id) => validTrainerIds.length && !validTrainerIds.includes(id)
  );
  if (invalidAdditional.length) {
    ["trainerIds1", "trainerIds2", "trainerIds3", "trainerIds4"].forEach((key) => {
      const value = ensureString(values[key]).trim();
      if (value && invalidAdditional.includes(value)) {
        errors[key] = "Ausgewählte Zusatz-Trainer sind ungültig.";
      }
    });
  }
  safeValues.trainerId = trainerId;
  safeValues.trainerIds = trainerIds;
  if (!safeValues.kursCode) {
    safeValues.kursCode = generateNextKursCode(kursCache);
  }
  return { errors, values: safeValues };
}

function applyErrors(refs, errors) {
  Object.entries(refs).forEach(([key, ref]) => {
    const hint = ref.hint;
    const inputs = ref.inputs || (ref.input ? [ref.input] : []);
    const hasError = Boolean(errors[key]);
    if (hint) {
      hint.textContent = hasError ? errors[key] : "";
      hint.classList.toggle("sr-only", !hasError);
    }
    inputs.forEach((input) => {
      input.setAttribute("aria-invalid", hasError ? "true" : "false");
    });
  });
}

function buildPayload(values, trainerList = []) {
  const trainer = findTrainerById(values.trainerId, trainerList);
  const trainerIds = collectAdditionalTrainerIds(values).filter((id) => id !== values.trainerId);
  if (values.trainerId && !trainerIds.includes(values.trainerId)) {
    trainerIds.unshift(values.trainerId);
  }
  return {
    code: ensureString(values.kursCode, ""),
    title: ensureString(values.title, ""),
    ort: ensureString(values.ort, ""),
    location: ensureString(values.ort, ""),
    trainerName: trainer?.name || ensureString(values.trainerName, ""),
    trainerId: ensureString(values.trainerId, ""),
    trainerIds,
    status: ensureString(values.status, ""),
    aboForm: ensureString(values.aboForm, ""),
    alterHund: ensureString(values.alterHund, ""),
    aufbauend: ensureString(values.aufbauend, ""),
    price: ensureString(values.price, ""),
    notes: ensureString(values.notes, ""),
    zertifikatHintergrund: ensureString(values.zertifikatHintergrund, ""),
    inhaltTheorie: ensureString(values.inhaltTheorie, ""),
    inhaltPraxis: ensureString(values.inhaltPraxis, ""),
  };
}

function setToast(message, tone = "info") {
  window[TOAST_KEY] = { message, tone };
}

function injectToast(section) {
  section.querySelectorAll(".kurse-toast").forEach((node) => node.remove());
  const toast = window[TOAST_KEY];
  if (!toast) return;
  delete window[TOAST_KEY];
  const { message, tone = "info" } =
    typeof toast === "string" ? { message: toast, tone: "info" } : toast;
  const notice = document.createElement("p");
  notice.className = `kurse-toast kurse-toast--${tone}`;
  notice.setAttribute("role", "status");
  notice.textContent = message;
  section.prepend(notice);
}

function showInlineToast(section, message, tone = "info") {
  setToast(message, tone);
  injectToast(section);
}

async function handleKursFormSubmit(event, { mode, id, refs, section, submit, trainerList = [] }) {
  event.preventDefault();
  const values = collectFormValues(refs);
  const codeInput = refs.kursCode?.input;
  const isManualCode = codeInput ? !codeInput.readOnly : false;
  if (!isManualCode && !values.kursCode) {
    const nextCode = generateNextKursCode(kursCache);
    values.kursCode = nextCode;
    if (codeInput) {
      codeInput.value = nextCode;
    }
  }
  const { errors, values: safeValues } = validate(values, { trainers: trainerList });
  applyErrors(refs, errors);
  if (Object.keys(errors).length) {
    const firstError = Object.values(refs).find((ref) => !ref.hint.classList.contains("sr-only"));
    firstError?.input.focus();
    return;
  }

  const payload = buildPayload(safeValues, trainerList);
  const defaultLabel = submit.textContent;
  submit.disabled = true;
  submit.textContent = mode === "create" ? "Erstelle ..." : "Speichere ...";

  try {
    let result;
    if (mode === "create") {
      result = await createKurs(payload);
    } else {
      result = await updateKurs(id, payload);
    }
    const createdId = result?.id;
    if (!createdId) {
      const resultError = new Error("Kurs result missing ID");
      resultError.code = "FORM_RESULT_EMPTY";
      throw resultError;
    }
    await fetchKurse();
    runIntegrityCheck();
    if (mode === "create") {
      setToast("Kurs wurde erstellt.", "success");
    } else {
      setToast("Kurs wurde aktualisiert.", "success");
    }
    window.location.hash = `#/kurse/${createdId}`;
  } catch (error) {
    const isResultError = error?.code === "FORM_RESULT_EMPTY";
    const isTrainerError = error?.code === "KURS_TRAINER_INVALID";
    if (isTrainerError) {
      applyErrors(refs, { trainerId: "Ausgewählter Trainer ist ungültig oder gelöscht." });
    }
    console.error(isResultError ? "[KURSE_ERR_FORM_RESULT]" : "[KURSE_ERR_FORM_SUBMIT]", error);
    const message = isResultError
      ? "Kurs konnte nach dem Speichern nicht geladen werden."
      : isTrainerError
        ? "Trainer-Auswahl ist ungültig. Bitte einen vorhandenen Trainer wählen."
        : mode === "create"
          ? "Kurs konnte nicht erstellt werden."
          : "Fehler beim Speichern des Kurses.";
    showInlineToast(section, message, "error");
  } finally {
    submit.disabled = false;
    submit.textContent = defaultLabel;
  }
}

async function handleDeleteKurs(section, id, button) {
  if (button?.disabled) return;
  const originalLabel = button.textContent;
  const guardHost = ensureDeleteGuard(section);
  const resetButton = () => {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  };
  button.disabled = true;
  button.textContent = "Prüfe ...";
  try {
    const [kursRecord, finanzen] = await Promise.all([getKurs(id), listFinanzen().catch(() => [])]);
    if (!kursRecord) {
      throw new Error("Kurs nicht gefunden");
    }
    const hasParticipants = Array.isArray(kursRecord.hundIds) && kursRecord.hundIds.length > 0;
    const hasFinanzen =
      Array.isArray(finanzen) && finanzen.some((entry) => entry?.kursId === kursRecord.id);
    if (hasParticipants || hasFinanzen) {
      const reasons = [];
      if (hasParticipants) reasons.push("Teilnehmer (Hunde) sind zugeordnet.");
      if (hasFinanzen)
        reasons.push("Finanzbuchungen verknüpfen diesen Kurs (kursId in Zahlungen).");
      guardHost.innerHTML = "";
      guardHost.appendChild(renderDeleteGuardNotice(reasons));
      showInlineToast(section, "Löschen blockiert: Bitte zuerst Verknüpfungen entfernen.", "error");
      resetButton();
      return;
    }
    const confirmed = window.confirm(
      "Kurs löschen?\nMöchtest du diesen Kurs wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden."
    );
    if (!confirmed) {
      resetButton();
      return;
    }
    button.textContent = "Lösche ...";
    const result = await deleteKurs(id);
    if (!result?.ok) {
      throw new Error("Delete failed");
    }
    await fetchKurse();
    runIntegrityCheck();
    setToast("Kurs wurde gelöscht.", "success");
    window.location.hash = "#/kurse";
  } catch (error) {
    console.error("[KURSE_ERR_DELETE]", error);
    guardHost.innerHTML = "";
    guardHost.appendChild(
      createNotice("Fehler beim Löschen des Kurses.", { variant: "warn", role: "alert" })
    );
    showInlineToast(section, "Fehler beim Löschen des Kurses.", "error");
    resetButton();
  }
}

function ensureDeleteGuard(section) {
  if (!section) {
    const fallback = document.createElement("div");
    fallback.className = "kurse-delete-guard";
    return fallback;
  }
  let host = section.querySelector(".kurse-delete-guard");
  if (!host) {
    host = document.createElement("div");
    host.className = "kurse-delete-guard";
    section.prepend(host);
  }
  host.innerHTML = "";
  return host;
}

function renderDeleteGuardNotice(reasons = []) {
  const wrapper = document.createElement("div");
  wrapper.className = "kurse-delete-guard";
  const noticeFragment = createNotice(
    "Der Kurs kann nicht gelöscht werden, da noch verknüpfte Daten existieren.",
    { variant: "warn", role: "alert" }
  );
  wrapper.appendChild(noticeFragment);
  if (Array.isArray(reasons) && reasons.length) {
    const list = document.createElement("ul");
    list.className = "kurse-delete-guard__list";
    reasons.forEach((reason) => {
      const item = document.createElement("li");
      item.textContent = reason;
      list.appendChild(item);
    });
    wrapper.appendChild(list);
  }
  return wrapper;
}

function focusHeading(root) {
  if (!root) return;
  const heading = root.querySelector("h1") || root.querySelector("h2");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }
}

function scrollToTop() {
  if (typeof window === "undefined" || typeof window.scrollTo !== "function") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
