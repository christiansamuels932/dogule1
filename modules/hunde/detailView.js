/* globals document, console, window, URLSearchParams */
import {
  createCard,
  createNotice,
  createSectionHeader,
  createEmptyState,
  createButton,
} from "../shared/components/components.js";
import { deleteHund, listHunde } from "../shared/api/hunde.js";
import { getKunde } from "../shared/api/kunden.js";
import { getKurseForHund } from "../shared/api/kurse.js";
import { listZertifikate } from "../shared/api/zertifikate.js";
import { runIntegrityCheck } from "../shared/api/db/integrityCheck.js";
import { injectHundToast, setHundToast } from "./formView.js";
import { formatHerkunft } from "./herkunft.js";

export async function createHundeDetailView(container, hundId) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("hunde-view");
  window.scrollTo(0, 0);

  const detailSection = document.createElement("section");
  detailSection.className = "dogule-section hunde-section hunde-detail";
  container.appendChild(detailSection);
  injectHundToast(container);

  const cardFragment = createCard({
    eyebrow: "",
    title: "Stammdaten",
    body: "<p>Details werden geladen ...</p>",
    footer: "",
  });
  const cardElement = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!cardElement) return;
  detailSection.appendChild(cardElement);
  const body = cardElement.querySelector(".ui-card__body");
  try {
    if (!hundId) {
      throw new Error("Keine Hunde-ID angegeben");
    }
    const hunde = await listHunde();
    const hund = hunde.find((entry) => entry.id === hundId);
    if (!hund) {
      throw new Error(`Hund ${hundId} nicht gefunden`);
    }
    let kundeLoadFailed = false;
    const kundeInfo = {
      id: hund.kundenId || "",
      vorname: "",
      nachname: "",
      telefon: "",
      email: "",
      town: "",
    };
    if (hund.kundenId) {
      try {
        const kunde = await getKunde(hund.kundenId);
        if (kunde) {
          kundeInfo.vorname = kunde.vorname || "";
          kundeInfo.nachname = kunde.nachname || "";
          kundeInfo.telefon = kunde.telefon || "";
          kundeInfo.email = kunde.email || "";
          kundeInfo.id = kunde.id || hund.kundenId;
          kundeInfo.town = extractTown(kunde.adresse || kunde.address || "");
        }
      } catch (kundenError) {
        kundeLoadFailed = true;
        console.error("[HUNDE_ERR_DETAIL_KUNDE]", kundenError);
      }
    }

    const titleEl = cardElement.querySelector(".ui-card__title");
    if (titleEl) titleEl.textContent = "Stammdaten";
    body.innerHTML = "";
    if (kundeLoadFailed) {
      body.appendChild(
        createNotice("Fehler beim Laden der Daten.", {
          variant: "warn",
          role: "alert",
        })
      );
    }
    body.appendChild(buildDetailList(hund));
    body.appendChild(buildMetaBlock(hund));

    const ownerCard = buildOwnerCard(kundeInfo, kundeLoadFailed);
    if (ownerCard) {
      detailSection.appendChild(ownerCard);
    }

    const actionsCard = createCard({
      eyebrow: "",
      title: "Aktionen",
      body: "",
      footer: "",
    });
    const actionsEl = actionsCard.querySelector(".ui-card") || actionsCard.firstElementChild;
    if (actionsEl) {
      const actionsBody = actionsEl.querySelector(".ui-card__body");
      const actionsWrap = document.createElement("div");
      actionsWrap.className = "module-actions";
      const editBtn = createButton({ label: "Bearbeiten", variant: "primary" });
      editBtn.type = "button";
      editBtn.addEventListener("click", () => {
        window.location.hash = `#/hunde/${hund.id}/edit`;
      });
      actionsWrap.appendChild(editBtn);

      const zertifikatBtn = createButton({ label: "Zertifikat erstellen", variant: "secondary" });
      zertifikatBtn.type = "button";
      zertifikatBtn.addEventListener("click", () => {
        const params = new URLSearchParams();
        params.set("hundId", hund.id);
        if (kundeInfo?.id) {
          params.set("kundeId", kundeInfo.id);
        }
        window.location.hash = `#/zertifikate/new?${params.toString()}`;
      });
      actionsWrap.appendChild(zertifikatBtn);

      const deleteBtn = createButton({ label: "Löschen", variant: "secondary" });
      deleteBtn.addEventListener("click", () =>
        handleDeleteHund(container, hund.id, kundeInfo.id, deleteBtn)
      );
      actionsWrap.appendChild(deleteBtn);

      if (kundeInfo.id) {
        const kundeBtn = createButton({ label: "Zum Kunden", variant: "secondary" });
        kundeBtn.type = "button";
        kundeBtn.addEventListener("click", () => {
          window.location.hash = `#/kunden/${kundeInfo.id}`;
        });
        actionsWrap.appendChild(kundeBtn);
      }

      const backBtn = createButton({ label: "Zur Liste", variant: "quiet" });
      backBtn.type = "button";
      backBtn.addEventListener("click", () => {
        window.location.hash = "#/hunde";
      });
      actionsWrap.appendChild(backBtn);

      if (actionsBody) {
        actionsBody.innerHTML = "";
        actionsBody.appendChild(actionsWrap);
      }
      detailSection.appendChild(actionsEl);
    }
    const zertifikateSection = await buildZertifikateSection(hund.id);
    container.appendChild(zertifikateSection);
  } catch (error) {
    console.error("[HUNDE_ERR_DETAIL_LOAD]", error);
    body.innerHTML = "";
    const notice = createNotice("Fehler beim Laden der Daten.", {
      variant: "warn",
      role: "alert",
    });
    body.appendChild(notice);
    const actionsFallback = document.createElement("div");
    actionsFallback.className = "module-actions";
    actionsFallback.appendChild(createNavLink("Zur Liste", "#/hunde", "secondary"));
    body.appendChild(actionsFallback);
  } finally {
    focusHeading(container);
  }
}

