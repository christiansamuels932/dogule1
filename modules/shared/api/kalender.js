import { list } from "./crud.js";

const TABLE = "kalender";

const SHAPE = {
  id: "",
  code: "",
  kursId: "",
  trainerId: "",
  title: "",
  start: "",
  end: "",
  location: "",
  notes: "",
};

function ensureShape(entry = {}) {
  return { ...SHAPE, ...entry };
}

export async function listKalenderEvents(options) {
  const events = await list(TABLE, options);
  return events.map(ensureShape);
}

export async function getKalenderEvent(id, options) {
  const events = await listKalenderEvents(options);
  return events.find((evt) => evt.id === id) || null;
}
