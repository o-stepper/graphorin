# Error contract

How Graphorin surfaces failures: which error classes exist, which
discriminator fields are stable API, how provider and server errors are
classified, and exactly what you may rely on when writing `catch`
blocks. The stability rules referenced here are defined in
[Stability & versioning](/guide/stability).

## Two discriminator families

There is deliberately **no single `GraphorinError` base class**. Each
package owns its error hierarchy, and two discriminator conventions
coexist:

- **`code`** - used by `@graphorin/agent`, `@graphorin/sessions` and
  `@graphorin/workflow` (typed unions like `WorkflowErrorCode`).
- **`kind`** - used by `@graphorin/provider`, `@graphorin/tools`,
  `@graphorin/memory`, `@graphorin/mcp`, `@graphorin/skills`,
  `@graphorin/client`, `@graphorin/server` and the security packages.

Renaming either family would break consumers for zero benefit, so the
split is frozen and **normalization is the server boundary's job**: the
server's wire envelope picks `err.code` when it is a non-empty string,
else `err.kind`, else `'unknown'`, and forwards `hint` when present.

## Package bases

| Package | Base class | Discriminator | `cause` | `hint` |
|---|---|---|---|---|
| `@graphorin/provider` | `GraphorinProviderError` | `kind` | yes | yes |
| `@graphorin/server` | `GraphorinServerError` | `kind` (typed union) | yes | yes |
| `@graphorin/tools` | `GraphorinToolsError` | `kind` | yes | yes |
| `@graphorin/memory` | `GraphorinMemoryError` | `kind` | yes | yes |
| `@graphorin/mcp` | `GraphorinMCPError` | `kind` (typed union) + structured `metadata` | yes | yes |
| `@graphorin/skills` | `GraphorinSkillsError` | `kind` | yes | yes |
| `@graphorin/client` | `GraphorinClientError` | `kind` (typed union) | yes | no |
| `@graphorin/security` | three roots: `GraphorinSecretsError` (secrets, auth, audit, sandbox, hardening), `GraphorinOAuthError`, `GraphorinSupplyChainError` | `kind` | yes | yes |
| `@graphorin/agent` | `AgentRuntimeError` | `code` (typed union) | yes | no |
| `@graphorin/sessions` | `SessionError` | `code` (typed union) | yes | no |
| `@graphorin/workflow` | `WorkflowError` | `code` (typed union) | yes | yes |

Packages with a handful of standalone errors instead of a base
(`@graphorin/core`'s `CheckpointConflictError`, the store packages'
`SqliteBusyError` / `SqliteNativeBindingError` /
`EncryptSwapLiveWriterError`, embedder/reranker load errors, trigger
errors) document each class in the API reference; the same
`kind`-when-present rule applies.

## Errors as data

Not every failure throws. Two families are **carried as data** on
results and events, and their discriminators are equally contractual:

- **`ToolError.kind`** - what a tool call reports to the model:
  `approval_denied`, `sandbox_violation`, `timeout`, `invalid_input`,
  `invalid_output`, `execution_failed`, `unknown_tool`, `aborted`,
  `inbound_sanitization_blocked`, `dataflow_policy_blocked`,
  `capability_blocked`, `rate_limited`. Anything a tool throws that is
  not a typed carrier flattens to `execution_failed`; throwing
  `ToolRateLimitError` reaches `rate_limited` with a pacing hint.
- **`ProviderError.kind`** - the normalized provider failure taxonomy:
  `rate-limit`, `capacity`, `context-length`, `transient`,
  `invalid-request`, `unauthorized`, `content-filter`, `unknown`.
- **Aborts are results, not throws.** Every bundled adapter maps a
  caller abort to `finishReason: 'aborted'`; retry and fallback
  middleware exclude aborts by design.

## Provider HTTP classification

The HTTP adapters throw `ProviderHttpError` carrying the raw `status`
plus a classified `errorKind`:

