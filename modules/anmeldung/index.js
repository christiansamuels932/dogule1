/* globals document, window, console */
import {
  createButton,
  createCard,
  createEmptyState,
  createFormRow,
  createNotice,
  createSectionHeader,
} from "../shared/components/components.js";
import { listKurse } from "../shared/api/kurse.js";
import {
  createAnmeldungDraft,
  deleteAnmeldungDraft,
  getAnmeldungDraft,
  updateAnmeldungDraft,
  createKundeFromAnmeldungDraft,
  createHundFromAnmeldungDraft,
} from "../shared/api/anmeldung.js";
import { buildAdresseFromParts, findBestKursMatch, parseEmailDraft } from "./parser.js";
import { getSession } from "../shared/auth/client.js";

function isClientReadonlyRole() {
  const role = String(getSession()?.user?.role || "")
    .trim()
    .toLowerCase();
  return role === "client_readonly";
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function focusHeading(container) {
  const heading = container.querySelector(".ui-section__title");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
}

function buildBackLink(href, label = "Zur Übersicht") {
  const link = document.createElement("a");
  link.href = href;
  link.className = "ui-btn ui-btn--quiet";
  link.textContent = label;
  return link;
}

function ensureSelectOptions(select, options, selectedValue) {
  select.innerHTML = "";
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    if (selectedValue && opt.value === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function isValidDraftForKunde(draft) {
  if (!draft?.kursId) return false;
  const kunde = draft?.kundePayload || {};
  const hund = draft?.hundPayload || {};
  const kundeOk = Boolean(
    String(kunde.vorname || "").trim() || String(kunde.nachname || "").trim()
  );
  const hundOk = Boolean(String(hund.name || "").trim());
  return kundeOk && hundOk;
}

function isValidDraftForHund(draft) {
  if (!draft?.kursId) return false;
  if (!draft?.kundeId) return false;
  const hund = draft?.hundPayload || {};
  return Boolean(String(hund.name || "").trim());
}

function renderErrors(host, errors = {}) {
  host.innerHTML = "";
  const messages = Object.values(errors).filter(Boolean);
  if (!messages.length) return;
  messages.forEach((message) => {
    host.appendChild(createNotice(message, { variant: "warn", role: "alert" }));
  });
}

async function renderEditor(container, { mode, draftId, initial }) {
  const section = document.createElement("section");
  section.className = "dogule-section";
  section.appendChild(
    createSectionHeader({
      title: "Anmeldung",
      subtitle: mode === "detail" ? `Entwurf ${draftId}` : "E-Mail einfügen und auswerten",
    })
  );

  const statusHost = document.createElement("div");
  section.appendChild(statusHost);

  const kursOptions = [{ value: "", label: "— Kurs auswählen —" }];
  let kurse = [];
  try {
    kurse = await listKurse();
    kurse
      .slice()
      .sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "de"))
      .forEach((kurs) => {
        kursOptions.push({
          value: kurs.id,
          label: kurs.title ? `${kurs.title} (${kurs.date || ""})` : kurs.id,
        });
      });
  } catch (error) {
    console.error("[ANMELDUNG_ERR_KURSE_LOAD]", error);
    statusHost.appendChild(
      createNotice("Kurse konnten nicht geladen werden.", { variant: "warn", role: "alert" })
    );
  }

  const state = { ...initial };

  const kursCardFrag = createCard({ eyebrow: "", title: "Kurs", body: "", footer: "" });
  const kursCard = kursCardFrag.querySelector(".ui-card") || kursCardFrag.firstElementChild;
  const kursBody = kursCard.querySelector(".ui-card__body");
  const kursRow = createFormRow({
    id: "anmeldung-kurs",
    label: "Kurs",
    control: "select",
    options: [],
  });
  const kursSelect = kursRow.querySelector("select");
  if (!state.kursId && state.kursTitle) {
    const match = findBestKursMatch(kurse, state.kursTitle);
    if (match) {
      state.kursId = match.id;
      state.kursTitle = match.title;
    }
  }
  ensureSelectOptions(kursSelect, kursOptions, state.kursId || "");
  kursSelect.addEventListener("change", () => {
    state.kursId = kursSelect.value || null;
    const match = kurse.find((kurs) => kurs.id === state.kursId);
    state.kursTitle = match?.title || state.kursTitle || "";
  });
  kursBody.appendChild(kursRow);
  section.appendChild(kursCard);

  const kundeCardFrag = createCard({ eyebrow: "", title: "Kunde (Entwurf)", body: "", footer: "" });
  const kundeCard = kundeCardFrag.querySelector(".ui-card") || kundeCardFrag.firstElementChild;
  const kundeBody = kundeCard.querySelector(".ui-card__body");

  const kundeAnredeRow = createFormRow({
    id: "anmeldung-kunde-anrede",
    label: "Anrede",
    control: "select",
    options: [
      { value: "", label: "Bitte wählen" },
      { value: "Herr", label: "Herr" },
      { value: "Frau", label: "Frau" },
    ],
  });
  const kundeVornameRow = createFormRow({
    id: "anmeldung-kunde-vorname",
    label: "Vorname",
    value: state.kundePayload?.vorname || "",
  });
  const kundeNachnameRow = createFormRow({
    id: "anmeldung-kunde-nachname",
    label: "Nachname",
    value: state.kundePayload?.nachname || "",
  });
  const kundeStrasseRow = createFormRow({
    id: "anmeldung-kunde-strasse",
    label: "Strasse",
    value: state.kundePayload?.strasse || "",
  });
  const kundePlzRow = createFormRow({
    id: "anmeldung-kunde-plz",
    label: "PLZ",
    value: state.kundePayload?.plz || "",
  });
  const kundeOrtRow = createFormRow({
    id: "anmeldung-kunde-ort",
    label: "Ort",
    value: state.kundePayload?.ort || "",
  });
  const kundeEmailRow = createFormRow({
    id: "anmeldung-kunde-email",
    label: "E-Mail",
    value: state.kundePayload?.email || "",
  });
  const kundeTelefonRow = createFormRow({
    id: "anmeldung-kunde-telefon",
    label: "Telefon",
    value: state.kundePayload?.telefon || "",
  });
  const kundeGeburtsdatumRow = createFormRow({
    id: "anmeldung-kunde-geburtsdatum",
    label: "Geburtsdatum",
    value: state.kundePayload?.geburtsdatum || "",
  });
  const kundeMobileRow = createFormRow({
    id: "anmeldung-kunde-mobile",
    label: "Mobile",
    value: state.kundePayload?.mobile || "",
  });
  const kundeHeimatortRow = createFormRow({
    id: "anmeldung-kunde-heimatort",
    label: "Heimatort",
    value: state.kundePayload?.heimatort || "",
  });
  const kundeAufmerksamRow = createFormRow({
    id: "anmeldung-kunde-aufmerksam",
    label: "Aufmerksam durch",
    value: state.kundePayload?.aufmerksamDurch || "",
  });

  const anredeSelect = kundeAnredeRow.querySelector("select");
  if (anredeSelect) {
    const currentAnrede = state.kundePayload?.anrede || "";
    const match = Array.from(anredeSelect.options).find((opt) => opt.value === currentAnrede);
    if (match) match.selected = true;
  }

  const readKundeState = () => {
    const nextStrasse = kundeStrasseRow.querySelector("input").value;
    const nextPlz = kundePlzRow.querySelector("input").value;
    const nextOrt = kundeOrtRow.querySelector("input").value;
    state.kundePayload = {
      ...(state.kundePayload || {}),
      anrede: anredeSelect?.value || "",
      vorname: kundeVornameRow.querySelector("input").value,
      nachname: kundeNachnameRow.querySelector("input").value,
      strasse: nextStrasse,
      plz: nextPlz,
      ort: nextOrt,
      email: kundeEmailRow.querySelector("input").value,
      telefon: kundeTelefonRow.querySelector("input").value,
      geburtsdatum: kundeGeburtsdatumRow.querySelector("input").value,
      mobile: kundeMobileRow.querySelector("input").value,
      heimatort: kundeHeimatortRow.querySelector("input").value,
      aufmerksamDurch: kundeAufmerksamRow.querySelector("input").value,
      adresse: buildAdresseFromParts({
        strasse: nextStrasse,
        plz: nextPlz,
        ort: nextOrt,
      }),
    };
  };
  [
    kundeVornameRow,
    kundeNachnameRow,
    kundeStrasseRow,
    kundePlzRow,
    kundeOrtRow,
    kundeEmailRow,
    kundeTelefonRow,
    kundeGeburtsdatumRow,
    kundeMobileRow,
    kundeHeimatortRow,
    kundeAufmerksamRow,
  ].forEach((row) => row.querySelector("input").addEventListener("input", readKundeState));
  if (anredeSelect) {
    anredeSelect.addEventListener("change", readKundeState);
  }

  kundeBody.append(
    kundeAnredeRow,
    kundeVornameRow,
    kundeNachnameRow,
    kundeStrasseRow,
    kundePlzRow,
    kundeOrtRow,
    kundeEmailRow,
    kundeTelefonRow,
    kundeGeburtsdatumRow,
    kundeMobileRow,
    kundeHeimatortRow,
    kundeAufmerksamRow
  );
  section.appendChild(kundeCard);

  const hundCardFrag = createCard({ eyebrow: "", title: "Hund (Entwurf)", body: "", footer: "" });
  const hundCard = hundCardFrag.querySelector(".ui-card") || hundCardFrag.firstElementChild;
  const hundBody = hundCard.querySelector(".ui-card__body");
  const hundNameRow = createFormRow({
    id: "anmeldung-hund-name",
    label: "Name",
    value: state.hundPayload?.name || "",
  });
  const hundRufnameRow = createFormRow({
    id: "anmeldung-hund-rufname",
    label: "Rufname",
    value: state.hundPayload?.rufname || "",
  });
  const hundRasseRow = createFormRow({
    id: "anmeldung-hund-rasse",
    label: "Rasse",
    value: state.hundPayload?.rasse || "",
  });
  const hundGeschlechtRow = createFormRow({
    id: "anmeldung-hund-geschlecht",
    label: "Geschlecht",
    value: state.hundPayload?.geschlecht || "",
  });
  const hundKastriertRow = createFormRow({
    id: "anmeldung-hund-kastriert",
    label: "Kastriert",
    control: "select",
    options: [
      { value: "", label: "Bitte wählen" },
      { value: "true", label: "Ja" },
      { value: "false", label: "Nein" },
    ],
  });
  const hundGeburtsdatumRow = createFormRow({
    id: "anmeldung-hund-geburtsdatum",
    label: "Wurfdatum (DD.MM.YYYY)",
    value: state.hundPayload?.geburtsdatum || "",
  });
  const hundChipRow = createFormRow({
    id: "anmeldung-hund-chip",
    label: "Chip-Nr.",
    value: state.hundPayload?.chipNummer || "",
  });

  const kastriertSelect = hundKastriertRow.querySelector("select");
  if (kastriertSelect) {
    const currentValue = state.hundPayload?.kastriert;
    const selectedValue = currentValue === true ? "true" : currentValue === false ? "false" : "";
    const match = Array.from(kastriertSelect.options).find((opt) => opt.value === selectedValue);
    if (match) match.selected = true;
  }

  const readHundState = () => {
    const kastriertValue = kastriertSelect?.value || "";
    state.hundPayload = {
      ...(state.hundPayload || {}),
      name: hundNameRow.querySelector("input").value,
      rufname: hundRufnameRow.querySelector("input").value,
      rasse: hundRasseRow.querySelector("input").value,
      geschlecht: hundGeschlechtRow.querySelector("input").value,
      geburtsdatum: hundGeburtsdatumRow.querySelector("input").value,
      kastriert:
        kastriertValue === ""
          ? ""
          : kastriertValue === "true"
            ? true
            : kastriertValue === "false"
              ? false
              : kastriertValue,
      chipNummer: hundChipRow.querySelector("input").value,
    };
  };
  [
    hundNameRow,
    hundRufnameRow,
    hundRasseRow,
    hundGeschlechtRow,
    hundGeburtsdatumRow,
    hundChipRow,
  ].forEach((row) => row.querySelector("input").addEventListener("input", readHundState));
  if (kastriertSelect) {
    kastriertSelect.addEventListener("change", readHundState);
  }

  hundBody.append(
    hundNameRow,
    hundRufnameRow,
    hundRasseRow,
    hundGeschlechtRow,
    hundKastriertRow,
    hundGeburtsdatumRow,
    hundChipRow
  );
  section.appendChild(hundCard);

  const errorsHost = document.createElement("div");
  section.appendChild(errorsHost);
  renderErrors(errorsHost, state.errors);

  const actionsCardFrag = createCard({ eyebrow: "", title: "Aktionen", body: "", footer: "" });
  const actionsCard =
    actionsCardFrag.querySelector(".ui-card") || actionsCardFrag.firstElementChild;
  const actionsBody = actionsCard.querySelector(".ui-card__body");
  const actionsWrap = document.createElement("div");
  actionsWrap.className = "module-actions anmeldung-actions";
  actionsBody.appendChild(actionsWrap);

  if (mode === "detail") {
    const saveBtn = createButton({ label: "Entwurf speichern", variant: "primary" });
    saveBtn.type = "button";
    saveBtn.addEventListener("click", async () => {
      statusHost.innerHTML = "";
      try {
        readKundeState();
        readHundState();
        const updated = await updateAnmeldungDraft(draftId, {
          status: state.status,
          rawText: state.rawText || "",
          kursId: state.kursId,
          kursTitle: state.kursTitle || "",
          kundePayload: state.kundePayload,
          hundPayload: state.hundPayload,
          errors: state.errors,
          kundeId: state.kundeId || null,
        });
        Object.assign(state, updated || {});
        statusHost.appendChild(createNotice("Entwurf gespeichert.", { variant: "ok" }));
      } catch (error) {
        console.error("[ANMELDUNG_ERR_SAVE]", error);
        statusHost.appendChild(
          createNotice("Entwurf konnte nicht gespeichert werden.", {
            variant: "warn",
            role: "alert",
          })
        );
      }
    });

    const deleteBtn = createButton({ label: "Entwurf verwerfen", variant: "secondary" });
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", async () => {
      const ok = window.confirm("Entwurf wirklich verwerfen?");
      if (!ok) return;
      statusHost.innerHTML = "";
      try {
        await deleteAnmeldungDraft(draftId);
        window.location.hash = "#/dashboard";
      } catch (error) {
        console.error("[ANMELDUNG_ERR_DELETE]", error);
        statusHost.appendChild(
          createNotice("Entwurf konnte nicht gelöscht werden.", { variant: "warn", role: "alert" })
        );
      }
    });

    const kundeBtn = createButton({ label: "Kunde speichern", variant: "secondary" });
    kundeBtn.type = "button";
    const hundBtn = createButton({ label: "Hund speichern", variant: "secondary" });
    hundBtn.type = "button";
    let kundeSaving = false;
    let hundSaving = false;

    const syncFinalizeState = () => {
      kundeBtn.disabled = kundeSaving || Boolean(state.kundeId) || !isValidDraftForKunde(state);
      hundBtn.disabled = hundSaving || Boolean(state.hundId) || !isValidDraftForHund(state);
    };
    syncFinalizeState();
    kursSelect.addEventListener("change", syncFinalizeState);
    [kundeVornameRow, kundeNachnameRow, hundNameRow].forEach((row) =>
      row.querySelector("input").addEventListener("input", syncFinalizeState)
    );

    kundeBtn.addEventListener("click", async () => {
      if (kundeSaving) return;
      kundeSaving = true;
      syncFinalizeState();
      statusHost.innerHTML = "";
      try {
        await updateAnmeldungDraft(draftId, {
          kursId: state.kursId,
          kursTitle: state.kursTitle || "",
          kundePayload: state.kundePayload,
          hundPayload: state.hundPayload,
        });
        const result = await createKundeFromAnmeldungDraft(draftId);
        state.kundeId = result?.kunde?.id || result?.draft?.kundeId || state.kundeId;
        state.status = result?.draft?.status || state.status;
        statusHost.appendChild(createNotice("Kunde gespeichert.", { variant: "ok" }));
      } catch (error) {
        console.error("[ANMELDUNG_ERR_KUNDE]", error);
        statusHost.appendChild(
          createNotice("Kunde konnte nicht gespeichert werden.", { variant: "warn", role: "alert" })
        );
      } finally {
        kundeSaving = false;
        syncFinalizeState();
      }
    });

    hundBtn.addEventListener("click", async () => {
      if (hundSaving) return;
      hundSaving = true;
      syncFinalizeState();
      statusHost.innerHTML = "";
      try {
        await updateAnmeldungDraft(draftId, {
          kursId: state.kursId,
          kursTitle: state.kursTitle || "",
          hundPayload: state.hundPayload,
        });
        const result = await createHundFromAnmeldungDraft(draftId);
        if (result?.kundeId) {
          window.location.hash = `#/kunden/${result.kundeId}`;
          return;
        }
        window.location.hash = "#/dashboard";
      } catch (error) {
        console.error("[ANMELDUNG_ERR_HUND]", error);
        statusHost.appendChild(
          createNotice("Hund konnte nicht gespeichert werden.", { variant: "warn", role: "alert" })
        );
      } finally {
        hundSaving = false;
        syncFinalizeState();
      }
    });

    actionsWrap.append(saveBtn, kundeBtn, hundBtn, deleteBtn, buildBackLink("#/dashboard"));
  } else {
    const saveDraftBtn = createButton({ label: "Entwurf speichern", variant: "primary" });
    saveDraftBtn.type = "button";
    saveDraftBtn.addEventListener("click", async () => {
      statusHost.innerHTML = "";
      try {
        readKundeState();
        readHundState();
        const created = await createAnmeldungDraft({
          status: "draft",
          rawText: state.rawText || "",
          kursId: state.kursId,
          kursTitle: state.kursTitle || "",
          kundePayload: state.kundePayload,
          hundPayload: state.hundPayload,
          errors: state.errors,
        });
        window.location.hash = `#/anmeldung/${created.id}`;
      } catch (error) {
        console.error("[ANMELDUNG_ERR_CREATE]", error);
        statusHost.appendChild(
          createNotice("Entwurf konnte nicht gespeichert werden.", {
            variant: "warn",
            role: "alert",
          })
        );
      }
    });

    const resetBtn = createButton({ label: "Verwerfen", variant: "secondary" });
    resetBtn.type = "button";
    resetBtn.addEventListener("click", () => {
      window.location.hash = "#/anmeldung";
    });

    actionsWrap.append(saveDraftBtn, resetBtn, buildBackLink("#/dashboard"));
  }

  section.appendChild(actionsCard);
  container.appendChild(section);
  focusHeading(container);
}

