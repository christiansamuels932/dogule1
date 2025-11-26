// Kurse module – list/detail flows with mock API
/* globals document, console, window */
import {
  createBadge,
  createButton,
  createCard,
  createEmptyState,
  createFormRow,
  createNotice,
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
  getKunde,
  listKunden,
  listFinanzenByKundeId,
  listFinanzen,
} from "../shared/api/index.js";
import { runIntegrityCheck } from "../shared/api/db/integrityCheck.js";

let kursCache = [];
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

    const subtitleText = kurs.title || "Ohne Titel";
    if (headerSubtitle) {
      headerSubtitle.textContent = subtitleText;
      headerSubtitle.hidden = !subtitleText;
    }
    overviewCard.setEyebrow(formatStatusLabel(kurs.status));
    overviewCard.setTitle(kurs.title || "Ohne Titel");
    overviewCard.clearBody();
    overviewCard.body.appendChild(renderDetailList(kurs));
    const { linkedHunde, linkedKunden, hundeError, kundenError } =
      await collectLinkedParticipants(kurs);
    const kundenFinanzen = await buildKursKundenFinanzen(linkedKunden, linkedHunde);
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

    appendLinkedSections(section, {
      linkedHunde,
      linkedKunden,
      hundeError,
      kundenError,
    });
    appendFinanceSections(section, kundenFinanzen);
  } catch (error) {
    console.error("[KURSE_ERR_DETAIL]", error);
    overviewCard.clearBody();
    overviewCard.body.appendChild(createErrorNotice());
    overviewCard.clearFooter();
  }

  focusHeading(section);
}

async function collectLinkedParticipants(kurs = {}) {
  const hundIds = Array.isArray(kurs.hundIds) ? kurs.hundIds.filter(Boolean) : [];
  const kundenIds = Array.isArray(kurs.kundenIds) ? kurs.kundenIds.filter(Boolean) : [];
  const result = {
    linkedHunde: [],
    linkedKunden: [],
    hundeError: false,
    kundenError: false,
  };
  if (hundIds.length) {
    try {
      const hunde = await listHunde();
      result.linkedHunde = hunde.filter((hund) => hundIds.includes(hund.id));
    } catch (error) {
      console.error("[KURSE_ERR_LINKED_HUNDE]", error);
      result.hundeError = true;
      result.linkedHunde = [];
    }
  }

  try {
    const kunden = await listKunden();
    const seen = new Set();
    const candidates = [];
    const addKunde = (kundeId) => {
      const id = kundeId || "";
      if (!id || seen.has(id)) return;
      seen.add(id);
      const kunde = kunden.find((entry) => entry.id === id);
      if (kunde) {
        candidates.push(kunde);
      } else {
        candidates.push({ id, code: id, vorname: "", nachname: "" });
      }
    };
    result.linkedHunde.forEach((hund) => addKunde(hund.kundenId));
    kundenIds.forEach((kundenId) => addKunde(kundenId));
    result.linkedKunden = candidates;
  } catch (error) {
    console.error("[KURSE_ERR_LINKED_KUNDEN]", error);
    result.kundenError = true;
    result.linkedKunden = [];
  }
  return result;
}
function appendLinkedSections(
  section,
  { linkedHunde = [], linkedKunden = [], hundeError = false, kundenError = false } = {}
) {
  const hundeSection = document.createElement("section");
  hundeSection.className = "kurse-linked-section";
  hundeSection.appendChild(
    createSectionHeader({
      title: "Hunde im Kurs",
      subtitle: "",
      level: 2,
    })
  );
  const hundeCardFragment = createCard({
    eyebrow: "",
    title: "",
    body: "",
    footer: "",
  });
  const hundeCard =
    hundeCardFragment.querySelector(".ui-card") || hundeCardFragment.firstElementChild;
  if (hundeCard) {
    const body = hundeCard.querySelector(".ui-card__body");
    if (body) {
      body.innerHTML = "";
      if (hundeError) {
        body.appendChild(createErrorNotice());
      } else if (!linkedHunde.length) {
        body.appendChild(createEmpty());
      } else {
        linkedHunde.forEach((hund) => {
          const cardFragment = createCard({
            eyebrow: hund.rasse || "",
            title: hund.name || "Unbenannter Hund",
            body: `<p>Rufname: ${hund.rufname || "–"}</p>`,
            footer: "",
          });
          const cardEl = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
          if (!cardEl) return;
          cardEl.classList.add("kurse-linked-hund");
          const link = document.createElement("a");
          link.href = `#/hunde/${hund.id}`;
          link.className = "kurse-linked-hund__link";
          link.appendChild(cardEl);
          body.appendChild(link);
        });
      }
    }
    hundeSection.appendChild(hundeCard);
  }
  section.appendChild(hundeSection);

  const kundenSection = document.createElement("section");
  kundenSection.className = "kurse-linked-section";
  kundenSection.appendChild(
    createSectionHeader({
      title: "Kunden im Kurs",
      subtitle: "",
      level: 2,
    })
  );
  const kundenCardFragment = createCard({
    eyebrow: "",
    title: "",
    body: "",
    footer: "",
  });
  const kundenCard =
    kundenCardFragment.querySelector(".ui-card") || kundenCardFragment.firstElementChild;
  if (kundenCard) {
    const body = kundenCard.querySelector(".ui-card__body");
    if (body) {
      body.innerHTML = "";
      if (kundenError) {
        body.appendChild(createErrorNotice());
      } else if (!linkedKunden.length) {
        body.appendChild(createEmpty());
      } else {
        linkedKunden.forEach((kunde) => {
          const displayCode = getCustomerDisplayCode(kunde);
          const cardFragment = createCard({
            eyebrow: displayCode,
            title: formatCustomerName(kunde),
            body: "",
            footer: "",
          });
          const cardEl = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
          if (!cardEl) return;
          cardEl.classList.add("kurse-linked-kunde");
          const cardBody = cardEl.querySelector(".ui-card__body");
          if (cardBody) {
            cardBody.innerHTML = "";
            const meta = document.createElement("div");
            meta.className = "kurse-linked-kunde__meta";
            const idRow = document.createElement("p");
            idRow.textContent = `ID: ${kunde.id || "–"}`;
            const phoneRow = document.createElement("p");
            phoneRow.textContent = `Telefon: ${kunde.telefon || "–"}`;
            meta.append(idRow, phoneRow);
            cardBody.appendChild(meta);
          }
          const link = document.createElement("a");
          link.href = kunde.id ? `#/kunden/${kunde.id}` : "#/kunden";
          link.className = "kurse-linked-kunde__link";
          link.appendChild(cardEl);
          body.appendChild(link);
        });
      }
    }
    kundenSection.appendChild(kundenCard);
  }
  section.appendChild(kundenSection);
}

