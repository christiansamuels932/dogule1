/* globals document, console, window, URLSearchParams */
import {
  createCard,
  createNotice,
  createEmptyState,
  createFormRow,
  createButton,
} from "../shared/components/components.js";
import { deleteHund, listHunde } from "../shared/api/hunde.js";
import { getKunde } from "../shared/api/kunden.js";
import { getKurseForHund } from "../shared/api/kurse.js";
import { listZertifikate } from "../shared/api/zertifikate.js";
import { createRapporteDraft } from "../shared/api/rapporteDrafts.js";
import {
  createHistorieEntry,
  listHistorieEntries,
  updateHistorieEntry,
  deleteHistorieEntry,
} from "../shared/api/historie.js";
import { getSession } from "../shared/auth/client.js";
import { runIntegrityCheck } from "../shared/api/db/integrityCheck.js";
import { injectHundToast, setHundToast } from "./formView.js";
import { formatHerkunft } from "./herkunft.js";

function isAdminOrDeveloper(role) {
  return role === "admin" || role === "developer";
}

function canCreateRapportForRole(role) {
  return (
    role === "admin" || role === "developer" || role === "trainer" || role === "trainer_rapport"
  );
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toLocalDateTimeInputValue(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(
    date.getHours()
  )}:${pad2(date.getMinutes())}`;
}

function buildRapportDraftCard({ targetId, kundeId, role }) {
  const cardFragment = createCard({
    eyebrow: "",
    title: "Rapport (Entwurf)",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return null;
  const body = card.querySelector(".ui-card__body");
  if (!body) return card;
  body.innerHTML = "";

  const form = document.createElement("form");
  form.className = "hunde-rapport-form";
  const occurredRow = createFormRow({
    id: `hunde-rapport-occurred-${targetId}`,
    label: "Datum/Zeit",
    control: "input",
    type: "datetime-local",
    value: toLocalDateTimeInputValue(),
  });
  const textRow = createFormRow({
    id: `hunde-rapport-text-${targetId}`,
    label: "Rapport",
    control: "textarea",
    placeholder: "Kurztext zum Rapport",
    required: true,
  });
  const occurredInput = occurredRow.querySelector("input");
  const textInput = textRow.querySelector("textarea");

  const actions = document.createElement("div");
  actions.className = "module-actions";
  const shouldSaveDirect = isAdminOrDeveloper(role);
  const submitLabel = shouldSaveDirect ? "Rapport speichern" : "Entwurf senden";
  const submitBtn = createButton({ label: submitLabel, variant: "primary" });
  submitBtn.type = "submit";
  actions.appendChild(submitBtn);

  const status = document.createElement("div");

  form.append(occurredRow, textRow, actions, status);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.innerHTML = "";
    const text = String(textInput?.value || "").trim();
    if (!text) {
      status.appendChild(
        createNotice("Bitte einen Rapporttext eingeben.", { variant: "warn", role: "alert" })
      );
      return;
    }
    const occurredAtRaw = String(occurredInput?.value || "").trim();
    const occurredAt = occurredAtRaw
      ? new Date(occurredAtRaw).toISOString()
      : new Date().toISOString();
    submitBtn.disabled = true;
    try {
      if (shouldSaveDirect) {
        const session = getSession();
        const authorId = session?.user?.id || "";
        const authorRole = session?.user?.role || "";
        const resolvedText = `Rapport - ${text}`.trim();
        if (kundeId) {
          await createHistorieEntry({
            entityType: "kunden",
            entityId: kundeId,
            occurredAt,
            authorId,
            authorRole,
            text: resolvedText,
          });
        }
        const created = await createHistorieEntry({
          entityType: "hunde",
          entityId: targetId,
          occurredAt,
          authorId,
          authorRole,
          text: resolvedText,
        });
        prependHundeHistorieEntry(
          created || {
            entityType: "hunde",
            entityId: targetId,
            occurredAt,
            authorId,
            authorRole,
            text: resolvedText,
          }
        );
        status.appendChild(createNotice("Rapport gespeichert.", { variant: "ok", role: "status" }));
      } else {
        await createRapporteDraft({
          targetType: "hunde",
          targetId,
          kundeId,
          text,
          occurredAt,
        });
        status.appendChild(createNotice("Rapport eingereicht.", { variant: "ok", role: "status" }));
      }
      if (occurredInput) occurredInput.disabled = true;
      if (textInput) textInput.disabled = true;
      submitBtn.disabled = true;
    } catch (error) {
      console.error("[HUNDE_ERR_RAPPORT_CREATE]", error);
      status.appendChild(
        createNotice(
          shouldSaveDirect
            ? "Rapport konnte nicht gespeichert werden."
            : "Rapport konnte nicht eingereicht werden.",
          { variant: "warn", role: "alert" }
        )
      );
      submitBtn.disabled = false;
    }
  });

  body.appendChild(form);
  return card;
}

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
    body.appendChild(buildDetailList(hund, kundeInfo));
    body.appendChild(buildMetaBlock(hund));

    const role = getSession()?.user?.role || "";
    const canManage = isAdminOrDeveloper(role);
    const canCreateRapport = canCreateRapportForRole(role);
    const canViewExtras = isAdminOrDeveloper(role);

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
      if (canManage) {
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
      }

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
    if (canCreateRapport) {
      const rapportCard = buildRapportDraftCard({
        targetId: hund.id,
        kundeId: kundeInfo.id || hund.kundenId,
        role,
      });
      if (rapportCard) {
        detailSection.appendChild(rapportCard);
      }
    }
    if (canViewExtras) {
      const zertifikateSection = await buildZertifikateSection(hund.id);
      container.appendChild(zertifikateSection);
      const historieSection = await buildHistorieSection(hund.id);
      container.appendChild(historieSection);
    }
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

async function buildHistorieSection(hundId) {
  const section = document.createElement("section");
  section.className = "hunde-historie";
  section.dataset.section = "hunde-historie";
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
    let entries = [];
    let loadFailed = false;
    try {
      entries = await listHistorieEntries({ entityType: "hunde", entityId: hundId });
    } catch (error) {
      loadFailed = true;
      console.error("[HUNDE_ERR_HISTORIE]", error);
    }
    if (loadFailed) {
      body.appendChild(
        createNotice("Fehler beim Laden der Daten.", {
          variant: "warn",
          role: "alert",
        })
      );
    } else if (!entries.length) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
    } else {
      const role = getSession()?.user?.role || "";
      const canEdit = role === "admin" || role === "developer";
      entries = entries
        .slice()
        .sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")));
      const list = document.createElement("ul");
      list.className = "hunde-historie-list";
      entries.forEach((entry) => {
        list.appendChild(buildHundeHistorieItem(entry, canEdit));
      });
      body.appendChild(list);
    }
  }
  section.appendChild(card);
  return section;
}

function buildHundeHistorieItem(entry, canEdit) {
  const item = document.createElement("li");
  item.className = "hunde-historie-item";
  const line = document.createElement("div");
  line.className = "hunde-historie-line";
  const date = entry.occurredAt ? formatDateTime(entry.occurredAt) : "";
  const author = entry.authorRole ? String(entry.authorRole) : "";
  const text = (entry.text || "").trim();
  const label = document.createElement("span");
  label.textContent = [date, author, text].filter(Boolean).join(" · ");
  line.appendChild(label);

  if (canEdit) {
    const actions = document.createElement("div");
    actions.className = "module-actions";
    const editBtn = createButton({ label: "Bearbeiten", variant: "secondary" });
    editBtn.type = "button";
    const deleteBtn = createButton({ label: "Löschen", variant: "secondary" });
    deleteBtn.type = "button";

    editBtn.addEventListener("click", async () => {
      const next = window.prompt("Historie-Eintrag bearbeiten:", entry.text || "");
      if (next === null) return;
      const trimmed = String(next).trim();
      if (!trimmed) {
        window.alert("Text darf nicht leer sein.");
        return;
      }
      editBtn.disabled = true;
      deleteBtn.disabled = true;
      try {
        const updated = await updateHistorieEntry(entry.id, { text: trimmed });
        entry.text = updated?.text ?? trimmed;
        label.textContent = [date, author, (entry.text || "").trim()].filter(Boolean).join(" · ");
      } catch (error) {
        console.error("[HUNDE_ERR_HISTORIE_EDIT]", error);
        window.alert("Änderung fehlgeschlagen (siehe Konsole).");
      } finally {
        editBtn.disabled = false;
        deleteBtn.disabled = false;
      }
    });

    deleteBtn.addEventListener("click", async () => {
      const ok = window.confirm("Historie-Eintrag wirklich löschen?");
      if (!ok) return;
      editBtn.disabled = true;
      deleteBtn.disabled = true;
      try {
        await deleteHistorieEntry(entry.id);
        item.remove();
      } catch (error) {
        console.error("[HUNDE_ERR_HISTORIE_DELETE]", error);
        window.alert("Löschen fehlgeschlagen (siehe Konsole).");
      } finally {
        editBtn.disabled = false;
        deleteBtn.disabled = false;
      }
    });

    actions.append(editBtn, deleteBtn);
    line.appendChild(actions);
  }

  item.appendChild(line);
  return item;
}

function prependHundeHistorieEntry(entry) {
  const section = document.querySelector("[data-section='hunde-historie']");
  const body = section?.querySelector(".ui-card__body");
  if (!body || !entry) return;
  let list = body.querySelector(".hunde-historie-list");
  if (!list) {
    body.innerHTML = "";
    list = document.createElement("ul");
    list.className = "hunde-historie-list";
    body.appendChild(list);
  }
  const role = getSession()?.user?.role || "";
  const canEdit = role === "admin" || role === "developer";
  const item = buildHundeHistorieItem(entry, canEdit);
  list.prepend(item);
}

async function buildZertifikateSection(hundId) {
  const section = document.createElement("section");
  section.className = "hunde-zertifikate";
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

function buildDetailList(hund, kundeInfo = null) {
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
    { label: "Wurfdatum", value: formatDate(hund.geburtsdatum) },
    { label: "Kastriert", value: formatBoolean(hund.kastriert) },
    { label: "Felltyp", value: hund.felltyp || hund.fellTyp },
    { label: "Fellfarbe", value: hund.fellfarbe || hund.fellFarbe },
    { label: "Größe (Typ)", value: hund.groesseTyp || hund.groesseType },
    { label: "Größe (cm)", value: hund.groesseCm },
    { label: "Gewicht (kg)", value: hund.gewichtKg },
    { label: "Herkunft", value: formatHerkunft(hund.herkunft) },
    { label: "Chip-Nr.", value: hund.chipNummer || hund.chipnummer },
    { label: "Trainingsziele", value: hund.trainingsziele },
    { label: "Notizen", value: hund.notizen },
  ];
  if (kundeInfo?.id) {
    const ownerName = [kundeInfo.vorname, kundeInfo.nachname].filter(Boolean).join(" ").trim();
    rows.splice(2, 0, {
      label: "Kunden-ID",
      value: kundeInfo.id,
      render: () => {
        const link = document.createElement("a");
        link.href = `#/kunden/${kundeInfo.id}`;
        link.textContent = kundeInfo.id;
        return link;
      },
    });
    rows.splice(3, 0, {
      label: "Besitzer",
      value: ownerName,
      render: () => {
        const link = document.createElement("a");
        link.href = `#/kunden/${kundeInfo.id}`;
        link.textContent = ownerName || kundeInfo.id;
        return link;
      },
    });
  }
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
