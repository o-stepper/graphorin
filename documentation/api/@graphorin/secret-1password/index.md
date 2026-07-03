[**Graphorin API reference v0.5.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/secret-1password

# @graphorin/secret-1password

> Reference 1Password secret-resolver adapter for the
> [Graphorin](https://github.com/o-stepper/graphorin) framework.
> Registers the `op://` scheme on top of `@graphorin/security`'s
> pluggable `SecretResolver` registry by shelling out to the official
> 1Password CLI (`op read 'op://<vault>/<item>/<field>'`).
>
> Project Graphorin · v0.5.0 · MIT License · © 2026 Oleksiy Stepurenko ·
> <https://github.com/o-stepper/graphorin>

---

## Status

- **Published:** v0.5.0 (optional sub-pack)
- Reference adapter — community packages should follow this template
  when wiring HashiCorp Vault, AWS Secrets Manager, GCP Secret
  Manager, Azure Key Vault, Bitwarden, or Unix `pass`.

---

## Install

```bash
pnpm add @graphorin/secret-1password
```

The package shells out to the **system** `op` binary; install it from
[1Password's official CLI distribution](https://developer.1password.com/docs/cli/get-started/).
The package does NOT bundle the CLI — the operator chooses how it is
provisioned (homebrew, scoop, apt, official tarball, k8s init
container, etc.).

---

## Usage

### Local interactive mode

Sign in to 1Password once via `eval $(op signin)`; the resolver picks
up the cached session token from your shell.

```ts
import { registerResolver, resolveSecret } from '@graphorin/security';
import { onePasswordResolver } from '@graphorin/secret-1password';

registerResolver(onePasswordResolver);

const apiKey = await resolveSecret('op://Personal/OpenAI/api-key');
await apiKey.use((raw) => callOpenAI(raw));
```

### Headless / CI mode

Use a [1Password Service Account](https://developer.1password.com/docs/service-accounts/)
token. The resolver forwards it via `OP_SERVICE_ACCOUNT_TOKEN`:

```ts
import { createOnePasswordResolver } from '@graphorin/secret-1password';

registerResolver(
  createOnePasswordResolver({
    serviceAccountToken: process.env.OP_SERVICE_ACCOUNT_TOKEN!,
    timeoutMs: 10_000,
  }),
);
```

### 1Password Connect

For self-hosted Connect deployments:

```ts
registerResolver(
  createOnePasswordResolver({
    connect: {
      host: process.env.OP_CONNECT_HOST!,
      token: process.env.OP_CONNECT_TOKEN!,
    },
  }),
);
```

### Multiple accounts

Pass `--account` through:

```ts
registerResolver(
  createOnePasswordResolver({
    account: 'team-graphorin.1password.com',
  }),
);
```

---

## URI format

`op://<vault>/<item>/[section/]<field>`

Per 1Password, vault / item / field names are case-insensitive. The
resolver lowercases the URI before forwarding to the CLI; pass
`preserveCase: true` to opt out.

Examples:

```text
op://Personal/OpenAI/api-key
op://Production/Stripe/credentials/live-secret-key
op://Engineering/Postgres/section/connection-string
```

---

## Error handling

Every error surfaces as a typed `OpCliError` with a `kind` field and
an actionable hint:

| `kind`                  | When it fires                                              | Hint                                                                                            |
|-------------------------|------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| `binary-missing`        | `op` not on PATH.                                          | Install the 1Password CLI.                                                                      |
| `signed-out`            | `op` reports "not signed in" or session expired.           | Run `eval $(op signin)` (interactive) or set `OP_SERVICE_ACCOUNT_TOKEN` (headless).             |
| `reference-not-found`   | The vault / item / field does not exist.                   | Verify with `op item get <item> --vault <vault>`.                                               |
| `timeout`               | The CLI did not return within the timeout.                 | Increase `timeoutMs` or check 1Password connectivity.                                           |
| `unknown`               | Any other non-zero exit code.                              | Inspect the captured stderr.                                                                    |

The resolver wraps `OpCliError` in `SecretResolutionError` (the
canonical `@graphorin/security` error) so existing `catch` paths in
agent code keep working.

---

## Template for community resolvers

The package is intentionally tiny (~170 LOC). The structure is the
canonical template community packages should follow when wiring
HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key
Vault, Bitwarden, or Unix `pass`:

1. Build a `<Tool>Cli` interface that captures the upstream tool's
   surface (read / list / health-check); ship a default
   implementation that spawns the binary or calls the SDK.
2. Build a `create<Tool>Resolver(options)` factory that returns a
   `SecretResolver` honouring the upstream URI scheme.
3. Validate the URI shape locally; the upstream tool is the source of
   truth for the actual lookup.
4. Wrap upstream errors in `SecretResolutionError` so existing `catch`
   paths keep working.
5. Test with a stub `<Tool>Cli` — never reach the network or the
   real binary in CI.

---

## Related decisions

- ADR-026 — `SecretValue` and `SecretsStore` end-to-end contract.
- ADR-028 — `SecretRef` URI scheme (`env:` / `keyring:` / `file:` / `encrypted-file:` / `op://` / `vault://` / `ref:`).

---

## License

MIT © 2026 Oleksiy Stepurenko

---

**Project Graphorin** · v0.5.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

@graphorin/secret-1password — reference 1Password secret-resolver
adapter for the Graphorin framework.

Registers the `op://` scheme on top of `@graphorin/security`'s
pluggable `SecretResolver` registry by shelling out to the official
1Password CLI:

```ts
import { registerResolver } from '@graphorin/security';
import { onePasswordResolver } from '@graphorin/secret-1password';

registerResolver(onePasswordResolver);

// Anywhere downstream:
const apiKey = await resolveSecret('op://Personal/OpenAI/api-key');
```

The adapter is also the canonical template community packages
should follow when wiring HashiCorp Vault, AWS Secrets Manager, GCP
Secret Manager, Azure Key Vault, Bitwarden, or Unix `pass` as
additional `SecretResolver` implementations.

## Classes

| Class | Description |
| ------ | ------ |
| [OpCliError](/api/@graphorin/secret-1password/classes/OpCliError.md) | Typed error raised by the CLI wrapper. Carries a `kind` so callers can distinguish operator-fixable failure modes. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [OnePasswordResolverOptions](/api/@graphorin/secret-1password/interfaces/OnePasswordResolverOptions.md) | - |
| [OpCli](/api/@graphorin/secret-1password/interfaces/OpCli.md) | - |
| [OpCliReadOptions](/api/@graphorin/secret-1password/interfaces/OpCliReadOptions.md) | - |
| [OpCliReadResult](/api/@graphorin/secret-1password/interfaces/OpCliReadResult.md) | - |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [OpCliErrorKind](/api/@graphorin/secret-1password/type-aliases/OpCliErrorKind.md) | - |

## Variables

| Variable | Description |
| ------ | ------ |
| [onePasswordResolver](/api/@graphorin/secret-1password/variables/onePasswordResolver.md) | Cache the default-options resolver so callers that just want the happy-path behaviour can use a constant export. |
| [VERSION](/api/@graphorin/secret-1password/variables/VERSION.md) | Canonical version constant. Mirrors the `package.json` version. |

## Functions

| Function | Description |
| ------ | ------ |
| [createDefaultOpCli](/api/@graphorin/secret-1password/functions/createDefaultOpCli.md) | Default [OpCli](/api/@graphorin/secret-1password/interfaces/OpCli.md) implementation. Spawns `op read --no-color --reveal '<uri>'` with the configured timeout and inherits the parent environment. |
| [createOnePasswordResolver](/api/@graphorin/secret-1password/functions/createOnePasswordResolver.md) | Build a `SecretResolver` that honours the `op://` scheme. Register with `registerResolver(...)` from `@graphorin/security` at app bootstrap. |
| [createOpCli](/api/@graphorin/secret-1password/functions/createOpCli.md) | [OpCli](/api/@graphorin/secret-1password/interfaces/OpCli.md) factory with an injectable `spawn` (for tests). Production code uses [createDefaultOpCli](/api/@graphorin/secret-1password/functions/createDefaultOpCli.md). |
| [normalizeOpUri](/api/@graphorin/secret-1password/functions/normalizeOpUri.md) | Lowercase the authority + path segments of an `op://` URI so two configs that differ only in case resolve to the same value (matching 1Password's case-insensitive behaviour). |
