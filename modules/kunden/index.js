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
} from "../shared/components/components.js";

let kundenCache = [];
const TOAST_KEY = "__DOGULE_KUNDEN_TOAST__";

export async function initModule(container, routeContext = { segments: [] }) {
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "dogule-section kunden-view";
  container.appendChild(section);

  const { view, id } = resolveView(routeContext);

  try {
    if (view === "list") {
      await renderList(section);
    } else if (view === "detail" && id) {
      await renderDetail(section, id);
    } else if (view === "create" || (view === "edit" && id)) {
      await renderForm(section, view, id);
    } else {
      section.innerHTML = `
        <h1>Unbekannte Ansicht</h1>
        <p>Der Pfad "${window.location.hash}" wird noch nicht unterstützt.</p>
      `;
      focusHeading(section);
    }
  } catch (error) {
    console.error("KUNDEN_ROUTE_FAILED", error);
    section.innerHTML = `
      <h1>Fehler</h1>
      <p>Konnte Kundenansicht nicht laden.</p>
      <p><a href="#/kunden">Zurück zur Liste</a></p>
    `;
    focusHeading(section);
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

async function fetchKunden() {
  kundenCache = await listKunden();
  return kundenCache;
}

function focusHeading(root) {
  const heading = root.querySelector("h1");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }
}

async function renderList(section) {
  const kunden = await fetchKunden();
  section.innerHTML = `
    <header class="kunden-header">
      <h1>Kundenliste</h1>
      <a class="ui-btn ui-btn--primary" href="#/kunden/new">Neu</a>
    </header>
  `;
  injectToast(section);

  if (!kunden.length) {
    const empty = document.createElement("p");
    empty.textContent = "Noch keine Kunden.";
    section.appendChild(empty);
  } else {
    const list = document.createElement("ul");
    list.className = "kunden-list";
    kunden.forEach((kunde) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#/kunden/${kunde.id}`;
      const fullName = formatFullName(kunde);
      const email = kunde.email?.trim() || "keine E-Mail";
      link.textContent = `${fullName} – ${email}`;
      item.appendChild(link);
      list.appendChild(item);
    });
    section.appendChild(list);
  }

  focusHeading(section);
}

async function renderDetail(section, id) {
  if (!kundenCache.length) await fetchKunden();
  let kunde = kundenCache.find((k) => k.id === id);
  if (!kunde) kunde = await getKunde(id);

  if (!kunde) {
    section.innerHTML = `
      <h1>Kunde nicht gefunden</h1>
      <p>Kein Eintrag mit ID <strong>${id}</strong> vorhanden.</p>
      <p><a href="#/kunden">Zurück zur Liste</a></p>
    `;
    focusHeading(section);
    return;
  }

  const fullName = formatFullName(kunde);
  const detailRows = [
    { label: "Kunden-ID", value: kunde.kundenCode || kunde.id },
    { label: "Name", value: fullName },
    { label: "E-Mail", value: kunde.email },
    { label: "Telefon", value: kunde.telefon },
    { label: "Adresse", value: kunde.adresse },
    { label: "Notizen", value: kunde.notizen },
    { label: "Erstellt am", value: formatDateTime(kunde.createdAt) },
    { label: "Aktualisiert am", value: formatDateTime(kunde.updatedAt) },
  ]
    .map(({ label, value }) => `<dt>${label}</dt><dd>${valueOrDash(value)}</dd>`)
    .join("");

  let linkedHunde = [];
  try {
    const hunde = await listHunde();
    linkedHunde = hunde.filter((hund) => hund.kundenId === id);
  } catch (error) {
    console.error("KUNDEN_HUNDE_LOAD_FAILED", error);
  }
  let linkedKurse = [];
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
      console.error("KUNDEN_KURSE_LOAD_FAILED", error);
    }
  }

  section.innerHTML = `
    <h1>Kundendetails</h1>
    <dl class="kunden-details">
      ${detailRows}
    </dl>
    <div class="kunden-actions">
      <a class="ui-btn" href="#/kunden/${id}/edit">Bearbeiten</a>
      <button type="button" class="ui-btn ui-btn--secondary" data-action="delete">Löschen</button>
      <a class="ui-btn ui-btn--quiet" href="#/kunden">Zurück</a>
    </div>
  `;
  injectToast(section);
  const hundeSection = document.createElement("section");
  hundeSection.className = "kunden-hunde-section";
  hundeSection.appendChild(
    createSectionHeader({
      title: "Hunde",
      subtitle: "",
      level: 2,
    })
  );
  const hundeCardFragment = createCard({
    eyebrow: "",
    title: "",
    body: "",
    footer: "",
  });
  const hundeCard =
    hundeCardFragment.querySelector(".ui-card") || hundeCardFragment.firstElementChild;
  if (hundeCard) {
    const hundeBody = hundeCard.querySelector(".ui-card__body");
    if (hundeBody) {
      hundeBody.innerHTML = "";
      hundeBody.appendChild(renderKundenHundeList(linkedHunde));
    }
    hundeSection.appendChild(hundeCard);
  }
  section.appendChild(hundeSection);
  section.appendChild(renderKundenKurseSection(linkedKurse));
  const finanzData = await loadFinanzen(id);
  section.appendChild(renderFinanzOverview(finanzData));
  section.appendChild(renderOffeneBetraege(finanzData));
  section.appendChild(renderZahlungshistorie(finanzData));

  const deleteBtn = section.querySelector('[data-action="delete"]');
  deleteBtn?.addEventListener("click", async () => {
    if (deleteBtn.disabled) return;
    const confirmed = window.confirm(`Soll "${fullName}" wirklich gelöscht werden?`);
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
      console.error("KUNDEN_DELETE_FAILED", error);
      showInlineToast(section, "Löschen fehlgeschlagen. Bitte erneut versuchen.", "error");
    } finally {
      if (!deleted) {
        deleteBtn.disabled = false;
        deleteBtn.textContent = originalLabel;
      }
    }
  });

  focusHeading(section);
}

