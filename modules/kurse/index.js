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
import { listKurse, getKurs } from "../shared/api/index.js";

let kursCache = [];

export async function initModule(container, routeContext = { segments: [] }) {
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "dogule-section kurse-view";
  container.appendChild(section);

  const { view, id } = resolveView(routeContext);

  try {
    if (view === "detail" && id) {
      await renderDetail(section, id);
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

  const toolbar = buildCourseToolbarCard();
  const listCard = buildCourseListCard();
  const formCard = buildCourseFormCard();

  section.appendChild(toolbar);
  section.appendChild(listCard);
  section.appendChild(formCard);

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
    footer.append(
      createButton({
        label: "Kurs bearbeiten",
        variant: "primary",
        onClick: () => {
          window.location.hash = `#/kurse/${kurs.id}/edit`;
        },
      }),
      createButton({
        label: "Kurs löschen",
        variant: "secondary",
        onClick: () => {
          window.alert?.("Löschfunktion folgt demnächst.");
        },
      })
    );
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

function focusHeading(root) {
  const heading = root.querySelector("h1, h2");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
}
