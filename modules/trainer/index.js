/* globals document, window, requestAnimationFrame, console */
import {
  listTrainer,
  getTrainer,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from "../shared/api/trainer.js";
import { getKurseForTrainer } from "../shared/api/kurse.js";
import { runIntegrityCheck } from "../shared/api/db/integrityCheck.js";
import {
  createSectionHeader,
  createCard,
  createEmptyState,
  createNotice,
  createButton,
  createFormRow,
} from "../shared/components/components.js";

const VIEW_TITLES = {
  list: "Übersicht",
  detail: "Details",
  create: "Neu",
  edit: "Bearbeiten",
  delete: "Löschen",
};

// Standardized module interface for Dogule1
export async function initModule(container, routeInfo) {
  if (!container) return;

  container.innerHTML = "";
  container.classList.add("trainer-view");

  const { view, id } = resolveView(routeInfo);
  const section = document.createElement("section");
  section.className = "dogule-section trainer-section";

  const h1 = document.createElement("h1");
  h1.textContent = "Trainer";
  section.appendChild(h1);

  try {
    if (view === "list") {
      await renderList(section);
    } else if (view === "detail" && id) {
      await renderDetail(section, id);
    } else if (view === "create") {
      await renderCreate(section);
    } else if (view === "edit" && id) {
      await renderEdit(section, id);
    } else if (view === "delete" && id) {
      await renderDelete(section, id);
    } else {
      renderPlaceholder(section, VIEW_TITLES[view] || VIEW_TITLES.list);
    }
  } catch (error) {
    console.error("[TRAINER_LIST_ERROR]", error);
    renderErrorState(section);
  }

  container.appendChild(section);
  scrollAndFocus(container, h1);
}

function resolveView(routeInfo) {
  const segments = routeInfo?.segments || [];
  if (segments.length === 0) return { view: "list" };
  if (segments[0] === "new") return { view: "create" };
  if (segments.length === 1) return { view: "detail", id: segments[0] };
  if (segments[1] === "edit") return { view: "edit", id: segments[0] };
  if (segments[1] === "delete") return { view: "delete", id: segments[0] };
  return { view: "list" };
}

async function renderList(section) {
  const header = createSectionHeader({
    title: "Trainer",
    subtitle: "Übersicht aller Trainerinnen und Trainer",
    level: 2,
  });
  section.appendChild(header);

  const actionsCard = createCard({
    eyebrow: "",
    title: "Aktionen",
    body: "",
    footer: "",
  });
  const actionsBody = actionsCard.querySelector(".ui-card__body");
  actionsBody.innerHTML = "";
  const newBtn = createButton({
    label: "Neuer Trainer",
    variant: "primary",
    onClick: () => {
      window.location.hash = "#/trainer/new";
    },
  });
  actionsBody.appendChild(newBtn);

  const listCard = createCard({
    eyebrow: "",
    title: "Trainerliste",
    body: "",
    footer: "",
  });
  const listBody = listCard.querySelector(".ui-card__body");
  listBody.innerHTML = "";

  let trainer = [];
  try {
    trainer = await listTrainer();
  } catch (error) {
    console.error("[TRAINER_LIST_LOAD_FAIL]", error);
    listBody.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
    section.append(actionsCard, listCard);
    return;
  }

  if (!trainer.length) {
    listBody.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
  } else {
    const listWrapper = document.createElement("div");
    listWrapper.className = "trainer-list";
    trainer.forEach((entry) => {
      const fragment = createCard({
        eyebrow: entry.code || entry.id,
        title: entry.name || "Unbenannt",
        body: `
          <p><strong>ID:</strong> ${entry.id}</p>
          <p><strong>Code:</strong> ${entry.code || "—"}</p>
          <p><strong>Telefon:</strong> ${entry.telefon || "keine Telefonangabe"}</p>
          <p><strong>E-Mail:</strong> ${entry.email || "keine E-Mail"}</p>
        `,
        footer: "",
      });
      const cardEl = fragment.querySelector(".ui-card") || fragment.firstElementChild;
      if (!cardEl) return;
      cardEl.classList.add("trainer-list__item");
      const link = document.createElement("a");
      link.href = `#/trainer/${entry.id}`;
      link.className = "trainer-list__link";
      link.setAttribute("aria-label", `${entry.name || entry.code || entry.id} öffnen`);
      link.appendChild(cardEl);
      listWrapper.appendChild(link);
    });
    listBody.appendChild(listWrapper);
  }

  section.append(actionsCard, listCard);
}

async function renderDetail(section, id) {
  const header = createSectionHeader({
    title: "Trainer",
    subtitle: "Details",
    level: 2,
  });
  section.appendChild(header);

  const actionsCard = createCard({
    eyebrow: "",
    title: "Aktionen",
    body: "",
    footer: "",
  });
  const actionsBody = actionsCard.querySelector(".ui-card__body");
  actionsBody.innerHTML = "";
  actionsBody.appendChild(
    createButton({
      label: "Bearbeiten",
      variant: "primary",
      onClick: () => {
        window.location.hash = `#/trainer/${id}/edit`;
      },
    })
  );
  actionsBody.appendChild(
    createButton({
      label: "Löschen",
      variant: "warn",
      onClick: () => {
        window.location.hash = `#/trainer/${id}/delete`;
      },
    })
  );

  const detailCard = createCard({
    eyebrow: "",
    title: "Stammdaten",
    body: "",
    footer: "",
  });
  const detailBody = detailCard.querySelector(".ui-card__body");
  detailBody.innerHTML = "";

  let trainer = null;
  try {
    trainer = await getTrainer(id);
  } catch (error) {
    console.error("[TRAINER_DETAIL_ERROR]", error);
    detailBody.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
    section.append(actionsCard, detailCard);
    return;
  }

  if (!trainer) {
    section.appendChild(
      createNotice("Datensatz nicht gefunden.", { variant: "warn", role: "alert" })
    );
    const backLink = document.createElement("a");
    backLink.href = "#/trainer";
    backLink.className = "ui-btn ui-btn--quiet";
    backLink.textContent = "Zur Übersicht";
    section.appendChild(backLink);
    return;
  }

  const fields = [
    ["ID", trainer.id],
    ["Code", trainer.code || "—"],
    ["Name", trainer.name || "—"],
    ["Telefon", trainer.telefon || "—"],
    ["E-Mail", trainer.email || "—"],
    ["Notizen", trainer.notizen || "—"],
    [
      "Verfügbarkeiten",
      trainer.verfuegbarkeiten?.length
        ? trainer.verfuegbarkeiten
            .map(
              (slot) =>
                `Wochentag ${slot.weekday ?? "?"}, ${slot.startTime || "??:??"}–${
                  slot.endTime || "??:??"
                }`
            )
            .join("<br>")
        : "Keine Angaben",
    ],
    ["Erstellt am", trainer.createdAt || "—"],
    ["Aktualisiert am", trainer.updatedAt || "—"],
  ];

  const list = document.createElement("dl");
  list.className = "trainer-detail__list";
  fields.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.innerHTML = value || "—";
    list.append(dt, dd);
  });

  detailBody.appendChild(list);
  section.append(actionsCard, detailCard);

  let trainerKurse = [];
  let kurseLoadFailed = false;
  try {
    trainerKurse = await getKurseForTrainer(id);
  } catch (error) {
    kurseLoadFailed = true;
    console.error("[TRAINER_KURSE_LOAD_FAIL]", error);
  }

  const kurseSection = buildTrainerKurseSection(trainerKurse, kurseLoadFailed);
  if (kurseSection) {
    section.appendChild(kurseSection);
  }
  const kalenderSection = buildTrainerKalenderSection(trainerKurse, kurseLoadFailed);
  if (kalenderSection) {
    section.appendChild(kalenderSection);
  }
}

