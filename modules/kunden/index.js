// Kunden module – list/detail/form flows with mock API
/* globals document, console, window */
import {
  listKunden,
  getKunde,
  createKunde,
  updateKunde,
  deleteKunde,
} from "../shared/api/kunden.js";
import { listHunde } from "../shared/api/hunde.js";
import { listKurse } from "../shared/api/kurse.js";
import { listFinanzen } from "../shared/api/finanzen.js";
import {
  createSectionHeader,
  createCard,
  createEmptyState,
  createNotice,
  createFormRow,
  createButton,
} from "../shared/components/components.js";

let kundenCache = [];
const TOAST_KEY = "__DOGULE_KUNDEN_TOAST__";

function createSectionBlock({ title, subtitle = "", level = 2, className = "" } = {}) {
  const section = document.createElement("section");
  const baseClass = "dogule-section kunden-section";
  section.className = className ? `${baseClass} ${className}` : baseClass;
  section.appendChild(
    createSectionHeader({
      title,
      subtitle,
      level,
    })
  );
  return section;
}

function createStandardCard(title = "", eyebrow = "") {
  const fragment = createCard({
    eyebrow,
    title,
    body: "",
    footer: "",
  });
  return fragment.querySelector(".ui-card") || fragment.firstElementChild;
}

function createUiLink(label, href, variant = "primary") {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  link.className = "ui-btn";
  if (variant) {
    link.classList.add(`ui-btn--${variant}`);
  }
  return link;
}

function appendSharedEmptyState(target) {
  if (!target) return;
  const fragment = createEmptyState("Keine Daten vorhanden.", "");
  target.appendChild(fragment);
}

function createErrorNotice() {
  return createNotice("Fehler beim Laden der Daten.", {
    variant: "warn",
    role: "alert",
  });
}

function showErrorNotice(target, { replace = true } = {}) {
  if (!target) return;
  if (replace) {
    target.innerHTML = "";
  }
  target.appendChild(createErrorNotice());
}

function mapToneToNoticeVariant(tone = "info") {
  if (tone === "success") return "ok";
  if (tone === "error" || tone === "warn") return "warn";
  return "info";
}

export async function initModule(container, routeContext = { segments: [] }) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("kunden-view");
  const viewRoot = document.createElement("div");
  viewRoot.className = "kunden-view__content";
  container.appendChild(viewRoot);

  if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const { view, id } = resolveView(routeContext);

  try {
    if (view === "list") {
      await renderList(viewRoot);
    } else if (view === "detail" && id) {
      await renderDetail(viewRoot, id);
    } else if (view === "create" || (view === "edit" && id)) {
      await renderForm(viewRoot, view, id);
    } else {
      renderUnknownView(viewRoot);
    }
  } catch (error) {
    console.error("[KUNDEN_ERR_ROUTE]", error);
    renderLoadError(viewRoot);
  }
}

function renderUnknownView(root) {
  if (!root) return;
  root.innerHTML = "";
  const section = createSectionBlock({
    title: "Unbekannte Ansicht",
    subtitle: "Diese Route wird aktuell nicht unterstützt.",
    level: 1,
  });
  section.appendChild(createErrorNotice());
  const note = document.createElement("p");
  note.textContent = `Der Pfad "${window.location.hash}" wird noch nicht unterstützt.`;
  section.appendChild(note);
  section.appendChild(createUiLink("Zur Kundenliste", "#/kunden", "quiet"));
  root.appendChild(section);
  focusHeading(root);
}

function renderLoadError(root) {
  if (!root) return;
  root.innerHTML = "";
  const section = createSectionBlock({
    title: "Fehler",
    subtitle: "Die Kundenansicht konnte nicht geladen werden.",
    level: 1,
  });
  section.appendChild(createErrorNotice());
  section.appendChild(createUiLink("Zur Kundenliste", "#/kunden", "quiet"));
  root.appendChild(section);
  focusHeading(root);
}

function resolveView(routeContext = {}) {
  const segments = routeContext.segments || [];
  if (!segments.length) return { view: "list" };
  const [first, second] = segments;
  if (first === "new") return { view: "create" };
  if (second === "edit") return { view: "edit", id: first };
  return { view: "detail", id: first };
}

