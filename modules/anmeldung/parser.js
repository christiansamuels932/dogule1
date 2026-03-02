const HTML_ENTITY_MAP = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function normalizeLineBreaks(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => {
      const numeric = Number.parseInt(code, 10);
      return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      const numeric = Number.parseInt(code, 16);
      return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : _;
    })
    .replace(/&([a-z]+);/gi, (match, name) => HTML_ENTITY_MAP[name.toLowerCase()] || match);
}

function normalizeInlineValue(value) {
  return decodeHtmlEntities(String(value || "").replace(/\u00a0/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseMailHeaders(rawHeaders = "") {
  const headers = {};
  let currentHeader = "";
  normalizeLineBreaks(rawHeaders)
    .split("\n")
    .forEach((line) => {
      if (/^\s/.test(line) && currentHeader) {
        headers[currentHeader] = `${headers[currentHeader]} ${line.trim()}`.trim();
        return;
      }
      const separatorIndex = line.indexOf(":");
      if (separatorIndex < 1) {
        currentHeader = "";
        return;
      }
      currentHeader = line.slice(0, separatorIndex).trim().toLowerCase();
      headers[currentHeader] = line.slice(separatorIndex + 1).trim();
    });
  return headers;
}

function splitMailHeadersAndBody(rawText = "") {
  const normalized = normalizeLineBreaks(rawText);
  const separatorMatch = normalized.match(/\n\n/);
  if (!separatorMatch || separatorMatch.index === undefined) {
    return { headers: {}, body: normalized };
  }
  const splitIndex = separatorMatch.index;
  return {
    headers: parseMailHeaders(normalized.slice(0, splitIndex)),
    body: normalized.slice(splitIndex + separatorMatch[0].length),
  };
}

function decodeBase64ToUtf8(base64Text = "") {
  const compact = String(base64Text || "").replace(/\s+/g, "");
  if (!compact) return "";
  try {
    if (typeof globalThis.Buffer !== "undefined") {
      return globalThis.Buffer.from(compact, "base64").toString("utf8");
    }
    if (typeof globalThis.atob === "function" && typeof globalThis.TextDecoder !== "undefined") {
      const binary = globalThis.atob(compact);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      return new globalThis.TextDecoder("utf-8").decode(bytes);
    }
  } catch {
    return "";
  }
  return "";
}

function decodeQuotedPrintableToUtf8(text = "") {
  const normalized = normalizeLineBreaks(text).replace(/=\n/g, "");
  const bytes = [];
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    if (char === "=" && /^[0-9a-f]{2}$/i.test(normalized.slice(index + 1, index + 3))) {
      bytes.push(Number.parseInt(normalized.slice(index + 1, index + 3), 16));
      index += 2;
      continue;
    }
    bytes.push(char.charCodeAt(0));
  }
  try {
    if (typeof globalThis.TextDecoder === "undefined") {
      return normalized;
    }
    return new globalThis.TextDecoder("utf-8").decode(Uint8Array.from(bytes));
  } catch {
    return normalized;
  }
}

function maybeDecodeMimeBody(rawText = "") {
  const { headers, body } = splitMailHeadersAndBody(rawText);
  const transferEncoding = String(headers["content-transfer-encoding"] || "")
    .trim()
    .toLowerCase();
  if (!transferEncoding) return rawText;
  if (transferEncoding.includes("base64")) {
    const decoded = decodeBase64ToUtf8(body);
    return decoded || rawText;
  }
  if (transferEncoding.includes("quoted-printable")) {
    const decoded = decodeQuotedPrintableToUtf8(body);
    return decoded || rawText;
  }
  return rawText;
}

function containsRegistrationPayload(text = "") {
  return /Neue Anmeldung für den Kurs|Angaben zur Person|Angaben zum Hund/i.test(text);
}

function stripMailTransportNoise(text = "") {
  let result = normalizeLineBreaks(decodeHtmlEntities(text))
    .replace(/\u00a0/g, " ")
    .replace(/\uFEFF/g, "");
  const startPatterns = [/Neue Anmeldung für den Kurs/i, /\nKurs:/i, /\nAngaben zur Person/i];
  const startIndex = startPatterns
    .map((pattern) => result.search(pattern))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];
  if (startIndex > 0) {
    result = result.slice(startIndex);
  }
  result = result
    .replace(/\n--\nIf you wish to stop receiving notifications[\s\S]*$/i, "")
    .replace(/\nIf you wish to stop receiving notifications[\s\S]*$/i, "")
    .replace(/\nPlease do not reply directly to this email[\s\S]*$/i, "");
  return result.trim();
}

function extractNormalizedPayloadText(rawText = "") {
  const direct = stripMailTransportNoise(rawText);
  if (containsRegistrationPayload(direct)) {
    return direct;
  }
  const decoded = stripMailTransportNoise(maybeDecodeMimeBody(rawText));
  if (containsRegistrationPayload(decoded)) {
    return decoded;
  }
  return direct;
}

function extractKeyValue(line) {
  const match = line.match(/^\s*([^:]+)\s*:\s*(.*?)\s*$/);
  if (!match) return null;
  const key = normalizeInlineValue(match[1]);
  const value = normalizeInlineValue(match[2]);
  if (!key) return null;
  return { key, value };
}

function normalizeKey(key) {
  return normalizeInlineValue(key).toLowerCase().replace(/\s+/g, " ").trim();
}

function parseSectionPairs(lines = []) {
  const pairs = {};
  lines.forEach((line) => {
    const kv = extractKeyValue(line);
    if (!kv) return;
    const key = normalizeKey(kv.key);
    if (!key) return;
    pairs[key] = kv.value;
  });
  return pairs;
}

export function buildAdresseFromParts({ strasse = "", plz = "", ort = "" } = {}) {
  const line = normalizeInlineValue(strasse);
  const townLine = [normalizeInlineValue(plz), normalizeInlineValue(ort)].filter(Boolean).join(" ");
  return [line, townLine].filter(Boolean).join(", ");
}

function parseCombinedAddress(value = "") {
  const lines = normalizeLineBreaks(value)
    .split("\n")
    .map((line) => normalizeInlineValue(line))
    .filter(Boolean);
  if (lines.length >= 2) {
    const postalCity = lines[1].match(/^(\d{4})\s+(.+)$/);
    if (postalCity) {
      return {
        strasse: lines[0],
        plz: postalCity[1],
        ort: postalCity[2].trim(),
      };
    }
  }
  const flat = normalizeInlineValue(lines.join(", "));
  const inlineMatch = flat.match(/^(.+?)(?:,|\s)\s*(\d{4})\s+(.+)$/);
  if (!inlineMatch) {
    return { strasse: flat, plz: "", ort: "" };
  }
  return {
    strasse: normalizeInlineValue(inlineMatch[1]),
    plz: inlineMatch[2],
    ort: normalizeInlineValue(inlineMatch[3]),
  };
}

function normalizeAdresseParts({ strasse = "", plz = "", ort = "", adresse = "" } = {}) {
  let nextStrasse = normalizeInlineValue(strasse);
  let nextPlz = normalizeInlineValue(plz);
  let nextOrt = normalizeInlineValue(ort);
  const combinedSource = !nextPlz || !nextOrt ? adresse || strasse : "";
  if (combinedSource) {
    const combined = parseCombinedAddress(combinedSource);
    if (!nextStrasse && combined.strasse) nextStrasse = combined.strasse;
    if (!nextPlz && combined.plz) nextPlz = combined.plz;
    if (!nextOrt && combined.ort) nextOrt = combined.ort;
  }
  if (!nextPlz && nextOrt) {
    const postalCity = nextOrt.match(/^(\d{4})\s+(.+)$/);
    if (postalCity) {
      nextPlz = postalCity[1];
      nextOrt = normalizeInlineValue(postalCity[2]);
    }
  } else if (nextPlz && nextOrt) {
    const duplicatedPrefix = new RegExp(`^${nextPlz}\\s+`, "i");
    nextOrt = nextOrt.replace(duplicatedPrefix, "").trim();
  }
  return {
    strasse: nextStrasse,
    plz: nextPlz,
    ort: nextOrt,
    adresse: buildAdresseFromParts({
      strasse: nextStrasse,
      plz: nextPlz,
      ort: nextOrt,
    }),
  };
}

function replaceGermanSpecials(value = "") {
  return String(value || "")
    .replace(/ä/gi, "ae")
    .replace(/ö/gi, "oe")
    .replace(/ü/gi, "ue")
    .replace(/ß/gi, "ss")
    .replace(/&/g, " und ");
}

function normalizeCourseKey(value) {
  return replaceGermanSpecials(normalizeInlineValue(value))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreCourseMatch(candidate = "", target = "") {
  if (!candidate || !target) return 0;
  if (candidate === target) return 100;
  const compactCandidate = candidate.replace(/\s+/g, "");
  const compactTarget = target.replace(/\s+/g, "");
  if (compactCandidate === compactTarget) return 96;
  if (compactCandidate.includes(compactTarget) || compactTarget.includes(compactCandidate)) {
    return 92;
  }
  const candidateTokens = [...new Set(candidate.split(" ").filter(Boolean))];
  const targetTokens = [...new Set(target.split(" ").filter(Boolean))];
  if (!candidateTokens.length || !targetTokens.length) return 0;
  let overlap = 0;
  targetTokens.forEach((targetToken) => {
    const matched = candidateTokens.some(
      (candidateToken) =>
        candidateToken === targetToken ||
        candidateToken.includes(targetToken) ||
        targetToken.includes(candidateToken)
    );
    if (matched) overlap += 1;
  });
  return (overlap / targetTokens.length) * 80;
}

export function findBestKursMatch(kurse = [], kursTitle = "") {
  const normalizedTarget = normalizeCourseKey(kursTitle);
  if (!normalizedTarget) return null;
  let best = null;
  let bestScore = 0;
  kurse.forEach((kurs) => {
    const normalizedCandidate = normalizeCourseKey(kurs?.title || "");
    const score = scoreCourseMatch(normalizedCandidate, normalizedTarget);
    if (score > bestScore) {
      bestScore = score;
      best = kurs;
    }
  });
  return bestScore > 0 ? best : null;
}

export function normalizeDateDDMMYYYY(value) {
  const raw = normalizeInlineValue(value);
  if (!raw) return "";
  const localDate = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (localDate) {
    const day = String(Number.parseInt(localDate[1], 10)).padStart(2, "0");
    const month = String(Number.parseInt(localDate[2], 10)).padStart(2, "0");
    return `${day}.${month}.${localDate[3]}`;
  }
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[tT ].*)?$/);
  if (iso) {
    const month = String(Number.parseInt(iso[2], 10)).padStart(2, "0");
    const day = String(Number.parseInt(iso[3], 10)).padStart(2, "0");
    return `${day}.${month}.${iso[1]}`;
  }
  return raw;
}

