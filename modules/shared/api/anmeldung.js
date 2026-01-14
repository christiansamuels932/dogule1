import { list, create, update, remove } from "./crud.js";
import { isHttpMode, httpRequest } from "./httpClient.js";
import { createKunde } from "./kunden.js";
import { createHund } from "./hunde.js";
import { createHistorieEntry } from "./historie.js";

const TABLE = "anmeldungDrafts";

export async function listAnmeldungDrafts() {
  if (isHttpMode()) {
    return httpRequest("/anmeldung/drafts", { method: "GET" });
  }
  return list(TABLE);
}

export async function getAnmeldungDraft(id) {
  if (isHttpMode()) {
    return httpRequest(`/anmeldung/drafts/${id}`, { method: "GET" });
  }
  const drafts = await list(TABLE);
  return drafts.find((draft) => draft.id === id) || null;
}

export async function createAnmeldungDraft(data = {}) {
  if (isHttpMode()) {
    return httpRequest("/anmeldung/drafts", { method: "POST", body: data });
  }
  return create(TABLE, data);
}

export async function updateAnmeldungDraft(id, data = {}) {
  if (isHttpMode()) {
    return httpRequest(`/anmeldung/drafts/${id}`, { method: "PUT", body: data });
  }
  return update(TABLE, id, data);
}

export async function deleteAnmeldungDraft(id) {
  if (isHttpMode()) {
    return httpRequest(`/anmeldung/drafts/${id}`, { method: "DELETE" });
  }
  return remove(TABLE, id);
}

export async function createKundeFromAnmeldungDraft(draftId) {
  if (isHttpMode()) {
    return httpRequest(`/anmeldung/drafts/${draftId}/kunde`, { method: "POST" });
  }
  const draft = await getAnmeldungDraft(draftId);
  if (!draft) throw new Error("draft_not_found");
  if (!draft.kursId) throw new Error("kurs_required");
  if (!draft.hundPayload) throw new Error("hund_required");
  const kunde = await createKunde(draft.kundePayload || {});
  const updated = await updateAnmeldungDraft(draftId, {
    ...draft,
    status: "kunde_created",
    kundeId: kunde.id,
  });
  return { draft: updated, kunde };
}

export async function createHundFromAnmeldungDraft(draftId) {
  if (isHttpMode()) {
    return httpRequest(`/anmeldung/drafts/${draftId}/hund`, { method: "POST" });
  }
  const draft = await getAnmeldungDraft(draftId);
  if (!draft) throw new Error("draft_not_found");
  if (!draft.kundeId) throw new Error("kunde_required");
  if (!draft.kursId) throw new Error("kurs_required");
  const hund = await createHund({ ...(draft.hundPayload || {}), kundenId: draft.kundeId });
  const now = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}.${now.getFullYear()}`;
  const kursTitle = draft.kursTitle || "";
  const titlePart = kursTitle ? ` "${kursTitle}"` : "";
  const text = `Neue Anmeldung für den Kurs${titlePart} – ${today}`;
  await createHistorieEntry({
    entityType: "kunden",
    entityId: draft.kundeId,
    text,
  });
  await createHistorieEntry({
    entityType: "hunde",
    entityId: hund.id,
    text,
  });
  await deleteAnmeldungDraft(draftId);
  return { ok: true, kundeId: draft.kundeId, hundId: hund.id };
}
