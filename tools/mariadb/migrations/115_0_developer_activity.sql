USE dogule1;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
