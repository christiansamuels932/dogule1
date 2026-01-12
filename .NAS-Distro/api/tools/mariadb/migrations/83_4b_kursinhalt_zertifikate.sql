-- Apply with: mariadb --protocol=socket --socket /run/mysqld/mysqld.sock -N -B dogule1 < tools/mariadb/migrations/83_4b_kursinhalt_zertifikate.sql

ALTER TABLE kurse
  ADD COLUMN inhalt_theorie TEXT NULL,
  ADD COLUMN inhalt_praxis TEXT NULL;

ALTER TABLE zertifikate
  ADD COLUMN kurs_inhalt_theorie_snapshot TEXT NULL,
  ADD COLUMN kurs_inhalt_praxis_snapshot TEXT NULL;
