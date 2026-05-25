-- X-1 migration 015: per-fact importance for multi-signal forgetting.
--
-- P1-2 added auto-importance scoring to *episodes* and deferred the
-- fact-level column to X-1 (multi-signal forgetting / capacity-bounded
-- eviction). This adds it. `importance` is an optional salience hint in
-- [0, 1]: the consolidator's light-phase salience score folds it into
-- the Ebbinghaus retention curve (alongside access frequency and a
-- P1-4 security-risk negative term) to decide what to archive first
-- when storage is capacity-bounded.
--
-- It is a *soft* signal — NULL means "unscored" and is treated as the
-- neutral midpoint (0.5), so existing rows behave exactly as before.
-- Importance never gates recall and never forces retention; this is
-- cost / staleness control, not an accuracy lever.

ALTER TABLE facts ADD COLUMN importance REAL;
