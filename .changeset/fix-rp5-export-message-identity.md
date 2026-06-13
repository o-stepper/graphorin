---
'@graphorin/sessions': minor
'@graphorin/core': minor
'@graphorin/store-sqlite': minor
'@graphorin/memory': patch
---

fix(sessions): preserve message identity + scope agents on export (RP-5)

Session export fabricated every message's identity — a fresh `idFactory('msg')`
id and `createdAt` set to the export wall-clock — because the core `Message`
type carries no id/timestamp, so a round-trip rewrote identity and chronology
(only `sequence` survived). It also wrote `store.listAgents()` in full, leaking
the metadata of agents unrelated to the session into every export despite the
schema documenting "one per agent referenced".

- New optional `SessionMemoryStore.listWithMetadata` (core) returns each message
  with its stored `messageId` / `sequence` / `createdAt`; `@graphorin/store-sqlite`
  implements it over the `session_messages` row, and `@graphorin/memory.session`
  delegates to it (falling back to fabricated ids only for stores that lack it).
- `Session.export` uses it so message identity + chronology round-trip, and
  filters exported agents to the session's primary agent plus any agent that
  authored a message or took part in a handoff.

Red-first: an export test asserts stored message ids/`createdAt` survive (not
the export wall-clock) and that an unreferenced agent is excluded; a real-sqlite
test asserts `listWithMetadata` surfaces the stored id/sequence/createdAt.
