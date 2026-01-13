-- Add kurs-specific certificate background reference.
ALTER TABLE kurse
  ADD COLUMN zertifikat_hintergrund VARCHAR(255) DEFAULT NULL;
