-- CS-9 migration 022: make session message sequencing collision-proof.
-- `SessionMemoryStore.push` computed `sequence` as MAX(sequence)+1 with no
-- uniqueness constraint, so two processes (server + CLI) racing on the same
-- session could mint duplicate sequences and silently interleave history.
-- A UNIQUE index turns that race into a loud constraint failure; it also
-- subsumes the prior non-unique `idx_session_messages_session` (same columns,
-- same ORDER BY sequence query plan), which is dropped to avoid redundancy.
DROP INDEX IF EXISTS idx_session_messages_session;
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_messages_session_sequence
  ON session_messages(scope_session_id, sequence);
