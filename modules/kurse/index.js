// Standardized module interface for Dogule1
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
import { listKurse } from "../shared/api/index.js";

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
  const createBtn = createButton({
    label: "Neuer Kurs",
    variant: "primary",
  });
  createBtn.addEventListener("click", () => {
    window.location.hash = "#/kurse/new";
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
  body.textContent = "Kurse werden geladen ...";
  try {
    const courses = await listKurse();
    body.innerHTML = "";
    if (!courses.length) {
      const emptyAction = createButton({
        label: "Neuer Kurs",
        variant: "primary",
      });
      emptyAction.addEventListener("click", () => {
        window.location.hash = "#/kurse/new";
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
      body.appendChild(cardEl);
    });
  } catch (error) {
    console.error("KURSE_LOAD_FAILED", error);
    body.innerHTML = "";
    const noticeFragment = createNotice("Fehler beim Laden der Kurse.", {
      variant: "warn",
      role: "alert",
    });
    const retryBtn = createButton({
      label: "Erneut versuchen",
      variant: "secondary",
    });
    retryBtn.addEventListener("click", () => populateCourses(cardElement));
    const noticeEl = noticeFragment.firstElementChild;
    if (noticeEl) {
      noticeEl.appendChild(retryBtn);
    }
    body.appendChild(noticeFragment);
  }
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
