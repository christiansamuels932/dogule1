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
} from "../shared/api/index.js";

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
    section.appendChild(
      createSectionHeader({
        title: "Kurse",
        subtitle: "Fehler beim Laden",
        level: 2,
      })
    );
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
  section.appendChild(
    createSectionHeader({
      title: "Kurse",
      subtitle: "Planung und Übersicht",
      level: 2,
    })
  );

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
  const listCard = buildCourseListCard();
  if (listCard) {
    section.appendChild(listCard);
    await populateCourses(listCard);
  }
  focusHeading(section);
}

async function renderDetail(section, id) {
  if (!section) return;
  section.innerHTML = "";
  scrollToTop();
  const headerFragment = createSectionHeader({
    title: "Kurs",
    subtitle: "",
    level: 2,
  });
  const headerSubtitle = headerFragment.querySelector(".ui-section__subtitle");
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
    const linkedHunde = await collectLinkedHunde(kurs);
    const kundenFinanzen = await buildKursKundenFinanzen(linkedHunde);
    const linkedKunden = await collectLinkedKunden(linkedHunde);
    section.__kursFinanzen = kundenFinanzen;

    overviewCard.clearFooter();
    const editLink = createNavLink("Kurs bearbeiten", `#/kurse/${kurs.id}/edit`, "primary");
    const deleteBtn = createButton({
      label: "Kurs löschen",
      variant: "secondary",
    });
    deleteBtn.addEventListener("click", () => handleDeleteKurs(section, kurs.id, deleteBtn));
    overviewCard.footer.append(
      editLink,
      deleteBtn,
      createNavLink("Zurück zur Übersicht", "#/kurse", "quiet")
    );

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

    appendLinkedSections(section, linkedHunde, linkedKunden);
    appendFinanceSections(section, kundenFinanzen);
  } catch (error) {
    console.error("[KURSE_ERR_DETAIL]", error);
    overviewCard.clearBody();
    overviewCard.body.appendChild(createErrorNotice());
    overviewCard.clearFooter();
  }

  focusHeading(section);
}

async function collectLinkedHunde(kurs) {
  const ids = Array.isArray(kurs.hundIds) ? kurs.hundIds : [];
  if (!ids.length) return [];
  try {
    const hunde = await listHunde();
    return hunde.filter((hund) => ids.includes(hund.id));
  } catch (error) {
    console.error("[KURSE_ERR_LINKED_HUNDE]", error);
    return [];
  }
}

