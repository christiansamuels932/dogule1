// Kurse module – list/detail flows with mock API
/* globals document, console, window */
import {
  createBadge,
  createButton,
  createCard,
  createEmptyState,
  createFormRow,
  createNotice,
  createLinkedTrainerCard,
  createSectionHeader,
} from "../shared/components/components.js";

const createSection = createSectionHeader;
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
  listHunde,
  getHundeForKurs,
  getKunde,
  listKunden,
  listFinanzenByKundeId,
  listFinanzen,
  listTrainer,
} from "../shared/api/index.js";
import { runIntegrityCheck } from "../shared/api/db/integrityCheck.js";

let kursCache = [];
let trainerCache = [];
const TOAST_KEY = "__DOGULE_KURSE_TOAST__";
const STATUS_OPTIONS = [
  { value: "geplant", label: "Geplant" },
  { value: "offen", label: "Offen" },
  { value: "ausgebucht", label: "Ausgebucht" },
  { value: "abgesagt", label: "Abgesagt" },
];
const LEVEL_OPTIONS = [
  { value: "", label: "Bitte wählen" },
  { value: "Welpen", label: "Welpen" },
  { value: "Junghunde", label: "Junghunde" },
  { value: "Alltag", label: "Alltag" },
  { value: "Fortgeschrittene", label: "Fortgeschrittene" },
  { value: "Sporthunde", label: "Sporthunde" },
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
    const trainer = kurs?.trainerId ? trainerMap.get(kurs.trainerId) || null : null;
    return {
      ...kurs,
      trainer,
      trainerName: trainer?.name || kurs.trainerName || "",
      trainerCode: trainer?.code || "",
    };
  });
}

function findTrainerById(trainerId, trainerList = trainerCache) {
  const safeId = (trainerId || "").trim();
  if (!safeId) return null;
  const list = Array.isArray(trainerList) ? trainerList : trainerCache;
  return list.find((trainer) => trainer.id === safeId) || null;
}

function createMainHeading(title, subtitle = "") {
  const fragment = createSectionHeader({
    title,
    subtitle,
    level: 1,
  });
  const sectionEl = fragment.querySelector(".ui-section") || fragment.firstElementChild;
  const subtitleEl = sectionEl?.querySelector(".ui-section__subtitle") || null;
  const originalTitleEl = sectionEl?.querySelector(".ui-section__title") || null;
  const heading = document.createElement("h1");
  heading.className = originalTitleEl?.className || "ui-section__title";
  heading.textContent = originalTitleEl?.textContent || title || "";
  if (originalTitleEl?.id) {
    heading.id = originalTitleEl.id;
  }
  if (originalTitleEl) {
    originalTitleEl.replaceWith(heading);
  } else if (sectionEl) {
    const header = sectionEl.querySelector(".ui-section__header") || sectionEl;
    header.prepend(heading);
  }
  if (subtitleEl) {
    subtitleEl.textContent = subtitle || "";
    subtitleEl.hidden = !subtitle;
  }
  return { fragment, sectionEl, heading, subtitleEl };
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
    const { fragment: headingFragment } = createMainHeading("Kurse", "Fehler beim Laden");
    section.appendChild(headingFragment);
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
  scrollToTop();
  await fetchTrainer(true);
  const { fragment: headingFragment } = createMainHeading("Kurse", "Planung und Übersicht");
  section.appendChild(headingFragment);

  const introCardFragment = createCard({
    eyebrow: "",
    title: "",
    body: "",
    footer: "",
  });
  const introCard =
    introCardFragment.querySelector(".ui-card") || introCardFragment.firstElementChild;
  if (introCard) {
    const introBody = introCard.querySelector(".ui-card__body");
    introBody.innerHTML = "";
    introBody.appendChild(
      createNotice("Verwalte Kurse und überprüfe freie Plätze.", {
        variant: "info",
      })
    );
    section.appendChild(introCard);
  }
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
  const { fragment: headerFragment, subtitleEl: headerSubtitle } = createMainHeading("Kurs", "");
  if (headerSubtitle) {
    headerSubtitle.hidden = true;
  }
  section.appendChild(headerFragment);
  injectToast(section);

  const detailStack = document.createElement("div");
  detailStack.className = "kurse-detail-stack";
  section.appendChild(detailStack);
  const loadingText = document.createElement("p");
  loadingText.textContent = "Kurs wird geladen ...";
  const overviewCard = createDetailCard({
    eyebrow: "",
    title: "Kurs wird geladen ...",
    bodyNodes: [loadingText],
  });
  if (!overviewCard) return;
  detailStack.appendChild(overviewCard.card);

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

    const subtitleText = kurs.title || "Ohne Titel";
    if (headerSubtitle) {
      headerSubtitle.textContent = subtitleText;
      headerSubtitle.hidden = !subtitleText;
    }
    overviewCard.setEyebrow(formatStatusLabel(kurs.status));
    overviewCard.setTitle(kurs.title || "Ohne Titel");
    overviewCard.clearBody();
    overviewCard.body.appendChild(renderDetailList(kurs));
    const participantContext = await buildParticipantContext(kurs);
    const kundenFinanzen = await buildKursKundenFinanzen(participantContext.participants);
    section.__kursFinanzen = kundenFinanzen;

    overviewCard.clearFooter();
    const editLink = createButton({
      label: "Kurs bearbeiten",
      variant: "primary",
    });
    editLink.type = "button";
    editLink.addEventListener("click", () => {
      window.location.hash = `#/kurse/${kurs.id}/edit`;
    });
    const deleteBtn = createButton({
      label: "Kurs löschen",
      variant: "secondary",
    });
    deleteBtn.addEventListener("click", () => handleDeleteKurs(section, kurs.id, deleteBtn));
    const backBtn = createButton({
      label: "Zurück zur Übersicht",
      variant: "quiet",
    });
    backBtn.type = "button";
    backBtn.addEventListener("click", () => {
      window.location.hash = "#/kurse";
    });
    const footerActions = document.createElement("div");
    footerActions.className = "kurse-detail-actions";
    footerActions.append(editLink, deleteBtn, backBtn);
    overviewCard.footer.appendChild(footerActions);

    const trainerCard = buildTrainerCard(kurs);
    if (trainerCard) {
      detailStack.appendChild(trainerCard);
    }
    const notesCard = createDetailCard({
      eyebrow: "",
      title: "Notizen",
      bodyNodes: [createNotesContent(kurs)],
    });
    if (notesCard) {
      detailStack.appendChild(notesCard.card);
    }
    const metaCard = createDetailCard({
      eyebrow: "",
      title: "Metadaten",
      bodyNodes: [createMetaContent(kurs)],
    });
    if (metaCard) {
      detailStack.appendChild(metaCard.card);
    }

    appendParticipantsSection(section, participantContext);
    appendFinanceSections(section, kundenFinanzen);
  } catch (error) {
    console.error("[KURSE_ERR_DETAIL]", error);
    overviewCard.clearBody();
    overviewCard.body.appendChild(createErrorNotice());
    overviewCard.clearFooter();
  }

  focusHeading(section);
}

