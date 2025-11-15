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
import { listKurse, getKurs, createKurs, updateKurs, deleteKurs } from "../shared/api/index.js";

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
    console.error("KURSE_VIEW_FAILED", error);
    section.innerHTML = `
      <h1>Fehler</h1>
      <p>Kursansicht konnte nicht geladen werden.</p>
      <p><a class="ui-btn ui-btn--quiet" href="#/kurse">Zurück zur Übersicht</a></p>
    `;
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
  section.innerHTML = "";
  section.appendChild(
    createSectionHeader({
      title: "Kurse",
      subtitle: "Planung und Übersicht",
      level: 2,
    })
  );

  section.appendChild(
    createNotice("Verwalte Kurse und überprüfe freie Plätze.", {
      variant: "info",
    })
  );
  injectToast(section);

  const toolbar = buildCourseToolbarCard();
  const listCard = buildCourseListCard();
  section.appendChild(toolbar);
  section.appendChild(listCard);

  await populateCourses(listCard);
  focusHeading(section);
}

async function renderDetail(section, id) {
  section.innerHTML = "";
  section.appendChild(
    createSectionHeader({
      title: "Kursdetails",
      subtitle: "Alle Informationen auf einen Blick",
      level: 2,
    })
  );
  injectToast(section);

  const detailFragment = createCard({
    eyebrow: "",
    title: "Kurs wird geladen ...",
    body: "<p>Kurs wird geladen ...</p>",
    footer: "",
  });
  const detailCard = detailFragment.querySelector(".ui-card") || detailFragment.firstElementChild;
  if (!detailCard) return;
  section.appendChild(detailCard);

  const body = detailCard.querySelector(".ui-card__body");
  const footer = detailCard.querySelector(".ui-card__footer");

  try {
    if (!kursCache.length) await fetchKurse();
    let kurs = kursCache.find((k) => k.id === id);
    if (!kurs) kurs = await getKurs(id);
    if (!kurs) {
      throw new Error(`Kurs ${id} nicht gefunden`);
    }

    detailCard.querySelector(".ui-card__eyebrow").textContent = formatStatusLabel(kurs.status);
    detailCard.querySelector(".ui-card__title").textContent = kurs.title || "Ohne Titel";

    body.innerHTML = "";
    body.appendChild(renderDetailList(kurs));
    body.appendChild(renderNotesBlock(kurs));
    body.appendChild(renderMetaBlock(kurs));

    footer.innerHTML = "";
    const editBtn = createButton({
      label: "Kurs bearbeiten",
      variant: "primary",
      onClick: () => {
        window.location.hash = `#/kurse/${kurs.id}/edit`;
      },
    });
    const deleteBtn = createButton({
      label: "Kurs löschen",
      variant: "secondary",
    });
    deleteBtn.addEventListener("click", () => handleDeleteKurs(section, kurs.id, deleteBtn));
    footer.append(editBtn, deleteBtn);
    const backLink = document.createElement("a");
    backLink.className = "ui-btn ui-btn--quiet";
    backLink.href = "#/kurse";
    backLink.textContent = "Zurück zur Übersicht";
    footer.append(backLink);
  } catch (error) {
    console.error("KURSE_DETAIL_FAILED", error);
    body.innerHTML = "";
    const noticeFragment = createNotice("Kurs konnte nicht geladen werden.", {
      variant: "warn",
      role: "alert",
    });
    body.appendChild(noticeFragment);
    const backBtn = createButton({
      label: "Zurück zur Übersicht",
      variant: "primary",
      onClick: () => {
        window.location.hash = "#/kurse";
      },
    });
    body.appendChild(backBtn);
    if (footer) footer.innerHTML = "";
  }

  focusHeading(section);
}