function renderPlaceholder(section, heading) {
  const placeholder = document.createElement("div");
  placeholder.className = "trainer-placeholder";
  placeholder.textContent = `Platzhalter für ${heading}`;
  section.appendChild(placeholder);
}

function renderErrorState(section) {
  section.appendChild(
    createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
  );
}

function buildTrainerKurseSection(kurse = [], loadFailed = false) {
  const section = document.createElement("section");
  section.className = "trainer-linked-kurse";
  section.appendChild(
    createSectionHeader({
      title: "Kurse dieses Trainers",
      subtitle: "",
      level: 2,
    })
  );
  const card = createCard({
    eyebrow: "",
    title: "",
    body: "",
    footer: "",
  });
  const cardEl = card.querySelector(".ui-card") || card.firstElementChild;
  if (!cardEl) return section;
  const body = cardEl.querySelector(".ui-card__body");
  body.innerHTML = "";
  if (loadFailed) {
    body.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
  } else if (!kurse.length) {
    body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
  } else {
    const sorted = sortKurseBySchedule(kurse);
    sorted.forEach((kurs) => {
      const kursCard = createCard({
        eyebrow: kurs.code || kurs.id,
        title: kurs.title || "Ohne Titel",
        body: "",
        footer: "",
      });
      const kursEl = kursCard.querySelector(".ui-card") || kursCard.firstElementChild;
      if (!kursEl) return;
      kursEl.classList.add("trainer-linked-kurs");
      const kursBody = kursEl.querySelector(".ui-card__body");
      kursBody.innerHTML = "";
      const info = document.createElement("div");
      info.className = "trainer-linked-kurs__info";
      const dateRow = document.createElement("p");
      dateRow.textContent = `${formatDate(kurs.date)} · ${kurs.location || "Ort offen"}`;
      const timeRow = document.createElement("p");
      timeRow.textContent = `Zeit: ${formatTimeRange(kurs.startTime, kurs.endTime)}`;
      info.append(dateRow, timeRow);
      kursBody.appendChild(info);
      const link = document.createElement("a");
      link.href = `#/kurse/${kurs.id}`;
      link.className = "trainer-linked-kurs__link";
      link.appendChild(kursEl);
      body.appendChild(link);
    });
  }
  section.appendChild(cardEl);
  return section;
}

