/* globals document, window, console, FileReader */
import {
  listUebungsbibliothek,
  getUebungsbibliothek,
  createUebungsbibliothek,
  updateUebungsbibliothek,
  uploadUebungsbibliothekImage,
  deleteUebungsbibliothek,
} from "../shared/api/uebungsbibliothek.js";
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
  if (segments[1] === "edit") return { mode: "edit", detailId: segments[0] };
  return { mode: "detail", detailId: segments[0] };
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function valueOrDash(value) {
  const normalized = String(value || "").trim();
  return normalized ? normalized : "–";
}

function normalizeSortValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function resolveCreatorLabel(rawValue = "") {
  const normalized = String(rawValue || "")
    .trim()
    .toLowerCase();
  if (normalized === "info") return "Richard";
  return String(rawValue || "").trim();
}

function canCreate() {
  const role = getSession()?.user?.role || "";
  return (
    role === "admin" || role === "developer" || role === "trainer" || role === "trainer_rapport"
  );
}

function getCreatorLabel() {
  const user = getSession()?.user || {};
  return resolveCreatorLabel(user.username || user.id || "");
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
      label: "Eintrag erstellen",
      variant: "primary",
      onClick: () => {
        window.location.hash = "#/uebungsbibliothek/new";
      },
    });
    actions.appendChild(createBtn);
  }
  body.appendChild(actions);
  return card;
}

function buildDetailActions(entry, statusSlot) {
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
  const editBtn = createButton({
    label: "Bearbeiten",
    variant: "primary",
    onClick: () => {
      window.location.hash = `#/uebungsbibliothek/${entry.id}/edit`;
    },
  });
  actions.appendChild(editBtn);
  const deleteBtn = createButton({ label: "Löschen", variant: "secondary" });
  deleteBtn.type = "button";
  deleteBtn.addEventListener("click", async () => {
    statusSlot.innerHTML = "";
    const ok = window.confirm(
      `Eintrag wirklich löschen?\n\n${valueOrDash(entry.title)}\n\nDieser Vorgang kann nicht rückgängig gemacht werden.`
    );
    if (!ok) return;
    deleteBtn.disabled = true;
    try {
      await deleteUebungsbibliothek(entry.id);
      statusSlot.appendChild(createNotice("Eintrag gelöscht.", { variant: "ok", role: "status" }));
      window.location.hash = "#/uebungsbibliothek";
    } catch (error) {
      console.error("[SCHULUNGEN_DELETE_FAILED]", error);
      statusSlot.appendChild(
        createNotice("Löschen fehlgeschlagen.", { variant: "warn", role: "alert" })
      );
      deleteBtn.disabled = false;
    }
  });
  actions.appendChild(deleteBtn);
  body.appendChild(actions);
  if (statusSlot) {
    body.appendChild(statusSlot);
  }
  return card;
}

