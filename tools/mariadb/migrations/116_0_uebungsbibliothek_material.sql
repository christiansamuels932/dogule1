-- Add Material uploads for Uebungsbibliothek
CREATE TABLE IF NOT EXISTS uebungsbibliothek_material (
  id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  material_type VARCHAR(32) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL DEFAULT '',
  mime_type VARCHAR(128) NOT NULL DEFAULT '',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  url VARCHAR(512) NOT NULL,
  created_by VARCHAR(160) NOT NULL DEFAULT '',
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_uebungsbibliothek_material_created (created_at),
  KEY idx_uebungsbibliothek_material_type (material_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
