/* globals document, window, fetch */
import { createButton, createCard, createNotice } from "../shared/components/components.js";
import { getSession, getAuthHeaders } from "../shared/auth/client.js";

const SLOT_LABELS = {
  "24h": "Restore 24h",
  "72h": "Restore 72h",
};

function formatTimestamp(value) {
  if (!value) return "Nicht vorhanden";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nicht vorhanden";
  return date.toLocaleString("de-CH", { dateStyle: "medium", timeStyle: "short" });
}

async function fetchBackups() {
  const res = await fetch("/api/developer/backups", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || "backup_list_failed");
    err.code = data?.code || "BACKUP_LIST_FAILED";
    throw err;
  }
  return data;
}

async function triggerRestore(slot) {
  const res = await fetch("/api/developer/restore", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ slot }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || "restore_failed");
    err.code = data?.code || "RESTORE_FAILED";
    throw err;
  }
  return data;
}

export async function initModule(container) {
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "dogule-section developer-section";
  container.appendChild(section);

  const role = getSession()?.user?.role || "";
  if (role !== "developer") {
    section.appendChild(createNotice("Keine Berechtigung.", { variant: "warn", role: "alert" }));
    return;
  }

  const cardFragment = createCard({
    eyebrow: "",
    title: "Backups",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return;
  section.appendChild(card);

  const body = card.querySelector(".ui-card__body");
  const footer = card.querySelector(".ui-card__footer");
  body.innerHTML = "";
  footer.innerHTML = "";

  const status = document.createElement("div");
  body.appendChild(status);

  const list = document.createElement("ul");
  list.className = "kunden-list";
  body.appendChild(list);

  const actions = document.createElement("div");
  actions.className = "module-actions";
  footer.appendChild(actions);

  const render = (slots = {}) => {
    list.innerHTML = "";
    actions.innerHTML = "";
    Object.keys(SLOT_LABELS).forEach((slot) => {
      const item = document.createElement("li");
      const label = document.createElement("strong");
      label.textContent = SLOT_LABELS[slot];
      const meta = document.createElement("span");
      meta.textContent = ` — ${formatTimestamp(slots?.[slot]?.mtime)}`;
      item.append(label, meta);
      list.appendChild(item);

      const btn = createButton({ label: SLOT_LABELS[slot], variant: "secondary" });
      btn.type = "button";
      btn.disabled = !slots?.[slot]?.exists;
      btn.addEventListener("click", async () => {
        const confirmed = window.confirm(
          "Datenbank wiederherstellen?\nAlle Änderungen nach diesem Snapshot gehen verloren. Der Dienst wird neu gestartet."
        );
        if (!confirmed) return;
        btn.disabled = true;
        btn.textContent = "Starte Restore ...";
        try {
          await triggerRestore(slot);
          status.innerHTML = "";
          status.appendChild(
            createNotice("Restore gestartet. Der Dienst wird neu gestartet; bitte kurz warten.", {
              variant: "info",
              role: "status",
            })
          );
        } catch {
          status.innerHTML = "";
          status.appendChild(
            createNotice("Restore fehlgeschlagen.", { variant: "warn", role: "alert" })
          );
          btn.disabled = false;
          btn.textContent = SLOT_LABELS[slot];
        }
      });
      actions.appendChild(btn);
    });
  };

  try {
    render({});
    status.appendChild(createNotice("Backups werden geladen ...", { variant: "info" }));
    const data = await fetchBackups();
    status.innerHTML = "";
    render(data?.slots || {});
  } catch {
    status.innerHTML = "";
    status.appendChild(
      createNotice("Backups konnten nicht geladen werden.", { variant: "warn", role: "alert" })
    );
  }
}
