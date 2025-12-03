/* globals console, Node */
import "./components/calendarGrid.css";
import "./components/eventBlock.css";
import {
  createButton,
  createCard,
  createEmptyState,
  createNotice,
} from "../shared/components/components.js";
import { listKalenderEvents, getKalenderEvent, getKurs } from "../shared/api/index.js";
import { buildKalenderHash, parseKalenderRoute } from "./utils/routes.js";
import { addDays, parseLocalDate, getIsoWeek, getMondayOfIsoWeek } from "./utils/date.js";
import { computeEventLayout } from "./utils/layout.js";

const SLOT_HEIGHT_FALLBACK = 24;

// Standardized module interface for Dogule1
export async function initModule(container, routeInfo = {}) {
  if (!container) return;
  container.innerHTML = "";

  const section = document.createElement("section");
  section.className = "dogule-section";
  container.appendChild(section);

  let parsedRoute;
  try {
    const hash = typeof window !== "undefined" ? window.location.hash || "" : "";
    const baseSegments = routeInfo?.segments || [];
    const mergedSegments =
      baseSegments[0] === "kalender" ? baseSegments : ["kalender", ...baseSegments];
    parsedRoute = parseKalenderRoute({
      hash,
      segments: mergedSegments,
    });
  } catch {
    section.appendChild(createNotice("Ungültige Route.", { variant: "warn", role: "alert" }));
    focusHeading(section);
    return;
  }

  if (parsedRoute.mode === "tag") {
    const dateObj = parseLocalDate(parsedRoute.payload?.date);
    await renderDayView(section, dateObj);
    return;
  }

  if (parsedRoute.mode === "woche") {
    const monday = getMondayOfIsoWeek(parsedRoute.payload?.isoYear, parsedRoute.payload?.isoWeek);
    await renderWeekView(section, monday);
    return;
  }

  if (parsedRoute.mode === "monat") {
    const year = parsedRoute.payload?.year;
    const month = parsedRoute.payload?.month;
    await renderMonthView(section, year, month);
    return;
  }

  if (parsedRoute.mode === "jahr") {
    const year = parsedRoute.payload?.year;
    await renderYearView(section, year);
    return;
  }

  if (parsedRoute.mode === "event") {
    const eventId = parsedRoute.payload?.eventId;
    await renderEventDetail(section, eventId);
    return;
  }

  section.appendChild(
    createNotice("Diese Ansicht wird später implementiert.", { variant: "info", role: "status" })
  );
  focusHeading(section);
}

async function renderDayView(section, dateObj) {
  section.innerHTML = "";
  const toolbar = buildDayToolbar(dateObj);
  section.appendChild(toolbar);

  const h1 = document.createElement("h1");
  h1.textContent = "Kalender – Tag";
  const h2 = document.createElement("h2");
  h2.textContent = formatGermanDate(dateObj);
  h2.className = "kalender-subhead";
  section.append(h1, h2);

  const gridWrapper = document.createElement("div");
  gridWrapper.className = "kalender-grid-wrapper";

  const timeAxis = document.createElement("div");
  timeAxis.className = "kalender-time-axis";
  for (let slot = 0; slot < 48; slot += 1) {
    const hour = Math.floor(slot / 2);
    const labelText = slot % 2 === 0 ? `${String(hour).padStart(2, "0")}:00` : "";
    const label = document.createElement("div");
    label.className = "kalender-time-axis__label";
    label.textContent = labelText;
    timeAxis.appendChild(label);
  }

  const canvas = document.createElement("div");
  canvas.className = "kalender-grid-canvas kalender-day-grid";
  canvas.style.setProperty("--slot-height", "24px");

  gridWrapper.append(timeAxis, canvas);
  section.appendChild(gridWrapper);

  const loading = createNotice("Lade Kalender...", { variant: "info", role: "status" });
  section.appendChild(loading);

  try {
    const positioned = await getEventsForRange(dateObj, dateObj);

    if (!positioned.length) {
      section.removeChild(loading);
      section.appendChild(createEmptyState("Keine Ereignisse für diesen Tag.", ""));
      focusHeading(section);
      return;
    }

    renderEventBlocks(canvas, positioned, { includeExtras: true });

    if (loading?.parentNode === section) {
      section.removeChild(loading);
    }
    scrollToFirstEvent(canvas, positioned);
    focusHeading(section);
  } catch {
    if (loading?.parentNode === section) {
      section.removeChild(loading);
    }
    section.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
    focusHeading(section);
  }
}

