---
'@graphorin/proactive': minor
'@graphorin/agent': minor
---

New package `@graphorin/proactive` (the 29th): `createHeartbeat` - a checklist-driven periodic agent beat with empty-checklist skip (zero model calls), busy-deferral (retry cadence + give-up cap), active-hours windows (IANA tz, midnight-crossing), sentinel suppression (`HEARTBEAT_OK`) with a minimum-length noise floor, cheap isolated per-beat profile (fresh session, per-beat run budget, fail-closed model pin) and typed `notify` outcomes from the core escalation ladder. Agent surface additions: public `Agent.isBusy()` (the busy signal behind the deferral) and `AgentCallOptions.pinnedProvider` (per-run fail-closed model pin - wins over `prepareStep` and the preference ladder, never consults the fallback chain; `PreferredModelResolution.source` gains `'pinned'`).
