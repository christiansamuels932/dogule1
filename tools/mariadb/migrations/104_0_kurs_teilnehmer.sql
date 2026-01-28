-- Apply with: mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 < tools/mariadb/migrations/104_0_kurs_teilnehmer.sql

CREATE TABLE IF NOT EXISTS kurs_teilnehmer (
  id CHAR(36) NOT NULL,
  kurs_id CHAR(36) NOT NULL,
  kunde_id CHAR(36) NOT NULL,
  hund_id CHAR(36) NOT NULL,
  kunde_nachname VARCHAR(128) NOT NULL DEFAULT '',
  kunde_vorname VARCHAR(128) NOT NULL DEFAULT '',
  kunde_ort VARCHAR(255) NOT NULL DEFAULT '',
  hund_name VARCHAR(128) NOT NULL DEFAULT '',
  start_datum VARCHAR(32) NOT NULL DEFAULT '',
  created_at VARCHAR(32) NOT NULL,
  created_by CHAR(36) NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_kurs_teilnehmer_kurs (kurs_id),
  KEY idx_kurs_teilnehmer_kunde (kunde_id),
  KEY idx_kurs_teilnehmer_hund (hund_id),
  CONSTRAINT fk_kurs_teilnehmer_kurs FOREIGN KEY (kurs_id) REFERENCES kurse(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_kurs_teilnehmer_kunde FOREIGN KEY (kunde_id) REFERENCES kunden(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_kurs_teilnehmer_hund FOREIGN KEY (hund_id) REFERENCES hunde(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
