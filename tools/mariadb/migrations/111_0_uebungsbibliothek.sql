-- Create uebungsbibliothek table
CREATE TABLE IF NOT EXISTS uebungsbibliothek (
  id CHAR(36) NOT NULL,
  title VARCHAR(160) NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  blocks TEXT NOT NULL,
  created_by VARCHAR(160) NOT NULL DEFAULT '',
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_uebungsbibliothek_occurred (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