async function renderForm(section, view, id) {
  if (!kundenCache.length) await fetchKunden();
  const mode = view === "create" ? "create" : "edit";
  let existing = null;

  if (mode === "edit") {
    existing = kundenCache.find((k) => k.id === id) || (await getKunde(id));
    if (!existing) {
      section.innerHTML = `
        <h1>Kunde nicht gefunden</h1>
        <p>Kein Eintrag mit ID <strong>${id}</strong> vorhanden.</p>
        <p><a href="#/kunden">Zurück zur Liste</a></p>
      `;
      focusHeading(section);
      return;
    }
  }

  section.innerHTML = `
    <h1>${mode === "create" ? "Neuer Kunde" : "Kunde bearbeiten"}</h1>
  `;
  injectToast(section);

  const form = document.createElement("form");
  form.noValidate = true;
  section.appendChild(form);

  const kundenCodeValue =
    mode === "edit" ? (existing?.kundenCode ?? "") : generateNextKundenCode(kundenCache);

  const fields = [
    {
      name: "kundenCode",
      label: "Kunden-ID*",
      required: true,
      readOnly: true,
      value: kundenCodeValue,
    },
    { name: "vorname", label: "Vorname*", required: true },
    { name: "nachname", label: "Nachname*", required: true },
    { name: "email", label: "E-Mail*", required: true, type: "email" },
    { name: "telefon", label: "Telefon" },
    { name: "adresse", label: "Adresse" },
    { name: "notizen", label: "Notizen", textarea: true },
  ];

  const refs = {};
  fields.forEach((field) => {
    const wrapper = document.createElement("div");
    wrapper.className = "kunden-form-row";
    const idAttr = `kunden-${field.name}`;
    const label = document.createElement("label");
    label.setAttribute("for", idAttr);
    label.textContent = field.label;
    const input = field.textarea
      ? document.createElement("textarea")
      : document.createElement("input");
    input.id = idAttr;
    input.name = field.name;
    if (field.type) input.type = field.type;
    const initialValue = field.value !== undefined ? field.value : (existing?.[field.name] ?? "");
    input.value = initialValue;
    if (field.readOnly) {
      input.readOnly = true;
    }
    const error = document.createElement("div");
    error.className = "form-error";
    error.id = `${idAttr}-error`;
    input.setAttribute("aria-describedby", error.id);
    input.setAttribute("aria-invalid", "false");
    wrapper.append(label, input, error);
    form.appendChild(wrapper);
    refs[field.name] = { input, error };
  });

  const actions = document.createElement("div");
  actions.className = "kunden-actions";
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "ui-btn ui-btn--primary";
  submit.textContent = mode === "create" ? "Erstellen" : "Speichern";
  const cancel = document.createElement("a");
  cancel.className = "ui-btn ui-btn--quiet";
  cancel.href = mode === "create" ? "#/kunden" : `#/kunden/${id}`;
  cancel.textContent = "Abbrechen";
  actions.append(submit, cancel);
  form.appendChild(actions);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = collectValues(refs);
    const errors = validate(values);
    applyErrors(refs, errors);
    if (Object.keys(errors).length) {
      const firstError = Object.values(refs).find((ref) => ref.error.textContent);
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
      console.error("KUNDEN_SAVE_FAILED", error);
      showInlineToast(section, "Speichern fehlgeschlagen. Bitte erneut versuchen.", "error");
    } finally {
      if (!success) {
        submit.disabled = false;
        submit.textContent = defaultLabel;
      }
    }
  });

  focusHeading(section);
}

function setToast(message, tone = "info") {
  window[TOAST_KEY] = { message, tone };
}

