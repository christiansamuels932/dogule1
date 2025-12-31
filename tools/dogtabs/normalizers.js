function normalizeString(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function normalizeEmail(value) {
  const raw = normalizeString(value).toLowerCase();
  if (!raw) return { value: "", valid: true };
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
  return { value: ok ? raw : "", valid: ok };
}

function normalizePhone(value) {
  const raw = normalizeString(value);
  if (!raw) return "";
  const trimmed = raw.replace(/[^\d+]/g, "");
  if (trimmed.startsWith("00")) {
    return `+${trimmed.slice(2)}`;
  }
  return trimmed;
}

function normalizeStatus(value) {
  const raw = normalizeString(value).toLowerCase();
  if (!raw) return "";
  if (raw.includes("aktiv")) return "aktiv";
  if (raw.includes("passiv")) return "passiv";
  if (raw.includes("deaktiv")) return "deaktiviert";
  return "";
}

function normalizeBoolean(value) {
  const raw = normalizeString(value).toLowerCase();
  if (!raw) return null;
  if (raw === "1" || raw === "true" || raw === "ja" || raw === "yes") return true;
  if (raw === "0" || raw === "false" || raw === "nein" || raw === "no") return false;
  return null;
}

function parseGermanDate(value) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min, ss] = match;
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: hh ? `${hh}:${min || "00"}:${ss || "00"}` : "",
  };
}

function parseIsoDate(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;
  const [, yyyy, mm, dd, hh, min, ss] = match;
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: hh ? `${hh}:${min || "00"}:${ss || "00"}` : "",
  };
}

function parseUsDate(value) {
  const match = value.match(
    /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!match) return null;
  let [, mm, dd, yyyy, hh, min, ss] = match;
  if (yyyy.length === 2) {
    const yearNum = Number(yyyy);
    if (Number.isNaN(yearNum)) return null;
    yyyy = yearNum <= 49 ? `20${yyyy}` : `19${yyyy}`;
  }
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: hh ? `${hh}:${min || "00"}:${ss || "00"}` : "",
  };
}

function normalizeDateTime(value) {
  const raw = normalizeString(value);
  if (!raw) return { date: "", time: "" };
  const parsed = parseIsoDate(raw) || parseGermanDate(raw) || parseUsDate(raw);
  if (!parsed) return { date: "", time: "" };
  return parsed;
}

function normalizePicklist(value, allowed = []) {
  const raw = normalizeString(value);
  if (!raw) return "";
  if (allowed.length === 0) return raw;
  return allowed.includes(raw) ? raw : "";
}

export {
  normalizeString,
  normalizeEmail,
  normalizePhone,
  normalizeStatus,
  normalizeBoolean,
  normalizeDateTime,
  normalizePicklist,
};
