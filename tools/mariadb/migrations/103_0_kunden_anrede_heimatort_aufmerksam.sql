-- Station 103: Kunden Anrede + Heimatort + Aufmerksam durch
ALTER TABLE kunden
  ADD COLUMN IF NOT EXISTS anrede VARCHAR(32) NOT NULL DEFAULT '' AFTER nachname,
  ADD COLUMN IF NOT EXISTS heimatort VARCHAR(255) NOT NULL DEFAULT '' AFTER ort,
  ADD COLUMN IF NOT EXISTS aufmerksam_durch VARCHAR(255) NOT NULL DEFAULT '' AFTER heimatort;
