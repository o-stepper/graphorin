---
'@graphorin/core': minor
'@graphorin/security': minor
'@graphorin/tools': minor
'@graphorin/agent': minor
---

Security hardening (audit 2026-07-04 Wave D, cluster D4) - architectural, deterministic layers.

- RFC-6962 Merkle transparency over the audit log (`@graphorin/security/audit`): tree head, inclusion + consistency proofs, and Ed25519-signed checkpoints, so anchoring a signed head out-of-band makes the trail tamper-resistant (a rewrite of a checkpointed prefix fails the consistency proof).
- Operator trust root for skills: `verifySkillSignature`/`installSkillFrom{Npm,Git}` gain `trustRoot` - a valid signature from a key absent from the root returns `valid: false` reason `'untrusted-key'`.
- Progent-style tool-argument policies + Rule-of-Two capability profiles (`@graphorin/security/policy`): `AgentConfig.toolPolicy` (forbid-before-allow, default-deny sensitive) + `ruleOfTwo` (drops a lethal-trifecta leg, forcing a read-only capability floor) enforced by a new `ExecutorOptions.argumentPolicy` hook (`capability_blocked`).
- Code-mode sandbox blocklist parity (`bridged-source.ts`) blocks the process-escape modules (child_process/vm/worker_threads/cluster/inspector) via the ESM resolve hook + a CJS `Module._load` patch.
