-- Channel pairing persistence (bot-adoption B1.4): backs the default
-- 'pairing' access policy of the channel gateway. One pending request
-- per peer (PK on the identity triple, upsert replaces); codes are
-- unique per channel so operator approval by (channel_id, code) is
-- unambiguous. Expiry POLICY lives in the access controller, which
-- injects its clock; rows only carry the timestamps.

CREATE TABLE IF NOT EXISTS channel_pairing_requests (
  channel_id  TEXT NOT NULL,
  account_id  TEXT NOT NULL,
  peer_id     TEXT NOT NULL,
  code        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  PRIMARY KEY (channel_id, account_id, peer_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_pairing_requests_code
  ON channel_pairing_requests (channel_id, code);

CREATE TABLE IF NOT EXISTS channel_paired_peers (
  channel_id  TEXT NOT NULL,
  account_id  TEXT NOT NULL,
  peer_id     TEXT NOT NULL,
  paired_at   INTEGER NOT NULL,
  PRIMARY KEY (channel_id, account_id, peer_id)
);