const KURSE_FINANCE_SECTION_TITLES = ["Finanzübersicht", "Offene Beträge", "Zahlungshistorie"];

async function buildKursKundenFinanzen(linkedKunden = [], linkedHunde = []) {
  const seen = new Set();
  const candidates = [];
  const kundenList = Array.isArray(linkedKunden) ? linkedKunden : [];
  kundenList.forEach((kunde) => {
    const id = kunde?.id;
    if (!id || seen.has(id)) return;
    seen.add(id);
    candidates.push(kunde);
  });
  (Array.isArray(linkedHunde) ? linkedHunde : []).forEach((hund) => {
    const kundeId = hund?.kundenId;
    if (!kundeId || seen.has(kundeId)) return;
    seen.add(kundeId);
    candidates.push({ id: kundeId });
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
    const infoRow = createFinanceRow(
      `Kunde ${entry.kundeId}`,
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
        eintrag: offen,
      });
    });
  });
  if (!offeneEntries.length) {
    container.appendChild(createEmpty());
    return true;
  }
  offeneEntries.forEach(({ kundeId, eintrag }) => {
    const infoRow = createFinanceRow(
      `Kunde ${kundeId}`,
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
      zahlungen.push({ kundeId: entry.kundeId, eintrag: zahlung });
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
  zahlungen.forEach(({ kundeId, eintrag }) => {
    const infoRow = createFinanceRow(
      `Kunde ${kundeId}`,
      `Zahlung: ${formatFinanceAmount(eintrag.betrag)} · Datum: ${formatDateTime(eintrag.datum)}`
    );
    container.appendChild(infoRow);
  });
  return true;
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
  const name = `${kunde.vorname ?? ""} ${kunde.nachname ?? ""}`.trim();
  return name || kunde.email || "Unbenannter Kunde";
}

function getCustomerDisplayCode(kunde = {}) {
  return kunde.code || kunde.kundenCode || kunde.id || "–";
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
    [
      { label: "ID", value: course.id },
      { label: "Trainer-ID", value: course.trainerId || "–" },
      { label: "Datum", value: formatDate(course.date) },
      { label: "Zeit", value: formatTimeRange(course.startTime, course.endTime) },
      { label: "Trainer", value: course.trainerName || "Noch nicht zugewiesen" },
      {
        label: "Kapazität",
        value: `${course.bookedCount ?? 0} / ${course.capacity ?? 0}`,
      },
      { label: "Ort", value: course.location || "Noch offen" },
      { label: "Kunden", value: formatIdList(course.kundenIds) },
      { label: "Hunde", value: formatIdList(course.hundIds) },
    ].forEach(({ label, value }) => {
      const item = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = `${label}: `;
      const span = document.createElement("span");
      span.textContent = value;
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
  const trainerOptions = buildTrainerOptions(kursCache, existing);
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
  let isCodeOverrideEnabled = false;
  const fields = buildFormFields(existing, {
    defaultCode: kursCodeValue,
    trainerOptions,
    hundeOptions,
    kundenOptions,
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

  const actions = document.createElement("div");
  actions.className = "kurse-form-actions";
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
  };

  form.addEventListener("submit", (event) => handleKursFormSubmit(event, submitContext));

  focusHeading(section);
}

async function fetchKurse() {
  try {
    kursCache = await listKurse();
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
  body.appendChild(createNavLink("Neuer Kurs", "#/kurse/new", "primary"));
  body.appendChild(
    createButton({
      label: "Plan exportieren",
      variant: "secondary",
    })
  );

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

    courses.forEach((course) => {
      const listItem = createCourseListItem(course);
      if (listItem) container.appendChild(listItem);
    });
  } catch (error) {
    console.error("[KURSE_ERR_LIST_FETCH]", error);
    container.innerHTML = "";
    container.appendChild(createErrorNotice());
  }
}

function formatDate(value) {
  if (!value) return "Datum folgt";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-CH", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeRange(start, end) {
  const safeStart = start || "00:00";
  const safeEnd = end || "00:00";
  return `${safeStart} – ${safeEnd}`;
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
    { term: "Trainer", value: kurs.trainerName || "–" },
    { term: "Datum", value: formatDate(kurs.date) },
    { term: "Zeit", value: formatTimeRange(kurs.startTime, kurs.endTime) },
    { term: "Ort", value: kurs.location || "–" },
    { term: "Status", value: formatStatusLabel(kurs.status) },
    {
      term: "Kapazität",
      value: `${kurs.bookedCount ?? 0} / ${kurs.capacity ?? 0}`,
    },
    { term: "Level", value: kurs.level || "–" },
    { term: "Preis", value: formatPrice(kurs.price) },
    { term: "Kunden (IDs)", value: formatIdList(kurs.kundenIds) },
    { term: "Hunde (IDs)", value: formatIdList(kurs.hundIds) },
  ].forEach(({ term, value }) => {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = value;
    list.append(dt, dd);
  });
  return list;
}

function createNotesContent(kurs) {
  const text = document.createElement("p");
  text.textContent = kurs.notes || "Keine Notizen vorhanden.";
  return text;
}

function createMetaContent(kurs) {
  const meta = document.createElement("p");
  meta.className = "kurs-detail-meta";
  meta.textContent = `Erstellt am ${formatDateTime(kurs.createdAt)} · Aktualisiert am ${formatDateTime(
    kurs.updatedAt
  )}`;
  return meta;
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

function buildTrainerOptions(kurse = [], existing = {}) {
  const map = new Map();
  kurse.forEach((kurs) => {
    if (!kurs.trainerId) return;
    if (map.has(kurs.trainerId)) return;
    map.set(kurs.trainerId, kurs.trainerName || `Trainer ${kurs.trainerId}`);
  });
  if (existing?.trainerId && !map.has(existing.trainerId)) {
    map.set(existing.trainerId, existing.trainerName || `Trainer ${existing.trainerId}`);
  }
  if (!map.size) {
    map.set("", "Bitte wählen");
  }
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
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

function buildOptions(selectEl, items = [], selectedValues = [], kind = "") {
  if (!selectEl) return;
  const selectedSet = new Set(Array.isArray(selectedValues) ? selectedValues : []);
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent =
      kind === "kunden" ? "Keine Kunden" : kind === "hunde" ? "Keine Hunde" : "Keine Einträge";
    selectEl.appendChild(option);
    return;
  }
  list.forEach((item) => {
    const option = document.createElement("option");
    const id = item.id || "";
    option.value = id;
    if (kind === "kunden") {
      option.textContent = `${item.kundenCode || item.code || id} · ${formatCustomerName(item)}`;
    } else if (kind === "hunde") {
      option.textContent = `${item.code || id} · ${item.name || "Hund"}`;
    } else {
      option.textContent = id || "Eintrag";
    }
    option.selected = selectedSet.has(id);
    selectEl.appendChild(option);
  });
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
  { defaultCode = "", trainerOptions = [], hundeOptions = [], kundenOptions = [] } = {}
) {
  const statusValue = existing?.status ?? "geplant";
  const levelValue = existing?.level ?? "";
  const selectedHundIds = Array.isArray(existing?.hundIds) ? existing.hundIds : [];
  const selectedKundenIds = Array.isArray(existing?.kundenIds) ? existing.kundenIds : [];
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
      value: existing?.trainerName ?? "",
      config: {
        id: "kurs-trainer",
        label: "Trainer",
        placeholder: "z. B. Martina Frei",
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
        required: false,
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
      name: "kundenIds",
      value: selectedKundenIds,
      readOnly: true,
      multiple: true,
      setValue(input) {
        input.multiple = true;
        input.disabled = true;
        buildOptions(input, kundenOptions, selectedKundenIds, "kunden");
      },
      config: {
        id: "kurs-kunden",
        label: "Kunden (lesend)",
        control: "select",
        describedByText: "Phase A: Auswahl ist schreibgeschützt.",
      },
    },
    {
      name: "hundIds",
      value: selectedHundIds,
      readOnly: true,
      multiple: true,
      setValue(input) {
        input.multiple = true;
        input.disabled = true;
        buildOptions(input, hundeOptions, selectedHundIds, "hunde");
      },
      config: {
        id: "kurs-hunde",
        label: "Hunde (lesend)",
        control: "select",
        describedByText: "Phase A: Auswahl ist schreibgeschützt.",
      },
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

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function collectFormValues(refs) {
  const values = {};
  Object.entries(refs).forEach(([key, ref]) => {
    const raw = ref.input.value;
    if (ref.input.multiple) {
      values[key] = Array.from(ref.input.selectedOptions || []).map((opt) => opt.value);
    } else {
      values[key] = typeof raw === "string" ? raw.trim() : raw;
    }
  });
  return values;
}

function validate(values = {}) {
  const safeValues = { ...values };
  safeValues.kursCode = ensureString(values.kursCode).trim();
  safeValues.kundenIds = ensureArray(values.kundenIds);
  safeValues.hundIds = ensureArray(values.hundIds);
  if (!safeValues.kursCode) {
    safeValues.kursCode = generateNextKursCode(kursCache);
  }
  return { errors: {}, values: safeValues };
}

function applyErrors(refs, errors) {
  Object.entries(refs).forEach(([key, ref]) => {
    const hint = ref.hint;
    const input = ref.input;
    if (errors[key]) {
      hint.textContent = errors[key];
      hint.classList.remove("sr-only");
      input.setAttribute("aria-invalid", "true");
    } else {
      hint.textContent = "";
      hint.classList.add("sr-only");
      input.setAttribute("aria-invalid", "false");
    }
  });
}

function buildPayload(values) {
  return {
    code: ensureString(values.kursCode, ""),
    title: ensureString(values.title, ""),
    trainerName: ensureString(values.trainerName, ""),
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
    kundenIds: ensureArray(values.kundenIds),
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

async function handleKursFormSubmit(event, { mode, id, refs, section, submit }) {
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
  const { errors, values: safeValues } = validate(values);
  applyErrors(refs, errors);
  if (Object.keys(errors).length) {
    const firstError = Object.values(refs).find((ref) => !ref.hint.classList.contains("sr-only"));
    firstError?.input.focus();
    return;
  }

  const payload = buildPayload(safeValues);
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
    if (mode === "create") {
      setToast("Kurs wurde erstellt.", "success");
    } else {
      setToast("Kurs wurde aktualisiert.", "success");
    }
    window.location.hash = `#/kurse/${createdId}`;
  } catch (error) {
    const isResultError = error?.code === "FORM_RESULT_EMPTY";
    console.error(isResultError ? "[KURSE_ERR_FORM_RESULT]" : "[KURSE_ERR_FORM_SUBMIT]", error);
    const message = isResultError
      ? "Kurs konnte nach dem Speichern nicht geladen werden."
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
    const hasParticipants =
      (Array.isArray(kursRecord.hundIds) && kursRecord.hundIds.length > 0) ||
      (Array.isArray(kursRecord.kundenIds) && kursRecord.kundenIds.length > 0);
    const hasFinanzen =
      Array.isArray(finanzen) && finanzen.some((entry) => entry?.kursId === kursRecord.id);
    if (hasParticipants || hasFinanzen) {
      const reasons = [];
      if (hasParticipants) reasons.push("Teilnehmer (Hunde/Kunden) sind zugeordnet.");
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

function createNavLink(label, href, variant = "primary") {
  const link = document.createElement("a");
  link.href = href;
  link.className = `ui-btn ui-btn--${variant}`;
  link.textContent = label;
  return link;
}
