import { getIsoWeek, parseIsoWeek, parseLocalDate } from "./date.js";

const ERROR_TYPE = "kalender";
const ERROR_SCOPE = "route";
const VALID_MODES = new Set(["tag", "woche", "monat", "jahr", "event"]);
const MIN_YEAR = 1970;
const MAX_YEAR = 2100;

function makeError(code, message) {
  return { type: ERROR_TYPE, scope: ERROR_SCOPE, code, message };
}

function normalizeSegments(routeInfo = {}) {
  const hash = typeof routeInfo.hash === "string" ? routeInfo.hash.trim() : "";
  if (hash === "#/kalender/") {
    throw makeError("invalid-route-pattern", "Trailing slash not allowed for root kalender route.");
  }

  if (Array.isArray(routeInfo.segments) && routeInfo.segments.length) {
    return { segments: [...routeInfo.segments] };
  }

  if (typeof routeInfo.segments === "string") {
    const parts = routeInfo.segments.split("/").filter(Boolean);
    return { segments: parts };
  }

  if (hash) {
    const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    return { segments: parts };
  }

  return { segments: [] };
}

export function parseKalenderRoute(routeInfo = {}) {
  const { segments } = normalizeSegments(routeInfo);

  if (segments[0] !== "kalender") {
    throw makeError("invalid-route-mode", "First segment must be kalender.");
  }

  if (segments.length === 1) {
    return buildWeekForToday();
  }

  const mode = segments[1];
  if (!VALID_MODES.has(mode)) {
    throw makeError("invalid-route-mode", `Unknown kalender mode "${mode}".`);
  }

  const payloadSegment = segments[2];
  if (segments.length > 3) {
    throw makeError("invalid-route-pattern", "Unexpected route pattern.");
  }

  switch (mode) {
    case "tag": {
      if (typeof payloadSegment === "undefined") {
        throw makeError("invalid-route-pattern", "Missing date for day view.");
      }
      if (!payloadSegment) {
        throw makeError("invalid-route-pattern", "Missing date for day view.");
      }
      const parsed = parseLocalDateStrict(payloadSegment);
      return { mode: "tag", payload: { date: formatDate(parsed) } };
    }
    case "woche": {
      if (typeof payloadSegment === "undefined") {
        throw makeError("invalid-route-pattern", "Missing ISO week.");
      }
      const parsed = parseIsoWeekStrict(payloadSegment);
      return { mode: "woche", payload: { isoYear: parsed.isoYear, isoWeek: parsed.isoWeek } };
    }
    case "monat": {
      if (typeof payloadSegment === "undefined") {
        throw makeError("invalid-route-pattern", "Missing month.");
      }
      const { year, month } = parseYearMonth(payloadSegment);
      return { mode: "monat", payload: { year, month } };
    }
    case "jahr": {
      if (typeof payloadSegment === "undefined") {
        throw makeError("invalid-route-pattern", "Missing year.");
      }
      const year = parseYear(payloadSegment);
      return { mode: "jahr", payload: { year } };
    }
    case "event": {
      if (segments.length !== 3 || typeof payloadSegment === "undefined") {
        throw makeError("invalid-event-id", "Event id must not be empty.");
      }
      const eventId = parseEventId(payloadSegment);
      return { mode: "event", payload: { eventId } };
    }
    default:
      throw makeError("invalid-route-mode", `Unsupported mode "${mode}".`);
  }
}

