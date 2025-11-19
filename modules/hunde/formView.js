/* globals document, window, console */
import {
  createButton,
  createCard,
  createFormRow,
  createNotice,
  createSectionHeader,
} from "../shared/components/components.js";
import { createHund, updateHund, listHunde } from "../shared/api/hunde.js";
import { listKunden } from "../shared/api/kunden.js";

const TOAST_KEY = "__DOGULE_HUNDE_TOAST__";
const GESCHLECHT_OPTIONS = [
  { value: "", label: "Bitte wählen" },
  { value: "Rüde", label: "Rüde" },
  { value: "Hündin", label: "Hündin" },
];

export async function createHundeFormView(container, options = {}) {
  if (!container) return;
  const mode = options.mode === "edit" ? "edit" : "create";
  const initialHund = mode === "edit" ? options.hund || null : null;
  const hundId = options.id || initialHund?.id || "";

  container.innerHTML = "";
  container.classList.add("hunde-view");
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const section = document.createElement("section");
  section.className = "dogule-section hunde-form-section";
  container.appendChild(section);

  section.appendChild(
    createSectionHeader({
      title: mode === "create" ? "Neuer Hund" : "Hund bearbeiten",
      subtitle:
        mode === "create"
          ? "Erfasse einen neuen Hund für deine Hundeschule."
          : "Passe die Daten dieses Hundes an.",
      level: 2,
    })
  );
  injectHundToast(section);

  let existing = null;
  let kunden = [];
  let hundeListe = [];
  try {
    [kunden, hundeListe] = await Promise.all([listKunden(), listHunde()]);
  } catch (error) {
    console.error("[HUNDE_ERR_FORM_DATA]", error);
    section.appendChild(
      createNotice("Fehler beim Laden der Daten.", {
        variant: "warn",
        role: "alert",
      })
    );
    section.appendChild(buildBackButton());
    focusHeading(section);
    return;
  }
  if (mode === "edit") {
    if (!hundId || !initialHund) {
      section.appendChild(
        createNotice("Fehler beim Laden der Daten.", {
          variant: "warn",
          role: "alert",
        })
      );
      section.appendChild(buildBackButton());
      focusHeading(section);
      return;
    }
    existing = initialHund;
  }

  const cardFragment = createCard({
    eyebrow: "",
    title: "Stammdaten",
    body: "",
    footer: "",
  });
  const cardElement = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!cardElement) return;
  section.appendChild(cardElement);

  const form = document.createElement("form");
  form.noValidate = true;
  form.dataset.hundeForm = "true";
  const body = cardElement.querySelector(".ui-card__body");
  body.innerHTML = "";
  body.appendChild(form);

  const refs = buildFormFields(form, existing, kunden, hundeListe, mode);

  const footer = cardElement.querySelector(".ui-card__footer");
  footer.innerHTML = "";
  const actions = document.createElement("div");
  actions.className = "hunde-form-actions";
  const submit = createButton({
    label: mode === "create" ? "Erstellen" : "Speichern",
    variant: "primary",
  });
  submit.type = "submit";
  const cancel = createButton({
    label: "Abbrechen",
    variant: "quiet",
    onClick: () => {
      window.location.hash = mode === "create" ? "#/hunde" : `#/hunde/${hundId}`;
    },
  });
  cancel.type = "button";
  actions.append(submit, cancel);
  footer.appendChild(actions);

  const submitContext = {
    mode,
    id: hundId,
    refs,
    section,
    submit,
  };
  form.addEventListener("submit", (event) => handleHundFormSubmit(event, submitContext));

  focusHeading(section);
}

