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
