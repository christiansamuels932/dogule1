/* global URLSearchParams */
import { list, create, remove } from "./crud.js";
import { isHttpMode, httpRequest } from "./httpClient.js";
import { getSession } from "../auth/client.js";
import { createHistorieEntry } from "./historie.js";
import { listTrainer } from "./trainer.js";

const TABLE = "rapporteDrafts";

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    search.set(key, value);
  });
  return search.toString();
}

function extractFirstName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.split(/\s+/)[0] || "";
}

function resolveTrainerIdFromActorId(actorId) {
  const raw = String(actorId || "").trim();
  if (!raw) return "";
  return raw.startsWith("user-") ? raw.slice(5) : raw;
}

export async function listRapporteDrafts({
  status = "",
  authorId = "",
  targetType = "",
  targetId = "",
  kundeId = "",
} = {}) {
  if (isHttpMode()) {
    const query = buildQuery({ status, authorId, targetType, targetId, kundeId });
    return httpRequest(`/rapporte/drafts${query ? `?${query}` : ""}`, { method: "GET" });
  }
  const drafts = await list(TABLE);
  return drafts
    .filter((draft) => (status ? draft.status === status : true))
    .filter((draft) => (authorId ? draft.authorId === authorId : true))
    .filter((draft) => (targetType ? draft.targetType === targetType : true))
    .filter((draft) => (targetId ? draft.targetId === targetId : true))
    .filter((draft) => (kundeId ? draft.kundeId === kundeId : true))
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

export async function getRapporteDraft(id) {
  if (!id) return null;
  if (isHttpMode()) {
    return httpRequest(`/rapporte/drafts/${id}`, { method: "GET" });
  }
  const drafts = await list(TABLE);
  return drafts.find((draft) => draft.id === id) || null;
}

export async function createRapporteDraft(data = {}) {
  if (isHttpMode()) {
    return httpRequest("/rapporte/drafts", { method: "POST", body: data });
  }
  const session = getSession();
  const authorId = data.authorId || session?.user?.id || "";
  const authorRole = data.authorRole || session?.user?.role || "";
  const occurredAt = data.occurredAt || new Date().toISOString();
  return create(TABLE, {
    status: data.status || "submitted",
    targetType: data.targetType,
    targetId: data.targetId,
    kundeId: data.kundeId,
    text: data.text || "",
    occurredAt,
    authorId,
    authorRole,
  });
}

export async function deleteRapporteDraft(id) {
  if (!id) return { ok: false };
  if (isHttpMode()) {
    return httpRequest(`/rapporte/drafts/${id}`, { method: "DELETE" });
  }
  return remove(TABLE, id);
}

export async function approveRapporteDraft(id) {
  if (!id) return { ok: false };
  if (isHttpMode()) {
    return httpRequest(`/rapporte/drafts/${id}/approve`, { method: "POST" });
  }
  const draft = await getRapporteDraft(id);
  if (!draft) throw new Error("draft_not_found");
  const occurredAt = draft.occurredAt || new Date().toISOString();
  let authorName = "";
  const trainerId = resolveTrainerIdFromActorId(draft.authorId);
  if (trainerId) {
    try {
      const trainers = await listTrainer();
      const trainer = trainers.find((entry) => entry.id === trainerId);
      authorName = extractFirstName(trainer?.name || "");
    } catch {
      authorName = "";
    }
  }
  const suffix = authorName ? ` (Trainer: ${authorName})` : "";
  const text = `Rapport - ${(draft.text || "").trim()}${suffix}`.trim();
  if (draft.kundeId) {
    await createHistorieEntry({
      entityType: "kunden",
      entityId: draft.kundeId,
      occurredAt,
      authorId: draft.authorId || "",
      authorRole: draft.authorRole || "",
      text,
    });
  }
  if (draft.targetType === "hunde" && draft.targetId) {
    await createHistorieEntry({
      entityType: "hunde",
      entityId: draft.targetId,
      occurredAt,
      authorId: draft.authorId || "",
      authorRole: draft.authorRole || "",
      text,
    });
  }
  await remove(TABLE, id);
  return { ok: true };
}

export async function rejectRapporteDraft(id) {
  if (!id) return { ok: false };
  if (isHttpMode()) {
    return httpRequest(`/rapporte/drafts/${id}/reject`, { method: "POST" });
  }
  return remove(TABLE, id);
}