function buildDayToolbar(dateObj) {
  const bar = document.createElement("div");
  bar.className = "kalender-toolbar";

  const prev = createButton({
    label: "Vorheriger Tag",
    variant: "secondary",
    onClick: () => navigateToDate(addDays(dateObj, -1)),
  });
  const today = createButton({
    label: "Heute",
    variant: "secondary",
    onClick: () => navigateToDate(new Date()),
  });
  const next = createButton({
    label: "Nächster Tag",
    variant: "secondary",
    onClick: () => navigateToDate(addDays(dateObj, 1)),
  });

  const viewTag = createButton({
    label: "Tag",
    variant: "primary",
    onClick: () => navigateToDate(dateObj),
  });
  const viewWoche = createButton({
    label: "Woche",
    variant: "secondary",
    onClick: () => {
      const { isoYear, isoWeek } = getIsoWeek(dateObj);
      window.location.hash = buildKalenderHash({ mode: "woche", isoYear, isoWeek });
    },
  });
  const viewMonat = createButton({
    label: "Monat",
    variant: "secondary",
    onClick: () => {
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      window.location.hash = buildKalenderHash({ mode: "monat", year, month });
    },
  });
  const viewJahr = createButton({
    label: "Jahr",
    variant: "secondary",
    onClick: () => {
      const year = dateObj.getFullYear();
      window.location.hash = buildKalenderHash({ mode: "jahr", year });
    },
  });

  bar.append(prev, today, next, viewTag, viewWoche, viewMonat, viewJahr);
  return bar;
}

function dayBounds(dateObj) {
  const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { gridStart: start, gridEnd: end };
}

function formatGermanDate(dateObj) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
}

function formatTimeRange(start, end) {
  return `${formatTime(start)}–${formatTime(end)}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function toDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getTime());
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid event date");
  }
  return parsed;
}

function scrollToFirstEvent(canvas, events) {
  if (!canvas || !events?.length) return;
  const earliest = Math.min(...events.map((evt) => evt.rowStart));
  const slotHeight =
    Number.parseFloat(getComputedStyle(canvas).getPropertyValue("--slot-height")) ||
    Number.parseFloat(getComputedStyle(canvas).getPropertyValue("--kalender-slot-height")) ||
    SLOT_HEIGHT_FALLBACK;
  const desired = Math.max(0, earliest * slotHeight - 40);
  if (typeof canvas.scrollTo === "function") {
    canvas.scrollTo({ top: desired, behavior: "auto" });
  } else {
    canvas.scrollTop = desired;
  }
}

function navigateToDate(dateObj) {
  const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const dateStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(
    target.getDate()
  ).padStart(2, "0")}`;
  window.location.hash = buildKalenderHash({ mode: "tag", date: dateStr });
}

function focusHeading(scope) {
  if (!scope) return;
  const heading = scope.querySelector("h1, h2");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }
}

