[**Graphorin API reference v0.9.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/secret-1password

# @graphorin/secret-1password

> Reference 1Password secret-resolver adapter for the
> [Graphorin](https://github.com/o-stepper/graphorin) framework.
> Registers the `op://` scheme on top of `@graphorin/security`'s
> pluggable `SecretResolver` registry by shelling out to the official
> 1Password CLI (`op read 'op://<vault>/<item>/<field>'`).
>
> Project Graphorin · v0.9.0 · MIT License · © 2026 Oleksiy Stepurenko ·
> <https://github.com/o-stepper/graphorin>

---

## Status

- **Published:** v0.9.0 (optional sub-pack)
- Reference adapter - community packages should follow this template
  when wiring HashiCorp Vault, AWS Secrets Manager, GCP Secret
  Manager, Azure Key Vault, Bitwarden, or Unix `pass`.

---

## Install

```bash
pnpm add @graphorin/secret-1password
```

The package shells out to the **system** `op` binary; install it from
[1Password's official CLI distribution](https://developer.1password.com/docs/cli/get-started/).
The package does NOT bundle the CLI - the operator chooses how it is
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
5. Test with a stub `<Tool>Cli` - never reach the network or the
   real binary in CI.

---

## Related decisions

- ADR-026 - `SecretValue` and `SecretsStore` end-to-end contract.
- ADR-028 - `SecretRef` URI scheme (`env:` / `keyring:` / `file:` / `encrypted-file:` / `op://` / `vault://` / `ref:`).

---

## License

MIT © 2026 Oleksiy Stepurenko

---

**Project Graphorin** · v0.9.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/secret-1password/README.md) | @graphorin/secret-1password - reference 1Password secret-resolver adapter for the Graphorin framework. |
| [package.json](/api/@graphorin/secret-1password/package.json/index.md) | - |
