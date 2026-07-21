---
'@graphorin/store-sqlite': patch
---

Twelfth external deep retest, P2: the `better-sqlite3` peer range now accepts v13 (`^12.9.0 || ^13.0.0`) - a fresh `pnpm add better-sqlite3` resolves 13.x, which previously left a green install with an unmet-peer warning. The whole workspace tests against 13.0.1. The README also documents the pnpm 10 build-approval step (`onlyBuiltDependencies` + rebuild) right next to the install command, so the npm package page explains the `Could not locate bindings` failure mode instead of leaving it to the installation guide alone.