async function renderListView(section) {
  section.classList.add("card-stack-compact");
  const actionsCard = buildActionsCard();
  if (actionsCard) section.appendChild(actionsCard);

  const cardFragment = createCard({
    eyebrow: "",
    title: "Übungsbibliothek",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";
  const statusSlot = document.createElement("div");
  statusSlot.className = "schulungen-status";
  body.appendChild(statusSlot);
  body.appendChild(createNotice("Lade Übungsbibliothek...", { variant: "info", role: "status" }));
  section.appendChild(card);

  let entries = [];
  try {
    entries = await listUebungsbibliothek();
  } catch (error) {
    console.error("[SCHULUNGEN_LIST_FAILED]", error);
    body.innerHTML = "";
    body.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
    return;
  }

  if (!entries.length) {
    body.innerHTML = "";
    body.appendChild(createEmptyState("Keine Einträge vorhanden.", ""));
    return;
  }

  body.innerHTML = "";
  body.appendChild(statusSlot);

  const sortState = {
    key: "createdAt",
    direction: "desc",
  };
  const searchState = {
    query: "",
  };
  const columnDefinitions = {
    createdAt: {
      key: "createdAt",
      label: "Erstellt am",
      value: (entry) => valueOrDash(formatDate(entry.createdAt || entry.occurredAt)),
      sortValue: (entry) => String(entry.createdAt || entry.occurredAt || ""),
    },
    title: {
      key: "title",
      label: "Titel",
      value: (entry) => valueOrDash(entry.title),
      sortValue: (entry) => normalizeSortValue(entry.title),
      isLink: true,
    },
    createdBy: {
      key: "createdBy",
      label: "Ersteller",
      value: (entry) => valueOrDash(resolveCreatorLabel(entry.createdBy)),
      sortValue: (entry) => normalizeSortValue(resolveCreatorLabel(entry.createdBy)),
    },
  };

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "kunden-list-scroll";
  const table = document.createElement("table");
  table.className = "kunden-list-table";
  const colgroup = document.createElement("colgroup");
  const colDate = document.createElement("col");
  colDate.style.width = "160px";
  const colTitle = document.createElement("col");
  const colCreator = document.createElement("col");
  colCreator.style.width = "180px";
  colgroup.append(colDate, colTitle, colCreator);
  table.appendChild(colgroup);
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const tbody = document.createElement("tbody");

  const searchRow = createFormRow({
    id: "schulungen-search",
    label: "Suche",
    placeholder: "Titel, Ersteller ...",
    value: "",
    required: false,
  });
  const searchInput = searchRow.querySelector("input");
  if (searchInput) {
    searchInput.type = "search";
    searchInput.addEventListener("input", (event) => {
      searchState.query = event.target.value || "";
      renderRows();
    });
  }
  const controlsWrap = document.createElement("div");
  controlsWrap.className = "list-controls";
  controlsWrap.appendChild(searchRow);
  body.appendChild(controlsWrap);

  function updateHeaderState() {
    headerRow.querySelectorAll("th").forEach((th) => {
      const key = th.dataset.sortKey;
      if (!key) return;
      const isActive = key === sortState.key;
      th.setAttribute(
        "aria-sort",
        isActive ? (sortState.direction === "asc" ? "ascending" : "descending") : "none"
      );
      const button = th.querySelector("button");
      if (!button) return;
      const indicator = isActive ? (sortState.direction === "asc" ? "↑" : "↓") : "";
      button.textContent = indicator ? `${th.dataset.label} ${indicator}` : th.dataset.label || "";
    });
  }

  function renderHeader() {
    headerRow.innerHTML = "";
    Object.values(columnDefinitions).forEach((column) => {
      const th = document.createElement("th");
      th.dataset.sortKey = column.key;
      th.dataset.label = column.label;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "kunden-sort-btn";
      button.addEventListener("click", () => {
        if (sortState.key === column.key) {
          sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
        } else {
          sortState.key = column.key;
          sortState.direction = "asc";
        }
        updateHeaderState();
        renderRows();
      });
      th.appendChild(button);
      headerRow.appendChild(th);
    });
    updateHeaderState();
  }

  function matchesSearch(entry, query) {
    if (!query) return true;
    const haystack = [
      entry.title,
      entry.createdBy,
      formatDate(entry.createdAt || entry.occurredAt),
      formatDate(entry.occurredAt),
    ]
      .filter(Boolean)
      .map(normalizeSortValue)
      .join(" ");
    return haystack.includes(normalizeSortValue(query));
  }

  function getSortedEntries() {
    const column = columnDefinitions[sortState.key] || columnDefinitions.createdAt;
    const getValue = column?.sortValue || column?.value;
    return entries
      .filter((entry) => matchesSearch(entry, searchState.query))
      .map((entry, index) => ({ entry, index }))
      .sort((a, b) => {
        const aValue = (getValue ? getValue(a.entry) : "").toString();
        const bValue = (getValue ? getValue(b.entry) : "").toString();
        const compare = aValue.localeCompare(bValue, "de", { sensitivity: "base" });
        if (compare !== 0) {
          return sortState.direction === "asc" ? compare : -compare;
        }
        return a.index - b.index;
      })
      .map(({ entry }) => entry);
  }

  function renderRows() {
    tbody.innerHTML = "";
    const rows = getSortedEntries();
    if (!rows.length) {
      const row = document.createElement("tr");
      row.className = "kunden-list-row";
      const cell = document.createElement("td");
      cell.colSpan = Object.keys(columnDefinitions).length;
      cell.textContent = "Keine Einträge vorhanden.";
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }

    rows.forEach((entry) => {
      const row = document.createElement("tr");
      row.className = "kunden-list-row";
      row.tabIndex = 0;
      row.addEventListener("click", (event) => {
        if (event.target && event.target.closest("a, button")) return;
        window.location.hash = `#/uebungsbibliothek/${entry.id}`;
      });
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          window.location.hash = `#/uebungsbibliothek/${entry.id}`;
        }
      });

      Object.values(columnDefinitions).forEach((column) => {
        const cell = document.createElement("td");
        if (column.isLink) {
          const link = document.createElement("a");
          link.href = `#/uebungsbibliothek/${entry.id}`;
          link.className = "kunden-list__link";
          link.textContent = column.value(entry);
          cell.appendChild(link);
        } else {
          cell.textContent = column.value(entry);
        }
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
  }

  thead.appendChild(headerRow);
  table.append(thead, tbody);
  tableWrapper.appendChild(table);
  body.appendChild(tableWrapper);
  renderHeader();
  renderRows();
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
      image.alt = block.title || "Eintrag Bild";
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
  section.classList.add("card-stack-compact");
  const statusSlot = document.createElement("div");
  statusSlot.className = "schulungen-status";

  const detailCard = createCard({
    eyebrow: "",
    title: "Details",
    body: "",
    footer: "",
  });
  const card = detailCard.querySelector(".ui-card") || detailCard.firstElementChild;
  const body = card.querySelector(".ui-card__body");
  body.innerHTML = "";
  body.appendChild(createNotice("Lade Eintrag...", { variant: "info", role: "status" }));
  section.appendChild(card);

  let entry = null;
  try {
    entry = await getUebungsbibliothek(id);
  } catch (error) {
    console.error("[SCHULUNGEN_GET_FAILED]", error);
    entry = null;
  }
  if (!entry) {
    body.innerHTML = "";
    body.appendChild(createNotice("Eintrag nicht gefunden.", { variant: "warn", role: "alert" }));
    return;
  }

  if (canCreate()) {
    section.insertBefore(buildDetailActions(entry, statusSlot), card);
  }

  body.innerHTML = "";
  const title = document.createElement("h3");
  title.textContent = entry.title || "Eintrag";
  const meta = document.createElement("div");
  meta.className = "schulungen-detail__meta";
  meta.textContent = formatDate(entry.occurredAt) || "";
  body.append(title, meta, buildBlocksList(entry.blocks || []));
}

function addBlockRow(container, type, blockData = {}) {
  const block = document.createElement("div");
  block.className = "schulungen-form-block";
  block.dataset.type = type;
  block.dataset.existingUrl = blockData.url || "";

  const titleRow = createFormRow({
    id: `schulungen-block-title-${Math.random().toString(36).slice(2)}`,
    label: "Titel",
    required: true,
  });
  const titleInput = titleRow.querySelector("input");
  titleInput.name = "blockTitle";
  titleInput.value = blockData.title || "";

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
    if (blockData.url) {
      const preview = document.createElement("div");
      preview.className = "schulungen-block__image-link";
      const image = document.createElement("img");
      image.className = "schulungen-block__image";
      image.alt = blockData.title || "Eintrag Bild";
      image.src = blockData.url;
      preview.appendChild(image);
      block.appendChild(preview);
    }
  } else {
    const textRow = createFormRow({
      id: `schulungen-block-text-${Math.random().toString(36).slice(2)}`,
      label: "Text",
      control: "textarea",
      required: true,
    });
    const textarea = textRow.querySelector("textarea");
    textarea.name = "blockText";
    textarea.value = blockData.text || "";
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
      createNotice("Nur Trainer 001 kann Einträge erstellen.", {
        variant: "warn",
        role: "alert",
      })
    );
    return;
  }

  const header = createSectionHeader({ title: "Neuer Eintrag", subtitle: "" });
  section.appendChild(header);

  const cardFragment = createCard({
    eyebrow: "",
    title: "Eintrag anlegen",
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
  footer.classList.add("uebungsbibliothek-form-footer");
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
          const upload = await uploadUebungsbibliothekImage({
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
        createdBy: getCreatorLabel(),
      };
      const created = await createUebungsbibliothek(payload);
      window.location.hash = `#/uebungsbibliothek/${created.id}`;
    } catch (error) {
      console.error("[SCHULUNGEN_CREATE_FAILED]", error);
      statusSlot.appendChild(
        createNotice("Eintrag konnte nicht erstellt werden.", { variant: "warn", role: "alert" })
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Speichern";
    }
  });

  section.appendChild(card);
}

async function renderEditView(section, id) {
  if (!canCreate()) {
    section.appendChild(
      createNotice("Nur Trainer 001 kann Einträge bearbeiten.", {
        variant: "warn",
        role: "alert",
      })
    );
    return;
  }

  const header = createSectionHeader({ title: "Eintrag bearbeiten", subtitle: "" });
  section.appendChild(header);

  const cardFragment = createCard({
    eyebrow: "",
    title: "Eintrag bearbeiten",
    body: "",
    footer: "",
  });
  const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
  const body = card.querySelector(".ui-card__body");
  const footer = card.querySelector(".ui-card__footer");
  const statusSlot = document.createElement("div");
  statusSlot.className = "schulungen-form-status";

  body.innerHTML = "";
  body.appendChild(statusSlot);
  body.appendChild(createNotice("Lade Eintrag...", { variant: "info", role: "status" }));
  section.appendChild(card);

  let entry = null;
  try {
    entry = await getUebungsbibliothek(id);
  } catch (error) {
    console.error("[SCHULUNGEN_GET_FAILED]", error);
    entry = null;
  }
  if (!entry) {
    body.innerHTML = "";
    body.appendChild(createNotice("Eintrag nicht gefunden.", { variant: "warn", role: "alert" }));
    return;
  }

  const form = document.createElement("form");
  form.className = "schulungen-form";
  form.id = "schulungen-edit-form";
  form.noValidate = true;

  const dateRow = createFormRow({
    id: "schulungen-date",
    label: "Datum",
    control: "input",
    type: "date",
    required: true,
    value: formatDate(entry.occurredAt),
  });
  const titleRow = createFormRow({
    id: "schulungen-title",
    label: "Titel",
    required: true,
    value: entry.title || "",
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

  const existingBlocks = Array.isArray(entry.blocks) ? entry.blocks : [];
  if (existingBlocks.length) {
    existingBlocks.forEach((block) => {
      addBlockRow(blocksWrap, block.type || "text", block);
    });
  } else {
    addBlockRow(blocksWrap, "text");
  }

  body.innerHTML = "";
  body.append(statusSlot, form);

  const submitBtn = createButton({ label: "Speichern", variant: "primary" });
  submitBtn.type = "submit";
  submitBtn.setAttribute("form", form.id);
  footer.innerHTML = "";
  footer.classList.add("uebungsbibliothek-form-footer");
  footer.appendChild(submitBtn);

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
        const existingUrl = node.dataset.existingUrl || "";
        if (file) {
          blocks.push({ type: "image", title: blockTitle, file });
        } else if (existingUrl) {
          blocks.push({ type: "image", title: blockTitle, url: existingUrl });
        }
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
          if (block.file) {
            const dataUrl = await readFileAsDataUrl(block.file);
            const upload = await uploadUebungsbibliothekImage({
              fileName: block.file.name || "bild",
              dataUrl,
            });
            resolvedBlocks.push({
              type: "image",
              title: block.title,
              url: upload?.url || "",
            });
          } else if (block.url) {
            resolvedBlocks.push({
              type: "image",
              title: block.title,
              url: block.url,
            });
          }
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
      const updated = await updateUebungsbibliothek(entry.id, payload);
      window.location.hash = `#/uebungsbibliothek/${updated.id}`;
    } catch (error) {
      console.error("[SCHULUNGEN_UPDATE_FAILED]", error);
      statusSlot.appendChild(
        createNotice("Eintrag konnte nicht gespeichert werden.", {
          variant: "warn",
          role: "alert",
        })
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Speichern";
    }
  });
}

export function initModule(container, routeInfo = {}) {
  if (!container) return;
  container.innerHTML = "";
  container.scrollTo?.({ top: 0, behavior: "auto" });

  const { mode, detailId } = parseRoute(routeInfo?.segments || []);
  const section = document.createElement("section");
  section.className = "dogule-section schulungen-section uebungsbibliothek-section";

  if (mode === "list") {
    renderListView(section);
  } else if (mode === "create") {
    renderCreateView(section);
  } else if (mode === "edit") {
    renderEditView(section, detailId);
  } else if (mode === "detail") {
    renderDetailView(section, detailId);
  }

  container.appendChild(section);
}
