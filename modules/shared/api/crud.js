import { db } from "./db.js";
import { wait } from "./delay.js";

/** Internal: return a table array by name, create if missing */
const tableOf = (name) => {
  if (!db[name]) db[name] = [];
  return db[name];
};

/** Tiny UUID fallback for browsers/builds without crypto.randomUUID */
const uuid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** READ: list all items */
export async function list(table, { delay = 250 } = {}) {
  await wait(delay);
  return [...tableOf(table)];
}

/** CREATE: add one item */
export async function create(table, item, { delay = 300 } = {}) {
  await wait(delay);
  const t = tableOf(table);
  const now = new Date().toISOString();
  const rec = { id: uuid(), createdAt: now, updatedAt: now, ...item };
  t.push(rec);
  return rec;
}

/** UPDATE: shallow-merge by id */
export async function update(table, id, patch, { delay = 300 } = {}) {
  await wait(delay);
  const t = tableOf(table);
  const i = t.findIndex((x) => x.id === id);
  if (i === -1) return null;
  const now = new Date().toISOString();
  t[i] = { ...t[i], ...patch, updatedAt: now };
  return t[i];
}

/** DELETE: remove by id */
export async function remove(table, id, { delay = 250 } = {}) {
  await wait(delay);
  const t = tableOf(table);
  const idx = t.findIndex((x) => x.id === id);
  if (idx === -1) return { ok: false };
  t.splice(idx, 1);
  return { ok: true, id };
}