function renderEventBlocks(canvas, positioned, { includeExtras = true } = {}) {
  positioned.forEach((evt) => {
    const block = document.createElement("div");
    block.className = "kalender-event-block";
    block.style.setProperty("--row-start", String(evt.rowStart));
    block.style.setProperty("--row-end", String(evt.rowEnd));
    block.style.setProperty("--col", String(evt.column));
    block.style.setProperty("--col-total", String(evt.columnCount));

    const titleEl = document.createElement("div");
    titleEl.className = "kalender-event-block__title";
    titleEl.textContent = evt.title;

    const metaEl = document.createElement("div");
    metaEl.className = "kalender-event-block__meta";
    const timeRange = formatTimeRange(evt.start, evt.end);
    let metaText = timeRange;
    if (includeExtras) {
      const codePart = evt.code ? ` · ${evt.code}` : "";
      const locationPart = evt.location ? ` · ${evt.location}` : "";
      metaText = `${timeRange}${codePart}${locationPart}`;
    }
    metaEl.textContent = metaText;

    block.append(titleEl, metaEl);
    block.tabIndex = 0;
    block.setAttribute("aria-label", `${evt.title}, ${timeRange}`);
    const targetHash = evt.kursId
      ? `#/kurse/${encodeURIComponent(evt.kursId)}`
      : buildKalenderHash({ mode: "event", eventId: evt.id });
    block.dataset.kursId = evt.kursId || "";
    const navigateToTarget = () => {
      window.location.hash = targetHash;
    };
    block.addEventListener("click", navigateToTarget);
    block.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigateToTarget();
      }
    });

    canvas.appendChild(block);
  });
}

async function getEventsForRange(startDate, endDate) {
  const allEvents = await listKalenderEvents();
  const rangeStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);

  const matches = allEvents
    .map((evt) => ({
      ...evt,
      startDate: toDate(evt.start),
      endDate: toDate(evt.end),
    }))
    .filter((evt) => evt.startDate < rangeEnd && evt.endDate > rangeStart)
    .map((evt) => ({
      id: evt.id,
      title: evt.title || evt.code || "Ohne Titel",
      start: evt.startDate,
      end: evt.endDate,
      code: evt.code,
      location: evt.location,
      kursId: evt.kursId,
      trainerId: evt.trainerId,
    }));

  return computeEventLayout(matches, rangeStart, rangeEnd);
}

function buildWeekRangeLabel(mondayDate) {
  const { isoWeek } = getIsoWeek(mondayDate);
  const startLabel = formatDateDMY(mondayDate);
  const endLabel = formatDateDMY(addDays(mondayDate, 6));
  return `KW ${String(isoWeek).padStart(2, "0")} · ${startLabel} – ${endLabel}`;
}

function formatWeekday(dateObj) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(dateObj);
}

function formatDateDMY(dateObj) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
}

