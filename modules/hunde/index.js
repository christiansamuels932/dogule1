/* globals console, document, window */
import { createHundeListView } from "./listView.js";
import { createHundeDetailView } from "./detailView.js";
import { createHundeFormView } from "./formView.js";
import { getHund } from "../shared/api/hunde.js";
import { createCard, createNotice, createSectionHeader } from "../shared/components/components.js";

export async function initModule(container, routeContext = { segments: [] }) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("hunde-view");
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    await renderHundEditRoute(container, id);
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

async function renderHundEditRoute(container, id) {
  try {
    const hund = await getHund(id);
    if (!hund) {
      renderHundEditError(container);
      return;
    }
    await createHundeFormView(container, { mode: "edit", id, hund });
  } catch (error) {
    console.error("[HUNDE_ERR_EDIT_ROUTE]", error);
    renderHundEditError(container);
  }
}

function renderHundEditError(container) {
  if (!container) return;
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "dogule-section hunde-view__error";
  section.appendChild(
    createSectionHeader({
      title: "Hund bearbeiten",
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
    body.innerHTML = "";
    body.appendChild(
      createNotice("Fehler beim Laden der Daten.", {
        variant: "warn",
        role: "alert",
      })
    );
    const footer = card.querySelector(".ui-card__footer");
    footer.innerHTML = "";
    const link = document.createElement("a");
    link.href = "#/hunde";
    link.className = "ui-btn ui-btn--quiet";
    link.textContent = "Zurück zur Übersicht";
    footer.appendChild(link);
    section.appendChild(card);
  }
  container.appendChild(section);
}
