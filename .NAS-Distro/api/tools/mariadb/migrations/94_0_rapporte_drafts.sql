-- Station 94: Rapporte drafts (trainer submit -> admin confirmation)

CREATE TABLE IF NOT EXISTS rapporte_drafts (
  id CHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'submitted',
  target_type VARCHAR(16) NOT NULL,
  target_id CHAR(36) NOT NULL,
  kunde_id CHAR(36) NOT NULL,
  text TEXT NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  author_id VARCHAR(64) NOT NULL DEFAULT '',
  author_role VARCHAR(32) NOT NULL DEFAULT '',
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_rapporte_status (status),
  KEY idx_rapporte_kunde (kunde_id),
  KEY idx_rapporte_target (target_type, target_id),
  CONSTRAINT fk_rapporte_kunde FOREIGN KEY (kunde_id) REFERENCES kunden(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
