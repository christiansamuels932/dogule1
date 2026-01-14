// Dashboard has no entity IDs; ID override controls are not applicable (Station 18 verification).
// Dashboard has no form views; verified for Station 18
// Standardized module interface for Dogule1
/* globals document, window, console */
import { createButton, createCard, createNotice } from "../shared/components/components.js";
import { listAnmeldungDrafts } from "../shared/api/anmeldung.js";
import { listKunden } from "../shared/api/kunden.js";
import { listHunde } from "../shared/api/hunde.js";

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

  const draftCards = await buildDraftCards();
  const duplicatesCard = buildDuplicatesCard();
  if (statusCard) {
    overviewSection.appendChild(statusCard);
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
