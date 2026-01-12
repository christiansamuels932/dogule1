/* globals document */

export function renderCard({ title, subtitle = "", body = "" }) {
  const template = document.getElementById("dogule-card");
  if (!template) {
    throw new Error("Template #dogule-card not found");
  }

  const node = template.content.cloneNode(true);
  node.querySelector(".dogule-card__title").textContent = title;
  node.querySelector(".dogule-card__subtitle").textContent = subtitle;
  node.querySelector(".dogule-card__body").innerHTML = body;
  return node;
}

export function renderAlert({ title, message }) {
  const template = document.getElementById("dogule-alert");
  if (!template) {
    throw new Error("Template #dogule-alert not found");
  }

  const node = template.content.cloneNode(true);
  node.querySelector(".dogule-alert__title").textContent = title;
  node.querySelector(".dogule-alert__message").textContent = message;
  return node;
}

export function createButton({ label, variant = "primary", onClick } = {}) {
  const template = document.getElementById("ui-btn");
  if (!template) {
    throw new Error("Template #ui-btn not found");
  }

  const clone = template.content.firstElementChild.cloneNode(true);
  clone.textContent = label || "";
  if (variant) {
    clone.classList.add(`ui-btn--${variant}`);
  }
  if (typeof onClick === "function") {
    clone.addEventListener("click", onClick);
  }
  return clone;
}

export function createCard({ eyebrow = "", title = "", body = "", footer = "" } = {}) {
  const template = document.getElementById("ui-card");
  if (!template) {
    throw new Error("Template #ui-card not found");
  }

  const node = template.content.cloneNode(true);
  node.querySelector(".ui-card__eyebrow").textContent = eyebrow;
  node.querySelector(".ui-card__title").textContent = title;
  node.querySelector(".ui-card__body").innerHTML = body;
  node.querySelector(".ui-card__footer").innerHTML = footer;
  return node;
}

export function createSectionHeader({ title, subtitle = "", level = 2 } = {}) {
  const template = document.getElementById("ui-section");
  if (!template) {
    throw new Error("Template #ui-section not found");
  }

  const fragment = template.content.cloneNode(true);
  const titleEl = fragment.querySelector(".ui-section__title");
  const subtitleEl = fragment.querySelector(".ui-section__subtitle");
  titleEl.textContent = title || "";
  const headingLevel = Number(level);
  if (headingLevel && headingLevel !== 2) {
    titleEl.setAttribute("aria-level", String(headingLevel));
  }
  subtitleEl.textContent = subtitle || "";
  subtitleEl.hidden = !subtitle;
  return fragment;
}

export function createBadge(text, variant = "default") {
  const template = document.getElementById("ui-badge");
  if (!template) {
    throw new Error("Template #ui-badge not found");
  }

  const clone = template.content.firstElementChild.cloneNode(true);
  const allowed = new Set(["default", "info", "ok", "warn"]);
  const resolvedVariant = allowed.has(variant) ? variant : "default";
  clone.classList.remove("ui-badge--default", "ui-badge--info", "ui-badge--ok", "ui-badge--warn");
  clone.classList.add(`ui-badge--${resolvedVariant}`);
  clone.textContent = text || "";
  return clone;
}

export function createNotice(text, { variant = "info", role = "status" } = {}) {
  const template = document.getElementById("ui-notice");
  if (!template) {
    throw new Error("Template #ui-notice not found");
  }

  const allowed = new Set(["info", "ok", "warn"]);
  const resolvedVariant = allowed.has(variant) ? variant : "info";
  const fragment = template.content.cloneNode(true);
  const section = fragment.firstElementChild;
  section.classList.remove("ui-notice--info", "ui-notice--ok", "ui-notice--warn");
  section.classList.add(`ui-notice--${resolvedVariant}`);
  section.setAttribute("role", role === "alert" ? "alert" : "status");
  section.querySelector(".ui-notice__content").textContent = text || "";
  return fragment;
}

