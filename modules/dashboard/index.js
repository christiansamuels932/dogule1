// Dashboard has no entity IDs; ID override controls are not applicable (Station 18 verification).
// Dashboard has no form views; verified for Station 18
// Standardized module interface for Dogule1
/* globals document, window, console */
import { createButton, createCard, createNotice } from "../shared/components/components.js";
import { listAnmeldungDrafts } from "../shared/api/anmeldung.js";
import { listKunden } from "../shared/api/kunden.js";
import { listHunde } from "../shared/api/hunde.js";
import { getDashboardBirthdays, handleDashboardBirthday } from "../shared/api/dashboard.js";

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
  const draftCards = await buildDraftCards();
  const duplicatesCard = buildDuplicatesCard();
  if (statusCard) {
    overviewSection.appendChild(statusCard);
  }
  if (birthdaysCard) {
    overviewSection.appendChild(birthdaysCard);
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

function buildMailtoHref({ to, subject, body }) {
  const params = new window.URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const suffix = params.toString();
  return `mailto:${encodeURIComponent(to || "")}${suffix ? `?${suffix}` : ""}`;
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

  const appendItem = ({
    label,
    meta,
    href,
    email,
    entityType,
    entityId,
    mailtoSubject,
    mailtoBody,
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
      const ok = window.confirm(
        `Geburtstagsemail vorbereiten?\n\nEmpfänger: ${email || "—"}\n\nHinweis: Es wird nichts automatisch versendet – es öffnet nur dein Mailprogramm.`
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
    const subject = `Alles Gute zum Geburtstag, ${kunde.vorname || name}!`;
    const bodyText = [
      `Herzlichen Glückwunsch zum Geburtstag, ${kunde.vorname || name}.`,
      "",
      "Fontanas Dogschool wünscht Dir das Allerbeste und möchte gerne ((Geschenkidee))  offerieren.",
      "",
      "Wir schätzen Dein Vertrauen in uns und hoffen, Dich noch viele Geburtstage bei uns zu haben.",
      "",
      "Beste Grüsse",
      "Richard Fontana",
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
    });
  });

  hunde.forEach((hund) => {
    const hundName = hund.name || hund.rufname || "Unbekannt";
    const kunde = hund.kunde || null;
    const kundeName = kunde
      ? [kunde.vorname, kunde.nachname].filter(Boolean).join(" ").trim() || kunde.id
      : hund.kundenId;
    const email = kunde?.email || "";
    const subject = `Alles Gute zum Geburtstag, ${hundName}!`;
    const bodyText = [
      `Herzlichen Glückwunsch zum Geburtstag, ${hundName}.`,
      "",
      `Fontanas Dogschool wünscht ${kunde?.vorname || kundeName} und Dir  das Allerbeste und wir hoffen, Dich noch viele Geburtstage bei uns zu haben.`,
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
      makeList("Customers (same email)", kundenDupes, (group) => {
        const wrap = document.createElement("div");
        const email = group.email;
        const strong = document.createElement("strong");
        strong.textContent = email || "—";
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

      const kundenByEmail = groupBy(kunden || [], (kunde) => normalizeValue(kunde.email));
      const kundenDupes = [];
      kundenByEmail.forEach((items, email) => {
        if (!email) return;
        if (items.length < 2) return;
        kundenDupes.push({ email, items });
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
