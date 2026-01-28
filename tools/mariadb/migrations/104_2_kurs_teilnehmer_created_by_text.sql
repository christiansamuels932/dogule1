-- Apply with: mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 < tools/mariadb/migrations/104_2_kurs_teilnehmer_created_by_text.sql

ALTER TABLE kurs_teilnehmer
  MODIFY COLUMN created_by TEXT NULL;
