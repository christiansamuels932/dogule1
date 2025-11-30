const ERROR_TYPE = "kalender";
const ERROR_SCOPE = "date";
const MIN_YEAR = 1970;
const MAX_YEAR = 2100;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function makeError(code, message) {
  return { type: ERROR_TYPE, scope: ERROR_SCOPE, code, message };
}

function ensureYearInRange(year) {
  if (year < MIN_YEAR || year > MAX_YEAR) {
    throw makeError("out-of-range-year", `Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
  }
}

function ensureValidDateObject(date, code = "invalid-date-object") {
  if (!isValidLocalDateObject(date)) {
    throw makeError(code, "Invalid date object.");
  }
  return date;
}

export function isValidLocalDateObject(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  const year = date.getFullYear();
  if (year < MIN_YEAR || year > MAX_YEAR) return false;
  const month = date.getMonth();
  const day = date.getDate();
  const check = new Date(year, month, day);
  return check.getFullYear() === year && check.getMonth() === month && check.getDate() === day;
}

export function parseLocalDate(isoDateString) {
  if (typeof isoDateString !== "string") {
    throw makeError("invalid-date-format", "Date must be a string in YYYY-MM-DD format.");
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDateString);
  if (!match) {
    throw makeError("invalid-date-format", "Date must be in strict YYYY-MM-DD format.");
  }
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  ensureYearInRange(year);

  const date = new Date(year, month - 1, day);
  if (
    !isValidLocalDateObject(date) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw makeError("invalid-date-value", "Invalid calendar date.");
  }
  return date;
}

export function parseIsoWeek(isoString) {
  if (typeof isoString !== "string") {
    throw makeError("invalid-iso-week-format", "ISO week must be a string in YYYY-Www format.");
  }
  const match = /^(\d{4})-W(\d{2})$/.exec(isoString);
  if (!match) {
    throw makeError("invalid-iso-week-format", "ISO week must be in strict YYYY-Www format.");
  }
  const isoYear = Number.parseInt(match[1], 10);
  const isoWeek = Number.parseInt(match[2], 10);

  ensureYearInRange(isoYear);
  if (isoWeek < 1 || isoWeek > 53) {
    throw makeError("invalid-week-range", "ISO week number must be between 1 and 53.");
  }

  const monday = getMondayOfIsoWeek(isoYear, isoWeek);
  return { isoYear, isoWeek, monday };
}

export function getMondayOfIsoWeek(isoYear, isoWeek) {
  if (!Number.isInteger(isoYear) || !Number.isInteger(isoWeek)) {
    throw makeError("invalid-iso-week", "ISO week arguments must be integers.");
  }
  ensureYearInRange(isoYear);
  if (isoWeek < 1 || isoWeek > 53) {
    throw makeError("invalid-week-range", "ISO week number must be between 1 and 53.");
  }

  const jan4 = new Date(isoYear, 0, 4);
  const jan4Weekday = jan4.getDay() === 0 ? 7 : jan4.getDay();
  const week1Monday = new Date(isoYear, 0, 4 - (jan4Weekday - 1));
  const candidate = addDays(week1Monday, (isoWeek - 1) * 7);

  const { isoYear: computedYear, isoWeek: computedWeek } = getIsoWeek(candidate);
  if (computedYear !== isoYear || computedWeek !== isoWeek) {
    throw makeError("invalid-iso-week", "ISO week does not exist in the provided year.");
  }
  return candidate;
}

export function addDays(date, n) {
  const base = ensureValidDateObject(date);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
}

export function addWeeks(date, n) {
  return addDays(date, n * 7);
}

export function getIsoWeek(date) {
  const base = ensureValidDateObject(date);
  const target = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const day = target.getDay() === 0 ? 7 : target.getDay(); // Monday=1 … Sunday=7
  target.setDate(target.getDate() + (4 - day));

  const isoYear = target.getFullYear();
  const yearStart = new Date(isoYear, 0, 1);
  const diffDays = Math.floor((target - yearStart) / MS_PER_DAY) + 1;
  const isoWeek = Math.ceil(diffDays / 7);
  return { isoYear, isoWeek };
}

export function getMonthStart(date) {
  const base = ensureValidDateObject(date);
  return new Date(base.getFullYear(), base.getMonth(), 1);
}

export function getYearStart(date) {
  const base = ensureValidDateObject(date);
  return new Date(base.getFullYear(), 0, 1);
}
