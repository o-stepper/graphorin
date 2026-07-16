---
'@graphorin/cli': patch
---

Raw-token stdout parity for `token rotate` / `token rekey` (e2e 2026-07-13, CLI-01) - `token create` moved its one-time raw value to stdout in S-14b ("machine-consumable output"), but rotate and rekey kept printing theirs to stderr, so `TOKEN=$(graphorin token rotate <id>)` captured nothing. Both now print raw values to stdout while the log chatter stays on stderr, and the `stdoutPrint` test seam moves to `TokenCommonOptions`. Also `memory status` no longer promises "migration state" in its `--help` (CLI-02) - the command reports counts + active embedder.