function buildTrainerKalenderSection(kurse = [], loadFailed = false) {
  const section = document.createElement("section");
  section.className = "trainer-calendar-assignments";
  section.appendChild(
    createSectionHeader({
      title: "Kalendereinsätze",
      subtitle: "",
      level: 2,
    })
  );

  const card = createCard({ eyebrow: "", title: "", body: "", footer: "" });
  const cardEl = card.querySelector(".ui-card") || card.firstElementChild;
  if (!cardEl) return section;
  const body = cardEl.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (loadFailed) {
    body.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
  } else {
    const scheduled = kurse.filter(kursHasSchedule);
    if (!scheduled.length) {
      body.appendChild(createEmptyState("Keine Kalendereinträge für diesen Trainer.", ""));
    } else {
      const sorted = sortKurseBySchedule(scheduled);
      const listWrapper = document.createElement("div");
      listWrapper.className = "trainer-calendar-assignments__list";
      sorted.forEach((kurs) => {
        const kursCard = createCard({
          eyebrow: kurs.code || kurs.id,
          title: kurs.title || "Ohne Titel",
          body: "",
          footer: "",
        });
        const kursEl = kursCard.querySelector(".ui-card") || kursCard.firstElementChild;
        if (!kursEl) return;
        kursEl.classList.add("trainer-linked-kurs");
        const kursBody = kursEl.querySelector(".ui-card__body");
        kursBody.innerHTML = "";
        const info = document.createElement("div");
        info.className = "trainer-linked-kurs__info";
        const dateRow = document.createElement("p");
        dateRow.textContent = `${formatDate(kurs.date)} · ${formatScheduleTimeRange(
          kurs.startTime,
          kurs.endTime
        )}`;
        const locationRow = document.createElement("p");
        locationRow.textContent = kurs.location || "Ort offen";
        info.append(dateRow, locationRow);
        kursBody.appendChild(info);
        const link = document.createElement("a");
        link.href = `#/kurse/${kurs.id}`;
        link.className = "trainer-linked-kurs__link";
        link.appendChild(kursEl);
        listWrapper.appendChild(link);
      });
      body.appendChild(listWrapper);
    }
  }

  section.appendChild(cardEl);
  return section;
}

