/* globals document, console, window */
import {
  createButton,
  createCard,
  createNotice,
  createSectionHeader,
} from "../shared/components/components.js";
import { getHund, deleteHund } from "../shared/api/hunde.js";
import { getKunde } from "../shared/api/kunden.js";
import { injectHundToast, setHundToast } from "./formView.js";

export async function createHundeDetailView(container, hundId) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("hunde-view");

  container.appendChild(
    createSectionHeader({
      title: "Hundedetails",
      subtitle: "Alle Informationen zu einem Hund",
      level: 2,
    })
  );
  injectHundToast(container);

  const cardFragment = createCard({
    eyebrow: "",
    title: "Lade Hund ...",
    body: "<p>Details werden geladen ...</p>",
    footer: "",
  });
  const cardElement = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!cardElement) return;
  container.appendChild(cardElement);
  const body = cardElement.querySelector(".ui-card__body");
  const footer = cardElement.querySelector(".ui-card__footer");

  try {
    if (!hundId) {
      throw new Error("Keine Hunde-ID angegeben");
    }
    const hund = await getHund(hundId);
    if (!hund) {
      throw new Error(`Hund ${hundId} nicht gefunden`);
    }
    const kundeInfo = {
      id: hund.kundenId || "",
      name: "–",
    };
    if (hund.kundenId) {
      try {
        const kunde = await getKunde(hund.kundenId);
        if (kunde) {
          const fullName = `${kunde.vorname ?? ""} ${kunde.nachname ?? ""}`.trim();
          kundeInfo.name = fullName || kunde.vorname || kunde.nachname || "–";
          kundeInfo.id = kunde.id || hund.kundenId;
        }
      } catch (kundenError) {
        console.error("HUNDE_DETAIL_KUNDE_FAILED", kundenError);
      }
    }

    cardElement.querySelector(".ui-card__title").textContent = hund.name || "Unbenannter Hund";
    body.innerHTML = "";
    body.appendChild(buildDetailList(hund, kundeInfo));
    body.appendChild(buildMetaBlock(hund));

    footer.innerHTML = "";
    footer.appendChild(
      createButton({
        label: "Hund bearbeiten",
        variant: "primary",
        onClick: () => {
          window.location.hash = `#/hunde/${hund.id}/edit`;
        },
      })
    );
    const deleteBtn = createButton({
      label: "Hund löschen",
      variant: "secondary",
    });
    deleteBtn.addEventListener("click", () => handleDeleteHund(container, hund.id, deleteBtn));
    footer.appendChild(deleteBtn);
    if (kundeInfo.id) {
      footer.appendChild(
        createButton({
          label: "Zum Kunden",
          variant: "secondary",
          onClick: () => {
            window.location.hash = `#/kunden/${kundeInfo.id}`;
          },
        })
      );
    }
    footer.appendChild(
      createButton({
        label: "Zur Liste",
        variant: "secondary",
        onClick: () => {
          window.location.hash = "#/hunde";
        },
      })
    );
  } catch (error) {
    console.error("HUNDE_DETAIL_FAILED", error);
    body.innerHTML = "";
    const notice = createNotice("Hund konnte nicht geladen werden.", {
      variant: "warn",
      role: "alert",
    });
    body.appendChild(notice);
    footer.innerHTML = "";
    footer.appendChild(
      createButton({
        label: "Zur Liste",
        variant: "secondary",
        onClick: () => {
          window.location.hash = "#/hunde";
        },
      })
    );
  } finally {
    focusHeading(container);
  }
}

function buildDetailList(hund, kundeInfo) {
  const list = document.createElement("dl");
  list.className = "hunde-detail-list";
  const rows = [
    { label: "Name", value: hund.name },
    { label: "Hunde-ID", value: hund.hundeId },
    { label: "Rufname", value: hund.rufname },
    { label: "Rasse", value: hund.rasse },
    { label: "Geschlecht", value: hund.geschlecht },
    { label: "Geburtsdatum", value: formatDate(hund.geburtsdatum) },
    { label: "Gewicht (kg)", value: hund.gewichtKg },
    { label: "Größe (cm)", value: hund.groesseCm },
    { label: "Kunden-ID", value: hund.kundenId },
    {
      label: "Kundenname",
      render: () => {
        if (!kundeInfo?.id || !kundeInfo.name || kundeInfo.name === "–") {
          const span = document.createElement("span");
          span.textContent = kundeInfo?.name || "–";
          return span;
        }
        const link = document.createElement("a");
        link.href = `#/kunden/${kundeInfo.id}`;
        link.textContent = kundeInfo.name;
        link.addEventListener("click", (event) => {
          event.preventDefault();
          window.location.hash = `#/kunden/${kundeInfo.id}`;
        });
        return link;
      },
    },
    { label: "Trainingsziele", value: hund.trainingsziele },
    { label: "Notizen", value: hund.notizen },
  ];
  rows.forEach(({ label, value, render }) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    if (typeof render === "function") {
      dd.appendChild(render());
    } else {
      dd.textContent = valueOrDash(value);
    }
    list.append(dt, dd);
  });
  return list;
}

function buildMetaBlock(hund) {
  const meta = document.createElement("p");
  meta.className = "hunde-detail-meta";
  meta.textContent = `Erstellt am ${formatDateTime(hund.createdAt)} · Aktualisiert am ${formatDateTime(
    hund.updatedAt
  )}`;
  return meta;
}

function formatDate(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "–";
  return String(value);
}

function focusHeading(container) {
  const heading = container.querySelector("h1, h2");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
}

async function handleDeleteHund(container, hundId, button) {
  if (!button || button.disabled) return;
  const confirmed = window.confirm("Möchten Sie diesen Hund wirklich löschen?");
  if (!confirmed) return;
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Lösche ...";
  try {
    const result = await deleteHund(hundId);
    if (!result?.ok) {
      throw new Error("Delete failed");
    }
    setHundToast("Hund wurde gelöscht.", "success");
    window.location.hash = "#/hunde";
  } catch (error) {
    console.error("HUNDE_DELETE_FAILED", error);
    setHundToast("Hund konnte nicht gelöscht werden.", "error");
    injectHundToast(container);
    button.disabled = false;
    button.textContent = originalLabel;
  }
}
