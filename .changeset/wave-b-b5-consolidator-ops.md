---
'@graphorin/memory': patch
---

Consolidator operational promises now hold (audit 2026-07-04 Wave B, cluster B5).

- memory-consolidation-02: `onExceed: 'log'` (the shipped standard/full presets) finally WARNs - once per resource per budget window, via a pluggable `BudgetTrackerOptions.logger`. New `priceUsage` hook on `CreateConsolidatorOptions` / `createMemory({ consolidator })` threads a USD pricer into every phase, so `maxCostPerDay` can actually accumulate spend (previously every call priced at $0 and the USD ceiling was inert at every tier).
- memory-consolidation-03: `drainDlq` has a production caller - every `trigger(...)` dispatch first replays ready (backoff-gated) dead-letter batches, so failed slices no longer accumulate forever. A separate-process `graphorin consolidator drain` CLI was deliberately NOT added: replays require the provider, which lives in the server process (same IP-4 boundary the CLI already documents for set-tier/stop).
- memory-consolidation-04: at tiers without a deep phase (free/cheap defaults) pending CONFLICT-CHECK rows older than 7 days are expired as `admit` (the safe direction - the candidate stays live), so the queue cannot grow monotonically.
- memory-consolidation-05/06: the guide's phase table now describes what the phases actually do (light = zero-LLM forgetting; standard = extraction + reconcile + episodes; deep = conflict judge + reflection; no procedural extraction, no shared-tier promotion) plus a new "Making it run" subsection documenting that the library-mode consolidator is dormant until `start()` + trigger wiring.
- memory-consolidation-08: extraction is temporally anchored - each transcript line carries its ISO timestamp and the prompt states today's date with an instruction to resolve relative dates into absolute ones.
