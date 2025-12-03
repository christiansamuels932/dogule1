/* globals console */
import { getKurs, getTrainer } from "../../shared/api/index.js";

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

const toMinutes = (timeStr) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr || "");
  if (!match) return null;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const buildDateAtTime = (dateValue, timeStr) => {
  const base = dateValue instanceof Date ? dateValue : new Date(dateValue || "");
  if (Number.isNaN(base.getTime())) return null;
  const minutes = toMinutes(timeStr);
  if (minutes == null) return new Date(base);
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0
  );
};

export function sortEventsChronologically(events = []) {
  return [...events].sort((a, b) => {
    const aStart = buildDateAtTime(a.start, null)?.getTime() ?? Number.POSITIVE_INFINITY;
    const bStart = buildDateAtTime(b.start, null)?.getTime() ?? Number.POSITIVE_INFINITY;
    if (aStart !== bStart) return aStart - bStart;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

export async function attachKursAndTrainer(events = []) {
  const kursIds = unique(events.map((evt) => evt?.kursId).filter(Boolean));
  const kursMap = new Map();
  await Promise.all(
    kursIds.map(async (kursId) => {
      try {
        const kurs = await getKurs(kursId);
        if (kurs) {
          kursMap.set(kursId, kurs);
        }
      } catch (error) {
        console.error("[KALENDER_ERR_KURS_RESOLVE]", kursId, error);
      }
    })
  );

  const trainerIds = unique([...kursMap.values()].map((kurs) => kurs?.trainerId).filter(Boolean));
  const trainerMap = new Map();
  await Promise.all(
    trainerIds.map(async (trainerId) => {
      try {
        const trainer = await getTrainer(trainerId);
        if (trainer) {
          trainerMap.set(trainerId, trainer);
        }
      } catch (error) {
        console.error("[KALENDER_ERR_TRAINER_RESOLVE]", trainerId, error);
      }
    })
  );

  const enriched = events.map((evt) => {
    const kurs = evt?.kursId ? kursMap.get(evt.kursId) || null : null;
    const trainer = kurs?.trainerId ? trainerMap.get(kurs.trainerId) || null : null;
    return { ...evt, kurs, trainer };
  });

  return {
    events: enriched,
    kursMap,
    trainerMap,
  };
}
