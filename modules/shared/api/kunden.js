import { list, create, update, remove } from "./crud.js";
import { isHttpMode, httpList, httpGet, httpCreate, httpUpdate, httpDelete } from "./httpClient.js";

const TABLE = "kunden";
const LEGACY_CODE_KEY = "kundenCode";

const EDITABLE_DEFAULTS = {
  code: "",
  vorname: "",
  nachname: "",
  geschlecht: "",
  email: "",
  telefon: "",
  adresse: "",
  notizen: "",
};

const FEMALE_VORNAMEN = new Set([
  "anna",
  "andrea",
  "lea",
  "lara",
  "laura",
  "maria",
  "marie",
  "sara",
  "sarah",
  "julia",
  "juliane",
  "lena",
  "eva",
  "nina",
  "sophie",
  "sofie",
  "luisa",
]);

const MALE_VORNAMEN = new Set([
  "thomas",
  "mark",
  "marco",
  "marcus",
  "lukas",
  "luca",
  "jan",
  "jonas",
  "michael",
  "peter",
  "tim",
  "timo",
  "daniel",
  "andreas",
]);

function inferGeschlechtFromVorname(vorname) {
  const trimmed = typeof vorname === "string" ? vorname.trim().toLowerCase() : "";
  if (!trimmed) return "";
  if (FEMALE_VORNAMEN.has(trimmed)) return "weiblich";
  if (MALE_VORNAMEN.has(trimmed)) return "männlich";
  if (trimmed.endsWith("a")) return "weiblich";
  return "";
}

const applyGeschlechtAutofill = (payload = {}) => {
  if (payload.geschlecht !== undefined && payload.geschlecht !== null && payload.geschlecht !== "") {
    return payload;
  }
  const inferred = inferGeschlechtFromVorname(payload.vorname);
  if (!inferred) return payload;
  return { ...payload, geschlecht: inferred };
};

const normalizeCodePayload = (payload = {}) => {
  if (payload.code !== undefined) {
    return payload;
  }
  if (payload[LEGACY_CODE_KEY] !== undefined) {
    return { ...payload, code: payload[LEGACY_CODE_KEY] };
  }
  return payload;
};

const ensureEditableDefaults = (payload = {}) => ({
  ...EDITABLE_DEFAULTS,
  ...normalizeCodePayload(payload),
});

const attachLegacyAlias = (record) => {
  if (!record) return record;
  if (Object.prototype.hasOwnProperty.call(record, LEGACY_CODE_KEY)) {
    delete record[LEGACY_CODE_KEY];
  }
  Object.defineProperty(record, LEGACY_CODE_KEY, {
    configurable: true,
    enumerable: false,
    get() {
      return this.code;
    },
    set(value) {
      this.code = value;
    },
  });
  return record;
};

const ensureKundeShape = (kunde = {}) =>
  attachLegacyAlias({
    id: "",
    createdAt: "",
    updatedAt: "",
    ...EDITABLE_DEFAULTS,
    ...kunde,
  });

export async function listKunden(options) {
  if (isHttpMode()) {
    return httpList("kunden");
  }
  const kunden = await list(TABLE, options);
  return kunden.map(ensureKundeShape);
}

export async function getKunde(id, options) {
  if (isHttpMode()) {
    return httpGet("kunden", id);
  }
  const kunden = await listKunden(options);
  return kunden.find((k) => k.id === id) || null;
}

export async function createKunde(data = {}, options) {
  if (isHttpMode()) {
    return httpCreate("kunden", applyGeschlechtAutofill(data));
  }
  const record = await create(
    TABLE,
    ensureEditableDefaults(applyGeschlechtAutofill(data)),
    options
  );
  return ensureKundeShape(record);
}

export async function updateKunde(id, data = {}, options) {
  if (isHttpMode()) {
    return httpUpdate("kunden", id, data);
  }
  const updated = await update(TABLE, id, ensureEditableDefaults(data), options);
  return updated ? ensureKundeShape(updated) : null;
}

export async function deleteKunde(id, options) {
  if (isHttpMode()) {
    return httpDelete("kunden", id);
  }
  return remove(TABLE, id, options);
}
