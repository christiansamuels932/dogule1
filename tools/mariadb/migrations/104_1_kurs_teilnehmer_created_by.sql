-- Apply with: mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 < tools/mariadb/migrations/104_1_kurs_teilnehmer_created_by.sql

ALTER TABLE kurs_teilnehmer
  MODIFY COLUMN created_by VARCHAR(128) NULL;