async function fetchKunden() {
  kundenCache = await listKunden();
  return kundenCache;
}

function focusHeading(root) {
  if (!root) return;
  const heading = root.querySelector("h1, h2");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }
}

async function renderList(root) {
  if (!root) return;
  root.innerHTML = "";

  const section = createSectionBlock({
    title: "Kunden",
    subtitle: "Übersicht über alle Kundinnen und Kunden",
    level: 1,
  });
  injectToast(section);
  section.appendChild(
    createNotice("Verwalte Stammdaten, verbundene Hunde und Kurse an einem Ort.", {
      variant: "info",
    })
  );

  const actionsCard = createStandardCard("Aktionen");
  const actionBody = actionsCard.querySelector(".ui-card__body");
  actionBody.innerHTML = "";
  actionBody.appendChild(createUiLink("Neuer Kunde", "#/kunden/new", "primary"));

  const listCard = createStandardCard("Kundenliste");
  const listBody = listCard.querySelector(".ui-card__body");
  listBody.innerHTML = "";

  let kunden = [];
  try {
    kunden = await fetchKunden();
  } catch (error) {
    console.error("[KUNDEN_ERR_LIST_LOAD]", error);
    showErrorNotice(listBody);
    section.append(actionsCard, listCard);
    root.appendChild(section);
    focusHeading(root);
    return;
  }

  if (!kunden.length) {
    appendSharedEmptyState(listBody);
  } else {
    const listWrapper = document.createElement("div");
    listWrapper.className = "kunden-list";
    kunden.forEach((kunde) => {
      const kundCardFragment = createCard({
        eyebrow: kunde.kundenCode || kunde.id,
        title: formatFullName(kunde),
        body: `<p>${kunde.email?.trim() || "keine E-Mail"}</p>`,
        footer: "",
      });
      const cardElement =
        kundCardFragment.querySelector(".ui-card") || kundCardFragment.firstElementChild;
      if (!cardElement) return;
      cardElement.classList.add("kunden-list-item");
      const link = document.createElement("a");
      link.href = `#/kunden/${kunde.id}`;
      link.className = "kunden-list__link";
      link.setAttribute("aria-label", `${formatFullName(kunde)} öffnen`);
      link.appendChild(cardElement);
      listWrapper.appendChild(link);
    });
    listBody.appendChild(listWrapper);
  }

  section.append(actionsCard, listCard);
  root.appendChild(section);
  focusHeading(root);
}

