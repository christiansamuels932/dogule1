/* globals console, document */
import { createHundeListView } from "./listView.js";
import { createHundeDetailView } from "./detailView.js";
import { createHundeFormView } from "./formView.js";
import { getHund } from "../shared/api/hunde.js";

export async function initModule(container, routeContext = { segments: [] }) {
  console.log("[Hunde] module loaded");
  if (!container) return;

  const { view, id } = resolveView(routeContext);
  if (view === "detail" && id) {
    await createHundeDetailView(container, id);
    return;
  }
  if (view === "create") {
    await createHundeFormView(container, { mode: "create" });
    return;
  }
  if (view === "edit" && id) {
    try {
      const hund = await getHund(id);
      if (!hund) {
        renderHundEditError(container, "Hund wurde nicht gefunden.");
        return;
      }
      await createHundeFormView(container, { mode: "edit", id, hund });
    } catch (error) {
      console.error("HUNDE_EDIT_ROUTE_FAILED", error);
      renderHundEditError(container, "Hund konnte nicht geladen werden.");
    }
    return;
  }

  await createHundeListView(container);
}

function resolveView(routeContext = {}) {
  const segments = routeContext?.segments || [];
  if (!segments.length) {
    return { view: "list" };
  }
  const [first, second] = segments;
  if (first === "new") {
    return { view: "create" };
  }
  if (second === "edit") {
    return { view: "edit", id: first };
  }
  if (first) {
    return { view: "detail", id: first };
  }
  return { view: "list" };
}

export default initModule;

function renderHundEditError(container, message) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("hunde-view");
  const section = document.createElement("section");
  section.className = "dogule-section";
  const heading = document.createElement("h2");
  heading.textContent = "Hund bearbeiten";
  const hint = document.createElement("p");
  hint.textContent = message;
  const linkWrap = document.createElement("p");
  const link = document.createElement("a");
  link.href = "#/hunde";
  link.className = "ui-btn ui-btn--quiet";
  link.textContent = "Zurück zur Übersicht";
  linkWrap.appendChild(link);
  section.append(heading, hint, linkWrap);
  container.appendChild(section);
}
