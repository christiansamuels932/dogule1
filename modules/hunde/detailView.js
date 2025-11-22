/* globals document, console, window */
import {
  createCard,
  createNotice,
  createSectionHeader,
  createEmptyState,
  createButton,
} from "../shared/components/components.js";
import { deleteHund, listHunde } from "../shared/api/hunde.js";
import { getKunde } from "../shared/api/kunden.js";
import { listKurse } from "../shared/api/kurse.js";
import { listFinanzenByKundeId } from "../shared/api/finanzen.js";
import { runIntegrityCheck } from "../shared/api/db/integrityCheck.js";
import { injectHundToast, setHundToast } from "./formView.js";

export async function createHundeDetailView(container, hundId) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("hunde-view");
  window.scrollTo(0, 0);

  const headerFragment = createSectionHeader({
    title: "Hunde",
    subtitle: "",
    level: 1,
  });
  const headerSection =
    headerFragment.querySelector(".ui-section") || headerFragment.firstElementChild;
  const headerTitle = headerSection?.querySelector(".ui-section__title");
  const headerSubtitle = headerSection?.querySelector(".ui-section__subtitle");
  if (headerTitle) headerTitle.textContent = "Hund";
  if (headerSubtitle) headerSubtitle.textContent = "";
  container.appendChild(headerFragment);
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
    const hunde = await listHunde();
    const hund = hunde.find((entry) => entry.id === hundId);
    if (!hund) {
      throw new Error(`Hund ${hundId} nicht gefunden`);
    }
    let kundeLoadFailed = false;
    let finanzenLoadFailed = false;
    const kundeInfo = {
      id: hund.kundenId || "",
      name: "–",
    };
    let kundeFinanzen = [];
    if (hund.kundenId) {
      try {
        const kunde = await getKunde(hund.kundenId);
        if (kunde) {
          const fullName = `${kunde.vorname ?? ""} ${kunde.nachname ?? ""}`.trim();
          kundeInfo.name = fullName || kunde.vorname || kunde.nachname || "–";
          kundeInfo.id = kunde.id || hund.kundenId;
          kundeInfo.code = kunde.code || kunde.kundenCode || kunde.id;
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
    cardElement.querySelector(".ui-card__title").textContent = hundName;
    body.innerHTML = "";
    if (headerSubtitle) {
      headerSubtitle.textContent = "";
      headerSubtitle.hidden = true;
    }
    if (kundeLoadFailed) {
      body.appendChild(
        createNotice("Fehler beim Laden der Daten.", {
          variant: "warn",
          role: "alert",
        })
      );
    }
    body.appendChild(buildOwnerCard(kundeInfo, kundeLoadFailed));
    body.appendChild(buildDetailList(hund));
    body.appendChild(buildMetaBlock(hund));
    const kurseSection = await buildLinkedKurseSection(hund.id);
    container.appendChild(kurseSection);

    footer.innerHTML = "";
    const editBtn = createButton({ label: "Bearbeiten", variant: "primary" });
    editBtn.type = "button";
    editBtn.addEventListener("click", () => {
      window.location.hash = `#/hunde/${hund.id}/edit`;
    });
    footer.appendChild(editBtn);

    const deleteBtn = createButton({ label: "Löschen", variant: "secondary" });
    deleteBtn.addEventListener("click", () => handleDeleteHund(container, hund.id, deleteBtn));
    footer.appendChild(deleteBtn);

    if (kundeInfo.id) {
      const kundeBtn = createButton({ label: "Zum Kunden", variant: "secondary" });
      kundeBtn.type = "button";
      kundeBtn.addEventListener("click", () => {
        window.location.hash = `#/kunden/${kundeInfo.id}`;
      });
      footer.appendChild(kundeBtn);
    }

    const backBtn = createButton({ label: "Zur Liste", variant: "quiet" });
    backBtn.type = "button";
    backBtn.addEventListener("click", () => {
      window.location.hash = "#/hunde";
    });
    footer.appendChild(backBtn);
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
    footer.innerHTML = "";
    footer.appendChild(createNavLink("Zur Liste", "#/hunde", "secondary"));
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
      const allKurse = await listKurse();
      kurse = allKurse.filter(
        (kurs) => Array.isArray(kurs.hundIds) && kurs.hundIds.includes(hundId)
      );
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
      body.appendChild(createEmptyState("Keine Daten vorhanden.", ""));
    } else {
      kurse.forEach((kurs) => {
        const kursFragment = createCard({
          eyebrow: kurs.code || kurs.title || "–",
          title: kurs.title || "Ohne Titel",
          body: `<p>${formatDate(kurs.date)} · ${kurs.location || "Ort offen"}</p>`,
          footer: "",
        });
        const kursCard = kursFragment.querySelector(".ui-card") || kursFragment.firstElementChild;
        if (!kursCard) return;
        kursCard.classList.add("hunde-linked-kurs");
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
    const payments = finanzen.filter((entry) => entry.typ === "zahlung");
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
      .filter((entry) => entry.typ === "zahlung")
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
    { label: "Geburtsdatum", value: formatDate(hund.geburtsdatum) },
    { label: "Gewicht (kg)", value: hund.gewichtKg },
    { label: "Größe (cm)", value: hund.groesseCm },
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
    eyebrow: kundeInfo.code || kundeInfo.id || "Kunde",
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
    const name = kundeInfo.name || "–";
    const code = kundeInfo.code || kundeInfo.id;
    const nameEl = document.createElement("p");
    nameEl.textContent = name;
    const codeEl = document.createElement("p");
    codeEl.textContent = `Code: ${code}`;
    body.append(nameEl, codeEl);
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

function createNavLink(label, href, variant = "secondary") {
  const link = document.createElement("a");
  link.href = href;
  link.className = `ui-btn ui-btn--${variant}`;
  link.textContent = label;
  return link;
}

async function handleDeleteHund(container, hundId, button) {
  if (!button || button.disabled) return;
  const confirmed = window.confirm("Möchten Sie diesen Hund wirklich löschen?");
  if (!confirmed) return;
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Lösche ...";
  try {
    const blocker = document.createElement("div");
    blocker.className = "hunde-delete-block";
    const card = createCard({
      eyebrow: "",
      title: "",
      body: "",
      footer: "",
    });
    const cardEl = card.querySelector(".ui-card") || card.firstElementChild;
    const body = cardEl?.querySelector(".ui-card__body");
    if (body) {
      body.innerHTML = "";
    }
    const [kurse, finanzen] = await Promise.all([listKurse(), listFinanzenByKundeId(hundId)]);
    const linkedKurse = kurse.filter(
      (kurs) => Array.isArray(kurs.hundIds) && kurs.hundIds.includes(hundId)
    );
    const linkedFinanzen = finanzen || [];
    if (linkedKurse.length || linkedFinanzen.length) {
      if (body) {
        body.appendChild(
          createNotice(
            "Der Hund kann nicht gelöscht werden, da noch verknüpfte Kurse oder Finanzdaten existieren.",
            { variant: "warn", role: "alert" }
          )
        );
      }
      setHundToast(
        "Löschen blockiert: Bitte zuerst Kurse/Finanzen auflösen oder entfernen.",
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
    window.location.hash = "#/hunde";
  } catch (error) {
    console.error("[HUNDE_ERR_DELETE]", error);
    setHundToast("Hund konnte nicht gelöscht werden.", "error");
    injectHundToast(container);
    button.disabled = false;
    button.textContent = originalLabel;
  }
}