async function renderForm(section, view, id) {
  const mode = view === "create" ? "create" : "edit";
  section.innerHTML = "";
  section.appendChild(
    createSectionHeader({
      title: mode === "create" ? "Neuer Kurs" : "Kurs bearbeiten",
      subtitle: mode === "create" ? "Lege einen neuen Kurs an." : "Passe die Kursdaten an.",
      level: 2,
    })
  );
  injectToast(section);

  let existing = null;
  if (mode === "edit") {
    const loading = document.createElement("p");
    loading.textContent = "Kurs wird geladen ...";
    section.appendChild(loading);
    try {
      if (!kursCache.length) await fetchKurse();
      existing = kursCache.find((kurs) => kurs.id === id) || (await getKurs(id));
      if (!existing) {
        throw new Error(`Kurs ${id} nicht gefunden`);
      }
    } catch (error) {
      console.error("KURSE_FORM_LOAD_FAILED", error);
      section.removeChild(loading);
      section.appendChild(
        createNotice("Kurs konnte nicht geladen werden.", {
          variant: "warn",
          role: "alert",
        })
      );
      const backBtn = createButton({
        label: "Zurück zur Übersicht",
        variant: "primary",
        onClick: () => {
          window.location.hash = "#/kurse";
        },
      });
      section.appendChild(backBtn);
      focusHeading(section);
      return;
    }
    section.removeChild(loading);
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
  submit.type = "submit";
  submit.className = "ui-btn ui-btn--primary";
  submit.textContent = mode === "create" ? "Erstellen" : "Speichern";
  const cancel = document.createElement("a");
  cancel.className = "ui-btn ui-btn--quiet";
  cancel.href = mode === "create" ? "#/kurse" : `#/kurse/${id}`;
  cancel.textContent = "Abbrechen";
  actions.append(submit, cancel);
  formCard.querySelector(".ui-card__footer").appendChild(actions);

  form.addEventListener("submit", async (event) => {
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
      const result = mode === "create" ? await createKurs(payload) : await updateKurs(id, payload);
      if (!result || !result.id) {
        throw new Error("Save failed");
      }
      await fetchKurse();
      setToast(mode === "create" ? "Kurs wurde erstellt." : "Kurs wurde aktualisiert.", "success");
      window.location.hash = mode === "create" ? "#/kurse" : `#/kurse/${result.id}`;
    } catch (error) {
      console.error("KURSE_FORM_SAVE_FAILED", error);
      showInlineToast(section, "Speichern fehlgeschlagen. Bitte erneut versuchen.", "error");
      submit.disabled = false;
      submit.textContent = defaultLabel;
    }
  });

  focusHeading(section);
}

async function fetchKurse() {
  kursCache = await listKurse();
  return kursCache;
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
  const createBtn = createButton({
    label: "Neuer Kurs",
    variant: "primary",
    onClick: () => {
      window.location.hash = "#/kurse/new";
    },
  });
  body.appendChild(createBtn);
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
      const emptyAction = createButton({
        label: "Neuer Kurs",
        variant: "primary",
        onClick: () => {
          window.location.hash = "#/kurse/new";
        },
      });
      body.appendChild(
        createEmptyState(
          "Noch keine Kurse erfasst.",
          "Lege den ersten Kurs an und plane dein Training.",
          {
            actionNode: emptyAction,
          }
        )
      );
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

      attachCourseNavigation(cardEl, course.id);
      body.appendChild(cardEl);
    });
  } catch (error) {
    console.error("KURSE_LOAD_FAILED", error);
    body.innerHTML = "";
    const noticeFragment = createNotice("Fehler beim Laden der Kurse.", {
      variant: "warn",
      role: "alert",
    });
    body.appendChild(noticeFragment);
    const retryBtn = createButton({
      label: "Erneut versuchen",
      variant: "secondary",
      onClick: () => populateCourses(cardElement),
    });
    body.appendChild(retryBtn);
  }
}

function attachCourseNavigation(cardEl, id) {
  if (!cardEl) return;
  cardEl.classList.add("kurse-list-item");
  cardEl.setAttribute("role", "button");
  cardEl.setAttribute("tabindex", "0");
  const navigate = () => {
    window.location.hash = `#/kurse/${id}`;
  };
  cardEl.addEventListener("click", navigate);
  cardEl.addEventListener("keypress", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate();
    }
  });
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

function renderNotesBlock(kurs) {
  const wrapper = document.createElement("div");
  wrapper.className = "kurs-detail-notes";
  const heading = document.createElement("h3");
  heading.textContent = "Notizen";
  const text = document.createElement("p");
  text.textContent = kurs.notes || "Keine Notizen vorhanden.";
  wrapper.append(heading, text);
  return wrapper;
}

function renderMetaBlock(kurs) {
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
    console.error("KURSE_DELETE_FAILED", error);
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