function injectToast(section) {
  section.querySelectorAll(".kunden-toast").forEach((node) => node.remove());
  const toast = window[TOAST_KEY];
  if (!toast) return;
  delete window[TOAST_KEY];
  const { message, tone = "info" } =
    typeof toast === "string" ? { message: toast, tone: "info" } : toast;
  const notice = document.createElement("p");
  notice.className = `kunden-toast kunden-toast--${tone}`;
  notice.setAttribute("role", "status");
  notice.textContent = message;
  section.prepend(notice);
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
    if (errors[key]) {
      ref.error.textContent = errors[key];
      ref.input.setAttribute("aria-invalid", "true");
    } else {
      ref.error.textContent = "";
      ref.input.setAttribute("aria-invalid", "false");
    }
  });
}

function showInlineToast(section, message, tone = "info") {
  setToast(message, tone);
  injectToast(section);
}

function renderKundenHundeList(hunde = []) {
  if (!hunde.length) {
    const wrapper = document.createElement("div");
    const emptyNotice = document.createElement("p");
    emptyNotice.className = "kunden-empty";
    emptyNotice.textContent = "Keine Hunde zugeordnet.";
    wrapper.appendChild(emptyNotice);
    return wrapper;
  }
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
  return list;
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

function renderKundenKurseSection(kurse = []) {
  const section = document.createElement("section");
  section.className = "kunden-kurse-section";
  section.appendChild(
    createSectionHeader({
      title: "Kurse dieses Kunden",
      subtitle: "",
      level: 2,
    })
  );
  const cardFragment = createCard({
    eyebrow: "",
    title: "",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (card) {
    const body = card.querySelector(".ui-card__body");
    if (body) {
      body.innerHTML = "";
      if (!kurse.length) {
        body.appendChild(createEmptyState("Noch keine Kurse", "", {}));
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
    }
    section.appendChild(card);
  }
  return section;
}

async function loadFinanzen(kundeId) {
  try {
    const finanzen = await listFinanzen();
    return finanzen.filter((entry) => entry.kundeId === kundeId);
  } catch (error) {
    console.error("KUNDEN_FINANZEN_LOAD_FAILED", error);
    return [];
  }
}

function renderFinanzOverview(finanzen = []) {
  const section = document.createElement("section");
  section.className = "kunden-finanz-section";
  section.appendChild(
    createSectionHeader({
      title: "Finanzübersicht",
      subtitle: "",
      level: 2,
    })
  );
  const cardFragment = createCard({
    eyebrow: "",
    title: "",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return section;
  const body = card.querySelector(".ui-card__body");
  if (body) {
    body.innerHTML = "";
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

function renderOffeneBetraege(finanzen = []) {
  const section = document.createElement("section");
  section.className = "kunden-finanz-section";
  section.appendChild(
    createSectionHeader({
      title: "Offene Beträge",
      subtitle: "",
      level: 2,
    })
  );
  const cardFragment = createCard({
    eyebrow: "",
    title: "",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return section;
  const body = card.querySelector(".ui-card__body");
  if (body) {
    body.innerHTML = "";
    const openEntries = finanzen.filter((entry) => entry.typ === "offen");
    if (!openEntries.length) {
      body.appendChild(createEmptyState("Noch keine Daten", "", {}));
    } else {
      const sum = openEntries.reduce((total, entry) => total + Number(entry.betrag || 0), 0);
      const summary = document.createElement("p");
      summary.innerHTML = `<strong>Total offen:</strong> CHF ${sum.toFixed(2)}`;
      body.appendChild(summary);
      const list = document.createElement("ul");
      list.className = "kunden-offene-liste";
      openEntries.forEach((entry) => {
        const item = document.createElement("li");
        item.innerHTML = `<strong>${entry.beschreibung || "Posten"}</strong> – CHF ${Number(
          entry.betrag || 0
        ).toFixed(2)} (${formatDateTime(entry.datum)})`;
        list.appendChild(item);
      });
      body.appendChild(list);
    }
  }
  section.appendChild(card);
  return section;
}

function renderZahlungshistorie(finanzen = []) {
  const section = document.createElement("section");
  section.className = "kunden-finanz-section";
  section.appendChild(
    createSectionHeader({
      title: "Zahlungshistorie",
      subtitle: "",
      level: 2,
    })
  );
  const cardFragment = createCard({
    eyebrow: "",
    title: "",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return section;
  const body = card.querySelector(".ui-card__body");
  if (body) {
    body.innerHTML = "";
    const payments = finanzen.filter((entry) => entry.typ === "zahlung");
    if (!payments.length) {
      body.appendChild(createEmptyState("Noch keine Daten", "", {}));
    } else {
      const list = document.createElement("ul");
      list.className = "kunden-zahlungsliste";
      payments.forEach((entry) => {
        const item = document.createElement("li");
        item.innerHTML = `<strong>${formatDateTime(entry.datum)}</strong> – CHF ${Number(entry.betrag || 0).toFixed(2)} (${entry.beschreibung || "Zahlung"})`;
        list.appendChild(item);
      });
      body.appendChild(list);
    }
  }
  section.appendChild(card);
  return section;
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
