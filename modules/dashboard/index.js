// Dashboard has no entity IDs; ID override controls are not applicable (Station 18 verification).
// Dashboard has no form views; verified for Station 18
// Standardized module interface for Dogule1
/* globals document, window, console */
import { createButton, createCard, createNotice } from "../shared/components/components.js";
import { listAnmeldungDrafts } from "../shared/api/anmeldung.js";
import { listKunden } from "../shared/api/kunden.js";
import { listHunde } from "../shared/api/hunde.js";
import { listTrainer } from "../shared/api/trainer.js";
import { getDashboardBirthdays, handleDashboardBirthday } from "../shared/api/dashboard.js";
import {
  listRapporteDrafts,
  approveRapporteDraft,
  rejectRapporteDraft,
} from "../shared/api/rapporteDrafts.js";
import { getSession } from "../shared/auth/client.js";

export async function initModule(container) {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const overviewSection = document.createElement("section");
  overviewSection.className = "dogule-section";
  const statusCardFragment = createCard({
    eyebrow: "",
    title: "Systemstatus",
    body: "",
    footer: "",
  });
  const statusCard =
    statusCardFragment.querySelector(".ui-card") || statusCardFragment.firstElementChild;
  const statusBody = statusCard?.querySelector(".ui-card__body");
  if (statusBody) {
    statusBody.innerHTML = "";
    statusBody.appendChild(
      createNotice("Alles betriebsbereit.", {
        variant: "ok",
        role: "status",
      })
    );
  }

  const birthdaysCard = await buildBirthdaysCard();
  const rapporteCard = await buildRapporteDraftsCard();
  const draftCards = await buildDraftCards();
  const duplicatesCard = buildDuplicatesCard();
  if (statusCard) {
    overviewSection.appendChild(statusCard);
  }
  if (birthdaysCard) {
    overviewSection.appendChild(birthdaysCard);
  }
  if (rapporteCard) {
    overviewSection.appendChild(rapporteCard);
  }
  if (draftCards) {
    overviewSection.appendChild(draftCards);
  }
  if (duplicatesCard) {
    overviewSection.appendChild(duplicatesCard);
  }

  fragment.appendChild(overviewSection);
  container.appendChild(fragment);

  window.scrollTo(0, 0);
  const heading = container.querySelector(".ui-section__title");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }
}

async function buildDraftCards() {
  let drafts = [];
  try {
    drafts = await listAnmeldungDrafts();
  } catch (error) {
    console.error("DASHBOARD_DRAFTS_LOAD_FAILED", error);
    drafts = [];
  }

  if (!drafts.length) return null;

  const fragment = document.createDocumentFragment();
  drafts.forEach((draft) => {
    const kundeCardFragment = createCard({
      eyebrow: "Anmeldung",
      title: "Neuer Kunde (Entwurf)",
      body: "",
      footer: "",
    });
    const kundeCard =
      kundeCardFragment.querySelector(".ui-card") || kundeCardFragment.firstElementChild;
    const kundeBody = kundeCard?.querySelector(".ui-card__body");
    const kundeFooter = kundeCard?.querySelector(".ui-card__footer");
    if (kundeBody) {
      const kunde = draft.kundePayload || {};
      const name = [kunde.vorname, kunde.nachname].filter(Boolean).join(" ").trim();
      kundeBody.innerHTML = `<p><strong>${name || "Unbekannt"}</strong></p><p>${
        draft.kursTitle || "Kurs nicht zugewiesen"
      }</p>`;
    }
    if (kundeFooter) {
      const open = createButton({
        label: "Weiter bearbeiten",
        variant: "primary",
        onClick: () => {
          window.location.hash = `#/anmeldung/${draft.id}`;
        },
      });
      kundeFooter.appendChild(open);
    }
    fragment.appendChild(kundeCard);

    const hundCardFragment = createCard({
      eyebrow: "Anmeldung",
      title: "Neuer Hund (Entwurf)",
      body: "",
      footer: "",
    });
    const hundCard =
      hundCardFragment.querySelector(".ui-card") || hundCardFragment.firstElementChild;
    const hundBody = hundCard?.querySelector(".ui-card__body");
    const hundFooter = hundCard?.querySelector(".ui-card__footer");
    if (hundBody) {
      const hund = draft.hundPayload || {};
      hundBody.innerHTML = `<p><strong>${hund.name || "Unbekannt"}</strong></p><p>${
        draft.kursTitle || "Kurs nicht zugewiesen"
      }</p>`;
    }
    if (hundFooter) {
      const open = createButton({
        label: "Weiter bearbeiten",
        variant: "primary",
        onClick: () => {
          window.location.hash = `#/anmeldung/${draft.id}`;
        },
      });
      hundFooter.appendChild(open);
    }
    fragment.appendChild(hundCard);
  });

  return fragment;
}