async function renderCreate(container) {
  container.innerHTML = "";

  const intakeSection = document.createElement("section");
  intakeSection.className = "dogule-section";

  const statusHost = document.createElement("div");
  intakeSection.appendChild(statusHost);

  const intakeCardFrag = createCard({
    eyebrow: "E-Mail einfügen und auswerten",
    title: "Anmeldung",
    body: "",
    footer: "",
  });
  const intakeCard = intakeCardFrag.querySelector(".ui-card") || intakeCardFrag.firstElementChild;
  const intakeBody = intakeCard.querySelector(".ui-card__body");

  const textareaRow = document.createElement("div");
  const textarea = document.createElement("textarea");
  textarea.id = "anmeldung-raw";
  textarea.placeholder = "Anmeldung (E-Mail einfügen)";
  textarea.rows = 10;
  textarea.style.width = "100%";
  textareaRow.appendChild(textarea);
  intakeBody.appendChild(textareaRow);
  intakeSection.appendChild(intakeCard);

  const actionsWrap = document.createElement("div");
  actionsWrap.className = "module-actions anmeldung-actions";
  const parseBtn = createButton({ label: "Auswerten", variant: "primary" });
  parseBtn.type = "button";
  const isReadonlyClient = isClientReadonlyRole();
  if (isReadonlyClient) {
    parseBtn.disabled = true;
    parseBtn.title = "Nur Lesen";
  }
  actionsWrap.appendChild(parseBtn);
  intakeSection.appendChild(actionsWrap);

  const previewHost = document.createElement("div");
  intakeSection.appendChild(previewHost);
  container.appendChild(intakeSection);

  parseBtn.addEventListener("click", async () => {
    if (isReadonlyClient) return;
    statusHost.innerHTML = "";
    previewHost.innerHTML = "";
    const rawText = normalizeText(textarea.value);
    if (!rawText) {
      statusHost.appendChild(
        createNotice("Bitte E-Mail Text einfügen.", { variant: "warn", role: "alert" })
      );
      return;
    }
    const parsed = parseEmailDraft(rawText);
    const initial = {
      status: "draft",
      rawText,
      kursId: null,
      kursTitle: parsed.kursTitle,
      kundePayload: parsed.kundePayload,
      hundPayload: parsed.hundPayload,
      errors: parsed.errors,
      kundeId: null,
      hundId: null,
    };
    await renderEditor(previewHost, { mode: "create", initial });
  });

  focusHeading(container);
}

async function renderDetail(container, draftId) {
  container.innerHTML = "";
  const status = document.createElement("section");
  status.className = "dogule-section";
  status.appendChild(createSectionHeader({ title: "Anmeldung", subtitle: "Entwurf laden…" }));
  container.appendChild(status);
  try {
    const draft = await getAnmeldungDraft(draftId);
    if (!draft) {
      status.appendChild(
        createEmptyState("Entwurf nicht gefunden.", "", {
          actionNode: buildBackLink("#/dashboard"),
        })
      );
      return;
    }
    container.innerHTML = "";
    await renderEditor(container, { mode: "detail", draftId, initial: draft });
  } catch (error) {
    console.error("[ANMELDUNG_ERR_LOAD]", error);
    status.appendChild(
      createNotice("Entwurf konnte nicht geladen werden.", { variant: "warn", role: "alert" })
    );
  }
  focusHeading(container);
}

export async function initModule(container, routeInfo = { segments: [] }) {
  container.innerHTML = "";
  const draftId = routeInfo?.segments?.[0];
  if (draftId) {
    await renderDetail(container, draftId);
    return;
  }
  await renderCreate(container);
}
