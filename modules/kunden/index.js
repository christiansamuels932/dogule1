// Kunden Module with param-route placeholders
/* globals document, console, window */
import {
  listKunden,
  getKunde,
  createKunde,
  updateKunde,
  deleteKunde,
} from "../../shared/api/kunden.js";

export async function initModule(container, routeContext = { segments: [] }) {
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "dogule-section";
  container.appendChild(section);

  const { view, id } = resolveView(routeContext);

  try {
    if (view === "list") {
      const kunden = await listKunden();
      console.log("[Kunden] Liste", kunden);
      section.innerHTML = `
        <h1>Kundenliste</h1>
        <p>Es wurden ${kunden.length} Kunden geladen.</p>
      `;
      return;
    }

    if (view === "create") {
      const preview = await createKunde(
        {
          vorname: "Platzhalter",
          nachname: "Kunde",
          email: "platzhalter@hundeschule.de",
        },
        { dryRun: true }
      );
      console.log("[Kunden] Neuer Kunde (Stub)", preview);
      section.innerHTML = `
        <h1>Neuer Kunde</h1>
        <p>Formular folgt – Vorname, Nachname, E-Mail, Telefon, Adresse, Notizen.</p>
      `;
      return;
    }

    if (view === "edit" && id) {
      const preview = await updateKunde(id, { notizen: "Bearbeitungsvorschau" }, { dryRun: true });
      console.log("[Kunden] Kunde bearbeiten (Stub)", preview);
      section.innerHTML = `
        <h1>Kunde bearbeiten</h1>
        <p>Bearbeite Datensatz mit ID: <strong>${id}</strong>.</p>
      `;
      return;
    }

    if (view === "delete" && id) {
      const preview = await deleteKunde(id, { dryRun: true });
      console.log("[Kunden] Kunde löschen (Stub)", preview);
      section.innerHTML = `
        <h1>Kunde löschen</h1>
        <p>Löschbestätigung für ID: <strong>${id}</strong>.</p>
      `;
      return;
    }

    if (view === "detail" && id) {
      const kunde = await getKunde(id);
      console.log("[Kunden] Details", kunde);
      if (!kunde) {
        section.innerHTML = `
          <h1>Unbekannter Kunde</h1>
          <p>Kein Eintrag mit ID <strong>${id}</strong> gefunden.</p>
        `;
        return;
      }
      section.innerHTML = `
        <h1>Kundendetails</h1>
        <p>${kunde.name ?? `${kunde.vorname ?? ""} ${kunde.nachname ?? ""}`}</p>
      `;
      return;
    }

    section.innerHTML = `
      <h1>Unbekannte Ansicht</h1>
      <p>Der Pfad "${window.location.hash}" wird noch nicht unterstützt.</p>
    `;
  } catch (error) {
    console.error("KUNDEN_ROUTE_FAILED", error);
    section.innerHTML = `
      <h1>Fehler</h1>
      <p>Konnte Kundenansicht nicht laden.</p>
    `;
  }
}

function resolveView(routeContext = {}) {
  const segments = routeContext.segments || [];
  if (!segments.length) return { view: "list" };

  const [first, second] = segments;
  if (first === "new") return { view: "create" };
  if (second === "edit") return { view: "edit", id: first };
  if (second === "delete") return { view: "delete", id: first };
  return { view: "detail", id: first };
}
