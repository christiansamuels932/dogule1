// Standardized module interface for Dogule1
/* globals document, window, console */
import {
  createButton,
  createCard,
  createFormRow,
  createNotice,
  createSectionHeader,
} from "../../shared/components/components.js";
import { list } from "../../shared/api/crud.js";

export async function initModule(container) {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const section = document.createElement("section");
  section.className = "dogule-section";
  section.appendChild(
    createSectionHeader({
      title: "Kunden",
      subtitle: "Verwaltung und Filter",
      level: 2,
    })
  );

  section.appendChild(
    createNotice("Bitte wähle einen Filter oder lege einen neuen Kunden an.", {
      variant: "info",
    })
  );

  section.appendChild(buildToolbarCard());
  section.appendChild(buildCustomersCard());
  section.appendChild(buildCreateFormCard());

  fragment.appendChild(section);
  container.appendChild(fragment);

  await populateKunden();
}

function buildToolbarCard() {
  const cardFragment = createCard({
    eyebrow: "",
    title: "Aktionen",
    body: "",
    footer: "",
  });
  const cardElement = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!cardElement) return document.createDocumentFragment();

  const body = cardElement.querySelector(".ui-card__body");
  body.appendChild(
    createButton({
      label: "Neuer Kunde",
      variant: "primary",
      onClick: () => {
        window.location.hash = "#/kunden";
      },
    })
  );
  body.appendChild(
    createButton({
      label: "Exportieren",
      variant: "secondary",
    })
  );

  return cardElement;
}

function buildCustomersCard() {
  const cardFragment = createCard({
    eyebrow: "",
    title: "Kundenliste",
    body: "",
    footer: "",
  });
  const cardElement = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!cardElement) return document.createDocumentFragment();

  const listBody = cardElement.querySelector(".ui-card__body");
  const list = document.createElement("ul");
  list.id = "kunden-list";
  listBody.appendChild(list);
  return cardElement;
}

async function populateKunden() {
  const listElement = document.querySelector("#kunden-list");
  if (!listElement) return;
  listElement.innerHTML = "<li>Lade Kunden…</li>";
  try {
    const customers = await list("kunden");
    if (!customers.length) {
      listElement.innerHTML = "<li>Keine Kunden vorhanden.</li>";
      return;
    }
    listElement.innerHTML = customers
      .map((customer) => `<li>${customer.name} – ${customer.hund} (${customer.kurs})</li>`)
      .join("");
  } catch (err) {
    console.error("KUNDEN_LOAD_FAILED", err);
    listElement.innerHTML = "<li>Fehler beim Laden der Kundendaten.</li>";
  }
}

function buildCreateFormCard() {
  const cardFragment = createCard({
    eyebrow: "",
    title: "Neuer Kunde",
    body: "",
    footer: "",
  });
  const cardElement = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!cardElement) return document.createDocumentFragment();

  const body = cardElement.querySelector(".ui-card__body");
  body.appendChild(
    createFormRow({
      id: "kunden-name",
      label: "Name",
      placeholder: "z. B. Anna Schmidt",
    })
  );
  body.appendChild(
    createFormRow({
      id: "kunden-email",
      label: "E-Mail",
      type: "email",
      placeholder: "anna@example.com",
    })
  );
  body.appendChild(
    createFormRow({
      id: "kunden-telefon",
      label: "Telefon",
      type: "tel",
      placeholder: "+49 160 000000",
    })
  );

  const footer = cardElement.querySelector(".ui-card__footer");
  footer.appendChild(
    createButton({
      label: "Speichern",
      variant: "primary",
    })
  );
  footer.appendChild(
    createButton({
      label: "Abbrechen",
      variant: "secondary",
    })
  );

  return cardElement;
}
