---
"@graphorin/cli": patch
---

fix(cli): OPERATOR-01 `triggers prune` requires --before

The prune help promised a bare invocation would "drop every disabled row", but
the epoch-0 default cutoff made it a no-op for every dated row. `--before` is
now a required option (mirroring `audit prune` / `traces prune`) and the help
text describes the real behaviour.
