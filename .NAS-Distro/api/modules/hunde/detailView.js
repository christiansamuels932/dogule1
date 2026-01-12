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
import { listFinanzenByKundeId } from "../shared/api/finanzen.js";
import { runIntegrityCheck } from "../shared/api/db/integrityCheck.js";
import { injectHundToast, setHundToast } from "./formView.js";
import { formatHerkunft } from "./herkunft.js";

export async function createHundeDetailView(container, hundId) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("hunde-view");
  window.scrollTo(0, 0);

  const headerFragment = createSectionHeader({
    title: "Hund",
    subtitle: "",
    level: 1,
  });
  const detailSection = document.createElement("section");
  detailSection.className = "dogule-section hunde-section hunde-detail";
  detailSection.appendChild(headerFragment);
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
  const headerSection =
    headerFragment.querySelector(".ui-section") || headerFragment.firstElementChild;
  const headerSubtitle = headerSection?.querySelector(".ui-section__subtitle");

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
    let finanzenLoadFailed = false;
    const kundeInfo = {
      id: hund.kundenId || "",
      vorname: "",
      nachname: "",
      telefon: "",
      email: "",
      town: "",
    };
    let kundeFinanzen = [];
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
          try {
            kundeFinanzen = await listFinanzenByKundeId(kunde.id);
            container.__linkedFinanzen = kundeFinanzen;
          } catch (finanzenError) {
            finanzenLoadFailed = true;
            console.error("[HUNDE_ERR_DETAIL_FINANZEN]", finanzenError);
          }
        }
      } catch (kundenError) {
        kundeLoadFailed = true;
        console.error("[HUNDE_ERR_DETAIL_KUNDE]", kundenError);
      }
    }

    const hundName = hund.name || "Unbenannter Hund";
    if (headerSubtitle) {
      headerSubtitle.textContent = hundName;
      headerSubtitle.hidden = false;
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
    const kurseSection = await buildLinkedKurseSection(hund.id);
    container.appendChild(kurseSection);
    container.appendChild(
      buildFinanzUebersichtSection(container.__linkedFinanzen || [], finanzenLoadFailed, {
        hasKunde: Boolean(kundeInfo.id),
      })
    );
    container.appendChild(
      buildFinanzOffeneSection(container.__linkedFinanzen || [], finanzenLoadFailed, {
        hasKunde: Boolean(kundeInfo.id),
      })
    );
    container.appendChild(
      buildFinanzHistorieSection(container.__linkedFinanzen || [], finanzenLoadFailed, {
        hasKunde: Boolean(kundeInfo.id),
      })
    );
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

async function buildLinkedKurseSection(hundId) {
  const section = document.createElement("section");
  section.className = "hunde-linked-kurse";
  section.appendChild(
    createSectionHeader({
      title: "Kurse dieses Hundes",
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
    let kurse = [];
    let loadFailed = false;
    try {
      kurse = await getKurseForHund(hundId);
    } catch (error) {
      loadFailed = true;
      console.error("[HUNDE_ERR_LINKED_KURSE]", error);
    }
    if (loadFailed) {
      body.appendChild(
        createNotice("Fehler beim Laden der Daten.", {
          variant: "warn",
          role: "alert",
        })
      );
    } else if (!kurse.length) {
      body.appendChild(createEmptyState("Keine Kurse vorhanden.", ""));
    } else {
      const sorted = [...kurse].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
        if (Number.isNaN(timeA)) return 1;
        if (Number.isNaN(timeB)) return -1;
        return timeA - timeB;
      });
      sorted.forEach((kurs) => {
        const kursFragment = createCard({
          eyebrow: kurs.code || kurs.title || "–",
          title: kurs.title || "Ohne Titel",
          body: "",
          footer: "",
        });
        const kursCard = kursFragment.querySelector(".ui-card") || kursFragment.firstElementChild;
        if (!kursCard) return;
        kursCard.classList.add("hunde-linked-kurs");
        const kursBody = kursCard.querySelector(".ui-card__body");
        if (kursBody) {
          kursBody.innerHTML = "";
          const info = document.createElement("div");
          info.className = "hunde-linked-kurs__info";
          const dateRow = document.createElement("p");
          dateRow.textContent = `${formatDate(kurs.date)} · ${kurs.location || "Ort offen"}`;
          const trainerRow = document.createElement("p");
          trainerRow.textContent = `Trainer: ${kurs.trainerName || kurs.trainerId || "–"}`;
          info.append(dateRow, trainerRow);
          kursBody.appendChild(info);
        }
        const link = document.createElement("a");
        link.href = `#/kurse/${kurs.id}`;
        link.className = "hunde-linked-kurs__link";
        link.appendChild(kursCard);
        body.appendChild(link);
      });
    }
  }
  section.appendChild(card);
  return section;
}

function buildFinanzUebersichtSection(finanzen = [], hasError = false, { hasKunde = false } = {}) {
  const section = document.createElement("section");
  section.className = "hunde-finanz-section";
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
    if (!hasKunde) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
      section.appendChild(card);
      return section;
    }
    if (hasError) {
      body.appendChild(
        createNotice("Fehler beim Laden der Daten.", {
          variant: "warn",
          role: "alert",
        })
      );
      section.appendChild(card);
      return section;
    }
    const payments = finanzen.filter((entry) => entry.typ === "bezahlt");
    const latest = payments.length ? payments[payments.length - 1] : null;
    if (!latest && !finanzen.some((entry) => entry.typ === "offen")) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
    } else {
      const listFragment = createCard({
        eyebrow: "",
        title: "",
        body: "",
        footer: "",
      });
      const listCard = listFragment.querySelector(".ui-card") || listFragment.firstElementChild;
      if (listCard) {
        const listBody = listCard.querySelector(".ui-card__body");
        if (listBody) {
          const info = document.createElement("dl");
          info.className = "hunde-finanz-info";
          const addRow = (label, value) => {
            const dt = document.createElement("dt");
            dt.textContent = label;
            const dd = document.createElement("dd");
            dd.textContent = value;
            info.append(dt, dd);
          };
          addRow(
            "Letzte Zahlung",
            latest
              ? `${formatDateTime(latest.datum)} – CHF ${Number(latest.betrag || 0).toFixed(2)}`
              : "Keine Zahlungen"
          );
          const openSum = finanzen
            .filter((entry) => entry.typ === "offen")
            .reduce((total, entry) => total + Number(entry.betrag || 0), 0);
          addRow("Offen gesamt", `CHF ${openSum.toFixed(2)}`);
          listBody.appendChild(info);
        }
        body.appendChild(listCard);
      }
    }
  }
  section.appendChild(card);
  return section;
}

