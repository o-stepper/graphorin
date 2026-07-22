# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.14.x   | Yes (current pre-release line) |

While Graphorin is on the 0.x line, only the latest minor receives security fixes. After 1.0, the latest two minor lines will be supported.

## Scope

In scope:

- The code of every published `@graphorin/*` package, including the standalone server, the CLI, and the wire protocol (`@graphorin/protocol`, REST/WebSocket/SSE surfaces).
- The deployment templates under `examples/docker`, `examples/k8s`, `examples/systemd`, and `examples/github-actions`.

Model-driven attacks (prompt injection and related classes) deserve their own note, because Graphorin layers two kinds of controls:

- **Deterministic controls** - the dataflow (taint) policy, the sandbox blocklist, sensitivity gates, the Progent/Rule-of-Two composition rules, scope enforcement, and the untrusted-content envelope. A bypass of a deterministic control **is in scope**: if content or capability crosses a boundary these mechanisms claim to close, that is a vulnerability.
- **Best-effort heuristics** - pattern catalogues, the verbatim-carry probe, and similar signals, already listed in the [Known limitations](https://docs.graphorin.com/guide/security#known-limitations) section of the security guide. Evasions of these are **welcome as reports** and inform catalogue updates, but are not treated as vulnerabilities by themselves: the documentation explicitly states they are signal, not gates.

When in doubt, report privately anyway - misclassifying in your favour costs nothing.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report privately through one of the following channels:

1. **Preferred - GitHub Security Advisories.** Open a private advisory at
   <https://github.com/o-stepper/graphorin/security/advisories/new>. GitHub Security Advisories handle the disclosure privately and let us coordinate a fix and release in one place. The advisory channel is encrypted in transit and access-controlled by GitHub, so no separate PGP exchange is needed to keep the report confidential; a maintainer PGP key may be published later as an additional option.
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

## Safe harbor

We consider good-faith security research on Graphorin authorized. If you make a genuine effort to follow this policy - testing against your own deployments and data, avoiding privacy violations, data destruction, and service degradation for others, and reporting privately with reasonable time to fix before disclosure - we will not pursue or support legal action against you for that research, and we will not report it as a violation of the GitHub Terms of Service. If a third party takes legal action against you for activity this policy authorizes, we will make it known that your actions were conducted in compliance with it. This clause does not authorize testing systems the maintainer does not own (for example npm's or GitHub's infrastructure).

## Privacy & telemetry

Graphorin performs **zero telemetry by default**. We make no anonymous version pings, no usage analytics, no auto-update calls, and no crash-report uploads. The only network calls Graphorin makes are those your code initiates explicitly. The repository ships a `pnpm run check-no-network` CI check that fails if a non-allowed network call is introduced.

## Cryptographic baselines

Graphorin's security primitives target the following baselines:

- **Server token verification:** HMAC-SHA256 with a deployment-wide pepper.
- **Encrypted-file secrets store:** Argon2id (parameters tuned per platform) for key derivation; AES-256-GCM for storage.
- **Audit log:** SQLite database with mandatory encryption-at-rest and a SHA-256 hash chain.
- **Skill packages:** Ed25519 signature verification for distributed skills.
- **Optional storage encryption-at-rest:** SQLCipher v4 via `better-sqlite3-multiple-ciphers`.

Implementation details and rationale are published in the [security guide](https://docs.graphorin.com/guide/security), including its [Known limitations](https://docs.graphorin.com/guide/security#known-limitations) section, and in the `@graphorin/security` package README.

---

**Graphorin** · v0.14.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://graphorin.com> · <https://github.com/o-stepper/graphorin>