async function renderCreate(section) {
  const header = createSectionHeader({
    title: "Neuer Trainer",
    subtitle: "Erfasse einen neuen Trainer.",
    level: 2,
  });
  section.appendChild(header);

  let trainerList = [];
  try {
    trainerList = await listTrainer();
  } catch (error) {
    console.error("[TRAINER_CREATE_LOAD_FAIL]", error);
    section.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
    appendBackLink(section, "#/trainer");
    focusHeading(section);
    return;
  }

  const defaultCode = generateNextTrainerCode(trainerList);
  const defaultId = generateNextTrainerId(trainerList);
  let isManualCode = false;

  const formCard = createCard({
    eyebrow: "",
    title: "Stammdaten",
    body: "",
    footer: "",
  });
  const cardEl = formCard.querySelector(".ui-card") || formCard.firstElementChild;
  const formBody = cardEl.querySelector(".ui-card__body");
  formBody.innerHTML = "";
  const statusSlot = document.createElement("div");
  statusSlot.className = "trainer-form-status";
  formBody.appendChild(statusSlot);

  const form = document.createElement("form");
  form.noValidate = true;
  form.className = "trainer-form";
  form.id = "trainer-create-form";
  formBody.appendChild(form);

  const refs = {};

  const idRow = createFormRow({
    id: "trainer-id",
    label: "Trainer-ID",
    placeholder: "Wird automatisch vergeben",
    required: false,
    describedByText: "Systemgenerierte ID, wird beim Speichern vergeben.",
  });
  const idInput = idRow.querySelector("input");
  idInput.name = "id";
  idInput.value = defaultId;
  idInput.readOnly = true;
  idInput.setAttribute("aria-readonly", "true");
  const idHint = idRow.querySelector(".ui-form-row__hint");
  if (idHint) {
    idHint.classList.remove("sr-only");
  }
  form.appendChild(idRow);

  const codeRow = createFormRow({
    id: "trainer-code",
    label: "Trainer-Code*",
    placeholder: "z. B. TR-004",
    required: true,
    describedByText:
      'Standardmäßig automatisch. Mit "Code manuell ändern" aktivierst du die Bearbeitung.',
  });
  const codeInput = codeRow.querySelector("input");
  codeInput.name = "code";
  codeInput.value = defaultCode;
  codeInput.readOnly = true;
  codeInput.setAttribute("aria-readonly", "true");
  const codeHint = codeRow.querySelector(".ui-form-row__hint");
  if (codeHint) {
    codeHint.classList.remove("sr-only");
  }

  const codeToggleWrap = document.createElement("div");
  codeToggleWrap.className = "trainer-code-toggle";
  const codeToggle = createButton({ label: "Code manuell ändern", variant: "secondary" });
  codeToggle.type = "button";
  codeToggle.addEventListener("click", () => {
    isManualCode = !isManualCode;
    if (isManualCode) {
      codeInput.readOnly = false;
      codeInput.removeAttribute("aria-readonly");
      codeToggle.textContent = "Automatischen Code verwenden";
      codeInput.focus();
    } else {
      codeInput.readOnly = true;
      codeInput.setAttribute("aria-readonly", "true");
      codeToggle.textContent = "Code manuell ändern";
      if (!codeInput.value.trim()) {
        codeInput.value = defaultCode;
      }
    }
  });
  codeToggleWrap.appendChild(codeToggle);
  codeRow.appendChild(codeToggleWrap);
  refs.code = { input: codeInput, hint: codeHint };
  form.appendChild(codeRow);

  const nameRow = createFormRow({
    id: "trainer-name",
    label: "Name*",
    required: true,
    placeholder: "z. B. Martina Frei",
  });
  const nameInput = nameRow.querySelector("input");
  nameInput.name = "name";
  refs.name = { input: nameInput, hint: nameRow.querySelector(".ui-form-row__hint") };
  form.appendChild(nameRow);

  const phoneRow = createFormRow({
    id: "trainer-telefon",
    label: "Telefon",
    placeholder: "z. B. +41 44 700 00 01",
  });
  const phoneInput = phoneRow.querySelector("input");
  phoneInput.name = "telefon";
  refs.telefon = { input: phoneInput, hint: phoneRow.querySelector(".ui-form-row__hint") };
  const phoneHint = phoneRow.querySelector(".ui-form-row__hint");
  phoneHint?.classList.add("sr-only");
  form.appendChild(phoneRow);

  const emailRow = createFormRow({
    id: "trainer-email",
    label: "E-Mail",
    type: "email",
    placeholder: "z. B. trainer@example.com",
  });
  const emailInput = emailRow.querySelector("input");
  emailInput.name = "email";
  refs.email = { input: emailInput, hint: emailRow.querySelector(".ui-form-row__hint") };
  const emailHint = emailRow.querySelector(".ui-form-row__hint");
  emailHint?.classList.add("sr-only");
  form.appendChild(emailRow);

  const notesRow = createFormRow({
    id: "trainer-notizen",
    label: "Notizen",
    control: "textarea",
    placeholder: "Optionale Ergänzungen",
  });
  const notesInput = notesRow.querySelector("textarea");
  notesInput.name = "notizen";
  refs.notizen = { input: notesInput, hint: notesRow.querySelector(".ui-form-row__hint") };
  const notesHint = notesRow.querySelector(".ui-form-row__hint");
  notesHint?.classList.add("sr-only");
  form.appendChild(notesRow);

  const availRow = createFormRow({
    id: "trainer-verfuegbarkeiten",
    label: "Verfügbarkeiten",
    control: "textarea",
    placeholder: "Eine Verfügbarkeit pro Zeile, z. B. 1 08:00-14:00",
  });
  const availField = availRow.querySelector("textarea");
  availField.name = "verfuegbarkeiten";
  refs.verfuegbarkeiten = {
    input: availField,
    hint: availRow.querySelector(".ui-form-row__hint"),
    parser: parseAvailabilityInput,
  };
  const availHint = availRow.querySelector(".ui-form-row__hint");
  if (availHint) {
    availHint.textContent = "Format: Wochentag Start-Ende, z. B. 1 08:00-14:00";
    availHint.classList.remove("sr-only");
  }
  form.appendChild(availRow);

  const footer = cardEl.querySelector(".ui-card__footer");
  footer.innerHTML = "";
  const actions = document.createElement("div");
  actions.className = "trainer-form-actions";
  const submit = createButton({ label: "Erstellen", variant: "primary" });
  submit.type = "submit";
  submit.addEventListener("click", () => form.requestSubmit());
  const cancel = createButton({ label: "Abbrechen", variant: "quiet" });
  cancel.type = "button";
  cancel.addEventListener("click", () => {
    window.location.hash = "#/trainer";
  });
  actions.append(submit, cancel);
  footer.appendChild(actions);

  form.addEventListener("submit", (event) =>
    handleCreateSubmit(event, {
      refs,
      submit,
      defaultCode,
      defaultId,
      statusSlot,
    })
  );

  section.appendChild(cardEl);
  focusHeading(section);
}

