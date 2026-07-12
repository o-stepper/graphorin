-- Index-version hygiene (item 10 step 1): record the write-path
-- contextualization mode the vector index was built with, so switching
-- `contextualRetrieval` invalidates the index exactly like a model or
-- configHash change would. NULL marks a legacy row; the repository
-- adopts the current mode on the next registerOrReturn instead of
-- failing existing databases retroactively.
ALTER TABLE embedding_meta ADD COLUMN index_mode TEXT;
