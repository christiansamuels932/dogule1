// Standardized module interface for Dogule1
/* globals document, window */
import {
  createBadge,
  createButton,
  createCard,
  createEmptyState,
  createFormRow,
  createNotice,
  createSectionHeader,
} from "../../shared/components/components.js";

export function initModule(container) {
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

  const customers = [];
  if (!customers.length) {
    const emptyState = createEmptyState(
      "Keine Kunden vorhanden",
      "Fügen Sie einen neuen Kunden hinzu.",
      {
        actionNode: createButton({
          label: "Neuen Kunden anlegen",
          variant: "primary",
          onClick: () => {
            window.location.hash = "#/kunden";
          },
        }),
      }
    );
    listBody.appendChild(emptyState);
    return cardElement;
  }

  customers.forEach((customer) => {
    const customerCard = createCard({
      eyebrow: customer.id,
      title: customer.name,
      body: `<p>${customer.email}</p>`,
      footer: "",
    });
    const cardEl = customerCard.querySelector(".ui-card") || customerCard.firstElementChild;
    if (!cardEl) return;
    cardEl.querySelector(".ui-card__footer").appendChild(createBadge("Aktiv", "ok"));
    listBody.appendChild(cardEl);
  });

  return cardElement;
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