async function renderDetail(root, id) {
  if (!root) return;
  let kunde = null;
  try {
    if (!kundenCache.length) {
      await fetchKunden();
    }
    kunde = kundenCache.find((k) => k.id === id);
    if (!kunde) {
      kunde = await getKunde(id);
    }
  } catch (error) {
    console.error("[KUNDEN_ERR_DETAIL_LOAD]", error);
    root.innerHTML = "";
    const fallbackSection = document.createElement("section");
    fallbackSection.className = "dogule-section kunden-section kunden-detail";
    fallbackSection.appendChild(
      createSectionHeader({
        title: "Kunde",
        subtitle: "",
        level: 1,
      })
    );
    const errorCard = createStandardCard("Stammdaten");
    const errorBody = errorCard.querySelector(".ui-card__body");
    showErrorNotice(errorBody);
    fallbackSection.appendChild(errorCard);
    root.appendChild(fallbackSection);
    focusHeading(root);
    return;
  }

  root.innerHTML = "";
  const detailSection = document.createElement("section");
  detailSection.className = "dogule-section kunden-section kunden-detail";
  detailSection.appendChild(
    createSectionHeader({
      title: "Kunde",
      subtitle: kunde ? formatFullName(kunde) : "",
      level: 1,
    })
  );

  if (!kunde) {
    detailSection.appendChild(
      createNotice(`Kein Eintrag mit ID ${id} vorhanden.`, {
        variant: "warn",
        role: "alert",
      })
    );
    detailSection.appendChild(createUiLink("Zur Kundenliste", "#/kunden", "quiet"));
    root.appendChild(detailSection);
    focusHeading(root);
    return;
  }

  injectToast(detailSection);
  const detailCard = createStandardCard("Stammdaten");
  const detailBody = detailCard.querySelector(".ui-card__body");
  const rows = [
    { label: "Kunden-ID", value: kunde.kundenCode || kunde.id },
    { label: "Name", value: formatFullName(kunde) },
    { label: "E-Mail", value: kunde.email },
    { label: "Telefon", value: kunde.telefon },
    { label: "Adresse", value: kunde.adresse },
    { label: "Notizen", value: kunde.notizen },
    { label: "Erstellt am", value: formatDateTime(kunde.createdAt) },
    { label: "Aktualisiert am", value: formatDateTime(kunde.updatedAt) },
  ];
  detailBody.innerHTML = "";
  detailBody.appendChild(createDefinitionList(rows));
  detailSection.appendChild(detailCard);

  const actionsCard = createStandardCard("Aktionen");
  const actionsBody = actionsCard.querySelector(".ui-card__body");
  const editLink = createUiLink("Bearbeiten", `#/kunden/${id}/edit`, "primary");
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "ui-btn ui-btn--secondary";
  deleteBtn.dataset.action = "delete";
  deleteBtn.textContent = "Löschen";
  const backLink = createUiLink("Zur Übersicht", "#/kunden", "quiet");
  actionsBody.append(editLink, deleteBtn, backLink);
  const actionStatus = document.createElement("div");
  actionStatus.className = "kunden-card-status";
  actionsBody.appendChild(actionStatus);
  detailSection.appendChild(actionsCard);

  root.appendChild(detailSection);

  let linkedHunde = [];
  let hundeLoadFailed = false;
  try {
    const hunde = await listHunde();
    linkedHunde = hunde.filter((hund) => hund.kundenId === id);
  } catch (error) {
    hundeLoadFailed = true;
    console.error("[KUNDEN_ERR_HUNDE_LOAD]", error);
  }

  let linkedKurse = [];
  let kurseLoadFailed = false;
  if (linkedHunde.length) {
    try {
      const kurse = await listKurse();
      const hundIds = new Set(linkedHunde.map((hund) => hund.id));
      const filtered = kurse.filter(
        (kurs) => Array.isArray(kurs.hundIds) && kurs.hundIds.some((hundId) => hundIds.has(hundId))
      );
      const unique = [];
      const seen = new Set();
      filtered.forEach((kurs) => {
        if (seen.has(kurs.id)) return;
        seen.add(kurs.id);
        unique.push(kurs);
      });
      linkedKurse = unique;
    } catch (error) {
      kurseLoadFailed = true;
      console.error("[KUNDEN_ERR_KURSE_LOAD]", error);
    }
  } else if (hundeLoadFailed) {
    kurseLoadFailed = true;
  }

  root.appendChild(renderKundenHundeSection(linkedHunde, hundeLoadFailed));
  root.appendChild(renderKundenKurseSection(linkedKurse, kurseLoadFailed));
  let finanzen = [];
  let finanzenLoadFailed = false;
  try {
    finanzen = await loadFinanzen(id);
  } catch (error) {
    finanzenLoadFailed = true;
    console.error("[KUNDEN_ERR_FINANZEN_LOAD]", error);
  }
  root.appendChild(renderFinanzOverview(finanzen, finanzenLoadFailed));
  root.appendChild(renderOffeneBetraege(finanzen, finanzenLoadFailed));
  root.appendChild(renderZahlungshistorie(finanzen, finanzenLoadFailed));

  deleteBtn.addEventListener("click", async () => {
    if (deleteBtn.disabled) return;
    const confirmed = window.confirm(`Soll "${formatFullName(kunde)}" wirklich gelöscht werden?`);
    if (!confirmed) return;
    deleteBtn.disabled = true;
    const originalLabel = deleteBtn.textContent;
    deleteBtn.textContent = "Lösche ...";
    let deleted = false;
    try {
      const result = await deleteKunde(id);
      if (!result?.ok) {
        throw new Error("Delete failed");
      }
      await fetchKunden();
      deleted = true;
      setToast("Kunde gelöscht.", "success");
      window.location.hash = "#/kunden";
    } catch (error) {
      console.error("[KUNDEN_ERR_DELETE]", error);
      showErrorNotice(actionStatus);
    } finally {
      if (!deleted) {
        deleteBtn.disabled = false;
        deleteBtn.textContent = originalLabel;
      }
    }
  });

  focusHeading(root);
}

