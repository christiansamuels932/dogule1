-- Add created_by to schulungen
ALTER TABLE schulungen
  ADD COLUMN created_by VARCHAR(160) NOT NULL DEFAULT ''
  AFTER blocks;
