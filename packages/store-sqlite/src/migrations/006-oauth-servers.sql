-- Phase 05 migration 006: OAuth server registrations + token metadata
-- (DEC-139 / ADR-033). Raw token material lives in the secret store;
-- this table only stores the `SecretRef` URIs that resolve them.

CREATE TABLE IF NOT EXISTS oauth_servers (
  id                            TEXT PRIMARY KEY,
  server_url                    TEXT NOT NULL,
  authorization_endpoint        TEXT,
  token_endpoint                TEXT,
  registration_endpoint         TEXT,
  revocation_endpoint           TEXT,
  device_authorization_endpoint TEXT,
  issuer                        TEXT,
  client_id                     TEXT NOT NULL,
  client_secret_ref             TEXT,
  access_token_ref              TEXT,
  refresh_token_ref             TEXT,
  id_token_ref                  TEXT,
  expires_at                    INTEGER,
  scope                         TEXT,
  redirect_uri                  TEXT,
  registered_via                TEXT,
  last_refreshed_at             INTEGER,
  last_refresh_error            TEXT,
  created_at                    INTEGER NOT NULL,
  updated_at                    INTEGER NOT NULL
);
