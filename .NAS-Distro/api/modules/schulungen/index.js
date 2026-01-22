/* globals document, window, console, FileReader */
import {
  listSchulungen,
  getSchulung,
  createSchulung,
  uploadSchulungImage,
  deleteSchulung,
} from "../shared/api/schulungen.js";
import {
  createCard,
  createNotice,
  createEmptyState,
  createButton,
  createFormRow,
  createSectionHeader,
} from "../shared/components/components.js";
import { getSession } from "../shared/auth/client.js";

function parseRoute(segments = []) {
  if (!segments.length) return { mode: "list" };
  if (segments[0] === "new") return { mode: "create" };
  return { mode: "detail", detailId: segments[0] };
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function canCreate() {
  const role = getSession()?.user?.role || "";
  return role === "admin";
}

function buildActionsCard() {
  const actionsCard = createCard({
    eyebrow: "",
    title: "Aktionen",
    body: "",
    footer: "",
  });
  const card = actionsCard.querySelector(".ui-card") || actionsCard.firstElementChild;
  const body = card?.querySelector(".ui-card__body");
  if (!body) return card;
  body.innerHTML = "";
  const actions = document.createElement("div");
  actions.className = "module-actions";
  if (canCreate()) {
    const createBtn = createButton({
      label: "Schulung erstellen",
      variant: "primary",
      onClick: () => {
        window.location.hash = "#/schulungen/new";
      },
    });
    actions.appendChild(createBtn);
  }
  body.appendChild(actions);
  return card;
}

async function renderListView(section) {
  const actionsCard = buildActionsCard();
  if (actionsCard) section.appendChild(actionsCard);

  const cardFragment = createCard({
    eyebrow: "",
    title: "Schulungshistorie",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";
  const statusSlot = document.createElement("div");
  statusSlot.className = "schulungen-status";
  body.appendChild(statusSlot);
  body.appendChild(createNotice("Lade Schulungen...", { variant: "info", role: "status" }));
  section.appendChild(card);

  let entries = [];
  try {
    entries = await listSchulungen();
  } catch (error) {
    console.error("[SCHULUNGEN_LIST_FAILED]", error);
    body.innerHTML = "";
    body.appendChild(createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" }));
    return;
  }

  if (!entries.length) {
    body.innerHTML = "";
    body.appendChild(createEmptyState("Keine Schulungen vorhanden.", ""));
    return;
  }

  body.innerHTML = "";
  body.appendChild(statusSlot);
  const list = document.createElement("ul");
  list.className = "schulungen-list";
  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "schulungen-item";
    const link = document.createElement("a");
    link.className = "schulungen-item__link";
    link.href = `#/schulungen/${entry.id}`;
    const date = formatDate(entry.occurredAt) || "–";
    const title = entry.title || "Schulung";
    link.textContent = `${date} · ${title}`;
    item.appendChild(link);
    if (canCreate()) {
      const actions = document.createElement("div");
      actions.className = "module-actions";
      const deleteBtn = createButton({ label: "Löschen", variant: "secondary" });
      deleteBtn.type = "button";
      deleteBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        statusSlot.innerHTML = "";
        const ok = window.confirm(
          `Schulung wirklich löschen?\n\n${title}\n\nDieser Vorgang kann nicht rückgängig gemacht werden.`
        );
        if (!ok) return;
        deleteBtn.disabled = true;
        try {
          await deleteSchulung(entry.id);
          item.remove();
          statusSlot.appendChild(
            createNotice("Schulung gelöscht.", { variant: "ok", role: "status" })
          );
          if (!list.children.length) {
            body.innerHTML = "";
            body.append(statusSlot, createEmptyState("Keine Schulungen vorhanden.", ""));
          }
        } catch (error) {
          console.error("[SCHULUNGEN_DELETE_FAILED]", error);
          statusSlot.appendChild(
            createNotice("Löschen fehlgeschlagen.", { variant: "warn", role: "alert" })
          );
          deleteBtn.disabled = false;
        }
      });
      actions.appendChild(deleteBtn);
      item.appendChild(actions);
    }
    list.appendChild(item);
  });
  body.appendChild(list);
}

