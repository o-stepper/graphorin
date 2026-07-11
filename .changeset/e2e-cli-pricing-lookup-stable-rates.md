---
'@graphorin/cli': patch
---

Serialize per-token USD rates in `graphorin pricing lookup --json` in a stable decimal form (S-05): the snapshot stores rates as `x / 1_000_000` doubles, so the $0.10/Mtok cache-read rate printed as `1.0000000000000001e-7`. The JSON document now re-quantizes each rate to the shortest decimal whose parsed value stays within 1e-15 relative of the stored double (it prints as `1e-7`), presentation only - `lookupPrice` / `calculateCost` and the command's return value keep the raw doubles used in cost math. Adds a regression test for the `claude-haiku-4-5` entry plus a sweep asserting clean, value-identical serialization for every bundled snapshot entry.
