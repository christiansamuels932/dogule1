-- Apply with: mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 < tools/mariadb/migrations/113_0_subkurse.sql

CREATE TABLE IF NOT EXISTS sub_kurse (
  id CHAR(36) NOT NULL,
  kurs_id CHAR(36) NOT NULL,
  name VARCHAR(64) NOT NULL DEFAULT '',
  weekday VARCHAR(2) NOT NULL DEFAULT '',
  time VARCHAR(16) NOT NULL DEFAULT '',
  primary_trainer_id CHAR(36) NOT NULL,
  trainer_ids JSON NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_sub_kurse_kurs (kurs_id),
  KEY idx_sub_kurse_trainer (primary_trainer_id),
  CONSTRAINT fk_sub_kurse_kurs FOREIGN KEY (kurs_id) REFERENCES kurse(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_sub_kurse_trainer FOREIGN KEY (primary_trainer_id) REFERENCES trainer(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE kurs_teilnehmer
  DROP FOREIGN KEY fk_kurs_teilnehmer_kurs;

ALTER TABLE kurs_teilnehmer
  MODIFY kurs_id CHAR(36) NULL,
  ADD COLUMN sub_kurs_id CHAR(36) NULL,
  ADD COLUMN kurs_code_snapshot VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN kurs_title_snapshot VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN kurs_date_snapshot VARCHAR(32) NOT NULL DEFAULT '',
  ADD COLUMN kurs_ort_snapshot VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN trainer_label_snapshot VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN sub_kurs_name_snapshot VARCHAR(64) NOT NULL DEFAULT '',
  ADD KEY idx_kurs_teilnehmer_subkurs (sub_kurs_id);

ALTER TABLE kurs_teilnehmer
  ADD CONSTRAINT fk_kurs_teilnehmer_kurs FOREIGN KEY (kurs_id) REFERENCES kurse(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  ADD CONSTRAINT fk_kurs_teilnehmer_subkurs FOREIGN KEY (sub_kurs_id) REFERENCES sub_kurse(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
