-- Make zertifikate.kurs_id nullable so course deletion can preserve certificate snapshots.
ALTER TABLE zertifikate
  DROP FOREIGN KEY fk_zertifikate_kurs;

ALTER TABLE zertifikate
  MODIFY kurs_id CHAR(36) NULL;

ALTER TABLE zertifikate
  ADD CONSTRAINT fk_zertifikate_kurs
    FOREIGN KEY (kurs_id) REFERENCES kurse(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
