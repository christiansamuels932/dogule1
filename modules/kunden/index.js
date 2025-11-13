// Kunden module – list/detail/form flows with mock API
/* globals document, console, window */
import {
  listKunden,
  getKunde,
  createKunde,
  updateKunde,
  deleteKunde,
} from "../../shared/api/kunden.js";

let kundenCache = [];

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
      const fullName = kunde.name ?? `${kunde.vorname ?? ""} ${kunde.nachname ?? ""}`.trim();
      link.textContent = `${fullName || "Unbenannt"} – ${kunde.email ?? "keine E-Mail"}`;
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

  section.innerHTML = `
    <h1>Kundendetails</h1>
    <dl class="kunden-details">
      <dt>Vorname</dt><dd>${kunde.vorname ?? "–"}</dd>
      <dt>Nachname</dt><dd>${kunde.nachname ?? "–"}</dd>
      <dt>E-Mail</dt><dd>${kunde.email ?? "–"}</dd>
      <dt>Telefon</dt><dd>${kunde.telefon ?? "–"}</dd>
      <dt>Adresse</dt><dd>${kunde.adresse ?? "–"}</dd>
      <dt>Notizen</dt><dd>${kunde.notizen ?? "–"}</dd>
    </dl>
    <div class="kunden-actions">
      <a class="ui-btn" href="#/kunden/${id}/edit">Bearbeiten</a>
      <button type="button" class="ui-btn ui-btn--secondary" data-action="delete">Löschen</button>
      <a class="ui-btn ui-btn--quiet" href="#/kunden">Zurück</a>
    </div>
  `;

  section.querySelector('[data-action="delete"]')?.addEventListener("click", async () => {
    await deleteKunde(id, { dryRun: true });
    kundenCache = kundenCache.filter((k) => k.id !== id);
    window.location.hash = "#/kunden";
  });

  focusHeading(section);
}

async function renderForm(section, view, id) {
  const mode = view === "create" ? "create" : "edit";
  let existing = null;

  if (mode === "edit") {
    if (!kundenCache.length) await fetchKunden();
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

  const form = document.createElement("form");
  form.noValidate = true;
  section.appendChild(form);

  const fields = [
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
    input.value = existing?.[field.name] ?? "";
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

    if (mode === "create") {
      const rec = await createKunde(values, { dryRun: true });
      kundenCache = [rec, ...kundenCache];
      window.location.hash = "#/kunden";
    } else {
      const updated = await updateKunde(id, values, { dryRun: true });
      const idx = kundenCache.findIndex((k) => k.id === id);
      if (idx >= 0) kundenCache[idx] = { ...kundenCache[idx], ...updated };
      window.location.hash = `#/kunden/${id}`;
    }
  });

  focusHeading(section);
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
