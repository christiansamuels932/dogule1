import { list, create, update, remove } from "./crud.js";
import { isHttpMode, httpList, httpGet, httpCreate, httpUpdate, httpDelete } from "./httpClient.js";

const TABLE = "zertifikate";
const REQUIRED_FIELDS = [
  "kundeId",
  "hundId",
  "kursId",
  "ausstellungsdatum",
  "kursOrtSnapshot",
  "kursInhaltTheorieSnapshot",
  "kursInhaltPraxisSnapshot",
  "trainer1NameSnapshot",
];

const EDITABLE_DEFAULTS = {
  code: "",
  kundeId: "",
  hundId: "",
  kursId: "",
  kundeNameSnapshot: "",
  kundeGeschlechtSnapshot: "",
  hundNameSnapshot: "",
  hundRasseSnapshot: "",
  hundGeschlechtSnapshot: "",
  kursTitelSnapshot: "",
  kursDatumSnapshot: "",
  kursOrtSnapshot: "",
  kursInhaltTheorieSnapshot: "",
  kursInhaltPraxisSnapshot: "",
  ausstellungsdatum: "",
  trainer1NameSnapshot: "",
  trainer1TitelSnapshot: "",
  trainer2NameSnapshot: "",
  trainer2TitelSnapshot: "",
  bemerkungen: "",
};

const ensureEditableDefaults = (payload = {}) => ({
  ...EDITABLE_DEFAULTS,
  ...payload,
});

const ensureZertifikatShape = (entry = {}) => ({
  id: "",
  createdAt: "",
  updatedAt: "",
  ...EDITABLE_DEFAULTS,
  ...entry,
});

let zertifikatSequence = 0;

const nextZertifikatCodeFromList = (list = []) => {
  const max = (Array.isArray(list) ? list : []).reduce((current, entry) => {
    const match = (entry?.code || "").match(/Z-(\d+)/);
    if (!match) return current;
    const num = Number.parseInt(match[1], 10);
    return Number.isFinite(num) && num > current ? num : current;
  }, 0);
  zertifikatSequence = Math.max(zertifikatSequence, max);
  zertifikatSequence += 1;
  return `Z-${String(zertifikatSequence).padStart(3, "0")}`;
};

function ensureRequiredFields(payload = {}) {
  if (!(payload.trainer1TitelSnapshot || "").toString().trim()) {
    const error = new Error("TRAINER_TITEL_REQUIRED");
    error.code = "TRAINER_TITEL_REQUIRED";
    throw error;
  }
  const missing = REQUIRED_FIELDS.filter((key) => !(payload[key] || "").toString().trim());
  if (missing.length) {
    const error = new Error("Zertifikat enthält fehlende Pflichtfelder");
    error.code = "ZERTIFIKAT_REQUIRED";
    error.missing = missing;
    throw error;
  }
  if ((payload.trainer2NameSnapshot || "").toString().trim()) {
    if (!(payload.trainer2TitelSnapshot || "").toString().trim()) {
      const error = new Error("TRAINER_TITEL_REQUIRED");
      error.code = "TRAINER_TITEL_REQUIRED";
      throw error;
    }
  }
}

export async function listZertifikate(options) {
  if (isHttpMode()) {
    return httpList("zertifikate");
  }
  const zertifikate = await list(TABLE, options);
  return zertifikate.map(ensureZertifikatShape);
}

export async function getZertifikat(id, options) {
  if (isHttpMode()) {
    return httpGet("zertifikate", id);
  }
  const zertifikate = await listZertifikate(options);
  return zertifikate.find((entry) => entry.id === id) || null;
}

export async function createZertifikat(data = {}, options) {
  const record = ensureEditableDefaults(data);
  if (!record.code) {
    const existing = await listZertifikate(options);
    record.code = nextZertifikatCodeFromList(existing);
  }
  ensureRequiredFields(record);
  if (isHttpMode()) {
    return httpCreate("zertifikate", record);
  }
  const created = await create(TABLE, record, options);
  return ensureZertifikatShape(created);
}

export async function updateZertifikat(id, data = {}, options) {
  if (isHttpMode()) {
    return httpUpdate("zertifikate", id, data);
  }
  const updated = await update(TABLE, id, ensureEditableDefaults(data), options);
  if (updated) {
    ensureRequiredFields(updated);
  }
  return updated ? ensureZertifikatShape(updated) : null;
}

export async function deleteZertifikat(id, options) {
  if (isHttpMode()) {
    return httpDelete("zertifikate", id);
  }
  return remove(TABLE, id, options);
}