function findKundeNameById(kunden, id) {
  const kunde = kunden.find((entry) => entry.id === id);
  if (!kunde) return "";
  return [kunde.vorname, kunde.nachname].filter(Boolean).join(" ").trim();
}

function resolveTrainerIdFromActorId(actorId) {
  const raw = String(actorId || "").trim();
  if (!raw) return "";
  return raw.startsWith("user-") ? raw.slice(5) : raw;
}

async function buildRapporteDraftsCard() {
  const role = getSession()?.user?.role || "";
  if (!(role === "admin" || role === "developer")) return null;

  let drafts = [];
  try {
    drafts = await listRapporteDrafts();
  } catch (error) {
    console.error("DASHBOARD_RAPPORTE_LOAD_FAILED", error);
    drafts = [];
  }
  if (!drafts.length) return null;

  let kunden = [];
  let hunde = [];
  let trainers = [];
  try {
    [kunden, hunde, trainers] = await Promise.all([listKunden(), listHunde(), listTrainer()]);
  } catch (error) {
    console.error("DASHBOARD_RAPPORTE_TARGETS_FAILED", error);
    kunden = [];
    hunde = [];
    trainers = [];
  }
  const trainerMap = new Map(
    trainers.map((trainer) => [trainer.id, trainer.name || trainer.code || trainer.id])
  );

  const cardFragment = createCard({
    eyebrow: "",
    title: "Neue Rapporte (Entwurf)",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return null;
  const body = card.querySelector(".ui-card__body");
  if (!body) return card;

  const list = document.createElement("ul");
  list.className = "dashboard-rapporte";

  drafts.forEach((draft) => {
    const li = document.createElement("li");
    const row = document.createElement("div");
    row.className = "dashboard-rapporte__row";
    const left = document.createElement("div");

    let label = "";
    let href = "";
    if (draft.targetType === "kunden") {
      const name = findKundeNameById(kunden, draft.targetId) || draft.targetId;
      label = `Kunde: ${name}`;
      href = `#/kunden/${draft.targetId}`;
    } else {
      const hund = hunde.find((entry) => entry.id === draft.targetId);
      const hundName = hund?.name || hund?.rufname || draft.targetId;
      const kundeName = findKundeNameById(kunden, hund?.kundenId) || hund?.kundenId || "";
      label = `Hund: ${hundName}`;
      href = `#/hunde/${draft.targetId}`;
      if (kundeName) {
        label = `${label} (${kundeName})`;
      }
    }

    const title = document.createElement("div");
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    link.className = "dashboard-rapporte__link";
    title.appendChild(link);

    const meta = document.createElement("div");
    meta.className = "dashboard-rapporte__meta";
    const date = draft.occurredAt ? new Date(draft.occurredAt).toLocaleString("de-CH") : "";
    const trainerId = resolveTrainerIdFromActorId(draft.authorId);
    const trainerName = trainerId ? trainerMap.get(trainerId) : "";
    const authorLabel = trainerName
      ? `Trainer: ${trainerName}`
      : draft.authorRole
        ? `Rolle: ${draft.authorRole}`
        : draft.authorId
          ? `Autor: ${draft.authorId}`
          : "";
    const textPreview = String(draft.text || "").trim();
    const metaTop = document.createElement("div");
    metaTop.textContent = [date, authorLabel].filter(Boolean).join(" · ");
    meta.appendChild(metaTop);
    if (textPreview) {
      const metaBottom = document.createElement("div");
      metaBottom.textContent = `Notiz: ${textPreview}`;
      meta.appendChild(metaBottom);
    }

    left.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "dashboard-rapporte__actions module-actions";
    const approveBtn = createButton({ label: "Bestätigen", variant: "primary" });
    approveBtn.type = "button";
    const rejectBtn = createButton({ label: "Verwerfen", variant: "secondary" });
    rejectBtn.type = "button";

    approveBtn.addEventListener("click", async () => {
      const ok = window.confirm(`Rapport bestätigen?\n\n${label}`);
      if (!ok) return;
      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      try {
        await approveRapporteDraft(draft.id);
        li.remove();
        if (!list.children.length) {
          card.remove();
        }
      } catch (error) {
        console.error("DASHBOARD_RAPPORTE_APPROVE_FAILED", error);
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
        window.alert("Aktion fehlgeschlagen (siehe Konsole).");
      }
    });

    rejectBtn.addEventListener("click", async () => {
      const ok = window.confirm(`Rapport verwerfen?\n\n${label}`);
      if (!ok) return;
      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      try {
        await rejectRapporteDraft(draft.id);
        li.remove();
        if (!list.children.length) {
          card.remove();
        }
      } catch (error) {
        console.error("DASHBOARD_RAPPORTE_REJECT_FAILED", error);
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
        window.alert("Aktion fehlgeschlagen (siehe Konsole).");
      }
    });

    actions.append(approveBtn, rejectBtn);
    row.append(left, actions);
    li.appendChild(row);
    list.appendChild(li);
  });

  body.appendChild(list);
  return card;
}

function buildMailtoHref({ to, subject, body }) {
  const parts = [];
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body)}`);
  const suffix = parts.length ? `?${parts.join("&")}` : "";
  return `mailto:${encodeURIComponent(to || "")}${suffix}`;
}

async function buildBirthdaysCard() {
  let data = null;
  try {
    data = await getDashboardBirthdays();
  } catch (error) {
    console.error("DASHBOARD_BIRTHDAYS_LOAD_FAILED", error);
    data = null;
  }
  const kunden = Array.isArray(data?.kunden) ? data.kunden : [];
  const hunde = Array.isArray(data?.hunde) ? data.hunde : [];
  if (!kunden.length && !hunde.length) return null;

  const cardFragment = createCard({
    eyebrow: "",
    title: "Heutige Geburtstage",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return null;
  const body = card.querySelector(".ui-card__body");
  if (!body) return card;

  const list = document.createElement("ul");
  list.className = "dashboard-birthdays";

  const normalizeStatus = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();
  const warnLabel = (text) => `WARNUNG: ${text}`;

  const appendItem = ({
    label,
    meta,
    href,
    email,
    entityType,
    entityId,
    mailtoSubject,
    mailtoBody,
    warningText,
  }) => {
    const li = document.createElement("li");
    const row = document.createElement("div");
    row.className = "dashboard-birthdays__row";

    const left = document.createElement("div");
    const title = document.createElement("div");
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    link.className = "dashboard-birthdays__link";
    title.appendChild(link);
    const small = document.createElement("div");
    small.className = "dashboard-birthdays__meta";
    small.textContent = meta || "";
    left.append(title, small);
    if (warningText) {
      const warningFragment = createNotice(warnLabel(warningText), {
        variant: "warn",
        role: "alert",
      });
      const warningEl = warningFragment.firstElementChild;
      if (warningEl) {
        warningEl.classList.add("dashboard-birthdays__warning");
      }
      left.appendChild(warningFragment);
    }

    const actions = document.createElement("div");
    actions.className = "dashboard-birthdays__actions module-actions";
    const dismissBtn = createButton({ label: "Verwerfen", variant: "secondary" });
    dismissBtn.type = "button";
    const mailBtn = createButton({ label: "Geburtstagsemail", variant: "primary" });
    mailBtn.type = "button";
    mailBtn.disabled = !String(email || "").trim();

    dismissBtn.addEventListener("click", async () => {
      const ok = window.confirm(`Geburtstagseintrag verwerfen?\n\n${label}`);
      if (!ok) return;
      dismissBtn.disabled = true;
      mailBtn.disabled = true;
      try {
        await handleDashboardBirthday({ entityType, entityId, action: "dismissed" });
        li.remove();
      } catch (error) {
        console.error("DASHBOARD_BIRTHDAYS_DISMISS_FAILED", error);
        dismissBtn.disabled = false;
        mailBtn.disabled = !String(email || "").trim();
        window.alert("Aktion fehlgeschlagen (siehe Konsole).");
      }
    });

    mailBtn.addEventListener("click", async () => {
      const warningLine = warningText ? `\n\nWARNUNG: ${warningText}` : "";
      const ok = window.confirm(
        `Geburtstagsemail vorbereiten?\n\nEmpfänger: ${email || "—"}${warningLine}\n\nHinweis: Es wird nichts automatisch versendet – es öffnet nur dein Mailprogramm.`
      );
      if (!ok) return;
      dismissBtn.disabled = true;
      mailBtn.disabled = true;
      try {
        await handleDashboardBirthday({ entityType, entityId, action: "mailto_prepared" });
        const hrefMailto = buildMailtoHref({ to: email, subject: mailtoSubject, body: mailtoBody });
        window.location.href = hrefMailto;
        li.remove();
      } catch (error) {
        console.error("DASHBOARD_BIRTHDAYS_MAILTO_FAILED", error);
        dismissBtn.disabled = false;
        mailBtn.disabled = !String(email || "").trim();
        window.alert("Aktion fehlgeschlagen (siehe Konsole).");
      }
    });

    actions.append(mailBtn, dismissBtn);
    row.append(left, actions);
    li.appendChild(row);
    list.appendChild(li);
  };

  kunden.forEach((kunde) => {
    const name = [kunde.vorname, kunde.nachname].filter(Boolean).join(" ").trim() || "Unbekannt";
    const email = kunde.email || "";
    const kundenStatus = normalizeStatus(kunde.status);
    const warningText = kundenStatus === "deaktiviert" ? "Kunde ist deaktiviert." : "";
    const subject = `Alles Gute zum Geburtstag, ${kunde.vorname || name}!`;
    const bodyText = [
      `Herzlichen Glückwunsch zum Geburtstag, ${kunde.vorname || name}.`,
      "",
      "",
      "Fontanas Dogschool wünscht Dir das Allerbeste und möchte gerne ((Geschenkidee))  offerieren.",
      "",
      "Wir schätzen Dein Vertrauen in uns und hoffen, Dich noch viele Geburtstage bei uns zu haben.",
      "",
      "",
      "Beste Grüsse",
    ].join("\n");
    appendItem({
      label: `Kunde: ${name}`,
      meta: kunde.geburtsdatum ? `Geburtsdatum: ${kunde.geburtsdatum}` : "",
      href: `#/kunden/${kunde.id}`,
      email,
      entityType: "kunden",
      entityId: kunde.id,
      mailtoSubject: subject,
      mailtoBody: bodyText,
      warningText,
    });
  });

  hunde.forEach((hund) => {
    const hundName = hund.name || hund.rufname || "Unbekannt";
    const kunde = hund.kunde || null;
    const hundStatus = normalizeStatus(hund.status);
    const kundenStatus = normalizeStatus(kunde?.status);
    const warningText = [
      hundStatus === "verstorben" ? "Hund ist verstorben." : "",
      kundenStatus === "deaktiviert" ? "Kunde ist deaktiviert." : "",
    ]
      .filter(Boolean)
      .join(" ");
    const kundeName = kunde
      ? [kunde.vorname, kunde.nachname].filter(Boolean).join(" ").trim() || kunde.id
      : hund.kundenId;
    const email = kunde?.email || "";
    const subject = `Alles Gute zum Geburtstag, ${hundName}!`;
    const bodyText = [
      `Herzlichen Glückwunsch zum Geburtstag, ${hundName}.`,
      "",
      "",
      `Fontanas Dogschool wünscht ${kunde?.vorname || kundeName} und Dir  das Allerbeste und wir hoffen, Dich noch viele Geburtstage bei uns zu haben.`,
      "",
      "",
      "Beste Grüsse",
    ]
      .filter(Boolean)
      .join("\n");
    appendItem({
      label: `Hund: ${hundName}`,
      meta: [
        kundeName ? `Besitzer: ${kundeName}` : "",
        hund.geburtsdatum ? `Geburtsdatum: ${hund.geburtsdatum}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      href: `#/hunde/${hund.id}`,
      email,
      entityType: "hunde",
      entityId: hund.id,
      mailtoSubject: subject,
      mailtoBody: bodyText,
      warningText,
    });
  });

  body.appendChild(list);
  return card;
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function extractTown(address = "") {
  if (typeof address !== "string") return "";
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return "";
  const townRaw = parts[parts.length - 1];
  const cleaned = townRaw.replace(/^\\d+\\s*/, "").trim();
  return cleaned || townRaw;
}

function groupBy(items, keyFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

function buildDuplicatesCard() {
  const cardFragment = createCard({
    eyebrow: "",
    title: "Possible duplicates",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return null;

  const body = card.querySelector(".ui-card__body");
  const footer = card.querySelector(".ui-card__footer");
  if (!body || !footer) return card;

  const status = document.createElement("div");
  const resultHost = document.createElement("div");
  body.append(status, resultHost);

  const scanBtn = createButton({ label: "Scan now", variant: "secondary" });
  scanBtn.type = "button";
  footer.appendChild(scanBtn);

  const renderResults = ({ kundenDupes = [], hundDupes = [] } = {}) => {
    resultHost.innerHTML = "";
    const summary = document.createElement("p");
    summary.innerHTML = `<strong>${kundenDupes.length}</strong> customer groups and <strong>${hundDupes.length}</strong> dog groups look duplicated.`;
    resultHost.appendChild(summary);

    const makeList = (title, groups, renderItem) => {
      const block = document.createElement("div");
      const h = document.createElement("h3");
      h.textContent = title;
      block.appendChild(h);
      if (!groups.length) {
        block.appendChild(
          createNotice("No duplicates detected.", { variant: "ok", role: "status" })
        );
        return block;
      }
      const ul = document.createElement("ul");
      groups.forEach((group) => {
        const li = document.createElement("li");
        li.appendChild(renderItem(group));
        ul.appendChild(li);
      });
      block.appendChild(ul);
      return block;
    };

    resultHost.appendChild(
      makeList("Customers (same name + town)", kundenDupes, (group) => {
        const wrap = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = `${group.name || "—"} · ${group.town || "—"}`;
        wrap.appendChild(strong);
        const ul = document.createElement("ul");
        group.items.forEach((kunde) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = `#/kunden/${kunde.id}`;
          a.textContent = `${[kunde.vorname, kunde.nachname].filter(Boolean).join(" ").trim() || "Unbekannt"} (${kunde.id})`;
          li.appendChild(a);
          ul.appendChild(li);
        });
        wrap.appendChild(ul);
        return wrap;
      })
    );

    resultHost.appendChild(
      makeList("Dogs (same owner + name)", hundDupes, (group) => {
        const wrap = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = `${group.kundeName || "Owner"} · ${group.name || "—"}`;
        wrap.appendChild(strong);
        const ul = document.createElement("ul");
        group.items.forEach((hund) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = `#/hunde/${hund.id}`;
          a.textContent = `${hund.name || hund.rufname || "Unbekannt"} (${hund.id})`;
          li.appendChild(a);
          ul.appendChild(li);
        });
        wrap.appendChild(ul);
        return wrap;
      })
    );
  };

  scanBtn.addEventListener("click", async () => {
    if (scanBtn.disabled) return;
    scanBtn.disabled = true;
    status.innerHTML = "";
    resultHost.innerHTML = "";
    status.appendChild(createNotice("Scanning…", { variant: "info", role: "status" }));
    try {
      const [kunden, hunde] = await Promise.all([listKunden(), listHunde()]);
      const kundenById = new Map((kunden || []).map((kunde) => [kunde.id, kunde]));

      const kundenByNameTown = groupBy(kunden || [], (kunde) => {
        const name = [kunde.nachname, kunde.vorname].filter(Boolean).join(" ").trim();
        const town = extractTown(kunde.adresse || kunde.address || "");
        const nameKey = normalizeValue(name);
        const townKey = normalizeValue(town);
        if (!nameKey || !townKey) return "";
        return `${nameKey}|${townKey}`;
      });
      const kundenDupes = [];
      kundenByNameTown.forEach((items, key) => {
        if (!key) return;
        if (items.length < 2) return;
        const [nameKey, townKey] = key.split("|");
        const name = items[0]
          ? [items[0].nachname, items[0].vorname].filter(Boolean).join(" ").trim()
          : nameKey;
        const town =
          items[0]?.adresse || items[0]?.address
            ? extractTown(items[0].adresse || items[0].address || "")
            : townKey;
        kundenDupes.push({ name, town, items });
      });
      kundenDupes.sort((a, b) => b.items.length - a.items.length);

      const hundByOwnerName = groupBy(hunde || [], (hund) => {
        const owner = normalizeValue(hund.kundenId);
        const name = normalizeValue(hund.name || hund.rufname);
        if (!owner || !name) return "";
        return `${owner}|${name}`;
      });
      const hundDupes = [];
      hundByOwnerName.forEach((items, key) => {
        if (!key) return;
        if (items.length < 2) return;
        const [ownerId, name] = key.split("|");
        const kunde = kundenById.get(ownerId) || null;
        const kundeName = kunde
          ? [kunde.vorname, kunde.nachname].filter(Boolean).join(" ").trim()
          : ownerId;
        hundDupes.push({ ownerId, kundeName, name, items });
      });
      hundDupes.sort((a, b) => b.items.length - a.items.length);

      status.innerHTML = "";
      status.appendChild(createNotice("Scan complete.", { variant: "ok", role: "status" }));
      renderResults({ kundenDupes, hundDupes });
    } catch (error) {
      console.error("[DASHBOARD_DUPLICATES_SCAN_FAILED]", error);
      status.innerHTML = "";
      status.appendChild(
        createNotice("Scan failed (see console).", { variant: "warn", role: "alert" })
      );
    } finally {
      scanBtn.disabled = false;
    }
  });

  return card;
}
