/* globals document, console, window */
import {
  createButton,
  createCard,
  createNotice,
  createSectionHeader,
  createEmptyState,
} from "../shared/components/components.js";
import { deleteHund, listHunde } from "../shared/api/hunde.js";
import { getKunde } from "../shared/api/kunden.js";
import { listKurse } from "../shared/api/kurse.js";
import { listFinanzenByKundeId } from "../shared/api/finanzen.js";
import { injectHundToast, setHundToast } from "./formView.js";

export async function createHundeDetailView(container, hundId) {
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("hunde-view");
  window.scrollTo(0, 0);

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
    const hunde = await listHunde();
    const hund = hunde.find((entry) => entry.id === hundId);
    if (!hund) {
      throw new Error(`Hund ${hundId} nicht gefunden`);
    }
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
          kundeFinanzen = await listFinanzenByKundeId(kunde.id);
        }
      } catch (kundenError) {
        console.error("HUNDE_DETAIL_KUNDE_FAILED", kundenError);
      }
    }
    container.__linkedFinanzen = kundeFinanzen;

    cardElement.querySelector(".ui-card__title").textContent = hund.name || "Unbenannter Hund";
    body.innerHTML = "";
    body.appendChild(buildDetailList(hund, kundeInfo));
    body.appendChild(buildMetaBlock(hund));
    const kurseSection = await buildLinkedKurseSection(hund.id);
    container.appendChild(kurseSection);

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
    container.appendChild(buildFinanzUebersichtSection(container.__linkedFinanzen || []));
    container.appendChild(buildFinanzOffeneSection(container.__linkedFinanzen || []));
    container.appendChild(buildFinanzHistorieSection(container.__linkedFinanzen || []));
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
    try {
      const allKurse = await listKurse();
      kurse = allKurse.filter(
        (kurs) => Array.isArray(kurs.hundIds) && kurs.hundIds.includes(hundId)
      );
    } catch (error) {
      console.error("HUNDE_LINKED_KURSE_FAILED", error);
    }
    if (!kurse.length) {
      body.appendChild(createEmptyState("Noch keine Kurse", "", {}));
    } else {
      kurse.forEach((kurs) => {
        const kursFragment = createCard({
          eyebrow: formatDate(kurs.date),
          title: kurs.title || "Ohne Titel",
          body: `<p>${kurs.location || "Ort offen"}</p>`,
          footer: "",
        });
        const kursCard = kursFragment.querySelector(".ui-card") || kursFragment.firstElementChild;
        if (!kursCard) return;
        kursCard.classList.add("hunde-linked-kurs");
        const navigate = () => {
          window.location.hash = `#/kurse/${kurs.id}`;
        };
        kursCard.addEventListener("click", navigate);
        kursCard.addEventListener("keypress", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate();
          }
        });
        body.appendChild(kursCard);
      });
    }
  }
  section.appendChild(card);
  return section;
}

function buildFinanzUebersichtSection(finanzen = []) {
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
    const payments = finanzen.filter((entry) => entry.typ === "zahlung");
    const latest = payments.length ? payments[payments.length - 1] : null;
    if (!latest && !finanzen.some((entry) => entry.typ === "offen")) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", "", {}));
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

function buildFinanzOffeneSection(finanzen = []) {
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
    const offen = finanzen.filter((entry) => entry.typ === "offen");
    if (!offen.length) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", "", {}));
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

function buildFinanzHistorieSection(finanzen = []) {
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
    const payments = finanzen
      .filter((entry) => entry.typ === "zahlung")
      .slice()
      .reverse();
    if (!payments.length) {
      body.appendChild(createEmptyState("Keine Daten vorhanden.", "", {}));
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