export function buildKalenderHash(args = {}) {
  const mode = args.mode;
  if (!VALID_MODES.has(mode)) {
    throw makeError("invalid-route-mode", "Unsupported kalender mode.");
  }

  switch (mode) {
    case "tag": {
      if (!args.date || typeof args.date !== "string") {
        throw makeError("invalid-route-pattern", "Missing date for tag route.");
      }
      const parsed = parseLocalDateStrict(args.date);
      return `#/kalender/tag/${formatDate(parsed)}`;
    }
    case "woche": {
      const isoYear = toInt(args.isoYear);
      const isoWeek = toInt(args.isoWeek);
      if (!Number.isInteger(isoYear) || !Number.isInteger(isoWeek)) {
        throw makeError("invalid-route-pattern", "Missing isoYear or isoWeek.");
      }
      ensureYearRange(isoYear);
      if (isoWeek < 1 || isoWeek > 53) {
        throw makeError("route-out-of-range", "ISO week must be between 1 and 53.");
      }
      // validate combination
      parseIsoWeekStrict(`${isoYear}-W${pad2(isoWeek)}`);
      return `#/kalender/woche/${isoYear}-W${pad2(isoWeek)}`;
    }
    case "monat": {
      const year = toInt(args.year);
      const month = toInt(args.month);
      if (!Number.isInteger(year) || !Number.isInteger(month)) {
        throw makeError("invalid-route-pattern", "Missing year or month.");
      }
      ensureYearRange(year);
      if (month < 1 || month > 12) {
        throw makeError("route-out-of-range", "Month must be between 01 and 12.");
      }
      return `#/kalender/monat/${year}-${pad2(month)}`;
    }
    case "jahr": {
      const year = toInt(args.year);
      if (!Number.isInteger(year)) {
        throw makeError("invalid-route-pattern", "Missing year for jahr route.");
      }
      ensureYearRange(year);
      return `#/kalender/jahr/${year}`;
    }
    case "event": {
      if (!args.eventId || typeof args.eventId !== "string") {
        throw makeError("invalid-route-pattern", "Missing event id.");
      }
      const trimmed = args.eventId.trim();
      if (!trimmed) {
        throw makeError("invalid-route-pattern", "Event id must not be empty.");
      }
      return `#/kalender/event/${encodeURIComponent(trimmed)}`;
    }
    default:
      throw makeError("invalid-route-mode", "Unsupported kalender mode.");
  }
}

function buildWeekForToday() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const today = parseLocalDateStrict(todayStr);
  const { isoYear, isoWeek } = getIsoWeek(today);
  return { mode: "woche", payload: { isoYear, isoWeek } };
}

function parseLocalDateStrict(value) {
  try {
    return parseLocalDate(value);
  } catch (err) {
    if (err.code === "out-of-range-year") {
      throw makeError("route-out-of-range", err.message || "Year out of range.");
    }
    throw makeError("invalid-route-pattern", err.message || "Invalid date.");
  }
}

function parseIsoWeekStrict(value) {
  if (typeof value === "string") {
    value = value.toUpperCase();
  }
  try {
    return parseIsoWeek(value);
  } catch (err) {
    if (err.code === "out-of-range-year") {
      throw makeError("route-out-of-range", err.message || "Year out of range.");
    }
    if (err.code === "invalid-week-range") {
      throw makeError("route-out-of-range", err.message || "ISO week out of range.");
    }
    throw makeError("invalid-route-pattern", err.message || "Invalid ISO week.");
  }
}

function parseYearMonth(value) {
  if (typeof value !== "string") {
    throw makeError("invalid-route-pattern", "Month route must use YYYY-MM.");
  }
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    throw makeError("invalid-route-pattern", "Month route must use YYYY-MM.");
  }
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  ensureYearRange(year);
  if (month < 1 || month > 12) {
    throw makeError("route-out-of-range", "Month must be between 01 and 12.");
  }
  return { year, month };
}

function parseYear(value) {
  if (typeof value !== "string" || !/^\d{4}$/.test(value)) {
    throw makeError("invalid-route-pattern", "Year route must use YYYY.");
  }
  const year = Number.parseInt(value, 10);
  ensureYearRange(year);
  return year;
}

function parseEventId(value) {
  if (typeof value !== "string") {
    throw makeError("invalid-route-pattern", "Event id must be provided.");
  }
  const decoded = decodeURIComponent(value).trim();
  if (!decoded) {
    throw makeError("invalid-event-id", "Event id must not be empty.");
  }
  return decoded;
}

function ensureYearRange(year) {
  if (year < MIN_YEAR || year > MAX_YEAR) {
    throw makeError("route-out-of-range", `Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toInt(value) {
  return Number.isInteger(value) ? value : Number.parseInt(value, 10);
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