async function handleCreateSubmit(event, { refs, submit, defaultCode, statusSlot }) {
  event.preventDefault();
  if (statusSlot) statusSlot.innerHTML = "";

  const values = collectFormValues(refs, { defaultCode });
  const errors = validateCreate(values);
  applyFormErrors(refs, errors);
  if (Object.keys(errors).length) {
    const firstError = Object.values(refs).find(
      (ref) => ref.hint && !ref.hint.classList.contains("sr-only")
    );
    firstError?.input.focus();
    return;
  }

  submit.disabled = true;
  submit.textContent = "Erstelle ...";

  try {
    const created = await createTrainer(values);
    if (!created?.id) {
      throw new Error("Trainer erstellen ohne ID");
    }
    if (statusSlot) {
      statusSlot.appendChild(
        createNotice("Trainer wurde erstellt.", { variant: "ok", role: "status" })
      );
    }
    window.location.hash = `#/trainer/${created.id}`;
  } catch (error) {
    console.error("[TRAINER_CREATE_SAVE_FAIL]", error);
    if (statusSlot) {
      statusSlot.appendChild(
        createNotice("Fehler beim Speichern.", { variant: "warn", role: "alert" })
      );
    }
    submit.disabled = false;
    submit.textContent = "Erstellen";
  }
}

function collectFormValues(refs, defaultCode) {
  const values = {};
  Object.entries(refs || {}).forEach(([key, ref]) => {
    if (!ref?.input) return;
    if (typeof ref.parser === "function") {
      values[key] = ref.parser(ref.input.value);
    } else {
      values[key] = ref.input.value.trim();
    }
  });
  const resolvedDefaults =
    typeof defaultCode === "object" && defaultCode !== null ? defaultCode : { defaultCode };
  if (!values.code) {
    values.code = resolvedDefaults.defaultCode;
  }
  return values;
}

function validateCreate(values = {}) {
  const errors = {};
  if (!values.code) {
    errors.code = "Code fehlt.";
  }
  if (!values.name) {
    errors.name = "Bitte einen Namen angeben.";
  }
  return errors;
}

