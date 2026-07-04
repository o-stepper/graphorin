-- D3 migration 027: explicit retrieval-access counter on `facts`.
--
-- `strength` (capped at 2.0) is a lossy reinforcement proxy: after twenty
-- accesses it saturates and "used weekly for a year" is indistinguishable
-- from "used twice". The monotonic counter gives the salience composite a
-- true use-it-or-lose-it signal (retrieval-frequency reinforcement). It is
-- bookkeeping only: `markAccessed` increments it alongside the existing
-- strength bump, and nothing reads it until an operator opts into a
-- non-zero `accessReinforcement` salience weight - existing behaviour is
-- byte-identical at the default weight 0.

ALTER TABLE facts ADD COLUMN access_count INTEGER NOT NULL DEFAULT 0;