function buildFormFields(form, existing = {}, kunden = [], hundeListe = [], mode = "create") {
  const kundeOptions = [
    { value: "", label: "Bitte wählen" },
    ...kunden.map((kunde) => ({
      value: kunde.id,
      label: formatKundeName(kunde),
    })),
  ];
  const assignedHundeId =
    existing?.hundeId ?? (mode === "create" ? generateNextHundeId(hundeListe) : existing?.id || "");
  const resolvedHundeId = assignedHundeId || generateNextHundeId(hundeListe);
  const defaultId = resolvedHundeId;
  const refs = {};

  // Hunde-ID row with manual override toggle
  const idRow = createFormRow({
    id: "hund-id",
    label: "Hunde-ID*",
    placeholder: "z. B. hund-001",
    required: true,
    describedByText:
      'Standardmäßig automatisch. Mit "ID manuell ändern" aktivierst du die Bearbeitung.',
  });
  const idInput = idRow.querySelector("input");
  idInput.name = "hundeId";
  idInput.value = resolvedHundeId;
  idInput.readOnly = true;
  idInput.setAttribute("aria-readonly", "true");
  const idHint = idRow.querySelector(".ui-form-row__hint");
  if (idHint) {
    idHint.classList.remove("sr-only");
  }
  refs.hundeId = { input: idInput, hint: idHint, defaultHint: idHint?.textContent || "" };
  form.appendChild(idRow);

  const toggleWrap = document.createElement("div");
  toggleWrap.className = "hunde-id-toggle";
  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "ui-btn ui-btn--secondary";
  toggleBtn.textContent = "ID manuell ändern";
  toggleWrap.appendChild(toggleBtn);
  form.appendChild(toggleWrap);

  let manualOverride = false;
  toggleBtn.addEventListener("click", () => {
    manualOverride = !manualOverride;
    if (manualOverride) {
      idInput.readOnly = false;
      idInput.removeAttribute("aria-readonly");
      toggleBtn.textContent = "Automatische ID verwenden";
      idInput.focus();
    } else {
      idInput.readOnly = true;
      idInput.setAttribute("aria-readonly", "true");
      toggleBtn.textContent = "ID manuell ändern";
      if (!idInput.value.trim()) {
        idInput.value = defaultId;
      }
    }
  });

  const fields = [
    {
      name: "name",
      value: existing?.name ?? "",
      config: {
        id: "hund-name",
        label: "Name*",
        placeholder: "z. B. Bello vom Greifensee",
        required: true,
      },
    },
    {
      name: "rufname",
      value: existing?.rufname ?? "",
      config: {
        id: "hund-rufname",
        label: "Rufname",
        placeholder: "z. B. Bello",
      },
    },
    {
      name: "rasse",
      value: existing?.rasse ?? "",
      config: {
        id: "hund-rasse",
        label: "Rasse",
        placeholder: "z. B. Labrador Retriever",
      },
    },
    {
      name: "geschlecht",
      config: {
        id: "hund-geschlecht",
        label: "Geschlecht",
        control: "select",
        options: GESCHLECHT_OPTIONS.map((option) => ({
          ...option,
          selected: option.value === (existing?.geschlecht ?? ""),
        })),
      },
    },
    {
      name: "geburtsdatum",
      value: existing?.geburtsdatum ?? "",
      config: {
        id: "hund-geburtsdatum",
        label: "Geburtsdatum",
        type: "date",
      },
    },
    {
      name: "gewichtKg",
      value: existing?.gewichtKg != null ? String(existing.gewichtKg) : "",
      config: {
        id: "hund-gewicht",
        label: "Gewicht (kg)",
        type: "number",
        placeholder: "z. B. 25",
      },
      min: "0",
      step: "0.1",
    },
    {
      name: "groesseCm",
      value: existing?.groesseCm != null ? String(existing.groesseCm) : "",
      config: {
        id: "hund-groesse",
        label: "Größe (cm)",
        type: "number",
        placeholder: "z. B. 60",
      },
      min: "0",
      step: "0.5",
    },
    {
      name: "kundenId",
      config: {
        id: "hund-kunden-id",
        label: "Kunde*",
        control: "select",
        required: true,
        options: kundeOptions.map((option) => ({
          ...option,
          selected: option.value === (existing?.kundenId ?? ""),
        })),
      },
    },
    {
      name: "trainingsziele",
      value: typeof existing?.trainingsziele === "string" ? existing.trainingsziele : "",
      config: {
        id: "hund-trainingsziele",
        label: "Trainingsziele",
        control: "textarea",
        placeholder: "Kommagetrennte Ziele, z. B. Rückruf, Impulskontrolle",
      },
    },
    {
      name: "notizen",
      value: existing?.notizen ?? "",
      config: {
        id: "hund-notizen",
        label: "Notizen",
        control: "textarea",
        placeholder: "Besondere Hinweise zum Hund",
      },
    },
  ];

  fields.forEach((field) => {
    const row = createFormRow(field.config);
    const input = row.querySelector("input, select, textarea");
    input.name = field.name;
    if (field.config.type === "number") {
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      if (field.step !== undefined) input.step = field.step;
    }
    if (field.value !== undefined && field.value !== null) {
      input.value = field.value;
    }
    const hint = row.querySelector(".ui-form-row__hint");
    const defaultHint = field.config.describedByText || "";
    if (defaultHint) {
      hint.textContent = defaultHint;
      hint.classList.remove("sr-only");
    } else {
      hint.classList.add("sr-only");
    }
    refs[field.name] = { input, hint, defaultHint };
    form.appendChild(row);
  });
  return refs;
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
  if (!values.hundeId) {
    errors.hundeId = "Bitte eine Hunde-ID angeben.";
  }
  if (!values.name) {
    errors.name = "Bitte den Namen des Hundes angeben.";
  }
  if (!values.kundenId) {
    errors.kundenId = "Bitte eine Kunden-ID eintragen.";
  }
  if (values.geburtsdatum) {
    const timestamp = Date.parse(values.geburtsdatum);
    if (Number.isNaN(timestamp)) {
      errors.geburtsdatum = "Bitte ein gültiges Datum wählen.";
    }
  }
  if (values.gewichtKg) {
    const weight = Number(values.gewichtKg);
    if (!Number.isFinite(weight) || weight <= 0) {
      errors.gewichtKg = "Bitte gültiges Gewicht angeben.";
    }
  }
  if (values.groesseCm) {
    const height = Number(values.groesseCm);
    if (!Number.isFinite(height) || height <= 0) {
      errors.groesseCm = "Bitte gültige Größe angeben.";
    }
  }
  return errors;
}