| HTTP status | Classified kind | Retryable |
|---|---|---|
| timeout / network failure (`status: 0`) | `transient` | yes |
| 429 | `rate-limit` | yes (honors `retry-after`) |
| 401 / 403 | `unauthorized` | no |
| 400 / 404 / 422 | `invalid-request` (or `context-length` when the body says so) | no |
| 503 / 529 | `capacity` | yes |
| other 5xx | `transient` | yes |

```ts
import { ProviderHttpError } from '@graphorin/provider';

function isRetryableProviderFailure(err: unknown): boolean {
  // `status` and `errorKind` are stable; message text is not.
  return (
    err instanceof ProviderHttpError &&
    (err.errorKind === 'transient' ||
      err.errorKind === 'rate-limit' ||
      err.errorKind === 'capacity')
  );
}
```

(In practice you rarely write this by hand - the `withRetry` /
`withFallback` [provider middleware](/guide/providers) encode exactly
these rules.)

## Server wire formats

Three surfaces, one envelope convention:

- **REST routes** answer errors as a JSON body with an `error` field
  (the kind) and a `message` field, plus a meaningful HTTP status
  (`404` for unknown agents/workflows/threads, `400` for validation,
  `409` for conflicts).
- **Auth middleware** answers `401` / `429` with stable `error` codes:
  `auth-required`, `auth-invalid`, `auth-revoked`, `auth-expired`,
  `auth-locked-out`, `scope-denied`, `csrf-denied`, `cors-denied`,
  `rate-limit-exceeded`.
- **WebSocket JSON-RPC** uses numeric codes:

| Code | Meaning |
|---|---|
| -32700 | parse error |
| -32600 | invalid request |
| -32601 | method not found |
| -32602 | invalid params |
| -32603 | internal error |
| -32001 | auth required |
| -32002 | auth invalid |
| -32003 | scope denied |
| -32004 | rate limited |
| -32005 | protocol violation |
| -32010 | run not found |
| -32011 | subscription not found |

New codes may be added in minor releases; existing numbers and strings
never change meaning.

## What is contractual (and what is not)

You MAY rely on:

- `code` / `kind` string values and the JSON-RPC numbers above;
- documented structured fields (`ProviderHttpError.status`,
  `ToolRateLimitError.retryAfterMs`, `ConfigInvalidError.issues`,
  `CheckpointConflictError.threadId`, ...);
- `instanceof` against the documented base classes;
- `cause` being threaded where the base supports it (every base in the
  table above does).

You may NOT rely on:

- **message text or hint text** - both exist for humans and logs and
  may be rephrased in any release;
- plain `Error` instances thrown from validation and internal glue
  paths - they carry no discriminator and their messages are equally
  non-contractual. Framework code converges on typed errors over time;
  until a failure path has one, treat it as opaque.

```ts
import { WorkflowError } from '@graphorin/workflow';

function describeWorkflowFailure(err: unknown): string {
  if (err instanceof WorkflowError) {
    switch (err.code) {
      case 'checkpoint-version-conflict':
        return 'another writer won the CAS race - safe to retry';
      case 'timer-driver-store-unsupported':
        return 'checkpoint store lacks listSuspended()';
      default:
        return `workflow failure: ${err.code}`;
    }
  }
  return 'not a workflow error';
}
```

## Known quirks

Kept for compatibility and documented rather than hidden:

- `SqliteBusyError` carries **both** `code: 'SQLITE_BUSY'` (the
  driver-ecosystem convention) and `kind: 'sqlite-busy'` (the package
  convention).
- `@graphorin/client` maps JSON-RPC numeric codes onto its own
  `kind` union client-side, so browser code never touches raw numbers.
- Before 0.14.0, `ToolRateLimitError` and
  `TimerDriverStoreUnsupportedError` extended `Error` directly; they
  now participate in their packages' hierarchies
  (`GraphorinToolsError` with `kind: 'rate-limited'`, `WorkflowError`
  with `code: 'timer-driver-store-unsupported'`).