async function renderForm(root, view, id) {
  if (!root) return;
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  try {
    if (!kundenCache.length) {
      await fetchKunden();
    }
  } catch (error) {
    console.error("[KUNDEN_ERR_FORM_INIT]", error);
    root.innerHTML = "";
    const fallbackSection = createSectionBlock({
      title: "Kundenformular",
      subtitle: "",
      level: 1,
    });
    const card = createStandardCard("Stammdaten");
    const body = card.querySelector(".ui-card__body");
    showErrorNotice(body);
    fallbackSection.appendChild(card);
    root.appendChild(fallbackSection);
    focusHeading(root);
    return;
  }
  const mode = view === "create" ? "create" : "edit";
  let existing = null;

  if (mode === "edit") {
    try {
      existing = kundenCache.find((k) => k.id === id) || (await getKunde(id));
    } catch (error) {
      console.error("[KUNDEN_ERR_FORM_LOAD]", error);
      root.innerHTML = "";
      const section = createSectionBlock({
        title: "Kunde bearbeiten",
        subtitle: "",
        level: 1,
      });
      const card = createStandardCard("Stammdaten");
      const body = card.querySelector(".ui-card__body");
      showErrorNotice(body);
      section.appendChild(card);
      root.appendChild(section);
      focusHeading(root);
      return;
    }
    if (!existing) {
      root.innerHTML = "";
      const section = createSectionBlock({
        title: "Kunde nicht gefunden",
        subtitle: `ID ${id} ist nicht verfügbar.`,
        level: 1,
      });
      section.appendChild(
        createNotice("Kein Eintrag vorhanden. Kehre zur Liste zurück und versuche es erneut.", {
          variant: "warn",
          role: "alert",
        })
      );
      section.appendChild(createUiLink("Zur Kundenliste", "#/kunden", "quiet"));
      root.appendChild(section);
      focusHeading(root);
      return;
    }
  }

  root.innerHTML = "";
  const section = createSectionBlock({
    title: mode === "create" ? "Neuer Kunde" : "Kunde bearbeiten",
    subtitle: mode === "edit" ? formatFullName(existing) : "Formular für neue Kundendaten",
    level: 1,
  });
  injectToast(section);

  const formCard = createStandardCard("Stammdaten");
  const formBody = formCard.querySelector(".ui-card__body");
  formBody.innerHTML = "";
  const formStatusSlot = document.createElement("div");
  formStatusSlot.className = "kunden-card-status";
  formBody.appendChild(formStatusSlot);

  const form = document.createElement("form");
  form.noValidate = true;
  form.className = "kunden-form";
  formBody.appendChild(form);

  const kundenCodeValue =
    mode === "edit" ? (existing?.kundenCode ?? "") : generateNextKundenCode(kundenCache);

  const fields = [
    {
      name: "kundenCode",
      label: "Kunden-ID*",
      required: true,
      readOnly: true,
      value: kundenCodeValue,
      describedByText: "Manuelle Überschreibung folgt in einem späteren Schritt.",
    },
    {
      name: "vorname",
      label: "Vorname*",
      required: true,
      placeholder: "z. B. Julia",
    },
    {
      name: "nachname",
      label: "Nachname*",
      required: true,
      placeholder: "z. B. Keller",
    },
    {
      name: "email",
      label: "E-Mail*",
      required: true,
      type: "email",
      placeholder: "z. B. julia.keller@example.com",
    },
    {
      name: "telefon",
      label: "Telefon",
      placeholder: "z. B. +41 44 123 45 67",
    },
    {
      name: "adresse",
      label: "Adresse",
      placeholder: "z. B. Hauptstrasse 10, 8000 Zürich",
    },
    {
      name: "notizen",
      label: "Notizen",
      textarea: true,
      placeholder: "Optionale Ergänzungen zum Kundenprofil",
    },
  ];

  const refs = {};
  fields.forEach((field) => {
    const row = createFormRow({
      id: `kunden-${field.name}`,
      label: field.label,
      control: field.textarea ? "textarea" : "input",
      type: field.type || "text",
      placeholder: field.placeholder || "",
      required: Boolean(field.required),
      describedByText: field.describedByText || "",
    });
    const input = row.querySelector("input, textarea");
    input.name = field.name;
    const initialValue = field.value !== undefined ? field.value : (existing?.[field.name] ?? "");
    input.value = initialValue || "";
    if (field.readOnly) {
      input.readOnly = true;
    }
    const hint = row.querySelector(".ui-form-row__hint");
    if (!field.describedByText) {
      hint.classList.add("sr-only");
    }
    refs[field.name] = { input, hint };
    form.appendChild(row);
  });

  const actions = document.createElement("div");
  actions.className = "kunden-actions";
  const submit = createButton({
    label: mode === "create" ? "Erstellen" : "Speichern",
    variant: "primary",
  });
  submit.type = "submit";
  const cancel = createButton({
    label: "Abbrechen",
    variant: "quiet",
  });
  cancel.type = "button";
  cancel.addEventListener("click", () => {
    window.location.hash = mode === "create" ? "#/kunden" : `#/kunden/${id}`;
  });
  actions.append(submit, cancel);
  const footer = formCard.querySelector(".ui-card__footer");
  footer.innerHTML = "";
  footer.appendChild(actions);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatusSlot.innerHTML = "";
    const values = collectValues(refs);
    const errors = validate(values);
    applyErrors(refs, errors);
    if (Object.keys(errors).length) {
      const firstError = Object.values(refs).find(
        (ref) => ref.hint && ref.hint.textContent && !ref.hint.classList.contains("sr-only")
      );
      if (firstError) firstError.input.focus();
      return;
    }

    const defaultLabel = mode === "create" ? "Erstellen" : "Speichern";
    const busyLabel = mode === "create" ? "Erstelle ..." : "Speichere ...";
    submit.disabled = true;
    submit.textContent = busyLabel;
    let success = false;
    try {
      const result = mode === "create" ? await createKunde(values) : await updateKunde(id, values);
      if (!result || !result.id) {
        throw new Error("Save failed");
      }
      await fetchKunden();
      success = true;
      if (mode === "create") {
        setToast("Kunde erstellt.", "success");
        window.location.hash = "#/kunden";
      } else {
        setToast("Änderungen gespeichert.", "success");
        window.location.hash = `#/kunden/${id}`;
      }
    } catch (error) {
      console.error("[KUNDEN_ERR_FORM_SAVE]", error);
      showErrorNotice(formStatusSlot, { replace: true });
    } finally {
      if (!success) {
        submit.disabled = false;
        submit.textContent = defaultLabel;
      }
    }
  });

  section.appendChild(formCard);
  root.appendChild(section);
  focusHeading(root);
}