function buildBlocksList(blocks = []) {
  const wrap = document.createElement("div");
  wrap.className = "schulungen-blocks";
  blocks.forEach((block) => {
    const blockEl = document.createElement("div");
    blockEl.className = "schulungen-block";
    const title = document.createElement("div");
    title.className = "schulungen-block__title";
    title.textContent = block.title || "";
    blockEl.appendChild(title);
    if (block.type === "image") {
      const link = document.createElement("a");
      link.className = "schulungen-block__image-link";
      link.href = block.url || "";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const image = document.createElement("img");
      image.className = "schulungen-block__image";
      image.alt = block.title || "Schulung Bild";
      image.src = block.url || "";
      link.appendChild(image);
      blockEl.appendChild(link);
    } else {
      const text = document.createElement("div");
      text.className = "schulungen-block__text";
      text.textContent = block.text || "";
      blockEl.appendChild(text);
    }
    wrap.appendChild(blockEl);
  });
  return wrap;
}

async function renderDetailView(section, id) {
  const header = createSectionHeader({ title: "Schulung", subtitle: "" });
  section.appendChild(header);

  const detailCard = createCard({
    eyebrow: "",
    title: "Details",
    body: "",
    footer: "",
  });
  const card = detailCard.querySelector(".ui-card") || detailCard.firstElementChild;
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";
  body.appendChild(createNotice("Lade Schulung...", { variant: "info", role: "status" }));
  section.appendChild(card);

  let entry = null;
  try {
    entry = await getSchulung(id);
  } catch (error) {
    console.error("[SCHULUNGEN_GET_FAILED]", error);
    entry = null;
  }
  if (!entry) {
    body.innerHTML = "";
    body.appendChild(createNotice("Schulung nicht gefunden.", { variant: "warn", role: "alert" }));
    return;
  }

  body.innerHTML = "";
  const title = document.createElement("h3");
  title.textContent = entry.title || "Schulung";
  const meta = document.createElement("div");
  meta.className = "schulungen-detail__meta";
  meta.textContent = formatDate(entry.occurredAt) || "";
  body.append(title, meta, buildBlocksList(entry.blocks || []));
}

