-- Station 83.2 schema updates (non-destructive)
-- Apply with: mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 < tools/mariadb/migrations/83_2_zertifikate_schema.sql

ALTER TABLE kunden
  ADD COLUMN IF NOT EXISTS geschlecht VARCHAR(32) NULL;

ALTER TABLE trainer
  ADD COLUMN IF NOT EXISTS titel VARCHAR(128) NULL;

ALTER TABLE kurse
  ADD COLUMN IF NOT EXISTS ort VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS zertifikate (
  id CHAR(36) NOT NULL,
  code VARCHAR(64) NOT NULL DEFAULT '',
  kunde_id CHAR(36) NOT NULL,
  hund_id CHAR(36) NOT NULL,
  kurs_id CHAR(36) NOT NULL,
  kunde_name_snapshot VARCHAR(255) NOT NULL DEFAULT '',
  kunde_geschlecht_snapshot VARCHAR(32) NOT NULL DEFAULT '',
  hund_name_snapshot VARCHAR(255) NOT NULL DEFAULT '',
  hund_rasse_snapshot VARCHAR(255) NOT NULL DEFAULT '',
  hund_geschlecht_snapshot VARCHAR(32) NOT NULL DEFAULT '',
  kurs_titel_snapshot VARCHAR(255) NOT NULL DEFAULT '',
  kurs_datum_snapshot VARCHAR(32) NOT NULL DEFAULT '',
  kurs_ort_snapshot VARCHAR(255) NOT NULL DEFAULT '',
  ausstellungsdatum VARCHAR(32) NOT NULL DEFAULT '',
  trainer1_name_snapshot VARCHAR(255) NOT NULL DEFAULT '',
  trainer1_titel_snapshot VARCHAR(255) NOT NULL DEFAULT '',
  trainer2_name_snapshot VARCHAR(255) NULL,
  trainer2_titel_snapshot VARCHAR(255) NULL,
  bemerkungen TEXT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY idx_zertifikate_code (code),
  KEY idx_zertifikate_kunde (kunde_id),
  KEY idx_zertifikate_hund (hund_id),
  KEY idx_zertifikate_kurs (kurs_id),
  CONSTRAINT fk_zertifikate_kunde FOREIGN KEY (kunde_id) REFERENCES kunden(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_zertifikate_hund FOREIGN KEY (hund_id) REFERENCES hunde(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_zertifikate_kurs FOREIGN KEY (kurs_id) REFERENCES kurse(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
