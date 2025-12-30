-- Dogule1 MariaDB schema (Station 74)
-- ASCII-only; timestamps stored as ISO-8601 strings for UI parity.

CREATE DATABASE IF NOT EXISTS dogule1;
USE dogule1;

CREATE TABLE IF NOT EXISTS kunden (
  id CHAR(36) NOT NULL,
  legacy_id VARCHAR(64) NULL,
  code VARCHAR(64) NOT NULL DEFAULT '',
  vorname VARCHAR(128) NOT NULL DEFAULT '',
  nachname VARCHAR(128) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  telefon VARCHAR(64) NOT NULL DEFAULT '',
  adresse VARCHAR(255) NOT NULL DEFAULT '',
  status VARCHAR(32) NOT NULL DEFAULT '',
  ausweis_id VARCHAR(64) NOT NULL DEFAULT '',
  foto_url TEXT NOT NULL,
  begleitpersonen JSON NULL,
  notizen TEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_kunden_name (nachname, vorname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hunde (
  id CHAR(36) NOT NULL,
  code VARCHAR(64) NOT NULL DEFAULT '',
  name VARCHAR(128) NOT NULL DEFAULT '',
  rufname VARCHAR(128) NOT NULL DEFAULT '',
  rasse VARCHAR(128) NOT NULL DEFAULT '',
  geschlecht VARCHAR(32) NOT NULL DEFAULT '',
  status VARCHAR(32) NOT NULL DEFAULT '',
  geburtsdatum VARCHAR(32) NOT NULL DEFAULT '',
  gewicht_kg DECIMAL(8,2) NULL,
  groesse_cm DECIMAL(8,2) NULL,
  kunden_id CHAR(36) NOT NULL,
  trainingsziele TEXT NOT NULL,
  notizen TEXT NOT NULL,
  felltyp VARCHAR(64) NOT NULL DEFAULT '',
  kastriert TINYINT(1) NULL,
  fellfarbe VARCHAR(64) NOT NULL DEFAULT '',
  groesse_typ VARCHAR(16) NOT NULL DEFAULT '',
  herkunft VARCHAR(128) NOT NULL DEFAULT '',
  chip_nummer VARCHAR(128) NOT NULL DEFAULT '',
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_hunde_kunden (kunden_id),
  CONSTRAINT fk_hunde_kunden FOREIGN KEY (kunden_id) REFERENCES kunden(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS trainer (
  id CHAR(36) NOT NULL,
  code VARCHAR(64) NOT NULL DEFAULT '',
  name VARCHAR(128) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  telefon VARCHAR(64) NOT NULL DEFAULT '',
  notizen TEXT NOT NULL,
  verfuegbarkeiten JSON NULL,
  ausbildungshistorie TEXT NOT NULL,
  stundenerfassung TEXT NOT NULL,
  lohnabrechnung TEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_trainer_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kurse (
  id CHAR(36) NOT NULL,
  code VARCHAR(64) NOT NULL DEFAULT '',
  title VARCHAR(255) NOT NULL DEFAULT '',
  trainer_name VARCHAR(128) NOT NULL DEFAULT '',
  trainer_id CHAR(36) NOT NULL,
  date VARCHAR(32) NOT NULL DEFAULT '',
  start_time VARCHAR(16) NOT NULL DEFAULT '',
  end_time VARCHAR(16) NOT NULL DEFAULT '',
  location VARCHAR(255) NOT NULL DEFAULT '',
  status VARCHAR(32) NOT NULL DEFAULT '',
  capacity INT NOT NULL DEFAULT 0,
  booked_count INT NOT NULL DEFAULT 0,
  level VARCHAR(64) NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT NOT NULL,
  hund_ids JSON NULL,
  kunden_ids JSON NULL,
  outlook_event_id VARCHAR(128) NOT NULL DEFAULT '',
  outlook_date VARCHAR(32) NOT NULL DEFAULT '',
  outlook_start VARCHAR(32) NOT NULL DEFAULT '',
  outlook_end VARCHAR(32) NOT NULL DEFAULT '',
  outlook_location VARCHAR(255) NOT NULL DEFAULT '',
  inventory_flag TINYINT(1) NOT NULL DEFAULT 0,
  portfolio_flag TINYINT(1) NOT NULL DEFAULT 0,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_kurse_trainer (trainer_id),
  CONSTRAINT fk_kurse_trainer FOREIGN KEY (trainer_id) REFERENCES trainer(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kalender (
  id CHAR(36) NOT NULL,
  code VARCHAR(64) NOT NULL DEFAULT '',
  title VARCHAR(255) NOT NULL DEFAULT '',
  start_at VARCHAR(32) NOT NULL DEFAULT '',
  end_at VARCHAR(32) NOT NULL DEFAULT '',
  location VARCHAR(255) NOT NULL DEFAULT '',
  notes TEXT NOT NULL,
  kurs_id CHAR(36) NULL,
  trainer_id CHAR(36) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_kalender_kurs (kurs_id),
  KEY idx_kalender_trainer (trainer_id),
  CONSTRAINT fk_kalender_kurs FOREIGN KEY (kurs_id) REFERENCES kurse(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_kalender_trainer FOREIGN KEY (trainer_id) REFERENCES trainer(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS zahlungen (
  id CHAR(36) NOT NULL,
  code VARCHAR(64) NOT NULL DEFAULT '',
  kunde_id CHAR(36) NOT NULL,
  kurs_id CHAR(36) NULL,
  trainer_id CHAR(36) NULL,
  typ VARCHAR(32) NOT NULL DEFAULT '',
  betrag DECIMAL(10,2) NOT NULL DEFAULT 0,
  datum VARCHAR(32) NOT NULL DEFAULT '',
  beschreibung TEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_zahlungen_kunde (kunde_id),
  KEY idx_zahlungen_kurs (kurs_id),
  KEY idx_zahlungen_trainer (trainer_id),
  CONSTRAINT fk_zahlungen_kunde FOREIGN KEY (kunde_id) REFERENCES kunden(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_zahlungen_kurs FOREIGN KEY (kurs_id) REFERENCES kurse(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_zahlungen_trainer FOREIGN KEY (trainer_id) REFERENCES trainer(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS waren (
  id CHAR(36) NOT NULL,
  code VARCHAR(64) NOT NULL DEFAULT '',
  kunden_id CHAR(36) NOT NULL,
  produkt_name VARCHAR(255) NOT NULL DEFAULT '',
  menge INT NOT NULL DEFAULT 1,
  preis DECIMAL(10,2) NOT NULL DEFAULT 0,
  datum VARCHAR(32) NOT NULL DEFAULT '',
  beschreibung TEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_waren_kunde (kunden_id),
  CONSTRAINT fk_waren_kunde FOREIGN KEY (kunden_id) REFERENCES kunden(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
