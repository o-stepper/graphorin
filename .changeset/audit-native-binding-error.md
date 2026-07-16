---
'@graphorin/store-sqlite': minor
---

Actionable native-binding failure (external audit 2026-07-16, P1-3). pnpm 10+ skips dependency build scripts unless approved, so a consumer install can look successful while `better-sqlite3`'s prebuilt binary was never downloaded - the first database open then died with a raw `bindings.js` stack. Both driver loaders (default and the cipher peer) now detect that failure and throw the new typed `SqliteNativeBindingError` naming the actual fix: add `"pnpm": { "onlyBuiltDependencies": ["better-sqlite3", "sqlite-vec"] }` to the application package.json (or run `pnpm approve-builds`) and reinstall. The cipher path previously misreported this case as a missing peer. The installation guide gains a matching "Native modules and pnpm 10" section, and a new scheduled consumer-install smoke (`scripts/smoke-consumer.mjs`) replays the documented recipe against the published packages weekly.
