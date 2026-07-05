-- W-065 migration 031: drop the dead trigger_fire_log table.
--
-- Created by migration 007 and never written or read by any code since
-- (verified by repository-wide search) - the trigger runtime records
-- fires in trigger_state. Dead schema invites dead tooling; drop it.
-- Precedent: migration 023 (drop of the dead facts.hash column). The
-- append-only migration discipline is preserved: 007 is untouched, this
-- is a new forward migration. Its index falls with the table.

DROP TABLE IF EXISTS trigger_fire_log;
