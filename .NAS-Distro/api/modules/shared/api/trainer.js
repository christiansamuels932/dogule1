import { list, create, update, remove } from "./crud.js";
import { isHttpMode, httpList, httpGet, httpCreate, httpUpdate, httpDelete } from "./httpClient.js";
import { db } from "./db/index.js";
import { getKurseForTrainer } from "./kurse.js";

const TABLE = "trainer";
const LEGACY_AVAILABILITY_KEY = "verfuegbarkeit";

const EDITABLE_DEFAULTS = {
  code: "",
  name: "",
  titel: "",
  email: "",
  telefon: "",
  notizen: "",
  verfuegbarkeiten: [],
};

const normalizeAvailability = (payload = {}) => {
  const entries = payload.verfuegbarkeiten ?? payload[LEGACY_AVAILABILITY_KEY];
  if (!Array.isArray(entries)) return EDITABLE_DEFAULTS.verfuegbarkeiten;
  return entries.map((slot = {}) => ({
    weekday: typeof slot.weekday === "number" ? slot.weekday : Number(slot.weekday) || 0,
    startTime: slot.startTime ?? "",
    endTime: slot.endTime ?? "",
  }));
};

const ensureEditableDefaults = (payload = {}) => {
  const normalized = { ...EDITABLE_DEFAULTS, ...payload };
  normalized.code = (payload.code || "").trim();
  normalized.verfuegbarkeiten = normalizeAvailability(payload);
  return normalized;
};

const sanitizeUpdatePayload = (payload = {}) => {
  const patch = {};
  const availabilityProvided =
    Object.prototype.hasOwnProperty.call(payload, "verfuegbarkeiten") ||
    Object.prototype.hasOwnProperty.call(payload, LEGACY_AVAILABILITY_KEY);

  Object.keys(EDITABLE_DEFAULTS).forEach((key) => {
    if (
      !Object.prototype.hasOwnProperty.call(payload, key) &&
      !(key === "verfuegbarkeiten" && availabilityProvided)
    ) {
      return;
    }
    if (key === "verfuegbarkeiten") {
      patch.verfuegbarkeiten = normalizeAvailability(payload);
    } else if (key === "code") {
      patch.code = (payload.code || "").trim();
    } else {
      patch[key] = payload[key] ?? EDITABLE_DEFAULTS[key];
    }
  });

  return patch;
};

const ensureTrainerShape = (trainer = {}) => ({
  id: "",
  createdAt: "",
  updatedAt: "",
  ...EDITABLE_DEFAULTS,
  ...trainer,
  verfuegbarkeiten: normalizeAvailability(trainer),
});

let trainerSequence =
  (db[TABLE] || []).reduce((max, entry) => {
    const match = (entry?.id || "").match(/(\d+)/);
    if (!match) return max;
    const num = Number.parseInt(match[1], 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0) || 0;

const nextTrainerId = () => {
  trainerSequence += 1;
  return `t${trainerSequence}`;
};

export async function listTrainer(options) {
  if (isHttpMode()) {
    return httpList("trainer");
  }
  const trainer = await list(TABLE, options);
  return trainer.map(ensureTrainerShape);
}

export async function getTrainer(id, options) {
  if (isHttpMode()) {
    return httpGet("trainer", id);
  }
  const trainer = await listTrainer(options);
  return trainer.find((entry) => entry.id === id) || null;
}

export async function createTrainer(data = {}, options) {
  if (isHttpMode()) {
    return httpCreate("trainer", data);
  }
  const sanitized = ensureEditableDefaults(data);
  if (sanitized.id) {
    delete sanitized.id;
  }
  const record = await create(TABLE, { id: nextTrainerId(), ...sanitized }, options);
  return ensureTrainerShape(record);
}

export async function updateTrainer(id, data = {}, options) {
  if (isHttpMode()) {
    return httpUpdate("trainer", id, data);
  }
  const patch = sanitizeUpdatePayload(data);
  if (!Object.keys(patch).length) {
    return getTrainer(id, options);
  }
  const updated = await update(TABLE, id, patch, options);
  return updated ? ensureTrainerShape(updated) : null;
}

export async function deleteTrainer(id, options) {
  if (isHttpMode()) {
    return httpDelete("trainer", id);
  }
  const kursAssignments = await getKurseForTrainer(id);
  if (kursAssignments.length) {
    const error = new Error(`Trainer ${id} ist Kursen zugeordnet und kann nicht gelöscht werden.`);
    error.code = "TRAINER_DELETE_BLOCKED";
    error.kurse = kursAssignments.map((kurs) => kurs.id);
    throw error;
  }
  return remove(TABLE, id, options);
}