function applyFormErrors(refs = {}, errors = {}) {
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

function appendBackLink(section, href) {
  const back = document.createElement("a");
  back.href = href;
  back.className = "ui-btn ui-btn--quiet";
  back.textContent = "Zur Übersicht";
  section.appendChild(back);
}

function formatDate(value) {
  if (!value) return "Datum folgt";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function kursHasSchedule(kurs = {}) {
  return Boolean((kurs.date || "").trim() && (kurs.startTime || "").trim());
}

function parseTimeToMinutes(timeStr = "") {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!match) return null;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function buildScheduleTimestamp(kurs = {}) {
  if (!kursHasSchedule(kurs)) return Number.POSITIVE_INFINITY;
  const base = new Date(kurs.date);
  if (Number.isNaN(base.getTime())) return Number.POSITIVE_INFINITY;
  const minutes = parseTimeToMinutes(kurs.startTime) ?? 0;
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0
  ).getTime();
}

function sortKurseBySchedule(kurse = []) {
  return [...kurse].sort((a, b) => {
    const timeA = buildScheduleTimestamp(a);
    const timeB = buildScheduleTimestamp(b);
    if (timeA !== timeB) return timeA - timeB;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

function formatScheduleTimeRange(start, end) {
  return formatTimeRange(start, end);
}

function formatTimeRange(start, end) {
  const safeStart = start || "00:00";
  const safeEnd = end || "00:00";
  return `${safeStart}–${safeEnd}`;
}

function generateNextTrainerCode(list = []) {
  let max = 0;
  list.forEach((trainer) => {
    const source = (trainer.code || trainer.id || "").trim();
    const match = source.match(/(\d+)/);
    if (!match) return;
    const num = Number.parseInt(match[1], 10);
    if (Number.isFinite(num) && num > max) {
      max = num;
    }
  });
  const next = max + 1;
  return `TR-${String(next).padStart(3, "0")}`;
}

function generateNextTrainerId(list = []) {
  let max = 0;
  list.forEach((trainer) => {
    const source = (trainer.id || "").trim();
    const match = source.match(/(\d+)/);
    if (!match) return;
    const num = Number.parseInt(match[1], 10);
    if (Number.isFinite(num) && num > max) {
      max = num;
    }
  });
  const next = max + 1;
  return `t${next}`;
}

function parseAvailabilityInput(raw = "") {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line) => {
    const match = line.match(/(\d)[\s,;:-]*(\d{1,2}:\d{2})?\s*[-–]?\s*(\d{1,2}:\d{2})?/);
    return {
      weekday: match ? Number.parseInt(match[1], 10) || 0 : 0,
      startTime: match?.[2] || "",
      endTime: match?.[3] || "",
    };
  });
}

function formatAvailabilityForInput(entries = []) {
  if (!Array.isArray(entries)) return "";
  return entries
    .map((slot) => {
      if (!slot) return "";
      const day = slot.weekday ?? "";
      const start = slot.startTime || "";
      const end = slot.endTime || "";
      if (day === "" && !start && !end) {
        return "";
      }
      if (start || end) {
        return `${day} ${start}-${end}`.trim();
      }
      return String(day);
    })
    .filter(Boolean)
    .join("\n");
}

function scrollAndFocus(container, target) {
  container.scrollTo?.({ top: 0, behavior: "smooth" });
  if (typeof requestAnimationFrame === "function" && target?.focus) {
    requestAnimationFrame(() => target.focus({ preventScroll: true }));
  }
}

function focusHeading(section) {
  if (!section) return;
  const heading = section.querySelector("h1, h2");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }
}

async function renderDelete(section, id) {
  const header = createSectionHeader({
    title: "Trainer löschen",
    subtitle: "Diese Aktion entfernt den Trainer dauerhaft.",
    level: 2,
  });
  section.appendChild(header);

  let trainer = null;
  try {
    trainer = await getTrainer(id);
  } catch (error) {
    console.error("[TRAINER_DELETE_LOAD_FAIL]", error);
  }

  if (!trainer) {
    section.appendChild(
      createNotice("Datensatz nicht gefunden.", { variant: "warn", role: "alert" })
    );
    appendBackLink(section, "#/trainer");
    focusHeading(section);
    return;
  }

  let assignedKurse = [];
  try {
    assignedKurse = await getKurseForTrainer(id);
  } catch (error) {
    console.error("[TRAINER_DELETE_KURSE_FAIL]", error);
  }
  const hasAssignments = assignedKurse.length > 0;

  const card = createCard({
    eyebrow: "",
    title: "Löschen bestätigen",
    body: "",
    footer: "",
  });
  const cardEl = card.querySelector(".ui-card") || card.firstElementChild;
  const body = cardEl.querySelector(".ui-card__body");
  body.innerHTML = "";
  const intro = document.createElement("p");
  intro.textContent = "Dieser Schritt entfernt den Trainer dauerhaft aus dem System.";
  const idRow = document.createElement("p");
  idRow.innerHTML = `<strong>ID:</strong> ${trainer.id}`;
  const codeRow = document.createElement("p");
  codeRow.innerHTML = `<strong>Code:</strong> ${trainer.code || "—"}`;
  const nameRow = document.createElement("p");
  nameRow.innerHTML = `<strong>Name:</strong> ${trainer.name || "—"}`;
  body.append(intro, idRow, codeRow, nameRow);

  const statusSlot = document.createElement("div");
  statusSlot.className = "trainer-delete-status";
  body.appendChild(statusSlot);

  if (hasAssignments) {
    const guard = createNotice(
      "Löschen blockiert: Der Trainer ist aktuell Kursen zugewiesen. Bitte zuerst umhängen.",
      { variant: "warn", role: "alert" }
    );
    statusSlot.appendChild(guard);
    const list = document.createElement("ul");
    list.className = "trainer-delete-assignments";
    assignedKurse.forEach((kurs) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#/kurse/${kurs.id}`;
      link.textContent = `${kurs.code || kurs.id} · ${kurs.title || "Kurs"}`;
      li.appendChild(link);
      list.appendChild(li);
    });
    body.appendChild(list);
  }

  const footer = cardEl.querySelector(".ui-card__footer");
  footer.innerHTML = "";
  const actions = document.createElement("div");
  actions.className = "trainer-delete-actions";

  const confirmBtn = createButton({
    label: hasAssignments ? "Löschen blockiert" : "Löschen",
    variant: "warn",
  });
  confirmBtn.type = "button";
  if (!hasAssignments) {
    confirmBtn.addEventListener("click", async () => {
      statusSlot.innerHTML = "";
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Lösche ...";
      try {
        const result = await deleteTrainer(id);
        if (!result?.ok) {
          throw new Error("Trainer Delete failed");
        }
        runIntegrityCheck();
        statusSlot.appendChild(
          createNotice("Trainer wurde gelöscht.", { variant: "ok", role: "status" })
        );
        window.location.hash = "#/trainer";
      } catch (error) {
        console.error("[TRAINER_DELETE_FAIL]", error);
        const isBlocked = error?.code === "TRAINER_DELETE_BLOCKED";
        const message = isBlocked
          ? "Löschen blockiert: Trainer ist Kursen zugewiesen."
          : "Fehler beim Löschen.";
        statusSlot.appendChild(createNotice(message, { variant: "warn", role: "alert" }));
        if (isBlocked) {
          let latestAssignments = [];
          try {
            latestAssignments = await getKurseForTrainer(id);
          } catch (refreshError) {
            console.error("[TRAINER_DELETE_REFRESH_FAIL]", refreshError);
          }
          if (latestAssignments.length) {
            const list = document.createElement("ul");
            list.className = "trainer-delete-assignments";
            latestAssignments.forEach((kurs) => {
              const li = document.createElement("li");
              const link = document.createElement("a");
              link.href = `#/kurse/${kurs.id}`;
              link.textContent = `${kurs.code || kurs.id} · ${kurs.title || "Kurs"}`;
              li.appendChild(link);
              list.appendChild(li);
            });
            statusSlot.appendChild(list);
          }
        }
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Löschen";
      }
    });
  } else {
    confirmBtn.disabled = true;
  }

  const cancelBtn = createButton({ label: "Abbrechen", variant: "quiet" });
  cancelBtn.type = "button";
  cancelBtn.addEventListener("click", () => {
    window.location.hash = `#/trainer/${id}`;
  });

  actions.append(confirmBtn, cancelBtn);
  footer.appendChild(actions);

  section.appendChild(cardEl);
  focusHeading(section);
}