async function renderWeekView(section, mondayDate) {
  section.innerHTML = "";
  const toolbar = buildWeekToolbar(mondayDate);
  section.appendChild(toolbar);

  const h1 = document.createElement("h1");
  h1.textContent = "Kalender – Woche";

  const weekRange = buildWeekRangeLabel(mondayDate);
  const h2 = document.createElement("h2");
  h2.className = "kalender-subhead";
  h2.textContent = weekRange;
  section.append(h1, h2);

  const wrapper = document.createElement("div");
  wrapper.className = "kalender-grid-wrapper";

  const timeAxis = document.createElement("div");
  timeAxis.className = "kalender-time-axis";
  for (let slot = 0; slot < 48; slot += 1) {
    const hour = Math.floor(slot / 2);
    const labelText = slot % 2 === 0 ? `${String(hour).padStart(2, "0")}:00` : "";
    const label = document.createElement("div");
    label.className = "kalender-time-axis__label";
    label.textContent = labelText;
    timeAxis.appendChild(label);
  }

  const columns = document.createElement("div");
  columns.className = "kalender-week-columns";

  wrapper.append(timeAxis, columns);
  section.appendChild(wrapper);

  const loading = createNotice("Lade Kalender...", { variant: "info", role: "status" });
  section.appendChild(loading);

  try {
    const allEvents = await listKalenderEvents();
    const positionedByDay = [];

    for (let offset = 0; offset < 7; offset += 1) {
      const dayDate = addDays(mondayDate, offset);
      const { gridStart, gridEnd } = dayBounds(dayDate);
      const dayEvents = allEvents
        .map((evt) => ({
          ...evt,
          startDate: toDate(evt.start),
          endDate: toDate(evt.end),
        }))
        .filter((evt) => evt.startDate < gridEnd && evt.endDate > gridStart)
        .map((evt) => ({
          id: evt.id,
          title: evt.title || evt.code || "Ohne Titel",
          start: evt.startDate,
          end: evt.endDate,
          code: evt.code,
          location: evt.location,
          kursId: evt.kursId,
          trainerId: evt.trainerId,
        }));
      const positioned = computeEventLayout(dayEvents, gridStart, gridEnd);
      positionedByDay.push({ date: dayDate, positioned });

      const dayColumn = document.createElement("div");
      dayColumn.className = "kalender-week-day";

      const header = document.createElement("div");
      header.className = "kalender-week-day__header";
      header.textContent = formatWeekday(dayDate);

      const grid = document.createElement("div");
      grid.className = "kalender-week-day__grid";
      grid.style.setProperty("--slot-height", "24px");

      renderEventBlocks(grid, positioned, { includeExtras: false });

      dayColumn.append(header, grid);
      columns.appendChild(dayColumn);

      if (offset === 0 && header?.offsetHeight) {
        timeAxis.style.paddingTop = `${header.offsetHeight}px`;
      }
    }

    if (loading?.parentNode === section) {
      section.removeChild(loading);
    }

    const allPositioned = positionedByDay.flatMap((d) => d.positioned);
    if (!allPositioned.length) {
      section.appendChild(createEmptyState("Keine Ereignisse für diese Woche.", ""));
      focusHeading(section);
      return;
    }

    scrollToFirstEvent(wrapper, allPositioned);
    focusHeading(section);
  } catch {
    if (loading?.parentNode === section) {
      section.removeChild(loading);
    }
    section.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
    focusHeading(section);
  }
}

function buildWeekToolbar(mondayDate) {
  const bar = document.createElement("div");
  bar.className = "kalender-toolbar";

  const prev = createButton({
    label: "Vorherige Woche",
    variant: "secondary",
    onClick: () => navigateToWeek(addDays(mondayDate, -7)),
  });
  const today = createButton({
    label: "Heute",
    variant: "secondary",
    onClick: () => navigateToDate(new Date()),
  });
  const next = createButton({
    label: "Nächste Woche",
    variant: "secondary",
    onClick: () => navigateToWeek(addDays(mondayDate, 7)),
  });

  const viewTag = createButton({
    label: "Tag",
    variant: "secondary",
    onClick: () => navigateToDate(mondayDate),
  });
  const { isoYear, isoWeek } = getIsoWeek(mondayDate);
  const viewWoche = createButton({
    label: "Woche",
    variant: "primary",
    onClick: () => {
      window.location.hash = buildKalenderHash({ mode: "woche", isoYear, isoWeek });
    },
  });
  const viewMonat = createButton({
    label: "Monat",
    variant: "secondary",
    onClick: () => {
      const year = mondayDate.getFullYear();
      const month = mondayDate.getMonth() + 1;
      window.location.hash = buildKalenderHash({ mode: "monat", year, month });
    },
  });
  const viewJahr = createButton({
    label: "Jahr",
    variant: "secondary",
    onClick: () => {
      const year = mondayDate.getFullYear();
      window.location.hash = buildKalenderHash({ mode: "jahr", year });
    },
  });

  bar.append(prev, today, next, viewTag, viewWoche, viewMonat, viewJahr);
  return bar;
}

function navigateToWeek(dateObj) {
  const { isoYear, isoWeek } = getIsoWeek(dateObj);
  const monday = getMondayOfIsoWeek(isoYear, isoWeek);
  const target = getIsoWeek(monday);
  window.location.hash = buildKalenderHash({
    mode: "woche",
    isoYear: target.isoYear,
    isoWeek: target.isoWeek,
  });
}

