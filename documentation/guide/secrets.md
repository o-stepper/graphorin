---
title: Secrets
description: SecretValue wrapper, SecretRef URI scheme, OS keychain integration, optional encryption-at-rest, and the per-tool secrets ACL.
---

# Secrets

Secrets are a **first-class concern** in Graphorin. The framework gives you:

- A `SecretValue` wrapper that cannot be accidentally logged, serialised, or displayed.
- A `SecretRef` URI scheme that decouples your application code from the underlying vault.
- OS keychain integration via [`@napi-rs/keyring`](https://github.com/napi-rs/node-keyring) (MIT).
- An optional encrypted-file store via [`@node-rs/argon2`](https://github.com/napi-rs/node-rs) + AES-256-GCM.
- Per-tool secrets ACL scoping that flows through the agent runtime.
- An optional reference adapter for the [1Password CLI](https://developer.1password.com/docs/cli/get-started/) in `@graphorin/secret-1password`.

## `SecretValue`

```ts
import { SecretValue } from '@graphorin/security';

const apiKey = SecretValue.fromString('sk-...redacted...');

// Logging or serialising a SecretValue prints a fixed redaction marker:
console.log(apiKey);
console.log(JSON.stringify({ apiKey })); // { "apiKey": "<redacted SecretValue>" }

// `length` is safe to log; the raw bytes are kept on a private buffer.
console.log(apiKey.length);

// Reading the raw value is explicit and audited.
const raw = apiKey.reveal();      // returns the UTF-8 string
// or
const raw2 = apiKey.unwrap();     // alias for reveal()

// When you no longer need the secret, dispose() zero-fills the buffer.
apiKey.dispose();
```

Two static helpers cover the common construction paths:

- `SecretValue.fromString(raw, opts?)` — wrap a UTF-8 string at the I/O boundary.
- `SecretValue.fromBuffer(buf, opts?)` — wrap a `Buffer` (defensively copied).

`SecretValue` is also exposed in `@graphorin/core` as an **interface** (the contract), so any package that types a parameter as `SecretValue` depends only on `@graphorin/core` — the concrete class lives in `@graphorin/security`.

## `SecretRef` URI scheme

A `SecretRef` is a URI of the form `<scheme>:<scheme-specific-part>` that names where a secret lives without binding the application to a specific vault. The default registry ships seven schemes; custom resolvers can register additional ones.

| URI | Resolves to |
|---|---|
| `env:OPENAI_API_KEY` | `process.env.OPENAI_API_KEY`. Optional `?default=...` fallback. |
| `keyring:openai_api_key?service=graphorin` | OS keychain entry (account, optional service prefix). Requires the `@napi-rs/keyring` peer. |
| `file:///abs/path/to/secret` | File on disk. Optional `?encoding=`, `?warnOnPermissions=0`. |
| `encrypted-file:/abs/path#key-name` | Entry inside an Argon2id + AES-256-GCM file. |
| `vault:foo/bar` | Lookup through a registered `MemorySecretsStore` (operator-controlled). |
| `ref:foo` | Indirection through the active `SecretsStore`. |
| `literal:value` | Inline literal (off by default; opt in explicitly per environment). |
| `op://<vault>/<item>/<field>` | 1Password CLI reference, via `@graphorin/secret-1password`. |

```ts
import { parseSecretRef, resolveSecret } from '@graphorin/security';

const parsed = parseSecretRef('keyring:openai_api_key?service=graphorin');
const value = await resolveSecret(parsed);
console.log(value.length); // safe; never reveals
const raw = value.reveal();
```

`parseSecretRef(uri)` strict-parses the URI and throws a typed `SecretRefParseError` on malformed input. `resolveSecret(refOrUri)` walks the resolver registry and returns a `SecretValue`. Resolvers register a single `scheme` and own the parsing of their scheme-specific part — see `registerResolver(...)` for plugging in your own.

## Per-tool secrets ACL

Tools never see the application's full secret scope. The agent runtime calls `withChildToolSecretsContext({...})` from `@graphorin/security/secrets` to narrow the visible refs **per tool execution**:

```ts
import { resolveSecret, withChildToolSecretsContext, type SecretValue } from '@graphorin/security';
import { tool } from '@graphorin/tools';
import { z } from 'zod';

const refundSchema = z.object({ orderId: z.string(), amountUsd: z.number() });
const receiptSchema = z.object({ receiptId: z.string() });

// your integration
declare function callPaymentApi(
  input: z.infer<typeof refundSchema>,
  apiKey: SecretValue,
): Promise<z.infer<typeof receiptSchema>>;

const refundTool = tool({
  name: 'refund.create',
  description: 'Issue a refund for a previously placed order.',
  inputSchema: refundSchema,
  outputSchema: receiptSchema,
  async execute(input, ctx) {
    return withChildToolSecretsContext(
      { toolName: 'refund.create', secretsAllowed: ['keyring:payments_api_key'] },
      async () => {
        const apiKey = await resolveSecret('keyring:payments_api_key');
        return callPaymentApi(input, apiKey);
      },
    );
  },
});
```

A tool that asks for a secret outside its declared ACL fails closed with `SecretAccessDeniedError` and writes one row to the audit log.

## Sub-agent inheritance

`agent.toTool({ secretsInheritance, inheritSecrets })` enforces the principle of least authority across multi-agent boundaries:

| `secretsInheritance` | Behaviour |
|---|---|
| `'inherit-allowlist'` (default) | Sub-agent inherits only the secret refs explicitly listed in `inheritSecrets`. |
| `'forward-explicit'` | Sub-agent receives only the refs forwarded for this specific call. |
| `'isolated'` | Sub-agent receives no inherited secrets. |

Every transition writes one audit row.

## OS keychain

`KeyringSecretsStore` is backed by the OS keychain — Keychain on macOS, Credential Manager on Windows, libsecret-compatible services on Linux — through the optional `@napi-rs/keyring` (MIT) peer dependency.

```bash
graphorin secrets list
graphorin secrets get openai_api_key
graphorin secrets set openai_api_key --from-stdin
graphorin secrets rotate openai_api_key --new-value …
graphorin secrets delete openai_api_key
graphorin secrets ref keyring:openai_api_key?service=graphorin
```

`graphorin secrets get` prints a redaction marker by default; pass `--reveal` to print the raw value (audited). Use `--secrets-source <auto|keyring|encrypted-file|env>` and `--strict-secrets` to control which `SecretsStore` the CLI activates.

## Encrypted-file store

When the OS keychain is not available (servers, containers, headless CI), `EncryptedFileSecretsStore` provides the same API on top of:

- **Argon2id** (`@node-rs/argon2`, MIT) for key derivation;
- **AES-256-GCM** for ciphertext;
- A versioned on-disk format with integrity tags.

The store is selected through the `--secrets-source encrypted-file` flag, the matching `secrets.source` config field, or the `createSecretsStore({ kind: 'encrypted-file', ... })` factory. The master passphrase resolves through a `SecretRef` (typically `env:GRAPHORIN_MASTER_PASSPHRASE` or `file:///path/to/passphrase`) so it is never embedded in plain config.

**Durability and recovery.** The store treats the bundle as precious data:

- **Fail-loud on a wrong passphrase or corruption.** A read that fails because the passphrase is wrong (or rotated), or because the bundle is tampered, truncated, or malformed, **throws** — it never silently re-initialises an empty bundle. A fresh empty bundle is created only when the file genuinely does not exist yet (`ENOENT`). This means a mistyped/rotated `GRAPHORIN_MASTER_PASSPHRASE` surfaces as an error on the next `get`/`set`/`delete` rather than wiping every stored secret. **Recovery:** restore the correct passphrase — the on-disk bundle is left untouched by a failed write.
- **Atomic writes.** Every write goes to a temp sibling (`<path>.tmp`, mode `0o600`) and is then `rename`d onto the target, so a crash mid-write can never truncate or corrupt the existing bundle; a reader only ever sees the old or the new file in full.
- **In-process single-writer guard.** Concurrent `set`/`delete` calls on one store instance are serialised so their read-modify-write cycles cannot interleave and clobber each other. Cross-process concurrent writers are out of scope (the atomic rename still rules out corruption — worst case is last-write-wins).

## Optional 1Password adapter

The `@graphorin/secret-1password` package is an optional reference adapter that delegates to the system [1Password CLI (`op`)](https://developer.1password.com/docs/cli/get-started/). It does **not** bundle the CLI — install the binary yourself. The adapter exposes a `SecretResolver` for the canonical `op://` URI scheme defined by 1Password:

```text
op://<vault>/<item>/[<section>/]<field>
```

```ts
import { registerResolver, resolveSecret } from '@graphorin/security';
import {
  createOnePasswordResolver,
  onePasswordResolver,
} from '@graphorin/secret-1password';

// Register the default resolver (uses the `op` binary on $PATH):
registerResolver(onePasswordResolver);

// Or build a customised one with a specific binary + timeout + token:
registerResolver(
  createOnePasswordResolver({
    binary: '/usr/local/bin/op',
    timeoutMs: 15_000,
    // OP_SERVICE_ACCOUNT_TOKEN is forwarded for headless use.
    serviceAccountToken: process.env.OP_SERVICE_ACCOUNT_TOKEN,
  }),
);

const apiKey = await resolveSecret('op://Production/Stripe API/credential');
```

Beyond `serviceAccountToken`, the resolver options also support 1Password **Connect** mode (`connect: { host, token }`, wired through `OP_CONNECT_HOST` / `OP_CONNECT_TOKEN`) and an `account` override for machines signed in to multiple 1Password accounts. The `op` invocation has a hard wall-clock timeout that escalates `SIGTERM` → `SIGKILL`, so a wedged CLI can never hang the resolver.

Errors from the CLI surface as typed `OpResolverError` codes (`'binary-missing'`, `'unauthenticated'`, `'item-not-found'`, …) so your code can react cleanly.

## Where OAuth tokens live (SPL-1)

`graphorin auth login` persists the OAuth **access / refresh / id tokens** into
the active `SecretsStore` (the same `keyring → encrypted-file → env` chain as
every other secret) under `oauth:<serverId>:<kind>` keys; the
`OAuthServerStore` record carries only the **refs**, never token material. A
fresh process resolves the refresh token back from the store, so
`graphorin auth refresh` / `auth revoke` and the MCP bridge's
`Authorization` header all work across restarts. `auth status` reports
`hasRefreshToken` only when the ref actually resolves. Without a usable
secrets store the tokens live in process memory only (the command warns).

## Telemetry redaction for `SecretValue`s

Every exporter is auto-wrapped with `withValidation(...)` by the tracer factory. The validator substitutes a redacted placeholder for any attribute whose serialised form matches a known `SecretValue` shape. Operators that pass `validation: 'off'` must wrap exporters explicitly — the tracer refuses to register a raw exporter in that mode and throws `UnvalidatedExporterError` at startup.

## Capability matrix

| Capability | OS keychain | Encrypted-file | 1Password CLI |
|---|---|---|---|
| Read | ✓ | ✓ | ✓ |
| Write | ✓ | ✓ | (read-only) |
| List | ✓ | ✓ | ✓ |
| Per-tool ACL | ✓ | ✓ | ✓ |
| Audit log | ✓ | ✓ | ✓ |
| Headless / CI | — | ✓ | ✓ |

## Next steps

- [Security](/guide/security) — sandbox, audit log, OAuth.
- [Privacy](/guide/privacy) — the zero-default-telemetry promise.
- [CLI](/guide/cli) — `graphorin secrets`, `graphorin auth`, `graphorin token`.

---

**Graphorin** · v0.5.0 · MIT License · © 2026 Oleksiy Stepurenko