async function renderEdit(section, id) {
  const header = createSectionHeader({
    title: "Trainer bearbeiten",
    subtitle: "Passe die Daten dieses Trainers an.",
    level: 2,
  });
  section.appendChild(header);

  let trainer = null;
  let trainerList = [];
  try {
    trainerList = await listTrainer();
    trainer = trainerList.find((t) => t.id === id) || (await getTrainer(id));
  } catch (error) {
    console.error("[TRAINER_EDIT_LOAD_FAIL]", error);
  }

  if (!trainer) {
    section.appendChild(
      createNotice("Datensatz nicht gefunden.", { variant: "warn", role: "alert" })
    );
    appendBackLink(section, "#/trainer");
    focusHeading(section);
    return;
  }

  const defaultCode = generateNextTrainerCode(trainerList);
  let isManualCode = true;

  const formCard = createCard({
    eyebrow: "",
    title: "Stammdaten",
    body: "",
    footer: "",
  });
  const cardEl = formCard.querySelector(".ui-card") || formCard.firstElementChild;
  const formBody = cardEl.querySelector(".ui-card__body");
  formBody.innerHTML = "";
  const statusSlot = document.createElement("div");
  statusSlot.className = "trainer-form-status";
  formBody.appendChild(statusSlot);

  const form = document.createElement("form");
  form.noValidate = true;
  form.className = "trainer-form";
  form.id = "trainer-edit-form";
  formBody.appendChild(form);

  const refs = {};

  const idRow = createFormRow({
    id: "trainer-id",
    label: "ID",
    placeholder: "",
    required: false,
    describedByText: "Systemgenerierte ID (nur Lesemodus).",
  });
  const idInput = idRow.querySelector("input");
  idInput.name = "id";
  idInput.value = trainer.id || "";
  idInput.readOnly = true;
  idInput.setAttribute("aria-readonly", "true");
  const idHint = idRow.querySelector(".ui-form-row__hint");
  if (idHint) idHint.classList.remove("sr-only");
  refs.id = { input: idInput, hint: idHint };
  form.appendChild(idRow);

  const codeRow = createFormRow({
    id: "trainer-code",
    label: "Trainer-Code*",
    placeholder: "z. B. TR-004",
    required: true,
    describedByText:
      'Standardmäßig automatisch. Mit "Code manuell ändern" aktivierst du die Bearbeitung.',
  });
  const codeInput = codeRow.querySelector("input");
  codeInput.name = "code";
  codeInput.value = trainer.code || defaultCode;
  codeInput.readOnly = true;
  codeInput.setAttribute("aria-readonly", "true");
  const codeHint = codeRow.querySelector(".ui-form-row__hint");
  if (codeHint) {
    codeHint.classList.remove("sr-only");
  }

  const codeToggleWrap = document.createElement("div");
  codeToggleWrap.className = "trainer-code-toggle";
  const codeToggle = createButton({ label: "Code manuell ändern", variant: "secondary" });
  codeToggle.type = "button";
  codeToggle.addEventListener("click", () => {
    isManualCode = !isManualCode;
    if (isManualCode) {
      codeInput.readOnly = false;
      codeInput.removeAttribute("aria-readonly");
      codeToggle.textContent = "Automatischen Code verwenden";
      codeInput.focus();
    } else {
      codeInput.readOnly = true;
      codeInput.setAttribute("aria-readonly", "true");
      codeToggle.textContent = "Code manuell ändern";
      if (!codeInput.value.trim()) {
        codeInput.value = trainer.code || defaultCode;
      }
    }
  });
  codeToggleWrap.appendChild(codeToggle);
  codeRow.appendChild(codeToggleWrap);
  refs.code = { input: codeInput, hint: codeHint };
  form.appendChild(codeRow);

  const nameRow = createFormRow({
    id: "trainer-name",
    label: "Name*",
    required: true,
    placeholder: "z. B. Martina Frei",
  });
  const nameInput = nameRow.querySelector("input");
  nameInput.name = "name";
  nameInput.value = trainer.name || "";
  refs.name = { input: nameInput, hint: nameRow.querySelector(".ui-form-row__hint") };
  form.appendChild(nameRow);

  const phoneRow = createFormRow({
    id: "trainer-telefon",
    label: "Telefon",
    placeholder: "z. B. +41 44 700 00 01",
  });
  const phoneInput = phoneRow.querySelector("input");
  phoneInput.name = "telefon";
  phoneInput.value = trainer.telefon || "";
  refs.telefon = { input: phoneInput, hint: phoneRow.querySelector(".ui-form-row__hint") };
  phoneRow.querySelector(".ui-form-row__hint")?.classList.add("sr-only");
  form.appendChild(phoneRow);

  const emailRow = createFormRow({
    id: "trainer-email",
    label: "E-Mail",
    type: "email",
    placeholder: "z. B. trainer@example.com",
  });
  const emailInput = emailRow.querySelector("input");
  emailInput.name = "email";
  emailInput.value = trainer.email || "";
  refs.email = { input: emailInput, hint: emailRow.querySelector(".ui-form-row__hint") };
  emailRow.querySelector(".ui-form-row__hint")?.classList.add("sr-only");
  form.appendChild(emailRow);

  const notesRow = createFormRow({
    id: "trainer-notizen",
    label: "Notizen",
    control: "textarea",
    placeholder: "Optionale Ergänzungen",
  });
  const notesInput = notesRow.querySelector("textarea");
  notesInput.name = "notizen";
  notesInput.value = trainer.notizen || "";
  refs.notizen = { input: notesInput, hint: notesRow.querySelector(".ui-form-row__hint") };
  notesRow.querySelector(".ui-form-row__hint")?.classList.add("sr-only");
  form.appendChild(notesRow);

  const availRow = createFormRow({
    id: "trainer-verfuegbarkeiten",
    label: "Verfügbarkeiten",
    control: "textarea",
    placeholder: "Eine Verfügbarkeit pro Zeile, z. B. 1 08:00-14:00",
  });
  const availField = availRow.querySelector("textarea");
  availField.name = "verfuegbarkeiten";
  availField.value = formatAvailabilityForInput(trainer.verfuegbarkeiten);
  refs.verfuegbarkeiten = {
    input: availField,
    hint: availRow.querySelector(".ui-form-row__hint"),
    parser: parseAvailabilityInput,
  };
  const editAvailHint = availRow.querySelector(".ui-form-row__hint");
  if (editAvailHint) {
    editAvailHint.textContent = "Format: Wochentag Start-Ende, z. B. 2 10:00-16:00";
    editAvailHint.classList.remove("sr-only");
  }
  form.appendChild(availRow);

  const footer = cardEl.querySelector(".ui-card__footer");
  footer.innerHTML = "";
  const actions = document.createElement("div");
  actions.className = "trainer-form-actions";
  const submit = createButton({ label: "Speichern", variant: "primary" });
  submit.type = "submit";
  submit.addEventListener("click", () => form.requestSubmit());
  const cancel = createButton({ label: "Abbrechen", variant: "quiet" });
  cancel.type = "button";
  cancel.addEventListener("click", () => {
    window.location.hash = `#/trainer/${id}`;
  });
  actions.append(submit, cancel);
  footer.appendChild(actions);

  form.addEventListener("submit", (event) =>
    handleEditSubmit(event, {
      refs,
      submit,
      defaultCode: trainer.code || defaultCode,
      statusSlot,
      id,
    })
  );

  section.appendChild(cardEl);
  focusHeading(section);
}

