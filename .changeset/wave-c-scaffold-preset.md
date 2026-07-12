---
'@graphorin/agent': minor
'@graphorin/tools': minor
---

Scaffold preset (decision D-10): `createAgent({ scaffold: 'minimal' | 'full' })`, default `'full'` (pre-C6 behaviour). `'minimal'` is the cheap-run posture: instructions-only system prompt, defer-loading by default via the new registry-level `deferLoadingByDefault` option (`createToolRegistry` / `normaliseTool`; per-tool `defer_loading: false` still wins and `built-in` registrations stay eager), no plan tool / recitation - contradictory explicit flags are fail-fast config errors, and security layers are untouched. New "Minimal profile" guide page covers the preset, the lean install path and the README-on-demand skill pattern over lazy `Skill.resources`.
