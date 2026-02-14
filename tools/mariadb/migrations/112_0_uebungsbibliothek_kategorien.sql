-- Add Kategorien for uebungsbibliothek and link entries
CREATE TABLE IF NOT EXISTS uebungsbibliothek_kategorien (
  id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  created_by VARCHAR(160) NOT NULL DEFAULT '',
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY idx_uebungsbibliothek_kategorien_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE uebungsbibliothek
  ADD COLUMN IF NOT EXISTS kategorie_id CHAR(36) DEFAULT NULL;

ALTER TABLE uebungsbibliothek
  ADD INDEX IF NOT EXISTS idx_uebungsbibliothek_kategorie_id (kategorie_id);