async function buildZertifikateSection(hundId) {
  const section = document.createElement("section");
  section.className = "hunde-zertifikate";
  section.appendChild(
    createSectionHeader({
      title: "Zertifikate",
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
    let zertifikate = [];
    let loadFailed = false;
    try {
      const allZertifikate = await listZertifikate();
      zertifikate = allZertifikate.filter((entry) => entry.hundId === hundId);
    } catch (error) {
      loadFailed = true;
      console.error("[HUNDE_ERR_ZERTIFIKATE]", error);
    }
    if (loadFailed) {
      body.appendChild(
        createNotice("Fehler beim Laden der Daten.", {
          variant: "warn",
          role: "alert",
        })
      );
    } else if (!zertifikate.length) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
    } else {
      const list = document.createElement("ul");
      list.className = "hunde-zertifikate-list";
      zertifikate.forEach((zertifikat) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `#/zertifikate/${zertifikat.id}`;
        link.className = "hunde-zertifikate-link";
        const label = zertifikat.kursTitelSnapshot || zertifikat.code || "Zertifikat";
        const meta = zertifikat.ausstellungsdatum
          ? ` · ${formatDateTime(zertifikat.ausstellungsdatum)}`
          : "";
        link.textContent = `${label}${meta}`;
        item.appendChild(link);
        list.appendChild(item);
      });
      body.appendChild(list);
    }
  }
  section.appendChild(card);
  return section;
}