function setToast(message, tone = "info") {
  window[TOAST_KEY] = { message, tone };
}

function injectToast(section) {
  if (!section) return;
  section.querySelectorAll(".kunden-toast").forEach((node) => node.remove());
  const toast = window[TOAST_KEY];
  if (!toast) return;
  delete window[TOAST_KEY];
  const { message, tone = "info" } =
    typeof toast === "string" ? { message: toast, tone: "info" } : toast;
  const fragment = createNotice(message, {
    variant: mapToneToNoticeVariant(tone),
    role: tone === "error" ? "alert" : "status",
  });
  const noticeElement = fragment.firstElementChild || fragment;
  if (noticeElement.classList) {
    noticeElement.classList.add("kunden-toast");
  }
  section.prepend(fragment);
}

function collectValues(refs) {
  const values = {};
  Object.entries(refs).forEach(([key, ref]) => {
    values[key] = ref.input.value.trim();
  });
  return values;
}

function validate(values) {
  const errors = {};
  if (!values.kundenCode) {
    errors.kundenCode = "Kunden-ID fehlt.";
  }
  if (!values.vorname) errors.vorname = "Bitte den Vornamen ausfüllen.";
  if (!values.nachname) errors.nachname = "Bitte den Nachnamen ausfüllen.";
  if (!values.email) {
    errors.email = "Bitte eine E-Mail-Adresse angeben.";
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
    errors.email = "Bitte eine gültige E-Mail-Adresse eingeben.";
  }
  return errors;
}