function buildFinanzOffeneSection(finanzen = [], hasError = false, { hasKunde = false } = {}) {
  const section = document.createElement("section");
  section.className = "hunde-finanz-section";
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
    if (!hasKunde) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
      section.appendChild(card);
      return section;
    }
    if (hasError) {
      body.appendChild(
        createNotice("Fehler beim Laden der Daten.", {
          variant: "warn",
          role: "alert",
        })
      );
      section.appendChild(card);
      return section;
    }
    const offen = finanzen.filter((entry) => entry.typ === "offen");
    if (!offen.length) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
    } else {
      const sum = offen.reduce((total, entry) => total + Number(entry.betrag || 0), 0);
      const summaryCardFragment = createCard({
        eyebrow: "",
        title: "",
        body: `<p><strong>Total offen:</strong> CHF ${sum.toFixed(2)}</p>`,
        footer: "",
      });
      const summaryCard =
        summaryCardFragment.querySelector(".ui-card") || summaryCardFragment.firstElementChild;
      if (summaryCard) body.appendChild(summaryCard);
      offen.forEach((entry) => {
        const itemFragment = createCard({
          eyebrow: entry.beschreibung || "Offener Posten",
          title: `CHF ${Number(entry.betrag || 0).toFixed(2)}`,
          body: `<p>${formatDateTime(entry.datum)}</p>`,
          footer: "",
        });
        const itemCard = itemFragment.querySelector(".ui-card") || itemFragment.firstElementChild;
        if (itemCard) body.appendChild(itemCard);
      });
    }
  }
  section.appendChild(card);
  return section;
}

function buildFinanzHistorieSection(finanzen = [], hasError = false, { hasKunde = false } = {}) {
  const section = document.createElement("section");
  section.className = "hunde-finanz-section";
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
    if (!hasKunde) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
      section.appendChild(card);
      return section;
    }
    if (hasError) {
      body.appendChild(
        createNotice("Fehler beim Laden der Daten.", {
          variant: "warn",
          role: "alert",
        })
      );
      section.appendChild(card);
      return section;
    }
    const payments = finanzen
      .filter((entry) => entry.typ === "bezahlt")
      .slice()
      .reverse();
    if (!payments.length) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
    } else {
      payments.forEach((entry) => {
        const paymentCardFragment = createCard({
          eyebrow: formatDateTime(entry.datum),
          title: `CHF ${Number(entry.betrag || 0).toFixed(2)}`,
          body: `<p>${entry.beschreibung || "Zahlung"}</p>`,
          footer: "",
        });
        const paymentCard =
          paymentCardFragment.querySelector(".ui-card") || paymentCardFragment.firstElementChild;
        if (paymentCard) body.appendChild(paymentCard);
      });
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
