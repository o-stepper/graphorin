# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes (current pre-release line) |

While Graphorin is on the 0.x line, only the latest minor receives security fixes. After 1.0, the latest two minor lines will be supported.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report privately through one of the following channels:

1. **Preferred — GitHub Security Advisories.** Open a private advisory at
   <https://github.com/o-stepper/graphorin/security/advisories/new>. GitHub Security Advisories handle the disclosure privately and let us coordinate a fix and release in one place.
2. **Email.** Send a report to the project maintainer at <step.oleksiy@gmail.com>. If you do not receive an acknowledgement within 48 hours, please fall back to a GitHub Security Advisory.

When reporting, please include:

- A clear description of the vulnerability and its impact.
- Steps to reproduce (proof-of-concept code or commands when applicable).
- The Graphorin version, Node.js version, and operating system you observed it on.
- Any relevant logs, traces, or packet captures (with sensitive information redacted).

## What to expect

- **Acknowledgement** within 48 hours of receipt.
- **Initial assessment** within 7 calendar days.
- A fix and coordinated disclosure timeline negotiated with the reporter.
- Public credit in the advisory unless the reporter prefers to remain anonymous.

## Privacy & telemetry

Graphorin performs **zero telemetry by default**. We make no anonymous version pings, no usage analytics, no auto-update calls, and no crash-report uploads. The only network calls Graphorin makes are those your code initiates explicitly. The repository ships a `pnpm run check-no-network` CI check that fails if a non-allowed network call is introduced.

## Cryptographic baselines

Graphorin's security primitives target the following baselines:

- **Server token verification:** HMAC-SHA256 with a deployment-wide pepper.
- **Encrypted-file secrets store:** Argon2id (parameters tuned per platform) for key derivation; AES-256-GCM for storage.
- **Audit log:** SQLite database with mandatory encryption-at-rest and a SHA-256 hash chain.
- **Skill packages:** Ed25519 signature verification for distributed skills.
- **Optional storage encryption-at-rest:** SQLCipher v4 via `better-sqlite3-multiple-ciphers`.

Implementation details and rationale ship with the corresponding `@graphorin/*` packages once they are released.

---

**Graphorin** · v0.2.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://graphorin.com> · <https://github.com/o-stepper/graphorin>
