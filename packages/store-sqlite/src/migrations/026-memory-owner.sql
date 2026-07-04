-- D3 migration 026: principal / owner dimension on memories.
--
-- Adds a nullable `owner` column ('user' | 'agent' | 'shared') to the four
-- recall-bearing tables, separating WHO a memory belongs to from WHERE it
-- came from (`provenance`). The consolidator stamps 'agent' on synthesized
-- writes (extraction facts, formed episodes, reflection insights, induced
-- procedures); user-authored writes may stamp 'user'; NULL (every existing
-- row and any writer that does not care) is treated as 'user' at filter
-- time. Default reads apply NO owner filter, so recall is byte-identical
-- until a caller opts into a retrieval-time scope filter.

ALTER TABLE facts ADD COLUMN owner TEXT;
ALTER TABLE episodes ADD COLUMN owner TEXT;
ALTER TABLE rules ADD COLUMN owner TEXT;
ALTER TABLE insights ADD COLUMN owner TEXT;
