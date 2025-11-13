// Standardized module interface for Dogule1
/* globals document, console */
import {
  createBadge,
  createButton,
  createCard,
  createEmptyState,
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

  const listCard = buildCourseListCard();
  section.appendChild(buildCourseToolbarCard());
  section.appendChild(listCard);
  section.appendChild(buildCourseFormCard());

  fragment.appendChild(section);
  container.appendChild(fragment);

  await populateCourses(listCard);
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
  body.appendChild(
    createButton({
      label: "Neuer Kurs",
      variant: "primary",
    })
  );
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
  body.textContent = "Lade Kurse…";
  return cardElement;
}

function buildCourseFormCard() {
  const cardFragment = createCard({
    eyebrow: "",
    title: "Kurs erfassen",
    body: "",
    footer: "",
  });
  const cardElement = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!cardElement) return document.createDocumentFragment();

  const body = cardElement.querySelector(".ui-card__body");
  body.appendChild(
    createFormRow({
      id: "kurs-titel",
      label: "Titel",
      placeholder: "z. B. Anfänger 1",
    })
  );
  body.appendChild(
    createFormRow({
      id: "kurs-trainer",
      label: "Trainer",
      placeholder: "z. B. Martina Frei",
    })
  );
  body.appendChild(
    createFormRow({
      id: "kurs-datum",
      label: "Datum",
      type: "date",
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

async function populateCourses(cardElement) {
  const body = cardElement.querySelector(".ui-card__body");
  body.textContent = "Lade Kurse…";
  try {
    const courses = await list("kurse");
    body.innerHTML = "";
    if (!courses.length) {
      body.appendChild(
        createEmptyState("Keine Kurse vorhanden", "Lege einen neuen Kurs an.", {
          actionNode: createButton({
            label: "Neuer Kurs",
            variant: "primary",
          }),
        })
      );
      return;
    }

    courses.forEach((course) => {
      const courseCard = createCard({
        eyebrow: course.trainer,
        title: course.titel,
        body: `<p>${course.datum ?? "Termin folgt"}</p>`,
        footer: "",
      });
      const cardEl = courseCard.querySelector(".ui-card") || courseCard.firstElementChild;
      if (!cardEl) return;
      cardEl.querySelector(".ui-card__footer").appendChild(createBadge("Geplant", "info"));
      body.appendChild(cardEl);
    });
  } catch (error) {
    console.error("KURSE_LOAD_FAILED", error);
    body.innerHTML = "";
    body.appendChild(
      createNotice("Kurse konnten nicht geladen werden.", {
        variant: "warn",
        role: "alert",
      })
    );
  }
}