export function createEmptyState(title, hint, { actionNode } = {}) {
  const template = document.getElementById("ui-empty");
  if (!template) {
    throw new Error("Template #ui-empty not found");
  }

  const fragment = template.content.cloneNode(true);
  fragment.querySelector(".ui-empty__title").textContent = title || "";
  fragment.querySelector(".ui-empty__hint").textContent = hint || "";
  const actions = fragment.querySelector(".ui-empty__actions");
  if (actions && actionNode) {
    actions.appendChild(actionNode);
  }
  return fragment;
}

export function createFormRow({
  id,
  label,
  control = "input",
  type = "text",
  placeholder = "",
  value = "",
  required = false,
  describedByText = "",
  options = [],
  visuallyHiddenLabel = false,
} = {}) {
  if (!id) {
    throw new Error("createFormRow requires an id");
  }

  const template = document.getElementById("ui-form-row-template");
  if (!template) {
    throw new Error("Template #ui-form-row-template not found");
  }

  const fragment = template.content.cloneNode(true);
  const row = fragment.firstElementChild;
  const labelEl = row.querySelector(".ui-form-row__label");
  const controlHost = row.querySelector(".ui-form-row__control");
  const hintEl = row.querySelector(".ui-form-row__hint");

  labelEl.textContent = label || "";
  labelEl.setAttribute("for", id);
  if (visuallyHiddenLabel) {
    labelEl.classList.add("sr-only");
  } else {
    labelEl.classList.remove("sr-only");
  }

  const controlNode = buildControl({
    id,
    control,
    type,
    placeholder,
    value,
    required,
    options,
  });
  controlHost.appendChild(controlNode);

  if (describedByText) {
    const hintId = `${id}-hint`;
    hintEl.textContent = describedByText;
    hintEl.id = hintId;
    hintEl.classList.remove("sr-only");
    controlNode.setAttribute("aria-describedby", hintId);
  } else {
    hintEl.classList.add("sr-only");
  }

  return row;
}

function buildControl({ id, control, type, placeholder, value, required, options }) {
  const controlType = control.toLowerCase();
  if (controlType === "textarea") {
    const textarea = document.createElement("textarea");
    textarea.id = id;
    textarea.placeholder = placeholder;
    textarea.required = Boolean(required);
    textarea.value = value;
    return textarea;
  }

  if (controlType === "select") {
    const select = document.createElement("select");
    select.id = id;
    select.required = Boolean(required);
    options.forEach(({ value: optionValue, label, selected }) => {
      const optionEl = document.createElement("option");
      optionEl.value = optionValue ?? "";
      optionEl.textContent = label ?? "";
      if (selected) optionEl.selected = true;
      select.appendChild(optionEl);
    });
    return select;
  }

  const input = document.createElement("input");
  input.id = id;
  input.type = type || "text";
  input.placeholder = placeholder;
  input.required = Boolean(required);
  input.value = value;
  return input;
}

export function createLinkedTrainerCard(trainer = {}, { href = "", showContact = true } = {}) {
  const cardFragment = createCard({
    eyebrow: trainer.code || trainer.id || "Trainer",
    title: trainer.name || "Trainer",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return null;
  const body = card.querySelector(".ui-card__body");
  const footer = card.querySelector(".ui-card__footer");
  body.innerHTML = "";
  footer.innerHTML = "";

  const meta = document.createElement("dl");
  meta.className = "ui-trainer-card__meta";
  const addRow = (label, value) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value || "–";
    meta.append(dt, dd);
  };
  addRow("Trainer-ID", trainer.id || "–");
  addRow("Code", trainer.code || "–");
  if (showContact) {
    addRow("E-Mail", trainer.email || "–");
    addRow("Telefon", trainer.telefon || "–");
  }
  body.appendChild(meta);

  if (href) {
    const link = document.createElement("a");
    link.href = href;
    link.className = "ui-btn ui-btn--secondary";
    link.textContent = "Zum Trainer";
    footer.appendChild(link);
  }

  return card;
}