async function renderMonthView(section, year, month) {
  section.innerHTML = "";
  const toolbar = buildMonthToolbar(year, month);
  section.appendChild(toolbar);

  const h1 = document.createElement("h1");
  h1.textContent = "Kalender – Monat";
  const h2 = document.createElement("h2");
  h2.className = "kalender-subhead";
  h2.textContent = formatMonthLabel(year, month);
  section.append(h1, h2);

  const grid = document.createElement("div");
  grid.className = "kalender-month-grid";
  section.appendChild(grid);

  try {
    const allEvents = await listKalenderEvents();
    const cells = buildMonthCells(year, month, allEvents);
    cells.forEach((cell) => grid.appendChild(cell));
    focusHeading(section);
  } catch {
    section.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
    focusHeading(section);
  }
}

function buildMonthToolbar(year, month) {
  const bar = document.createElement("div");
  bar.className = "kalender-toolbar";
  const prev = createButton({
    label: "Vorheriger Monat",
    variant: "secondary",
    onClick: () => {
      const { y, m } = shiftMonth(year, month, -1);
      window.location.hash = buildKalenderHash({ mode: "monat", year: y, month: m });
    },
  });
  const today = createButton({
    label: "Heute",
    variant: "secondary",
    onClick: () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      window.location.hash = buildKalenderHash({ mode: "monat", year: y, month: m });
    },
  });
  const next = createButton({
    label: "Nächster Monat",
    variant: "secondary",
    onClick: () => {
      const { y, m } = shiftMonth(year, month, 1);
      window.location.hash = buildKalenderHash({ mode: "monat", year: y, month: m });
    },
  });

  const viewTag = createButton({
    label: "Tag",
    variant: "secondary",
    onClick: () => {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-01`;
      window.location.hash = buildKalenderHash({ mode: "tag", date: dateStr });
    },
  });
  const { isoYear, isoWeek } = getIsoWeek(new Date(year, month - 1, 1));
  const viewWoche = createButton({
    label: "Woche",
    variant: "secondary",
    onClick: () => {
      window.location.hash = buildKalenderHash({ mode: "woche", isoYear, isoWeek });
    },
  });
  const viewMonat = createButton({
    label: "Monat",
    variant: "primary",
    onClick: () => {
      window.location.hash = buildKalenderHash({ mode: "monat", year, month });
    },
  });
  const viewJahr = createButton({
    label: "Jahr",
    variant: "secondary",
    onClick: () => {
      window.location.hash = buildKalenderHash({ mode: "jahr", year });
    },
  });

  bar.append(prev, today, next, viewTag, viewWoche, viewMonat, viewJahr);
  return bar;
}

function buildMonthCells(year, month, allEvents = []) {
  const cells = [];
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstWeekday = getWeekdayNumber(firstOfMonth);
  const daysInMonth = new Date(year, month, 0).getDate();

  const leading = firstWeekday - 1;
  const totalSlots = 42;

  for (let i = 0; i < leading; i += 1) {
    cells.push(buildEmptyCell());
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    const dayStart = new Date(year, month - 1, day);
    const dayEnd = new Date(year, month - 1, day + 1);
    const hasEvent = allEvents.some((evt) => {
      const evtStart = toDate(evt.start);
      const evtEnd = toDate(evt.end);
      return evtStart < dayEnd && evtEnd > dayStart;
    });
    cells.push(buildDayCell(date, hasEvent));
  }

  const used = cells.length;
  const remaining = totalSlots - used;
  for (let i = 0; i < remaining; i += 1) {
    cells.push(buildEmptyCell());
  }

  return cells;
}

function buildDayCell(dateObj, hasEvent) {
  const cell = document.createElement("div");
  cell.className = "kalender-month-cell";

  const dateEl = document.createElement("div");
  dateEl.className = "kalender-month-cell__date";
  dateEl.textContent = String(dateObj.getDate());
  cell.appendChild(dateEl);

  if (hasEvent) {
    const dot = document.createElement("div");
    dot.className = "kalender-month-cell__dot";
    cell.appendChild(dot);
  }

  const dateStr = [
    dateObj.getFullYear(),
    String(dateObj.getMonth() + 1).padStart(2, "0"),
    String(dateObj.getDate()).padStart(2, "0"),
  ].join("-");

  const weekdayLabel = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
  cell.setAttribute("aria-label", weekdayLabel);
  cell.tabIndex = 0;
  cell.addEventListener("click", () => {
    window.location.hash = buildKalenderHash({ mode: "tag", date: dateStr });
  });
  cell.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      window.location.hash = buildKalenderHash({ mode: "tag", date: dateStr });
    }
  });

  return cell;
}

function buildEmptyCell() {
  const cell = document.createElement("div");
  cell.className = "kalender-month-cell";
  cell.setAttribute("aria-hidden", "true");
  return cell;
}

function formatMonthLabel(year, month) {
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}

function getWeekdayNumber(dateObj) {
  const day = dateObj.getDay();
  return day === 0 ? 7 : day;
}

function shiftMonth(year, month, delta) {
  const base = new Date(year, month - 1 + delta, 1);
  return { y: base.getFullYear(), m: base.getMonth() + 1 };
}

function formatDuration(start, end) {
  const diffMs = Math.max(0, end - start);
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

async function renderEventDetail(section, eventId) {
  section.innerHTML = "";
  const toolbar = buildEventToolbar();
  section.appendChild(toolbar);

  const h1 = document.createElement("h1");
  h1.textContent = "Kalender – Ereignis";
  let h2 = document.createElement("h2");
  h2.className = "kalender-subhead";
  h2.textContent = "Lade Ereignis...";
  section.append(h1, h2);

  try {
    const event = await getKalenderEvent(eventId);
    if (!event) {
      h2.textContent = "Nicht gefunden";
      section.appendChild(createEmptyState("Dieses Ereignis ist nicht vorhanden.", ""));
      focusHeading(section);
      return;
    }

    const start = toDate(event.start);
    const end = toDate(event.end);
    const dateLabel = formatDateDMY(start);
    const timeLabel = formatTimeRange(start, end);
    const durationLabel = formatDuration(start, end);
    const kursId = event.kursId ? String(event.kursId) : "";
    let kurs = null;
    if (kursId) {
      try {
        kurs = await getKurs(kursId);
      } catch (error) {
        console.error("[KALENDER_ERR_KURS_FETCH]", error);
      }
    }

    h2.textContent = event.title || event.code || "Ereignis";

    const cardFragment = createCard({
      eyebrow: event.code || "",
      title: event.title || event.code || "Ereignis",
      body: "",
      footer: "",
    });
    const card = cardFragment.querySelector(".ui-card") || cardFragment.firstElementChild;
    const body = card.querySelector(".ui-card__body");

    body.innerHTML = "";
    const dl = document.createElement("dl");
    dl.className = "kalender-event-detail";
    const addRow = (label, value) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      if (value instanceof Node) {
        dd.appendChild(value);
      } else {
        dd.textContent = value;
      }
      dl.append(dt, dd);
    };
    addRow("Datum", dateLabel);
    addRow("Zeit", timeLabel);
    addRow("Dauer", durationLabel);
    if (event.location) addRow("Ort", event.location);
    if (event.notes) addRow("Notiz", event.notes);
    if (kurs) {
      addRow("Kurs", `${kurs.title || kurs.code || kurs.id}`);
      addRow("Kurs-ID", kurs.id);
    } else if (kursId) {
      const warn = createNotice("Verknüpfter Kurs nicht gefunden.", {
        variant: "warn",
        role: "alert",
      });
      addRow("Kurs", warn);
    }
    body.appendChild(dl);

    const footer = card.querySelector(".ui-card__footer");
    if (footer) {
      footer.innerHTML = "";
      const actions = [];
      if (kursId) {
        actions.push(
          createButton({
            label: "Zum Kurs",
            variant: "primary",
            onClick: () => {
              window.location.hash = `#/kurse/${encodeURIComponent(kursId)}`;
            },
          })
        );
      }
      actions.push(
        createButton({
          label: "Zum Tag",
          variant: "secondary",
          onClick: () => {
            const dateStr = [
              start.getFullYear(),
              String(start.getMonth() + 1).padStart(2, "0"),
              String(start.getDate()).padStart(2, "0"),
            ].join("-");
            window.location.hash = buildKalenderHash({ mode: "tag", date: dateStr });
          },
        })
      );
      actions.forEach((btn) => footer.appendChild(btn));
    }

    section.appendChild(card);

    focusHeading(section);
  } catch {
    h2.textContent = "Nicht gefunden";
    section.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
    focusHeading(section);
  }
}