function addBlockRow(container, type) {
  const block = document.createElement("div");
  block.className = "schulungen-form-block";
  block.dataset.type = type;

  const titleRow = createFormRow({
    id: `schulungen-block-title-${Math.random().toString(36).slice(2)}`,
    label: "Titel",
    required: true,
  });
  const titleInput = titleRow.querySelector("input");
  titleInput.name = "blockTitle";

  block.appendChild(titleRow);

  if (type === "image") {
    const imageRow = createFormRow({
      id: `schulungen-block-image-${Math.random().toString(36).slice(2)}`,
      label: "Bild",
      control: "input",
      type: "file",
    });
    const input = imageRow.querySelector("input");
    if (input) {
      input.accept = "image/*";
      input.name = "blockImage";
    }
    block.appendChild(imageRow);
  } else {
    const textRow = createFormRow({
      id: `schulungen-block-text-${Math.random().toString(36).slice(2)}`,
      label: "Text",
      control: "textarea",
      required: true,
    });
    const textarea = textRow.querySelector("textarea");
    textarea.name = "blockText";
    block.appendChild(textRow);
  }

  const removeBtn = createButton({ label: "Entfernen", variant: "secondary" });
  removeBtn.type = "button";
  removeBtn.addEventListener("click", () => {
    block.remove();
  });
  const actions = document.createElement("div");
  actions.className = "module-actions";
  actions.appendChild(removeBtn);
  block.appendChild(actions);

  container.appendChild(block);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

async function renderCreateView(section) {
  if (!canCreate()) {
    section.appendChild(
      createNotice("Nur Trainer 001 kann Schulungen erstellen.", {
        variant: "warn",
        role: "alert",
      })
    );
    return;
  }

  const header = createSectionHeader({ title: "Neue Schulung", subtitle: "" });
  section.appendChild(header);

  const cardFragment = createCard({
    eyebrow: "",
    title: "Schulung anlegen",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  const body = card.querySelector(".ui-card__body");
  const footer = card.querySelector(".ui-card__footer");
  const statusSlot = document.createElement("div");
  statusSlot.className = "schulungen-form-status";

  const form = document.createElement("form");
  form.className = "schulungen-form";
  form.id = "schulungen-create-form";
  form.noValidate = true;

  const dateRow = createFormRow({
    id: "schulungen-date",
    label: "Datum",
    control: "input",
    type: "date",
    required: true,
    value: formatDate(new Date().toISOString()),
  });
  const titleRow = createFormRow({
    id: "schulungen-title",
    label: "Titel",
    required: true,
  });

  form.append(dateRow, titleRow);

  const blocksHeader = document.createElement("h4");
  blocksHeader.textContent = "Inhalte";
  blocksHeader.className = "schulungen-form__heading";
  form.appendChild(blocksHeader);

  const blocksWrap = document.createElement("div");
  blocksWrap.className = "schulungen-form-blocks";
  form.appendChild(blocksWrap);

  const addActions = document.createElement("div");
  addActions.className = "module-actions";
  const addTextBtn = createButton({ label: "Textfeld hinzufügen", variant: "secondary" });
  addTextBtn.type = "button";
  addTextBtn.addEventListener("click", () => addBlockRow(blocksWrap, "text"));
  const addImageBtn = createButton({ label: "Bild hinzufügen", variant: "secondary" });
  addImageBtn.type = "button";
  addImageBtn.addEventListener("click", () => addBlockRow(blocksWrap, "image"));
  addActions.append(addTextBtn, addImageBtn);
  form.appendChild(addActions);

  body.innerHTML = "";
  body.append(statusSlot, form);

  const submitBtn = createButton({ label: "Speichern", variant: "primary" });
  submitBtn.type = "submit";
  submitBtn.setAttribute("form", form.id);
  footer.innerHTML = "";
  footer.appendChild(submitBtn);

  addBlockRow(blocksWrap, "text");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusSlot.innerHTML = "";
    const dateInput = dateRow.querySelector("input");
    const titleInput = titleRow.querySelector("input");
    const dateValue = dateInput?.value || "";
    const titleValue = titleInput?.value.trim() || "";

    const blockNodes = Array.from(blocksWrap.querySelectorAll(".schulungen-form-block"));
    const blocks = [];
    let hasText = false;
    let missingTitle = false;

    for (const node of blockNodes) {
      const type = node.dataset.type || "text";
      const blockTitle = node.querySelector("input[name='blockTitle']")?.value.trim() || "";
      if (!blockTitle) {
        missingTitle = true;
        break;
      }
      if (type === "image") {
        const fileInput = node.querySelector("input[name='blockImage']");
        const file = fileInput?.files?.[0] || null;
        if (!file) continue;
        blocks.push({ type: "image", title: blockTitle, file });
      } else {
        const textValue = node.querySelector("textarea[name='blockText']")?.value || "";
        if (textValue.trim()) {
          hasText = true;
        }
        blocks.push({ type: "text", title: blockTitle, text: textValue });
      }
    }

    if (!titleValue || !dateValue) {
      statusSlot.appendChild(
        createNotice("Titel und Datum sind erforderlich.", { variant: "warn", role: "alert" })
      );
      return;
    }
    if (missingTitle) {
      statusSlot.appendChild(
        createNotice("Jeder Inhalt braucht einen Titel.", { variant: "warn", role: "alert" })
      );
      return;
    }
    if (!blocks.length) {
      statusSlot.appendChild(
        createNotice("Mindestens ein Inhalt ist erforderlich.", {
          variant: "warn",
          role: "alert",
        })
      );
      return;
    }
    if (!hasText) {
      statusSlot.appendChild(
        createNotice("Mindestens ein Textfeld ist erforderlich.", {
          variant: "warn",
          role: "alert",
        })
      );
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Speichern ...";
    try {
      const resolvedBlocks = [];
      for (const block of blocks) {
        if (block.type === "image") {
          const dataUrl = await readFileAsDataUrl(block.file);
          const upload = await uploadSchulungImage({
            fileName: block.file.name || "bild",
            dataUrl,
          });
          resolvedBlocks.push({
            type: "image",
            title: block.title,
            url: upload?.url || "",
          });
        } else {
          resolvedBlocks.push({
            type: "text",
            title: block.title,
            text: block.text || "",
          });
        }
      }

      const payload = {
        title: titleValue,
        occurredAt: dateValue,
        blocks: resolvedBlocks,
      };
      const created = await createSchulung(payload);
      window.location.hash = `#/schulungen/${created.id}`;
    } catch (error) {
      console.error("[SCHULUNGEN_CREATE_FAILED]", error);
      statusSlot.appendChild(
        createNotice("Schulung konnte nicht erstellt werden.", { variant: "warn", role: "alert" })
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Speichern";
    }
  });

  section.appendChild(card);
}

export function initModule(container, routeInfo = {}) {
  if (!container) return;
  container.innerHTML = "";
  container.scrollTo?.({ top: 0, behavior: "auto" });

  const { mode, detailId } = parseRoute(routeInfo?.segments || []);
  const section = document.createElement("section");
  section.className = "dogule-section schulungen-section";

  if (mode === "list") {
    renderListView(section);
  } else if (mode === "create") {
    renderCreateView(section);
  } else if (mode === "detail") {
    renderDetailView(section, detailId);
  }

  container.appendChild(section);
}