async function buildParticipantContext(kurs = {}) {
  const result = { participants: [], hasMissing: false, loadError: false };
  if (!kurs?.id) return result;
  try {
    const hunde = await getHundeForKurs(kurs.id);
    result.participants = Array.isArray(hunde) ? hunde : [];
    result.hasMissing = result.participants.some((participant) => participant?._missing);
  } catch (error) {
    console.error("[KURSE_ERR_LINKED_HUNDE]", error);
    result.loadError = true;
  }
  return result;
}

function appendParticipantsSection(
  section,
  { participants = [], hasMissing = false, loadError } = {}
) {
  const participantSection = document.createElement("section");
  participantSection.className = "kurse-linked-section";
  participantSection.appendChild(
    createSectionHeader({
      title: "Teilnehmende Hunde",
      subtitle: "",
      level: 2,
    })
  );
  const cardFragment = createCard({
    eyebrow: "",
    title: "",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (card) {
    const body = card.querySelector(".ui-card__body");
    body.innerHTML = "";
    if (loadError) {
      body.appendChild(createErrorNotice());
    } else {
      if (hasMissing) {
        body.appendChild(
          createNotice("Teilnehmerliste enthält ungültige Einträge. Bitte Kurs bearbeiten.", {
            variant: "warn",
            role: "alert",
          })
        );
      }
      if (!participants.length) {
        body.appendChild(createEmpty());
      } else {
        const sorted = [...participants].sort(participantSorter);
        sorted.forEach((participant) => {
          const row = renderParticipantRow(participant);
          if (row) body.appendChild(row);
        });
      }
    }
    participantSection.appendChild(card);
  }
  section.appendChild(participantSection);
}

function participantSorter(a, b) {
  if (a?._missing && b?._missing) return 0;
  if (a?._missing) return 1;
  if (b?._missing) return -1;
  const codeA = (a?.code || a?.id || "").toLowerCase();
  const codeB = (b?.code || b?.id || "").toLowerCase();
  if (codeA === codeB) return 0;
  return codeA > codeB ? 1 : -1;
}

function renderParticipantRow(participant) {
  if (participant?._missing) {
    const wrapper = document.createElement("div");
    wrapper.className = "kurse-participant kurse-participant--missing";
    const icon = createBadge("!", "warn");
    icon.classList.add("kurse-participant__warning");
    const label = document.createElement("span");
    label.className = "kurse-participant__label";
    label.textContent = "Unbekannter Hund (verwaiste Zuordnung)";
    const idNote = document.createElement("span");
    idNote.className = "kurse-participant__meta";
    idNote.textContent = participant.id ? `ID: ${participant.id}` : "";
    wrapper.append(icon, label);
    if (participant.id) {
      wrapper.appendChild(idNote);
    }
    return wrapper;
  }
  const displayCode = participant.code || participant.id || "–";
  const name = participant.name || "Unbenannter Hund";
  const ownerText = formatParticipantOwner(participant.owner, participant.kundenId);

  const cardFragment = createCard({
    eyebrow: displayCode,
    title: name,
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return null;
  card.classList.add("kurse-linked-hund");
  const body = card.querySelector(".ui-card__body");
  if (body) {
    body.innerHTML = "";
    const meta = document.createElement("div");
    meta.className = "kurse-linked-hund__meta";
    const ownerRow = document.createElement("p");
    ownerRow.textContent = `Besitzer: ${ownerText}`;
    const idRow = document.createElement("p");
    idRow.textContent = `ID: ${participant.id || "–"}`;
    meta.append(ownerRow, idRow);
    body.appendChild(meta);
  }
  const link = document.createElement("a");
  link.href = `#/hunde/${participant.id}`;
  link.className = "kurse-linked-hund__link";
  link.appendChild(card);
  return link;
}

function formatParticipantOwner(owner, kundenId) {
  if (!owner && !kundenId) return "–";
  if (owner) {
    const name = formatCustomerName(owner);
    const code = getCustomerDisplayCode(owner);
    const town = formatCustomerTown(owner);
    const townPart = town ? ` · ${town}` : "";
    return `${code} · ${name}${townPart}`;
  }
  return kundenId;
}

const KURSE_FINANCE_SECTION_TITLES = ["Finanzübersicht", "Offene Beträge", "Zahlungshistorie"];

async function buildKursKundenFinanzen(participants = []) {
  const seen = new Set();
  const candidates = [];
  (Array.isArray(participants) ? participants : []).forEach((participant) => {
    if (participant?._missing) return;
    const owner = participant?.owner;
    const kundeId = owner?.id || participant?.kundenId;
    if (!kundeId || seen.has(kundeId)) return;
    seen.add(kundeId);
    candidates.push(owner?.id ? owner : { id: kundeId });
  });
  const financeResults = [];
  if (!candidates.length) return financeResults;
  for (const kunde of candidates) {
    const kundeId = kunde?.id;
    if (!kundeId) continue;
    let kundeData = kunde;
    if (!kundeData.vorname && !kundeData.nachname && !kundeData.code && kundeData.id) {
      try {
        const fetched = await getKunde(kundeData.id);
        if (fetched) {
          kundeData = fetched;
        }
      } catch (error) {
        console.error("[KURSE_ERR_FINANZ_KUNDE]", error);
      }
    }
    let finanzen = [];
    try {
      finanzen = await listFinanzenByKundeId(kundeId);
    } catch (finanzenError) {
      console.error("[KURSE_ERR_FINANZ_FETCH]", finanzenError);
    }
    const zahlungen = finanzen.filter((entry) => entry.typ === "zahlung");
    const offeneBetraege = finanzen.filter((entry) => entry.typ === "offen");
    const lastZahlung = zahlungen.length ? zahlungen[zahlungen.length - 1] : null;
    financeResults.push({
      kundeId: kundeId,
      label: formatCustomerName(kundeData) || `Kunde ${kundeId}`,
      code: getCustomerDisplayCode(kundeData),
      offeneBetraege,
      zahlungen,
      lastZahlung,
    });
  }
  return financeResults;
}

function appendFinanceSections(section, kundenFinanzen = []) {
  if (!section) return;
  const financeData = Array.isArray(kundenFinanzen) ? kundenFinanzen : [];
  const renderers = {
    Finanzübersicht: renderKursFinanzOverviewContent,
    "Offene Beträge": renderKursOffeneBetraegeContent,
    Zahlungshistorie: renderKursZahlungshistorieContent,
  };
  KURSE_FINANCE_SECTION_TITLES.forEach((title) => {
    const financeSection = document.createElement("section");
    financeSection.className = "kurse-linked-section kurse-finanz-section";
    financeSection.appendChild(
      createSection({
        title,
        subtitle: "",
        level: 2,
      })
    );
    const cardFragment = createCard({
      eyebrow: "",
      title: "",
      body: "",
      footer: "",
    });
    const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
    if (!card) return;
    const body = card.querySelector(".ui-card__body");
    if (body) {
      body.innerHTML = "";
      const renderer = renderers[title];
      const rendered = typeof renderer === "function" ? renderer(body, financeData) : false;
      if (!rendered) {
        body.appendChild(createEmpty());
      }
    }
    financeSection.appendChild(card);
    section.appendChild(financeSection);
  });
}

function renderKursFinanzOverviewContent(container, financeData = []) {
  if (!financeData.length) return false;
  financeData.forEach((entry) => {
    const label = entryLabel(entry, financeData);
    const infoRow = createFinanceRow(
      label,
      entry.lastZahlung
        ? `Letzte Zahlung: ${formatFinanceAmount(entry.lastZahlung.betrag)} · Datum: ${formatDateTime(
            entry.lastZahlung.datum
          )}`
        : "Keine letzte Zahlung"
    );
    container.appendChild(infoRow);
  });
  return true;
}

function renderKursOffeneBetraegeContent(container, financeData = []) {
  const offeneEntries = [];
  financeData.forEach((entry) => {
    entry.offeneBetraege.forEach((offen) => {
      offeneEntries.push({
        kundeId: entry.kundeId,
        label: entry.label,
        code: entry.code,
        eintrag: offen,
      });
    });
  });
  if (!offeneEntries.length) {
    container.appendChild(createEmpty());
    return true;
  }
  offeneEntries.forEach(({ kundeId, label: kundeLabel, code, eintrag }) => {
    const label = entryLabel({ kundeId, label: kundeLabel, code }, financeData);
    const infoRow = createFinanceRow(
      label,
      `Betrag: ${formatFinanceAmount(eintrag.betrag)} · Datum: ${formatDateTime(eintrag.datum)}`
    );
    container.appendChild(infoRow);
  });
  return true;
}

function renderKursZahlungshistorieContent(container, financeData = []) {
  const zahlungen = [];
  financeData.forEach((entry) => {
    entry.zahlungen.forEach((zahlung) => {
      zahlungen.push({
        kundeId: entry.kundeId,
        label: entry.label,
        code: entry.code,
        eintrag: zahlung,
      });
    });
  });
  zahlungen.sort((a, b) => {
    const timeA = new Date(a.eintrag.datum).getTime();
    const timeB = new Date(b.eintrag.datum).getTime();
    return Number.isNaN(timeB) ? 1 : Number.isNaN(timeA) ? -1 : timeB - timeA;
  });
  if (!zahlungen.length) {
    container.appendChild(createEmpty());
    return true;
  }
  zahlungen.forEach(({ kundeId, label: kundeLabel, code, eintrag }) => {
    const label = entryLabel({ kundeId, label: kundeLabel, code }, financeData);
    const infoRow = createFinanceRow(
      label,
      `Zahlung: ${formatFinanceAmount(eintrag.betrag)} · Datum: ${formatDateTime(eintrag.datum)}`
    );
    container.appendChild(infoRow);
  });
  return true;
}

function entryLabel(entry, financeData = []) {
  const baseLabel = entry.label || `Kunde ${entry.kundeId}`;
  const prefix = entry.code || findFinanceCode(financeData, entry.kundeId);
  return prefix ? `${prefix} · ${baseLabel}` : baseLabel;
}

function findFinanceCode(financeData = [], kundeId = "") {
  const match = financeData.find((item) => item.kundeId === kundeId);
  return match?.code || "";
}

function createFinanceRow(label, text) {
  const row = document.createElement("div");
  row.className = "kurse-finanz-row";
  const labelEl = document.createElement("strong");
  labelEl.textContent = label;
  const textEl = document.createElement("span");
  textEl.textContent = text;
  row.append(labelEl, textEl);
  return row;
}

function formatCustomerName(kunde = {}) {
  const name = `${kunde.nachname ?? ""} ${kunde.vorname ?? ""}`.trim();
  return name || kunde.email || "Unbenannter Kunde";
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

function formatCustomerTown(kunde = {}) {
  return extractTown(kunde.adresse || kunde.address || "");
}

function getCustomerDisplayCode(kunde = {}) {
  return kunde.code || kunde.kundenCode || kunde.id || "–";
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
  const label = formatTrainerLabel(kurs.trainer, kurs.trainerName, kurs.trainerId);
  if (kurs.trainerId) {
    const link = document.createElement("a");
    link.href = `#/trainer/${kurs.trainerId}`;
    link.textContent = label;
    return link;
  }
  const span = document.createElement("span");
  span.textContent = label;
  return span;
}

function createCourseListItem(course = {}, { hundeById, kundenById } = {}) {
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
  const participantInfo = buildCourseParticipantSummary(course, { hundeById, kundenById });
  if (body) {
    body.innerHTML = "";
    const metaList = document.createElement("ul");
    metaList.className = "kurse-list__meta";
    const trainerLabel = formatTrainerLabel(course.trainer, course.trainerName, course.trainerId);
    [
      { label: "ID", value: course.id },
      { label: "Trainer-ID", value: course.trainerId || "–" },
      { label: "Erstellt am", value: formatDateTime(course.createdAt) },
      { label: "Kalender (Outlook)", value: formatOutlookMirror(course) },
      {
        label: "Trainer",
        value: trainerLabel,
        link: course.trainerId ? `#/trainer/${course.trainerId}` : "",
      },
      {
        label: "Kapazität",
        value: `${course.bookedCount ?? 0} / ${course.capacity ?? 0}`,
      },
      { label: "Ort", value: course.location || "Noch offen" },
      { label: "Hunde", value: participantInfo.hundeLabel },
      { label: "Kunden", value: participantInfo.kundenLabel },
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
    const statusBadge = createBadge(
      formatStatusLabel(course.status),
      getStatusVariant(course.status)
    );
    footer.appendChild(statusBadge);
    footer.appendChild(createBadge(`${course.level || "Alltag"}`, "default"));
  }
  link.appendChild(card);
  return link;
}

function createDetailCard({ eyebrow = "", title = "", bodyNodes = [], footerNodes = [] } = {}) {
  const cardFragment = createCard({
    eyebrow,
    title,
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return null;
  const body = card.querySelector(".ui-card__body");
  const footer = card.querySelector(".ui-card__footer");
  body.innerHTML = "";
  footer.innerHTML = "";
  (Array.isArray(bodyNodes) ? bodyNodes : []).forEach((node) => {
    if (node) body.appendChild(node);
  });
  (Array.isArray(footerNodes) ? footerNodes : []).forEach((node) => {
    if (node) footer.appendChild(node);
  });
  const eyebrowEl = card.querySelector(".ui-card__eyebrow");
  const titleEl = card.querySelector(".ui-card__title");
  return {
    card,
    body,
    footer,
    setEyebrow(value = "") {
      if (eyebrowEl) eyebrowEl.textContent = value;
    },
    setTitle(value = "") {
      if (titleEl) titleEl.textContent = value;
    },
    clearBody() {
      if (body) body.innerHTML = "";
    },
    clearFooter() {
      if (footer) footer.innerHTML = "";
    },
  };
}

async function renderForm(section, view, id) {
  if (!section) return;
  const mode = view === "create" ? "create" : "edit";
  section.innerHTML = "";
  scrollToTop();
  const { fragment: headingFragment } = createMainHeading(
    mode === "create" ? "Kurs erstellen" : "Kurs bearbeiten",
    mode === "create" ? "Lege einen neuen Kurs an." : "Passe die Kursdaten an."
  );
  section.appendChild(headingFragment);
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
  let hundeOptions = [];
  let kundenOptions = [];
  try {
    hundeOptions = await listHunde();
  } catch (error) {
    console.error("[KURSE_ERR_FORM_HUNDE]", error);
  }
  try {
    kundenOptions = await listKunden();
  } catch (error) {
    console.error("[KURSE_ERR_FORM_KUNDEN]", error);
  }
  const selectedHundIds = Array.isArray(existing?.hundIds) ? existing.hundIds : [];
  let isCodeOverrideEnabled = false;
  const fields = buildFormFields(existing, {
    defaultCode: kursCodeValue,
    trainerOptions,
    trainerNameValue:
      (existing?.trainerId && findTrainerById(existing.trainerId, trainerList)?.name) ||
      existing?.trainerName ||
      "",
  });
  const refs = {};
  fields.forEach((field) => {
    const row = createFormRow(field.config);
    const input = row.querySelector("input, select, textarea");
    input.name = field.name;
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
      input.value = field.value;
    }
    const hint = row.querySelector(".ui-form-row__hint");
    if (!field.config.describedByText) {
      hint.classList.add("sr-only");
    }
    refs[field.name] = { input, hint };
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

  const trainerIdRef = refs.trainerId;
  const trainerNameRef = refs.trainerName;
  if (trainerIdRef?.input && trainerNameRef?.input) {
    trainerNameRef.input.readOnly = true;
    trainerNameRef.input.setAttribute("aria-readonly", "true");
    const syncTrainerName = () => {
      const trainer = findTrainerById(trainerIdRef.input.value, trainerList);
      trainerNameRef.input.value = trainer?.name || "";
    };
    trainerIdRef.input.addEventListener("change", syncTrainerName);
    syncTrainerName();
  }

  const hundeRow = createHundSearchField({
    kundenOptions,
    hundeOptions,
    selectedHundIds,
  });
  refs.hundIds = hundeRow.__ref;
  form.appendChild(hundeRow);

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
    let hundeById = new Map();
    let kundenById = new Map();
    try {
      const [hunde, kunden] = await Promise.all([listHunde(), listKunden()]);
      hundeById = new Map((Array.isArray(hunde) ? hunde : []).map((hund) => [hund.id, hund]));
      kundenById = new Map((Array.isArray(kunden) ? kunden : []).map((kunde) => [kunde.id, kunde]));
    } catch (error) {
      console.warn("[KURSE_WARN_LIST_PARTICIPANTS]", error);
    }
    container.innerHTML = "";
    if (!courses.length) {
      container.appendChild(createEmpty());
      return;
    }

    courses.forEach((course) => {
      const listItem = createCourseListItem(course, { hundeById, kundenById });
      if (listItem) container.appendChild(listItem);
    });
  } catch (error) {
    console.error("[KURSE_ERR_LIST_FETCH]", error);
    container.innerHTML = "";
    container.appendChild(createErrorNotice());
  }
}

function formatStatusLabel(status) {
  const normalized = (status || "").toLowerCase();
  switch (normalized) {
    case "offen":
      return "Offen";
    case "ausgebucht":
      return "Ausgebucht";
    case "abgesagt":
      return "Abgesagt";
    case "geplant":
    default:
      return "Geplant";
  }
}

function getStatusVariant(status) {
  const normalized = (status || "").toLowerCase();
  switch (normalized) {
    case "offen":
      return "ok";
    case "ausgebucht":
    case "abgesagt":
      return "warn";
    default:
      return "info";
  }
}

function renderDetailList(kurs) {
  const list = document.createElement("dl");
  list.className = "kurs-detail-list";
  [
    { term: "ID", value: kurs.id || "–" },
    { term: "Code", value: kurs.code || "–" },
    { term: "Trainer-ID", value: kurs.trainerId || "–" },
    { term: "Trainer", render: () => renderTrainerInline(kurs) },
    { term: "Erstellt am", value: formatDateTime(kurs.createdAt) },
    { term: "Kalender (Outlook)", value: formatOutlookMirror(kurs) },
    { term: "Ort", value: kurs.location || "–" },
    { term: "Status", value: formatStatusLabel(kurs.status) },
    {
      term: "Kapazität",
      value: `${kurs.bookedCount ?? 0} / ${kurs.capacity ?? 0}`,
    },
    { term: "Level", value: kurs.level || "–" },
    { term: "Preis", value: formatPrice(kurs.price) },
    { term: "Hunde (IDs)", value: formatIdList(kurs.hundIds) },
  ].forEach(({ term, value, render }) => {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    if (typeof render === "function") {
      const rendered = render();
      if (rendered) dd.appendChild(rendered);
    } else {
      dd.textContent = value;
    }
    list.append(dt, dd);
  });
  return list;
}

function createNotesContent(kurs) {
  const text = document.createElement("p");
  text.textContent = kurs.notes || "Keine Notizen vorhanden.";
  return text;
}

function formatOutlookMirror(kurs = {}) {
  const value = kurs.outlookStart || kurs.outlookDate || kurs.outlookTermin || "";
  if (!value) return "Wird aus Outlook gespiegelt.";
  return formatDateTime(value);
}

function buildCourseParticipantSummary(course = {}, { hundeById, kundenById } = {}) {
  const hundIds = Array.isArray(course.hundIds) ? course.hundIds : [];
  const hundNames = [];
  const kundenNames = [];
  const kundenSeen = new Set();

  hundIds.forEach((hundId) => {
    if (!hundeById || !hundeById.size) return;
    const hund = hundeById.get(hundId);
    if (!hund) return;
    const name = hund.name || hund.code || hund.hundeId || hund.id || "–";
    hundNames.push(name);
    if (kundenById && kundenById.size && hund.kundenId) {
      const kunde = kundenById.get(hund.kundenId);
      if (kunde) {
        const label = formatCustomerName(kunde);
        if (!kundenSeen.has(label)) {
          kundenSeen.add(label);
          kundenNames.push(label);
        }
      }
    }
  });

  return {
    hundeLabel: formatNameSummary(hundNames) || formatIdList(course.hundIds),
    kundenLabel: formatNameSummary(kundenNames) || "–",
  };
}

function formatNameSummary(list = []) {
  if (!Array.isArray(list) || !list.length) return "";
  const unique = Array.from(new Set(list.filter(Boolean)));
  if (!unique.length) return "";
  if (unique.length <= 2) return unique.join(", ");
  return `${unique.slice(0, 2).join(", ")} (+${unique.length - 2})`;
}

function createMetaContent(kurs) {
  const meta = document.createElement("p");
  meta.className = "kurs-detail-meta";
  meta.textContent = `Erstellt am ${formatDateTime(kurs.createdAt)} · Aktualisiert am ${formatDateTime(
    kurs.updatedAt
  )}`;
  return meta;
}

function buildTrainerCard(kurs = {}) {
  const buildNoticeCard = (message) => {
    const fallbackCardFragment = createCard({
      eyebrow: "Trainer",
      title: "Trainer",
      body: "",
      footer: "",
    });
    const fallbackCard =
      fallbackCardFragment.querySelector(".ui-card") || fallbackCardFragment.firstElementChild;
    if (!fallbackCard) return null;
    const body = fallbackCard.querySelector(".ui-card__body");
    if (body) {
      body.innerHTML = "";
      body.appendChild(
        createNotice(message, {
          variant: "warn",
          role: "alert",
        })
      );
    }
    const footer = fallbackCard.querySelector(".ui-card__footer");
    if (footer) footer.innerHTML = "";
    return fallbackCard;
  };

  if (!kurs.trainerId) {
    return buildNoticeCard("Kein Trainer zugewiesen. Bitte Kurs bearbeiten.");
  }
  if (!kurs.trainer) {
    return buildNoticeCard("Zugewiesener Trainer konnte nicht geladen werden.");
  }
  const trainerCard = createLinkedTrainerCard(kurs.trainer, {
    href: kurs.trainer.id ? `#/trainer/${kurs.trainer.id}` : "",
  });
  if (trainerCard) {
    trainerCard.classList.add("kurse-trainer-card");
    return trainerCard;
  }
  return buildNoticeCard("Trainerkarte konnte nicht dargestellt werden.");
}

function formatPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "–";
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatFinanceAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "CHF 0.00";
  return `CHF ${amount.toFixed(2)}`;
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

function formatIdList(value) {
  if (Array.isArray(value) && value.length) return value.join(", ");
  if (typeof value === "string" && value.trim()) return value;
  return "–";
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

function buildFormFields(
  existing = {},
  { defaultCode = "", trainerOptions = [], trainerNameValue = "" } = {}
) {
  const statusValue = existing?.status ?? "geplant";
  const levelValue = existing?.level ?? "";
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
        label: "Kurstitel",
        placeholder: "z. B. Welpentraining Kompakt",
        required: false,
      },
    },
    {
      name: "trainerName",
      value: trainerNameValue ?? existing?.trainerName ?? "",
      readOnly: true,
      config: {
        id: "kurs-trainer",
        label: "Trainer",
        placeholder: "Automatisch aus Auswahl",
        describedByText: "Trainer wird automatisch aus der Auswahl unten übernommen.",
        required: false,
      },
    },
    {
      name: "trainerId",
      value: existing?.trainerId ?? "",
      config: {
        id: "kurs-trainer-id",
        label: "Trainer-ID",
        control: "select",
        required: true,
        describedByText: "Trainer ist Pflichtfeld. Bitte ausw\u00e4hlen.",
        options: buildTrainerSelectOptions(trainerOptions, existing?.trainerId),
      },
    },
    {
      name: "date",
      value: existing?.date ?? "",
      config: {
        id: "kurs-date",
        label: "Datum",
        type: "date",
        required: false,
      },
    },
    {
      name: "startTime",
      value: existing?.startTime ?? "",
      config: {
        id: "kurs-start",
        label: "Beginn",
        type: "time",
        required: false,
      },
    },
    {
      name: "endTime",
      value: existing?.endTime ?? "",
      config: {
        id: "kurs-end",
        label: "Ende",
        type: "time",
        required: false,
      },
    },
    {
      name: "location",
      value: existing?.location ?? "",
      config: {
        id: "kurs-location",
        label: "Ort",
        placeholder: "Trainingsplatz oder Treffpunkt",
        required: false,
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
      name: "capacity",
      value: existing?.capacity?.toString() ?? "",
      config: {
        id: "kurs-capacity",
        label: "Kapazität",
        type: "number",
        required: false,
      },
      min: "1",
      step: "1",
    },
    {
      name: "bookedCount",
      value: existing?.bookedCount?.toString() ?? "",
      config: {
        id: "kurs-booked",
        label: "Anmeldungen",
        type: "number",
        required: false,
      },
      min: "0",
      step: "1",
    },
    {
      name: "level",
      config: {
        id: "kurs-level",
        label: "Niveau",
        control: "select",
        options: LEVEL_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
          selected: option.value === levelValue,
        })),
      },
    },
    {
      name: "price",
      value: existing?.price ? String(existing.price) : "",
      config: {
        id: "kurs-price",
        label: "Preis (CHF)",
        type: "number",
        placeholder: "z. B. 150",
      },
      min: "0",
      step: "0.05",
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
  ];
}

function ensureString(value, fallback = "") {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function ensureArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function createHundSearchField({
  kundenOptions = [],
  hundeOptions = [],
  selectedHundIds = [],
} = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "kurse-hunde-search";

  const searchRow = createFormRow({
    id: "kurs-hunde-search",
    label: "Teilnehmende Hunde",
    control: "input",
    type: "text",
    placeholder: "Kunde oder Hund eingeben ...",
    describedByText:
      "Tippe nach Kunde oder Hund. Links siehst du Kunden-Treffer (fügt deren Hunde hinzu), rechts Hund-Treffer. Auswahl kann leer bleiben.",
  });
  const searchInput = searchRow.querySelector("input");
  const hint = searchRow.querySelector(".ui-form-row__hint");
  wrapper.appendChild(searchRow);

  const hundMap = new Map(
    (Array.isArray(hundeOptions) ? hundeOptions : []).map((hund) => [hund.id, hund])
  );
  const getKundeById = (id) =>
    (Array.isArray(kundenOptions) ? kundenOptions : []).find((kunde) => kunde.id === id);
  const formatOwnerWithTown = (kunde) => {
    if (!kunde) return "Besitzer unbekannt";
    const town = formatCustomerTown(kunde);
    const townPart = town ? ` · ${town}` : "";
    return `${getCustomerDisplayCode(kunde)} · ${formatCustomerName(kunde)}${townPart}`;
  };
  const selectedIds = new Set(
    (Array.isArray(selectedHundIds) ? selectedHundIds.filter(Boolean) : []).filter((id) =>
      hundMap.has(id)
    )
  );

  const selectionInfo = document.createElement("div");
  selectionInfo.className = "kurse-hunde-search__selection";
  wrapper.appendChild(selectionInfo);

  const results = document.createElement("div");
  results.className = "kurse-hunde-search__results";
  wrapper.appendChild(results);

  const kundenCol = document.createElement("div");
  kundenCol.className = "kurse-hunde-search__col";
  const kundenTitle = document.createElement("h3");
  kundenTitle.textContent = "Kunden";
  kundenCol.appendChild(kundenTitle);
  const kundenList = document.createElement("div");
  kundenList.className = "kurse-hunde-search__list";
  kundenCol.appendChild(kundenList);

  const hundeCol = document.createElement("div");
  hundeCol.className = "kurse-hunde-search__col";
  const hundeTitle = document.createElement("h3");
  hundeTitle.textContent = "Hunde";
  hundeCol.appendChild(hundeTitle);
  const hundeList = document.createElement("div");
  hundeList.className = "kurse-hunde-search__list";
  hundeCol.appendChild(hundeList);

  results.append(kundenCol, hundeCol);

  const clearBtn = createButton({
    label: "Auswahl leeren",
    variant: "secondary",
  });
  clearBtn.type = "button";
  clearBtn.classList.add("kurse-hunde-search__clear");
  clearBtn.addEventListener("click", () => {
    selectedIds.clear();
    updateSelection();
  });
  wrapper.appendChild(clearBtn);

  const addHund = (hundId) => {
    if (!hundId || !hundMap.has(hundId)) return;
    selectedIds.add(hundId);
    updateSelection();
  };

  const removeHund = (hundId) => {
    selectedIds.delete(hundId);
    updateSelection();
  };

  const addCustomerDogs = (kundeId) => {
    const dogs = (Array.isArray(hundeOptions) ? hundeOptions : []).filter(
      (hund) => hund.kundenId === kundeId
    );
    if (!dogs.length) return;
    dogs.forEach((hund) => addHund(hund.id));
  };

  const renderList = (target, items, clickHandler, emptyText) => {
    target.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("p");
      empty.textContent = emptyText;
      target.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "kurse-hunde-search__option";
      button.textContent = item.label;
      if (item.sublabel) {
        const sub = document.createElement("span");
        sub.className = "kurse-hunde-search__sublabel";
        sub.textContent = item.sublabel;
        button.appendChild(sub);
      }
      button.addEventListener("click", () => clickHandler(item));
      target.appendChild(button);
    });
  };

  const filterOptions = (term) => {
    const t = term.trim().toLowerCase();
    if (!t) return { kunden: [], hunde: [] };
    const kundenMatches = (Array.isArray(kundenOptions) ? kundenOptions : []).filter((kunde) =>
      [kunde.vorname, kunde.nachname, kunde.email, kunde.code, kunde.kundenCode]
        .map((v) => (v || "").toLowerCase())
        .some((value) => value.includes(t))
    );
    const hundeMatches = (Array.isArray(hundeOptions) ? hundeOptions : []).filter((hund) =>
      [hund.name, hund.rufname, hund.code, hund.rasse, hund.kundenId]
        .map((v) => (v || "").toLowerCase())
        .some((value) => value.includes(t))
    );

    // Add owners for matched dogs
    const kundenById = new Map(
      (Array.isArray(kundenOptions) ? kundenOptions : []).map((k) => [k.id, k])
    );
    const kundenByHunde = new Map(kundenMatches.map((kunde) => [kunde.id, kunde]));
    hundeMatches.forEach((hund) => {
      const owner = kundenById.get(hund.kundenId);
      if (owner && !kundenByHunde.has(owner.id)) {
        kundenByHunde.set(owner.id, owner);
      }
    });

    // Add dogs for matched customers
    const kundenIds = new Set(kundenMatches.map((kunde) => kunde.id));
    kundenIds.forEach((kundeId) => {
      const dogs = (Array.isArray(hundeOptions) ? hundeOptions : []).filter(
        (hund) => hund.kundenId === kundeId
      );
      dogs.forEach((hund) => {
        if (!hundeMatches.includes(hund)) {
          hundeMatches.push(hund);
        }
      });
    });

    return {
      kunden: Array.from(kundenByHunde.values()),
      hunde: hundeMatches,
    };
  };

  const updateSelection = () => {
    selectionInfo.innerHTML = "";
    if (!selectedIds.size) {
      const empty = document.createElement("p");
      empty.textContent = "Keine Hunde ausgewählt.";
      selectionInfo.appendChild(empty);
    } else {
      const list = document.createElement("div");
      list.className = "kurse-hunde-selected";
      selectedIds.forEach((id) => {
        const hund = hundMap.get(id);
        const owner = getKundeById(hund?.kundenId);
        const ownerLabel = formatOwnerWithTown(owner);
        const label = hund ? `${hund.code || id} · ${hund.name || "Hund"} · ${ownerLabel}` : id;
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "kurse-hunde-chip";
        chip.textContent = label;
        chip.addEventListener("click", () => removeHund(id));
        list.appendChild(chip);
      });
      selectionInfo.appendChild(list);
    }
  };

  const updateResults = () => {
    const kundenById = new Map(
      (Array.isArray(kundenOptions) ? kundenOptions : []).map((kunde) => [kunde.id, kunde])
    );
    const { kunden, hunde } = filterOptions(searchInput.value || "");
    renderList(
      kundenList,
      kunden.map((kunde) => ({
        id: kunde.id,
        label: `${kunde.code || kunde.kundenCode || kunde.id} · ${formatCustomerName(kunde)}`,
        sublabel: kunde.email || "",
      })),
      (item) => addCustomerDogs(item.id),
      "Keine Kunden gefunden."
    );
    renderList(
      hundeList,
      hunde.map((hund) => ({
        id: hund.id,
        label: `${hund.code || hund.id} · ${hund.name || "Hund"}`,
        sublabel: formatOwnerWithTown(kundenById.get(hund.kundenId)),
      })),
      (item) => addHund(item.id),
      "Keine Hunde gefunden."
    );
  };

  searchInput.addEventListener("input", updateResults);
  updateSelection();
  updateResults();

  wrapper.__ref = {
    getValue: () => Array.from(selectedIds),
    inputs: [searchInput],
    hint,
  };
  return wrapper;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function validate(values = {}, { trainers = [] } = {}) {
  const safeValues = { ...values };
  safeValues.kursCode = ensureString(values.kursCode).trim();
  safeValues.hundIds = ensureArray(values.hundIds);
  const errors = {};
  const trainerId = ensureString(values.trainerId).trim();
  const trainerIds = Array.isArray(trainers) ? trainers.map((trainer) => trainer.id) : [];
  if (!trainerId) {
    errors.trainerId = "Bitte Trainer auswählen.";
  } else if (trainerIds.length && !trainerIds.includes(trainerId)) {
    errors.trainerId = "Ausgewählter Trainer ist ungültig.";
  }
  safeValues.trainerId = trainerId;
  safeValues.trainerName = ensureString(values.trainerName, "");
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
  return {
    code: ensureString(values.kursCode, ""),
    title: ensureString(values.title, ""),
    trainerName: trainer?.name || ensureString(values.trainerName, ""),
    trainerId: ensureString(values.trainerId, ""),
    date: ensureString(values.date, ""),
    startTime: ensureString(values.startTime, ""),
    endTime: ensureString(values.endTime, ""),
    location: ensureString(values.location, ""),
    status: ensureString(values.status, ""),
    capacity: toNumber(values.capacity, 0),
    bookedCount: toNumber(values.bookedCount, 0),
    level: ensureString(values.level, ""),
    price: toNumber(values.price, 0),
    notes: ensureString(values.notes, ""),
    hundIds: ensureArray(values.hundIds),
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
