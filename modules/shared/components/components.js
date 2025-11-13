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
