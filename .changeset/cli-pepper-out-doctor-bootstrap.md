---
'@graphorin/cli': patch
---

CI-safe init pepper handling + bootstrap-aware doctor (thirteenth deep retest). `graphorin init --pepper-out <path>` writes the server pepper hex to a `0600` file (never overwrites) instead of printing it, so non-interactive bootstrap logs (CI, image builds) stop retaining the key material behind every token HMAC; the next-steps hint walks the file-based `secrets set --from-stdin` path and tells the operator to delete the file. `graphorin doctor` on an UNINITIALIZED host (no `~/.graphorin`, no `--config`) now reports the `audit-db` encryption check as `skip` with an init hint instead of a hard `fail` - nothing could have registered an audit binding before bootstrap; configured or bootstrapped deployments keep the strict fail.