function buildEventToolbar() {
  const bar = document.createElement("div");
  bar.className = "kalender-toolbar";

  const back = createButton({
    label: "Zurück zum Tag",
    variant: "secondary",
    onClick: () => {
      const hash = window.location.hash || "";
      const match = /event\/([^/]+)/.exec(hash);
      if (match?.[1]) {
        getKalenderEvent(match[1]).then((evt) => {
          if (!evt) return;
          const start = toDate(evt.start);
          const dateStr = [
            start.getFullYear(),
            String(start.getMonth() + 1).padStart(2, "0"),
            String(start.getDate()).padStart(2, "0"),
          ].join("-");
          window.location.hash = buildKalenderHash({ mode: "tag", date: dateStr });
        });
      }
    },
  });

  const today = new Date();
  const viewTag = createButton({
    label: "Tag",
    variant: "secondary",
    onClick: () => {
      const dateStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");
      window.location.hash = buildKalenderHash({ mode: "tag", date: dateStr });
    },
  });
  const { isoYear, isoWeek } = getIsoWeek(today);
  const viewWoche = createButton({
    label: "Woche",
    variant: "secondary",
    onClick: () => {
      window.location.hash = buildKalenderHash({ mode: "woche", isoYear, isoWeek });
    },
  });
  const viewMonat = createButton({
    label: "Monat",
    variant: "secondary",
    onClick: () => {
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      window.location.hash = buildKalenderHash({ mode: "monat", year, month });
    },
  });
  const viewJahr = createButton({
    label: "Jahr",
    variant: "secondary",
    onClick: () => {
      const year = today.getFullYear();
      window.location.hash = buildKalenderHash({ mode: "jahr", year });
    },
  });

  bar.append(back, viewTag, viewWoche, viewMonat, viewJahr);
  return bar;
}
async function renderYearView(section, year) {
  section.innerHTML = "";
  const toolbar = buildYearToolbar(year);
  section.appendChild(toolbar);

  const h1 = document.createElement("h1");
  h1.textContent = "Kalender – Jahr";
  const h2 = document.createElement("h2");
  h2.className = "kalender-subhead";
  h2.textContent = String(year);
  section.append(h1, h2);

  const grid = document.createElement("div");
  grid.className = "kalender-year-grid";
  section.appendChild(grid);

  try {
    for (let month = 1; month <= 12; month += 1) {
      const cell = buildYearMonthCell(year, month);
      grid.appendChild(cell);
    }
    focusHeading(section);
  } catch {
    section.appendChild(
      createNotice("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })
    );
    focusHeading(section);
  }
}

function buildYearToolbar(year) {
  const bar = document.createElement("div");
  bar.className = "kalender-toolbar";
  const prev = createButton({
    label: "Vorheriges Jahr",
    variant: "secondary",
    onClick: () => {
      window.location.hash = buildKalenderHash({ mode: "jahr", year: year - 1 });
    },
  });
  const today = createButton({
    label: "Heute",
    variant: "secondary",
    onClick: () => {
      const now = new Date();
      window.location.hash = buildKalenderHash({ mode: "jahr", year: now.getFullYear() });
    },
  });
  const next = createButton({
    label: "Nächstes Jahr",
    variant: "secondary",
    onClick: () => {
      window.location.hash = buildKalenderHash({ mode: "jahr", year: year + 1 });
    },
  });

  const viewTag = createButton({
    label: "Tag",
    variant: "secondary",
    onClick: () => {
      const todayDate = new Date(year, 0, 1);
      const dateStr = [
        todayDate.getFullYear(),
        String(todayDate.getMonth() + 1).padStart(2, "0"),
        String(todayDate.getDate()).padStart(2, "0"),
      ].join("-");
      window.location.hash = buildKalenderHash({ mode: "tag", date: dateStr });
    },
  });
  const { isoYear, isoWeek } = getIsoWeek(new Date(year, 0, 1));
  const viewWoche = createButton({
    label: "Woche",
    variant: "secondary",
    onClick: () => {
      window.location.hash = buildKalenderHash({ mode: "woche", isoYear, isoWeek });
    },
  });
  const viewMonat = createButton({
    label: "Monat",
    variant: "secondary",
    onClick: () => {
      window.location.hash = buildKalenderHash({ mode: "monat", year, month: 1 });
    },
  });
  const viewJahr = createButton({
    label: "Jahr",
    variant: "primary",
    onClick: () => {
      window.location.hash = buildKalenderHash({ mode: "jahr", year });
    },
  });

  bar.append(prev, today, next, viewTag, viewWoche, viewMonat, viewJahr);
  return bar;
}

function buildYearMonthCell(year, month) {
  const wrapper = document.createElement("div");
  wrapper.className = "kalender-year-month";

  const title = document.createElement("div");
  title.className = "kalender-year-month__title";
  const monthLabel = formatMonthLabel(year, month);
  title.textContent = monthLabel;
  title.setAttribute("aria-label", `Monat ${monthLabel}`);
  title.tabIndex = 0;
  title.addEventListener("click", () => {
    window.location.hash = buildKalenderHash({ mode: "monat", year, month });
  });
  title.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      window.location.hash = buildKalenderHash({ mode: "monat", year, month });
    }
  });

  const miniGrid = document.createElement("div");
  miniGrid.className = "kalender-month-grid";

  const firstOfMonth = new Date(year, month - 1, 1);
  const firstWeekday = getWeekdayNumber(firstOfMonth);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leading = firstWeekday - 1;
  const totalSlots = 42;

  for (let i = 0; i < leading; i += 1) {
    const cell = document.createElement("div");
    cell.className = "kalender-month-cell";
    cell.setAttribute("aria-hidden", "true");
    miniGrid.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement("div");
    cell.className = "kalender-month-cell";
    const dateEl = document.createElement("div");
    dateEl.className = "kalender-month-cell__date";
    dateEl.textContent = String(day);
    cell.appendChild(dateEl);
    cell.tabIndex = 0;
    cell.addEventListener("click", () => {
      window.location.hash = buildKalenderHash({ mode: "monat", year, month });
    });
    cell.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.hash = buildKalenderHash({ mode: "monat", year, month });
      }
    });
    miniGrid.appendChild(cell);
  }

  const used = leading + daysInMonth;
  const remaining = totalSlots - used;
  for (let i = 0; i < remaining; i += 1) {
    const cell = document.createElement("div");
    cell.className = "kalender-month-cell";
    cell.setAttribute("aria-hidden", "true");
    miniGrid.appendChild(cell);
  }

  wrapper.append(title, miniGrid);
  return wrapper;
}
/* globals window, document, getComputedStyle */