function buildDetailList(hund) {
  const list = document.createElement("dl");
  list.className = "hunde-detail-list";
  const rows = [
    { label: "ID", value: hund.id },
    { label: "Hundecode", value: hund.code || hund.hundeId },
    { label: "Name", value: hund.name },
    { label: "Rufname", value: hund.rufname },
    { label: "Rasse", value: hund.rasse },
    { label: "Geschlecht", value: hund.geschlecht },
    { label: "Status", value: hund.status },
    { label: "Geburtsdatum", value: formatDate(hund.geburtsdatum) },
    { label: "Kastriert", value: formatBoolean(hund.kastriert) },
    { label: "Felltyp", value: hund.felltyp || hund.fellTyp },
    { label: "Fellfarbe", value: hund.fellfarbe || hund.fellFarbe },
    { label: "Größe (Typ)", value: hund.groesseTyp || hund.groesseType },
    { label: "Größe (cm)", value: hund.groesseCm },
    { label: "Gewicht (kg)", value: hund.gewichtKg },
    { label: "Herkunft", value: formatHerkunft(hund.herkunft) },
    { label: "Chip Nummer", value: hund.chipNummer || hund.chipnummer },
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

function buildOwnerCard(kundeInfo = {}, hasError = false) {
  const cardFragment = createCard({
    eyebrow: "",
    title: "Besitzer",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return cardFragment;
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";
  if (hasError) {
    body.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
  } else if (!kundeInfo.id) {
    body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
  } else {
    const list = document.createElement("dl");
    list.className = "kunden-details";
    const rows = [
      { label: "Name", value: kundeInfo.nachname },
      { label: "Vorname", value: kundeInfo.vorname },
      { label: "Telefon", value: kundeInfo.telefon },
      { label: "E-Mail", value: kundeInfo.email },
      { label: "Ort", value: kundeInfo.town },
    ];
    rows.forEach(({ label, value }) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = valueOrDash(value);
      list.append(dt, dd);
    });
    body.appendChild(list);
    const footer = card.querySelector(".ui-card__footer");
    footer.innerHTML = "";
    const link = document.createElement("a");
    link.href = `#/kunden/${kundeInfo.id}`;
    link.className = "ui-btn ui-btn--secondary";
    link.textContent = "Zum Kunden";
    footer.appendChild(link);
  }
  return card;
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

function extractTown(address = "") {
  if (typeof address !== "string") return "";
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return "";
  const townRaw = parts[parts.length - 1];
  const cleaned = townRaw.replace(/^\d+\s*/, "").trim();
  return cleaned || townRaw;
}

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "–";
  return String(value);
}

function formatBoolean(value) {
  if (value === true) return "Ja";
  if (value === false) return "Nein";
  return "–";
}

function focusHeading(container) {
  const heading = container.querySelector("h1, h2");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
}

function createNavLink(label, href, variant = "secondary") {
  const link = document.createElement("a");
  link.href = href;
  link.className = `ui-btn ui-btn--${variant}`;
  link.textContent = label;
  return link;
}

async function handleDeleteHund(container, hundId, kundenId, button) {
  if (!button || button.disabled) return;
  const confirmed = window.confirm("Möchten Sie diesen Hund wirklich löschen?");
  if (!confirmed) return;
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Lösche ...";
  try {
    const linkedKurse = await getKurseForHund(hundId);
    if (linkedKurse.length) {
      setHundToast(
        "Löschen blockiert: Bitte zuerst Kurse entfernen oder Hund aus Kursen lösen.",
        "error"
      );
      injectHundToast(container);
      button.disabled = false;
      button.textContent = originalLabel;
      return;
    }
    const result = await deleteHund(hundId);
    if (!result?.ok) {
      throw new Error("Delete failed");
    }
    runIntegrityCheck();
    setHundToast("Hund wurde gelöscht.", "success");
    if (kundenId) {
      window.location.hash = `#/kunden/${kundenId}`;
    } else {
      window.location.hash = "#/hunde";
    }
  } catch (error) {
    console.error("[HUNDE_ERR_DELETE]", error);
    setHundToast("Hund konnte nicht gelöscht werden.", "error");
    injectHundToast(container);
    button.disabled = false;
    button.textContent = originalLabel;
  }
}
