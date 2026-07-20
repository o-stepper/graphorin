---
'@graphorin/server': patch
'@graphorin/cli': patch
---

`graphorin start` can now serve the full domain surface. A new `app` config field points at a compose module; the launcher imports it, calls the default-exported factory (typed as `GraphorinAppFactory` in `@graphorin/server`, with `GraphorinAppContext` / `GraphorinAppBag` alongside) and spreads the returned adapter bag into `createServer(...)`, mounting sessions / memory / agents / workflows instead of the bare infrastructure daemon. The bag's optional `close` hook runs after `server.stop()` on shutdown. `graphorin init --app` scaffolds a working `graphorin.app.mjs` (SQLite store + memory + sessions REST adapters over the configured storage) and wires the config field; the scaffold is boot-tested in CI.