function applyErrors(refs, errors) {
  Object.entries(refs).forEach(([key, ref]) => {
    const hint = ref.hint;
    if (errors[key]) {
      if (hint) {
        hint.textContent = errors[key];
        hint.classList.remove("sr-only");
      }
      ref.input.setAttribute("aria-invalid", "true");
    } else {
      if (hint) {
        hint.textContent = "";
        hint.classList.add("sr-only");
      }
      ref.input.setAttribute("aria-invalid", "false");
    }
  });
}

function renderKundenHundeSection(hunde = [], hasError = false) {
  const section = createSectionBlock({
    title: "Hunde dieses Kunden",
    subtitle: "",
    level: 2,
  });
  const card = createStandardCard("Hunde");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (hasError) {
    showErrorNotice(body);
  } else if (!hunde.length) {
    appendSharedEmptyState(body);
  } else {
    const list = document.createElement("ul");
    list.className = "kunden-list";
    hunde.forEach((hund) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#/hunde/${hund.id}`;
      link.textContent = formatHundeListEntry(hund);
      item.appendChild(link);
      list.appendChild(item);
    });
    body.appendChild(list);
  }

  section.appendChild(card);
  return section;
}

function formatHundeListEntry(hund = {}) {
  const name = (hund.name || "").trim() || "Unbenannter Hund";
  const rufname = (hund.rufname || "").trim() || "kein Rufname";
  const rasse = (hund.rasse || "").trim() || "unbekannte Rasse";
  return `${name} – ${rufname} · ${rasse}`;
}

function generateNextKundenCode(list = []) {
  let max = 0;
  list.forEach((kunde) => {
    const source = (kunde.kundenCode || kunde.id || "").trim();
    const match = source.match(/(\d+)/);
    if (!match) return;
    const num = Number.parseInt(match[1], 10);
    if (Number.isFinite(num) && num > max) {
      max = num;
    }
  });
  const nextNumber = max + 1;
  return `K-${String(nextNumber).padStart(3, "0")}`;
}

function renderKundenKurseSection(kurse = [], hasError = false) {
  const section = createSectionBlock({
    title: "Kurse dieses Kunden",
    subtitle: "",
    level: 2,
  });
  const card = createStandardCard("Kurse");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (hasError) {
    showErrorNotice(body);
  } else if (!kurse.length) {
    appendSharedEmptyState(body);
  } else {
    kurse.forEach((kurs) => {
      const kursCardFragment = createCard({
        eyebrow: formatDateTime(kurs.date),
        title: kurs.title || "Ohne Titel",
        body: `<p>${kurs.location || "Ort folgt"}</p>`,
        footer: "",
      });
      const kursCard =
        kursCardFragment.querySelector(".ui-card") || kursCardFragment.firstElementChild;
      if (!kursCard) return;
      kursCard.classList.add("kunden-kurs-item");
      const kursLink = document.createElement("a");
      kursLink.className = "kunden-kurs-link";
      kursLink.href = `#/kurse/${kurs.id}`;
      kursLink.setAttribute("aria-label", `Kurs ${kurs.title || kurs.id} öffnen`);
      kursLink.appendChild(kursCard);
      body.appendChild(kursLink);
    });
  }

  section.appendChild(card);
  return section;
}

async function loadFinanzen(kundeId) {
  const finanzen = await listFinanzen();
  return finanzen.filter((entry) => entry.kundeId === kundeId);
}

