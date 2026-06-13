---
'@graphorin/skills': minor
---

fix(skills): close five skills-surface drifts (RP-11)

Five places where the skills surface advertised behaviour it did not deliver:

- **(a)** `ActivatedSkill.tools` was hardcoded to `[]` even on eager
  activation, discarding the skill's pre-built `Tool[]`. The registry now
  accepts an optional `stampTool` function (`SkillToolStamper`); when wired
  (the agent runtime does), `activate()` stamps each tool into a
  `ResolvedTool` and surfaces it. Without it, no tools are surfaced — the
  runtime resolves them itself.
- **(b)** An invalid `runtime-compat` produced an *error*-severity diagnostic
  but the load still passed, and `SkillRuntimeCompatError` /
  `SkillFrontmatterConflictError` were only ever constructed in tests. Under
  `conflictPolicy: 'error'` an error-severity diagnostic now fails the load
  through the matching typed exception; the default `'warn'` keeps it a
  diagnostic.
- **(c)** `loadSkills` documented "concurrently" but ran a sequential
  `for`-await. It now loads sources in parallel (order-preserving).
- **(d)** A present-but-unparseable `graphorin-tools` / `handoff-input-filter`
  value was silently swallowed by `?? []`. The loader now surfaces an
  `invalid-field-type` diagnostic, as the parser contracts mandate.
- **(e)** `register()` throws on a name collision with no upgrade path. A new
  `SkillRegistry.replace(skill)` upserts by name for hot-reload.

Red-first tests cover each of (a)–(e); every exported skills error now has a
construction site outside the test suite.
