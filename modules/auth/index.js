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

async function loginUser(username) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
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

async function fetchAuthOptions() {
  const res = await fetch("/api/auth/options", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || "options_failed");
    err.code = data?.code || "OPTIONS_FAILED";
    throw err;
  }
  return Array.isArray(data?.users) ? data.users : [];
}

async function requestResetCode(username) {
  const res = await fetch("/api/auth/reset/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || "reset_request_failed");
    err.code = data?.code || "RESET_REQUEST_FAILED";
    throw err;
  }
  return data;
}

async function confirmResetCode(username, code, password) {
  const res = await fetch("/api/auth/reset/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, code, password }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || "reset_confirm_failed");
    err.code = data?.code || "RESET_CONFIRM_FAILED";
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

async function loadUserOptions(selectEl, statusSlot, controls = [], selectedUser = "") {
  selectEl.innerHTML = "";
  const baseOption = document.createElement("option");
  baseOption.value = "";
  baseOption.textContent = "Bitte auswählen";
  baseOption.selected = true;
  selectEl.appendChild(baseOption);

  try {
    const users = await fetchAuthOptions();
    users.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.username || "";
      option.textContent = user.label || user.username || "";
      if (!option.value) return;
      selectEl.appendChild(option);
    });
    if (selectedUser) {
      selectEl.value = selectedUser;
    }
    if (!users.length) {
      statusSlot.appendChild(
        createNotice("Keine Login-Optionen gefunden.", { variant: "warn", role: "alert" })
      );
    }
  } catch (error) {
    console.error("[AUTH_OPTIONS_FAILED]", error);
    statusSlot.appendChild(
      createNotice("Login-Optionen konnten nicht geladen werden.", {
        variant: "warn",
        role: "alert",
      })
    );
    controls.forEach((control) => {
      control.disabled = true;
    });
  }
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

async function renderLogin(container, { selectedUser = "" } = {}) {
  const section = document.createElement("section");
  section.className = "dogule-section auth-section";
  section.appendChild(
    createSectionHeader({
      title: "Anmelden",
      subtitle: "Bitte Benutzer auswählen.",
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
    label: "Benutzer",
    control: "select",
    required: true,
  });
  const userInput = userRow.querySelector("select");
  userInput.name = "username";
  form.appendChild(userRow);

  const footer = card.querySelector(".ui-card__footer");
  footer.innerHTML = "";
  const actions = document.createElement("div");
  actions.className = "module-actions";
  const submit = createButton({ label: "Anmelden", variant: "primary" });
  submit.type = "submit";
  submit.setAttribute("form", form.id);
  const resetBtn = createButton({ label: "Passwort vergessen", variant: "quiet" });
  resetBtn.type = "button";
  resetBtn.addEventListener("click", () => {
    renderReset(container, { selectedUser: userInput.value || selectedUser });
  });
  actions.append(submit, resetBtn);
  footer.appendChild(actions);

  await loadUserOptions(userInput, statusSlot, [submit, resetBtn], selectedUser);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusSlot.innerHTML = "";
    if (!userInput.value.trim()) {
      statusSlot.appendChild(
        createNotice("Bitte einen Benutzer auswählen.", {
          variant: "warn",
          role: "alert",
        })
      );
      return;
    }
    submit.disabled = true;
    submit.textContent = "Anmelden ...";
    try {
      const result = await loginUser(userInput.value.trim());
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

async function renderReset(container, { selectedUser = "" } = {}) {
  container.innerHTML = "";
  const section = document.createElement("section");
  section.className = "dogule-section auth-section";
  section.appendChild(
    createSectionHeader({
      title: "Passwort zurücksetzen",
      subtitle: "Code anfordern und neues Passwort setzen.",
      level: 1,
    })
  );

  const cardFragment = createCard({
    eyebrow: "",
    title: "Reset",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  if (!card) return;
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";

  const statusSlot = buildStatusSlot();
  body.appendChild(statusSlot);

  const form = document.createElement("form");
  form.noValidate = true;
  form.id = "auth-reset-form";
  body.appendChild(form);

  const userRow = createFormRow({
    id: "auth-reset-username",
    label: "Benutzer",
    control: "select",
    required: true,
  });
  const userInput = userRow.querySelector("select");
  userInput.name = "username";
  form.appendChild(userRow);

  const codeRow = createFormRow({
    id: "auth-reset-code",
    label: "Bestätigungscode",
    placeholder: "Code eingeben",
    required: true,
  });
  const codeInput = codeRow.querySelector("input");
  codeInput.name = "code";
  codeRow.style.display = "none";
  form.appendChild(codeRow);

  const passRow = createFormRow({
    id: "auth-reset-password",
    label: "Neues Passwort",
    type: "password",
    placeholder: "Neues Passwort",
    required: true,
  });
  const passInput = passRow.querySelector("input");
  passInput.name = "password";
  passRow.style.display = "none";
  form.appendChild(passRow);

  const footer = card.querySelector(".ui-card__footer");
  footer.innerHTML = "";
  const actions = document.createElement("div");
  actions.className = "module-actions";
  const requestBtn = createButton({ label: "Code senden", variant: "primary" });
  requestBtn.type = "button";
  const confirmBtn = createButton({ label: "Bestätigen", variant: "secondary" });
  confirmBtn.type = "button";
  confirmBtn.style.display = "none";
  const backBtn = createButton({ label: "Zurück", variant: "quiet" });
  backBtn.type = "button";
  backBtn.addEventListener("click", () => renderLogin(container, { selectedUser }));
  actions.append(requestBtn, confirmBtn, backBtn);
  footer.appendChild(actions);

  await loadUserOptions(userInput, statusSlot, [requestBtn, confirmBtn], selectedUser);

  requestBtn.addEventListener("click", async () => {
    statusSlot.innerHTML = "";
    if (!userInput.value.trim()) {
      statusSlot.appendChild(
        createNotice("Bitte einen Benutzer auswählen.", { variant: "warn", role: "alert" })
      );
      return;
    }
    requestBtn.disabled = true;
    requestBtn.textContent = "Sende ...";
    try {
      const result = await requestResetCode(userInput.value.trim());
      const targetEmail = result?.email || "christiansamuels932@gmail.com";
      statusSlot.appendChild(
        createNotice(`Code wurde an ${targetEmail} gesendet.`, {
          variant: "ok",
          role: "status",
        })
      );
      codeRow.style.display = "";
      passRow.style.display = "";
      confirmBtn.style.display = "";
      requestBtn.textContent = "Code erneut senden";
    } catch (error) {
      console.error("[AUTH_RESET_REQUEST_FAILED]", error);
      statusSlot.appendChild(
        createNotice("Code konnte nicht gesendet werden.", { variant: "warn", role: "alert" })
      );
      requestBtn.textContent = "Code senden";
    } finally {
      requestBtn.disabled = false;
    }
  });

  confirmBtn.addEventListener("click", async () => {
    statusSlot.innerHTML = "";
    if (!userInput.value.trim() || !codeInput.value.trim() || !passInput.value.trim()) {
      statusSlot.appendChild(
        createNotice("Bitte Code und neues Passwort eingeben.", {
          variant: "warn",
          role: "alert",
        })
      );
      return;
    }
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Bestätige ...";
    try {
      await confirmResetCode(
        userInput.value.trim(),
        codeInput.value.trim(),
        passInput.value.trim()
      );
      statusSlot.appendChild(
        createNotice("Passwort wurde aktualisiert. Bitte neu anmelden.", {
          variant: "ok",
          role: "status",
        })
      );
      window.setTimeout(
        () => renderLogin(container, { selectedUser: userInput.value.trim() }),
        800
      );
    } catch (error) {
      console.error("[AUTH_RESET_CONFIRM_FAILED]", error);
      statusSlot.appendChild(
        createNotice("Bestätigung fehlgeschlagen. Bitte Code prüfen.", {
          variant: "warn",
          role: "alert",
        })
      );
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Bestätigen";
    }
  });

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

  await renderLogin(container);
}