async function handleEditSubmit(event, { refs, submit, defaultCode, statusSlot, id }) {
  event.preventDefault();
  if (statusSlot) statusSlot.innerHTML = "";

  const values = collectFormValues(refs, { defaultCode });
  const errors = validateCreate(values);
  applyFormErrors(refs, errors);
  if (Object.keys(errors).length) {
    const firstError = Object.values(refs).find(
      (ref) => ref.hint && !ref.hint.classList.contains("sr-only")
    );
    firstError?.input.focus();
    return;
  }

  submit.disabled = true;
  const defaultLabel = submit.textContent;
  submit.textContent = "Speichere ...";

  try {
    const updated = await updateTrainer(id, values);
    if (!updated?.id) {
      throw new Error("Trainer aktualisieren ohne ID");
    }
    if (statusSlot) {
      statusSlot.appendChild(
        createNotice("Änderungen gespeichert.", { variant: "ok", role: "status" })
      );
    }
    window.location.hash = `#/trainer/${id}`;
  } catch (error) {
    console.error("[TRAINER_EDIT_SAVE_FAIL]", error);
    if (statusSlot) {
      statusSlot.appendChild(
        createNotice("Fehler beim Speichern.", { variant: "warn", role: "alert" })
      );
    }
    submit.disabled = false;
    submit.textContent = defaultLabel;
  }
}
