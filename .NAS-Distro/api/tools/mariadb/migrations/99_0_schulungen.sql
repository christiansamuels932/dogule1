-- Station 99: Schulungen module
CREATE TABLE IF NOT EXISTS schulungen (
  id CHAR(36) NOT NULL,
  title VARCHAR(160) NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  blocks TEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_schulungen_occurred (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
