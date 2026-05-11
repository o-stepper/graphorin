-- Phase 05 migration 005: server token records. Hashes are HMAC-SHA256
-- against the server pepper (DEC-122 / ADR-027). Raw tokens are never
-- persisted — the runtime carries them via `SecretValue`.

CREATE TABLE IF NOT EXISTS auth_tokens (
  id            TEXT PRIMARY KEY,
  hash_hex      TEXT NOT NULL,
  label         TEXT,
  scopes_json   TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER,
  revoked_at    INTEGER,
  last_used_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash
  ON auth_tokens(hash_hex);
