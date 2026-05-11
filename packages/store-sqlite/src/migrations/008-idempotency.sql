-- Phase 05 migration 008: REST `Idempotency-Key` cache (DEC-142 /
-- ADR-036; IETF idempotency-header draft-07). A row stores the
-- request fingerprint + response payload until `expires_at`; a repeat
-- request with the same key returns the cached response verbatim.

CREATE TABLE IF NOT EXISTS idempotency_records (
  key             TEXT PRIMARY KEY,
  request_hash    TEXT NOT NULL,
  status_code     INTEGER NOT NULL,
  response_json   TEXT NOT NULL,
  response_headers_json TEXT,
  scope           TEXT,
  created_at      INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires
  ON idempotency_records(expires_at);
