---
"@graphorin/cli": patch
---

fix(cli): MEMORY-CL-02 `memory review --promote` emits a JSON error on failure

`review --promote <bad-id> --json` exited 1 with empty stdout, so `--json`
consumers got no structured payload. The failure paths (not-quarantined and
injection-refused) now carry an `error { code, message }` on the result and emit
it through the JSON sink, matching the `secrets get` miss contract.
