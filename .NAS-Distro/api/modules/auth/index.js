/* globals document, window, console, fetch */
import {
  createCard,
  createFormRow,
  createButton,
  createNotice,
  createSectionHeader,
} from "../shared/components/components.js";
import {
  saveSession,
  clearSession,
  getSession,
  getDefaultModuleForRole,
} from "../shared/auth/client.js";

async function loginUser(username, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || "login_failed");
    err.code = data?.code || "LOGIN_FAILED";
    throw err;
  }
  return data;
}

async function logoutUser(refreshToken) {
  if (!refreshToken) return;
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
}

function buildStatusSlot() {
  const slot = document.createElement("div");
  slot.className = "auth-status";
  return slot;
}

function renderLoggedIn(container, session) {
  const section = document.createElement("section");
  section.className = "dogule-section auth-section";
  section.appendChild(
    createSectionHeader({
      title: "Angemeldet",
      subtitle: "Du bist bereits angemeldet.",
      level: 1,
    })
  );

  const cardFragment = createCard({
    eyebrow: "",
    title: "Sitzung",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return;
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";
  body.appendChild(
    createNotice(
      `Angemeldet als ${session.user?.username || "?"} (${session.user?.role || "?"}).`,
      { variant: "ok", role: "status" }
    )
  );

  const footer = card.querySelector(".ui-card__footer");
  footer.innerHTML = "";
  const actions = document.createElement("div");
  actions.className = "module-actions";
  const logoutBtn = createButton({ label: "Abmelden", variant: "secondary" });
  logoutBtn.type = "button";
  logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    await logoutUser(session.refreshToken);
    clearSession();
    window.location.hash = "#/auth";
  });
  actions.appendChild(logoutBtn);
  footer.appendChild(actions);

  section.appendChild(card);
  container.appendChild(section);
}

export async function initModule(container) {
  if (!container) return;
  container.innerHTML = "";

  const existing = getSession();
  if (existing?.user?.role) {
    renderLoggedIn(container, existing);
    return;
  }

  const section = document.createElement("section");
  section.className = "dogule-section auth-section";
  section.appendChild(
    createSectionHeader({
      title: "Anmelden",
      subtitle: "Bitte mit Benutzername und Passwort anmelden.",
      level: 1,
    })
  );

  const cardFragment = createCard({
    eyebrow: "",
    title: "Zugang",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return;
  const form = document.createElement("form");
  form.id = "auth-login-form";
  form.noValidate = true;
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";
  body.appendChild(form);

  const statusSlot = buildStatusSlot();
  body.appendChild(statusSlot);

  const userRow = createFormRow({
    id: "auth-username",
    label: "Benutzername",
    placeholder: "z. B. admin",
    required: true,
  });
  const userInput = userRow.querySelector("input");
  userInput.name = "username";
  form.appendChild(userRow);

  const passRow = createFormRow({
    id: "auth-password",
    label: "Passwort",
    type: "password",
    placeholder: "Passwort",
    required: true,
  });
  const passInput = passRow.querySelector("input");
  passInput.name = "password";
  form.appendChild(passRow);

  const footer = card.querySelector(".ui-card__footer");
  footer.innerHTML = "";
  const actions = document.createElement("div");
  actions.className = "module-actions";
  const submit = createButton({ label: "Anmelden", variant: "primary" });
  submit.type = "submit";
  submit.setAttribute("form", form.id);
  actions.appendChild(submit);
  footer.appendChild(actions);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusSlot.innerHTML = "";
    submit.disabled = true;
    submit.textContent = "Anmelden ...";
    try {
      const result = await loginUser(userInput.value.trim(), passInput.value);
      saveSession(result);
      const target = getDefaultModuleForRole(result.user?.role);
      window.location.hash = `#/${target}`;
    } catch (error) {
      console.error("[AUTH_LOGIN_FAILED]", error);
      statusSlot.appendChild(
        createNotice("Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen.", {
          variant: "warn",
          role: "alert",
        })
      );
    } finally {
      submit.disabled = false;
      submit.textContent = "Anmelden";
    }
  });

  section.appendChild(card);
  container.appendChild(section);
}
