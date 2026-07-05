---
'@graphorin/memory': patch
'@graphorin/eslint-plugin': patch
'@graphorin/server': patch
---

Release-pipeline and tarball-surface fixes (audit 2026-07-04 Wave E, cluster E2). `@graphorin/memory`'s `./conflict` subpath was runtime-EMPTY on npm 0.5.0 (`export { };` - preserveModules emitted the module without an explicit tsdown entry); it now ships all 8 runtime exports. `@graphorin/server`'s internal `workspace:*` peer dependencies are ranged (`workspace:>=0.5.0 <1.0.0`) so changesets stops escalating every sibling bump into a bogus MAJOR for the whole fixed group (the 1.0.0 landmine on the release bot's branch). `@graphorin/eslint-plugin` gains the `./package.json` self-export. All 27 per-package CHANGELOGs gain the 0.5.0 section (they were frozen at 0.1.0 inside every published tarball), and the `mvp-readiness` release gate now rejects a stale-CHANGELOG or unresolvable-exports release.