async function collectLinkedKunden(hunde) {
  if (!hunde.length) return [];
  try {
    const kunden = await listKunden();
    const seen = new Set();
    const result = [];
    hunde.forEach((hund) => {
      if (!hund.kundenId) return;
      if (seen.has(hund.kundenId)) return;
      const kunde = kunden.find((entry) => entry.id === hund.kundenId);
      if (kunde) {
        seen.add(kunde.id);
        result.push(kunde);
      }
    });
    return result;
  } catch (error) {
    console.error("[KURSE_ERR_LINKED_KUNDEN]", error);
    return [];
  }
}
function appendLinkedSections(section, linkedHunde, linkedKunden) {
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
      if (!linkedHunde.length) {
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
      title: "Kunden der Hunde im Kurs",
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
      if (!linkedKunden.length) {
        body.appendChild(createEmpty());
      } else {
        linkedKunden.forEach((kunde) => {
          const cardFragment = createCard({
            eyebrow: kunde.email || "",
            title: formatCustomerName(kunde),
            body: `<p>Telefon: ${kunde.telefon || "–"}</p>`,
            footer: "",
          });
          const cardEl = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
          if (!cardEl) return;
          cardEl.classList.add("kurse-linked-kunde");
          const link = document.createElement("a");
          link.href = `#/kunden/${kunde.id}`;
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

async function buildKursKundenFinanzen(linkedHunde = []) {
  if (!Array.isArray(linkedHunde) || !linkedHunde.length) return [];
  const financeResults = [];
  const seen = new Set();
  for (const hund of linkedHunde) {
    const kundeId = hund?.kundenId;
    if (!kundeId || seen.has(kundeId)) continue;
    seen.add(kundeId);
    let kunde = null;
    try {
      kunde = await getKunde(kundeId);
    } catch (error) {
      console.error("[KURSE_ERR_FINANZ_KUNDE]", error);
    }
    if (!kunde) continue;
    let finanzen = [];
    try {
      finanzen = await listFinanzenByKundeId(kunde.id);
    } catch (finanzenError) {
      console.error("[KURSE_ERR_FINANZ_FETCH]", finanzenError);
    }
    const zahlungen = finanzen.filter((entry) => entry.typ === "zahlung");
    const offeneBetraege = finanzen.filter((entry) => entry.typ === "offen");
    const lastZahlung = zahlungen.length ? zahlungen[zahlungen.length - 1] : null;
    financeResults.push({
      kundeId: kunde.id,
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
  section.appendChild(
    createSectionHeader({
      title: mode === "create" ? "Kurs erstellen" : "Kurs bearbeiten",
      subtitle: mode === "create" ? "Lege einen neuen Kurs an." : "Passe die Kursdaten an.",
      level: 2,
    })
  );
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

  const formCardFragment = createCard({
    eyebrow: "",
    title: mode === "create" ? "Angaben zum Kurs" : existing?.title || "Angaben zum Kurs",
    body: "",
    footer: "",
  });
  const formCard = formCardFragment.querySelector(".ui-card") || formCardFragment.firstElementChild;
  if (!formCard) return;
  section.appendChild(formCard);

  const form = document.createElement("form");
  form.noValidate = true;
  form.dataset.kursForm = "true";
  const body = formCard.querySelector(".ui-card__body");
  body.appendChild(form);

  const fields = buildFormFields(existing);
  const refs = {};
  fields.forEach((field) => {
    const row = createFormRow(field.config);
    const input = row.querySelector("input, select, textarea");
    input.name = field.name;
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
    hint.classList.add("sr-only");
    refs[field.name] = { input, hint };
    form.appendChild(row);
  });

  const actions = document.createElement("div");
  actions.className = "kurse-form-actions";
  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "ui-btn ui-btn--primary";
  submit.textContent = mode === "create" ? "Erstellen" : "Speichern";
  const cancel = document.createElement("a");
  cancel.className = "ui-btn ui-btn--quiet";
  cancel.href = mode === "create" ? "#/kurse" : `#/kurse/${id}`;
  cancel.textContent = "Abbrechen";
  actions.append(submit, cancel);
  formCard.querySelector(".ui-card__footer").appendChild(actions);

  const submitContext = {
    mode,
    id,
    refs,
    section,
    submit,
  };
  const kursFormSubmitHandler = (event) => handleKursFormSubmit(event, submitContext);

  form.addEventListener("submit", kursFormSubmitHandler);
  submit.addEventListener("click", (event) => {
    event.preventDefault();
    kursFormSubmitHandler(event);
  });

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

function buildCourseListCard() {
  const cardFragment = createCard({
    eyebrow: "",
    title: "Kursübersicht",
    body: "",
    footer: "",
  });
  const cardElement = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!cardElement) return document.createDocumentFragment();
  const body = cardElement.querySelector(".ui-card__body");
  body.textContent = "Kurse werden geladen ...";
  return cardElement;
}

async function populateCourses(cardElement) {
  const body = cardElement.querySelector(".ui-card__body");
  body.textContent = "Kurse werden geladen ...";
  try {
    const courses = await fetchKurse();
    body.innerHTML = "";
    if (!courses.length) {
      body.appendChild(createEmpty());
      return;
    }

    courses.forEach((course) => {
      const courseCard = createCard({
        eyebrow: formatDate(course.date),
        title: course.title || "Ohne Titel",
        body: "",
        footer: "",
      });
      const cardEl = courseCard.querySelector(".ui-card") || courseCard.firstElementChild;
      if (!cardEl) return;
      const cardBody = cardEl.querySelector(".ui-card__body");
      const infoList = document.createElement("ul");
      infoList.className = "kurs-info-list";
      [
        { label: "Zeit", value: formatTimeRange(course.startTime, course.endTime) },
        { label: "Trainer", value: course.trainerName || "Noch nicht zugewiesen" },
        {
          label: "Kapazität",
          value: `${course.bookedCount ?? 0} / ${course.capacity ?? 0}`,
        },
        { label: "Ort", value: course.location || "Noch offen" },
      ].forEach(({ label, value }) => {
        const item = document.createElement("li");
        item.innerHTML = `<strong>${label}:</strong> ${value}`;
        infoList.appendChild(item);
      });
      cardBody.appendChild(infoList);

      const footer = cardEl.querySelector(".ui-card__footer");
      const statusBadge = createBadge(
        formatStatusLabel(course.status),
        getStatusVariant(course.status)
      );
      footer.appendChild(statusBadge);
      footer.appendChild(createBadge(`${course.level || "Alltag"}`, "default"));

      const linkedCard = attachCourseNavigation(cardEl, course.id);
      body.appendChild(linkedCard);
    });
  } catch (error) {
    console.error("[KURSE_ERR_LIST_FETCH]", error);
    body.innerHTML = "";
    body.appendChild(createErrorNotice());
  }
}

function attachCourseNavigation(cardEl, id) {
  if (!cardEl) return cardEl;
  const link = document.createElement("a");
  link.href = `#/kurse/${id}`;
  link.className = "kurse-list__link";
  link.appendChild(cardEl);
  return link;
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

function formatDateTime(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleString("de-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function buildFormFields(existing = {}) {
  const statusValue = existing?.status ?? "geplant";
  const levelValue = existing?.level ?? "";
  return [
    {
      name: "title",
      value: existing?.title ?? "",
      config: {
        id: "kurs-title",
        label: "Kurstitel*",
        placeholder: "z. B. Welpentraining Kompakt",
        required: true,
      },
    },
    {
      name: "trainerName",
      value: existing?.trainerName ?? "",
      config: {
        id: "kurs-trainer",
        label: "Trainer*",
        placeholder: "z. B. Martina Frei",
        required: true,
      },
    },
    {
      name: "date",
      value: existing?.date ?? "",
      config: {
        id: "kurs-date",
        label: "Datum*",
        type: "date",
        required: true,
      },
    },
    {
      name: "startTime",
      value: existing?.startTime ?? "",
      config: {
        id: "kurs-start",
        label: "Beginn*",
        type: "time",
        required: true,
      },
    },
    {
      name: "endTime",
      value: existing?.endTime ?? "",
      config: {
        id: "kurs-end",
        label: "Ende*",
        type: "time",
        required: true,
      },
    },
    {
      name: "location",
      value: existing?.location ?? "",
      config: {
        id: "kurs-location",
        label: "Ort*",
        placeholder: "Trainingsplatz oder Treffpunkt",
        required: true,
      },
    },
    {
      name: "status",
      config: {
        id: "kurs-status",
        label: "Status*",
        control: "select",
        required: true,
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
        label: "Kapazität*",
        type: "number",
        required: true,
      },
      min: "1",
      step: "1",
    },
    {
      name: "bookedCount",
      value: existing?.bookedCount?.toString() ?? "",
      config: {
        id: "kurs-booked",
        label: "Anmeldungen*",
        type: "number",
        required: true,
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

function collectFormValues(refs) {
  const values = {};
  Object.entries(refs).forEach(([key, ref]) => {
    const raw = ref.input.value;
    values[key] = typeof raw === "string" ? raw.trim() : raw;
  });
  return values;
}

function validate(values) {
  const errors = {};
  const requiredFields = [
    "title",
    "trainerName",
    "date",
    "startTime",
    "endTime",
    "location",
    "status",
    "capacity",
    "bookedCount",
  ];
  requiredFields.forEach((field) => {
    if (!values[field]) {
      errors[field] = "Bitte dieses Feld ausfüllen.";
    }
  });

  const capacity = Number.parseInt(values.capacity, 10);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    errors.capacity = "Kapazität muss größer als 0 sein.";
  }

  const booked = Number.parseInt(values.bookedCount, 10);
  if (!Number.isFinite(booked) || booked < 0) {
    errors.bookedCount = "Anmeldungen müssen 0 oder größer sein.";
  } else if (Number.isFinite(capacity) && booked > capacity) {
    errors.bookedCount = "Anmeldungen dürfen die Kapazität nicht überschreiten.";
  }

  const startMinutes = toMinutes(values.startTime);
  const endMinutes = toMinutes(values.endTime);
  if (values.startTime && startMinutes === null) {
    errors.startTime = "Bitte gültigen Beginn (HH:MM) eingeben.";
  }
  if (values.endTime && endMinutes === null) {
    errors.endTime = "Bitte gültiges Ende (HH:MM) eingeben.";
  }
  if (startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes) {
    errors.endTime = "Ende muss nach dem Beginn liegen.";
  }

  if (values.price) {
    const price = Number(values.price);
    if (!Number.isFinite(price) || price < 0) {
      errors.price = "Bitte gültigen Preis eingeben.";
    }
  }

  return errors;
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
    title: values.title,
    trainerName: values.trainerName,
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    location: values.location,
    status: values.status,
    capacity: Number.parseInt(values.capacity, 10),
    bookedCount: Number.parseInt(values.bookedCount, 10),
    level: values.level || "",
    price: values.price ? Number(values.price) : 0,
    notes: values.notes || "",
  };
}

function toMinutes(value) {
  if (!value || typeof value !== "string") return null;
  const [hourStr, minuteStr] = value.split(":");
  const hours = Number.parseInt(hourStr, 10);
  const minutes = Number.parseInt(minuteStr, 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
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
  const errors = validate(values);
  applyErrors(refs, errors);
  if (Object.keys(errors).length) {
    const firstError = Object.values(refs).find((ref) => !ref.hint.classList.contains("sr-only"));
    firstError?.input.focus();
    return;
  }

  const payload = buildPayload(values);
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
      console.error("[KURSE_ERR_FORM_RESULT]");
      showInlineToast(section, "Kurs konnte nach dem Speichern nicht geladen werden.", "error");
      return;
    }
    await fetchKurse();
    if (mode === "create") {
      setToast("Kurs wurde erstellt.", "success");
    } else {
      setToast("Kurs wurde aktualisiert.", "success");
    }
    window.location.hash = `#/kurse/${createdId}`;
  } catch (error) {
    console.error("[KURSE_ERR_FORM_SUBMIT]", error);
    const message =
      mode === "create"
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
  const confirmed = window.confirm(
    "Kurs löschen?\nMöchtest du diesen Kurs wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden."
  );
  if (!confirmed) return;
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Lösche ...";
  try {
    const result = await deleteKurs(id);
    if (!result?.ok) {
      throw new Error("Delete failed");
    }
    await fetchKurse();
    setToast("Kurs wurde gelöscht.", "success");
    window.location.hash = "#/kurse";
  } catch (error) {
    console.error("[KURSE_ERR_DELETE]", error);
    showInlineToast(section, "Fehler beim Löschen des Kurses.", "error");
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

function focusHeading(root) {
  const heading = root.querySelector("h1, h2");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
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
