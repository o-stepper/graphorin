---
'@graphorin/security': patch
---

`checkEncryption` accepts a `bootstrapped` flag (thirteenth deep retest). When the caller reports an uninitialized host (`bootstrapped: false`, no `auditEnabled` knowledge), a missing audit-db binding is a `skip` with a bootstrap hint rather than a `fail` - `fail` stays reserved for configured or bootstrapped deployments where the binding is genuinely expected. An audit-enabled config always keeps the strict fail regardless of the flag.
