const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;
const EVENT_TYPES = new Set(["route_view", "ui_click", "issue_report", "admin_action"]);

let schemaReadyPromise = null;

function normalizeText(value, maxLength) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.slice(0, maxLength);
}

function normalizeLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

function normalizeId(value) {
  return normalizeText(value, 64);
}

function mapRow(row = {}) {
  return {
    id: row.id,
    eventType: row.event_type,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    actorUsername: row.actor_username,
    routeHash: row.route_hash,
    moduleId: row.module_id,
    actionLabel: row.action_label,
    details: row.details,
    createdAt: row.created_at,
  };
}

export function normalizeActivityInput(raw = {}) {
  const eventType = normalizeText(raw.eventType, 32);
  if (!EVENT_TYPES.has(eventType)) return null;
  const routeHash = normalizeText(raw.routeHash, 255);
  const moduleId = normalizeText(raw.moduleId, 64);
  const actionLabel = normalizeText(raw.actionLabel, 255);
  const detailsLimit = eventType === "issue_report" ? 500 : 255;
  const details = normalizeText(raw.details, detailsLimit);
  if (eventType === "issue_report" && !details) return null;
  return {
    eventType,
    routeHash,
    moduleId,
    actionLabel,
    details,
  };
}

export async function ensureDeveloperActivitySchema(pool) {
  if (!pool?.query) {
    throw new Error("developer_activity_pool_missing");
  }
  if (!schemaReadyPromise) {
    schemaReadyPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS developer_activity_events (
        id CHAR(36) NOT NULL,
        event_type VARCHAR(32) NOT NULL,
        actor_id VARCHAR(64) NOT NULL DEFAULT '',
        actor_role VARCHAR(32) NOT NULL DEFAULT '',
        actor_username VARCHAR(128) NOT NULL DEFAULT '',
        route_hash VARCHAR(255) NOT NULL DEFAULT '',
        module_id VARCHAR(64) NOT NULL DEFAULT '',
        action_label VARCHAR(255) NOT NULL DEFAULT '',
        details TEXT NOT NULL,
        created_at VARCHAR(32) NOT NULL,
        schema_version INT NOT NULL DEFAULT 1,
        version INT NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        KEY idx_developer_activity_created (created_at),
        KEY idx_developer_activity_actor (actor_id, created_at),
        KEY idx_developer_activity_role (actor_role, created_at),
        KEY idx_developer_activity_type (event_type, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }
  await schemaReadyPromise;
}

export async function insertDeveloperActivity(pool, events = []) {
  await ensureDeveloperActivitySchema(pool);
  if (!Array.isArray(events) || !events.length) {
    return { inserted: 0 };
  }
  for (const event of events) {
    await pool.query(
      `INSERT INTO developer_activity_events
        (id, event_type, actor_id, actor_role, actor_username, route_hash, module_id, action_label, details, created_at, schema_version, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
      [
        event.id,
        event.eventType,
        event.actorId,
        event.actorRole,
        event.actorUsername,
        event.routeHash,
        event.moduleId,
        event.actionLabel,
        event.details,
        event.createdAt,
      ]
    );
  }
  return { inserted: events.length };
}

export async function listDeveloperActivity(pool, filters = {}) {
  await ensureDeveloperActivitySchema(pool);
  const clauses = [];
  const params = [];
  const actorId = normalizeText(filters.actorId, 64);
  const actorRole = normalizeText(filters.actorRole, 32);
  const eventType = normalizeText(filters.eventType, 32);
  if (actorId) {
    clauses.push("actor_id = ?");
    params.push(actorId);
  }
  if (actorRole) {
    clauses.push("actor_role = ?");
    params.push(actorRole);
  }
  if (EVENT_TYPES.has(eventType)) {
    clauses.push("event_type = ?");
    params.push(eventType);
  }
  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = normalizeLimit(filters.limit);
  const rows = await pool.query(
    `SELECT id, event_type, actor_id, actor_role, actor_username, route_hash, module_id, action_label, details, created_at
       FROM developer_activity_events
       ${whereSql}
      ORDER BY created_at DESC
      LIMIT ?`,
    [...params, limit]
  );
  return Array.isArray(rows) ? rows.map(mapRow) : [];
}

export async function deleteDeveloperActivity(pool, id) {
  await ensureDeveloperActivitySchema(pool);
  const normalizedId = normalizeId(id);
  if (!normalizedId) {
    return { ok: false, found: false };
  }
  const rows = await pool.query(
    `SELECT id
       FROM developer_activity_events
      WHERE id = ?
        AND event_type = 'issue_report'
      LIMIT 1`,
    [normalizedId]
  );
  if (!Array.isArray(rows) || !rows.length) {
    return { ok: false, found: false };
  }
  await pool.query("DELETE FROM developer_activity_events WHERE id = ?", [normalizedId]);
  return { ok: true, found: true, id: normalizedId };
}