function renderFinanzOverview(finanzen = [], hasError = false) {
  const section = createSectionBlock({
    title: "Finanzübersicht",
    subtitle: "",
    level: 2,
  });
  const card = createStandardCard("Zusammenfassung");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (hasError) {
    showErrorNotice(body);
  } else if (!finanzen.length) {
    appendSharedEmptyState(body);
  } else {
    const payments = finanzen
      .filter((entry) => entry.typ === "zahlung")
      .slice()
      .reverse();
    const latest = payments.length ? payments[payments.length - 1] : null;
    const openSum = finanzen
      .filter((entry) => entry.typ === "offen")
      .reduce((total, entry) => total + Number(entry.betrag || 0), 0);
    const infoList = document.createElement("dl");
    infoList.className = "kunden-finanz-info";
    const addInfoRow = (label, value) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      infoList.append(dt, dd);
    };
    addInfoRow(
      "Letzte Zahlung",
      latest
        ? `${formatDateTime(latest.datum)} – CHF ${Number(latest.betrag || 0).toFixed(2)}`
        : "Keine Zahlungen"
    );
    addInfoRow("Offen gesamt", `CHF ${openSum.toFixed(2)}`);
    body.appendChild(infoList);
    if (latest?.beschreibung) {
      const note = document.createElement("p");
      note.textContent = latest.beschreibung;
      body.appendChild(note);
    }
  }

  section.appendChild(card);
  return section;
}

function renderOffeneBetraege(finanzen = [], hasError = false) {
  const section = createSectionBlock({
    title: "Offene Beträge",
    subtitle: "",
    level: 2,
  });
  const card = createStandardCard("Offene Posten");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (hasError) {
    showErrorNotice(body);
  } else {
    const openEntries = finanzen.filter((entry) => entry.typ === "offen");
    if (!openEntries.length) {
      appendSharedEmptyState(body);
    } else {
      const sum = openEntries.reduce((total, entry) => total + Number(entry.betrag || 0), 0);
      const summary = document.createElement("p");
      const summaryLabel = document.createElement("strong");
      summaryLabel.textContent = "Total offen:";
      summary.append(summaryLabel, document.createTextNode(` CHF ${sum.toFixed(2)}`));
      body.appendChild(summary);

      const list = document.createElement("ul");
      list.className = "kunden-offene-liste";
      openEntries.forEach((entry) => {
        const item = document.createElement("li");
        const title = document.createElement("strong");
        title.textContent = entry.beschreibung || "Posten";
        const amountText = document.createTextNode(
          ` – CHF ${Number(entry.betrag || 0).toFixed(2)} (${formatDateTime(entry.datum)})`
        );
        item.append(title, amountText);
        list.appendChild(item);
      });
      body.appendChild(list);
    }
  }

  section.appendChild(card);
  return section;
}

function renderZahlungshistorie(finanzen = [], hasError = false) {
  const section = createSectionBlock({
    title: "Zahlungshistorie",
    subtitle: "",
    level: 2,
  });
  const card = createStandardCard("Zahlungen");
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  if (hasError) {
    showErrorNotice(body);
  } else {
    const payments = finanzen.filter((entry) => entry.typ === "zahlung");
    if (!payments.length) {
      appendSharedEmptyState(body);
    } else {
      const list = document.createElement("ul");
      list.className = "kunden-zahlungsliste";
      payments.forEach((entry) => {
        const item = document.createElement("li");
        const time = document.createElement("strong");
        time.textContent = formatDateTime(entry.datum);
        const amountText = document.createTextNode(
          ` – CHF ${Number(entry.betrag || 0).toFixed(2)} (${entry.beschreibung || "Zahlung"})`
        );
        item.append(time, amountText);
        list.appendChild(item);
      });
      body.appendChild(list);
    }
  }

  section.appendChild(card);
  return section;
}

function createDefinitionList(rows = []) {
  const list = document.createElement("dl");
  list.className = "kunden-details";
  rows.forEach(({ label, value }) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = valueOrDash(value);
    list.append(dt, dd);
  });
  return list;
}

function formatFullName(kunde = {}) {
  const fullName = `${kunde.vorname ?? ""} ${kunde.nachname ?? ""}`.trim();
  return fullName || "Unbenannt";
}

function valueOrDash(value) {
  if (value === null || value === undefined) return "–";
  const str = typeof value === "string" ? value.trim() : String(value);
  return str || "–";
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
