---
'@graphorin/store-sqlite': patch
---

Twelfth external deep retest, P2: the `better-sqlite3` peer range now accepts v13 (`^12.9.0 || ^13.0.0`) - a fresh `pnpm add better-sqlite3` resolves 13.x, which previously left a green install with an unmet-peer warning. API compatibility is validated by the full storage/memory/server/workflow/sessions suites against 13.0.1. The workspace default stays 12.x for now: better-sqlite3 13.0.x dropped `prebuild-install` in favour of prebuilds bundled in the tarball but left `binding.gyp` at the package root, so package managers still run the implicit `node-gyp rebuild` and the install needs a C++ toolchain (Windows CI runners have none node-gyp accepts). The README also documents the pnpm 10 build-approval step (`onlyBuiltDependencies` + rebuild) right next to the install command, so the npm package page explains the `Could not locate bindings` failure mode instead of leaving it to the installation guide alone.