function applyErrors(refs, errors) {
  Object.entries(refs).forEach(([key, ref]) => {
    if (errors[key]) {
      ref.hint.textContent = errors[key];
      ref.hint.classList.remove("sr-only");
      ref.input.setAttribute("aria-invalid", "true");
    } else {
      const defaultHint = ref.defaultHint || "";
      if (defaultHint) {
        ref.hint.textContent = defaultHint;
        ref.hint.classList.remove("sr-only");
      } else {
        ref.hint.textContent = "";
        ref.hint.classList.add("sr-only");
      }
      ref.input.setAttribute("aria-invalid", "false");
    }
  });
}

function buildPayload(values) {
  return {
    hundeId: values.hundeId,
    name: values.name,
    rufname: values.rufname || "",
    rasse: values.rasse || "",
    geschlecht: values.geschlecht || "",
    geburtsdatum: values.geburtsdatum || "",
    gewichtKg: toNumber(values.gewichtKg),
    groesseCm: toNumber(values.groesseCm),
    kundenId: values.kundenId,
    trainingsziele: values.trainingsziele || "",
    notizen: values.notizen || "",
  };
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatKundeName(kunde = {}) {
  const parts = [kunde.vorname, kunde.nachname].filter((part) => Boolean(part && part.trim()));
  const combined = parts.join(" ").trim();
  if (combined) return combined;
  if (kunde.email) return kunde.email;
  return kunde.id || "Unbekannter Kunde";
}

async function isHundeIdDuplicate(hundeId, currentId) {
  const normalized = (hundeId || "").trim();
  if (!normalized) return false;
  const hunde = await listHunde();
  return hunde.some((hund) => {
    const existing = (hund.hundeId || "").trim();
    if (!existing) return false;
    if (currentId && hund.id === currentId) return false;
    return existing === normalized;
  });
}

function generateNextHundeId(hundeListe = []) {
  let maxNumber = 0;
  hundeListe.forEach((hund) => {
    const raw = (hund?.hundeId || hund?.id || "").trim();
    const match = raw.match(/(\d+)/);
    if (!match) return;
    const num = Number.parseInt(match[1], 10);
    if (Number.isFinite(num) && num > maxNumber) {
      maxNumber = num;
    }
  });
  const next = maxNumber + 1;
  return `H-${String(next).padStart(3, "0")}`;
}

async function handleHundFormSubmit(event, { mode, id, refs, section, submit }) {
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
  const busyLabel = mode === "create" ? "Erstelle ..." : "Speichere ...";
  submit.disabled = true;
  submit.textContent = busyLabel;

  try {
    const hasDuplicate = await isHundeIdDuplicate(values.hundeId, mode === "edit" ? id : null);
    if (hasDuplicate) {
      showInlineToast(section, "Hunde-ID ist bereits vergeben.", "error");
      submit.disabled = false;
      submit.textContent = defaultLabel;
      return;
    }
    const result = mode === "create" ? await createHund(payload) : await updateHund(id, payload);
    if (!result?.id) {
      throw new Error("Hund speichern ohne ID");
    }
    setHundToast(
      mode === "create" ? "Hund wurde erstellt." : "Hund wurde aktualisiert.",
      "success"
    );
    window.location.hash = `#/hunde/${result.id}`;
  } catch (error) {
    console.error("[HUNDE_ERR_FORM_SUBMIT]", error);
    const message =
      mode === "create"
        ? "Hund konnte nicht erstellt werden."
        : "Hund konnte nicht aktualisiert werden.";
    showInlineToast(section, message, "error");
    submit.disabled = false;
    submit.textContent = defaultLabel;
  }
}

export function setHundToast(message, tone = "info") {
  window[TOAST_KEY] = { message, tone };
}

export function injectHundToast(section) {
  if (!section) return;
  section.querySelectorAll(".hunde-toast").forEach((node) => node.remove());
  const toast = window[TOAST_KEY];
  if (!toast) return;
  delete window[TOAST_KEY];
  const { message, tone = "info" } =
    typeof toast === "string" ? { message: toast, tone: "info" } : toast;
  const notice = document.createElement("p");
  notice.className = `hunde-toast hunde-toast--${tone}`;
  notice.setAttribute("role", tone === "error" ? "alert" : "status");
  notice.textContent = message;
  section.prepend(notice);
}

function showInlineToast(section, message, tone = "info") {
  setHundToast(message, tone);
  injectHundToast(section);
}

function buildBackButton() {
  const button = createButton({
    label: "Zur Liste",
    variant: "secondary",
    onClick: () => {
      window.location.hash = "#/hunde";
    },
  });
  button.type = "button";
  return button;
}

function focusHeading(root) {
  const heading = root.querySelector("h1, h2");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
}
