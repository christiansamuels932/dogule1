-- Station 93: Dashboard birthdays (global handled state) + Kunden Geburtstag

ALTER TABLE kunden
  ADD COLUMN IF NOT EXISTS geburtsdatum VARCHAR(32) NOT NULL DEFAULT '' AFTER nachname;

CREATE TABLE IF NOT EXISTS dashboard_birthdays_handled (
  id CHAR(36) NOT NULL,
  day VARCHAR(16) NOT NULL,
  entity_type VARCHAR(16) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  action VARCHAR(32) NOT NULL,
  author_id VARCHAR(64) NOT NULL DEFAULT '',
  author_role VARCHAR(32) NOT NULL DEFAULT '',
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY idx_birthdays_day_target (day, entity_type, entity_id),
  KEY idx_birthdays_day (day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