function inferGeschlechtFromAnrede(anrede) {
  const normalized = normalizeKey(anrede);
  if (normalized === "herr") return "männlich";
  if (normalized === "frau") return "weiblich";
  return "";
}

function normalizeKastriert(value) {
  const normalized = normalizeKey(value);
  if (!normalized) return "";
  if (["ja", "j", "yes", "true", "1"].includes(normalized)) return true;
  if (["nein", "n", "no", "false", "0"].includes(normalized)) return false;
  return normalizeInlineValue(value);
}

function parseRufnameLine(value) {
  const raw = normalizeInlineValue(value);
  if (!raw) return { name: "", rufname: "" };
  const match = raw.match(/^(.+?)\s*\(\s*(?:kurz\s*:?\s*)?(.+?)\s*\)\s*$/i);
  if (match) {
    return { name: normalizeInlineValue(match[1]), rufname: normalizeInlineValue(match[2]) };
  }
  return { name: raw, rufname: raw };
}

export function parseEmailDraft(rawText = "") {
  const text = extractNormalizedPayloadText(rawText);
  const lines = normalizeLineBreaks(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const findHeadingIndex = (needle) =>
    lines.findIndex((line) => normalizeKey(line).includes(normalizeKey(needle)));

  const personIdx = findHeadingIndex("Angaben zur Person");
  const hundIdx = findHeadingIndex("Angaben zum Hund");

  const personLines =
    personIdx >= 0 ? lines.slice(personIdx + 1, hundIdx > personIdx ? hundIdx : undefined) : [];
  const hundLines = hundIdx >= 0 ? lines.slice(hundIdx + 1) : [];

  const allPairs = parseSectionPairs(lines);
  const personPairs = personLines.length ? parseSectionPairs(personLines) : allPairs;
  const hundPairs = hundLines.length ? parseSectionPairs(hundLines) : allPairs;

  const headerKurs =
    lines
      .find((line) => /^Neue Anmeldung für den Kurs\s+/i.test(line))
      ?.replace(/^Neue Anmeldung für den Kurs\s+/i, "")
      .trim() || "";
  const kursTitle =
    normalizeInlineValue(
      allPairs["kurs"] ||
        allPairs["kursname"] ||
        allPairs["kurs titel"] ||
        allPairs["kurs titel / name"] ||
        headerKurs
    ) || "";

  const anrede = personPairs["anrede"] || "";
  const kundeAdresse = normalizeAdresseParts({
    strasse:
      personPairs["strasse"] ||
      personPairs["straße"] ||
      personPairs["strasse / nr"] ||
      personPairs["adresse"] ||
      "",
    plz: personPairs["plz"] || personPairs["postleitzahl"] || "",
    ort: personPairs["ort"] || personPairs["stadt"] || "",
    adresse: personPairs["adresse"] || "",
  });
  const kundePayload = {
    anrede,
    vorname: personPairs["vorname"] || "",
    nachname: personPairs["nachname"] || "",
    geschlecht: personPairs["geschlecht"] || inferGeschlechtFromAnrede(anrede) || "",
    email: personPairs["e-mail"] || personPairs["email"] || "",
    telefon: personPairs["telefon"] || personPairs["tel"] || "",
    mobile: personPairs["mobile"] || "",
    geburtsdatum: normalizeDateDDMMYYYY(personPairs["geburtsdatum"] || ""),
    strasse: kundeAdresse.strasse,
    plz: kundeAdresse.plz,
    ort: kundeAdresse.ort,
    heimatort: personPairs["heimatort"] || "",
    aufmerksamDurch: personPairs["aufmerksam durch"] || personPairs["aufmerksam"] || "",
    adresse: kundeAdresse.adresse,
    notizen: "",
  };

  if (!kundePayload.nachname && personPairs["name"]) {
    const parts = normalizeInlineValue(personPairs["name"]).split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      kundePayload.vorname = kundePayload.vorname || parts.slice(0, -1).join(" ");
      kundePayload.nachname = parts[parts.length - 1];
    } else if (parts.length === 1) {
      kundePayload.nachname = parts[0];
    }
  }

  const hundRufnameRaw = normalizeInlineValue(hundPairs["rufname"] || hundPairs["kurzname"] || "");
  const parsedHundNames = parseRufnameLine(hundRufnameRaw);
  const explicitHundName = normalizeInlineValue(hundPairs["name"] || hundPairs["hundename"] || "");
  const hundPayload = {
    name: explicitHundName || parsedHundNames.name || "",
    rufname: parsedHundNames.rufname || hundRufnameRaw || "",
    rasse: hundPairs["rasse"] || "",
    geschlecht: hundPairs["geschlecht"] || "",
    kastriert: normalizeKastriert(hundPairs["kastriert"]),
    geburtsdatum: normalizeDateDDMMYYYY(hundPairs["wurfdatum"] || hundPairs["geburtsdatum"] || ""),
    chipNummer:
      hundPairs["chip-nr."] ||
      hundPairs["chip-nr"] ||
      hundPairs["chip nr"] ||
      hundPairs["chipnummer"] ||
      hundPairs["chip nummer"] ||
      "",
    notizen: "",
    status: "",
  };

  const errors = {
    kurs: kursTitle ? null : "Kursname nicht gefunden (manuell auswählen).",
    kunde:
      kundePayload.vorname || kundePayload.nachname
        ? null
        : "Kundendaten nicht erkannt (Vorname/Nachname).",
    hund: hundPayload.name ? null : "Hundedaten nicht erkannt (Name).",
  };

  return { kursTitle, kundePayload, hundPayload, errors };
}
