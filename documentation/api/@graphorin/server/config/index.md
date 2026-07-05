[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / config

# config

Strongly-typed configuration loader for the Graphorin server.

Operators ship a `graphorin.config.ts` (or `.js` / `.mjs` / JSON)
file that calls [defineConfig](/api/@graphorin/server/config/functions/defineConfig.md) to construct a typed config
object; the server runtime accepts either the raw object, a path
to such a file, or a function that returns one.

Validation is performed via Zod so user-facing errors include the
exact path of every failing field, not just a generic
"TypeError: undefined".

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ServerConfigSpec](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md) | - |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [DeliveryCommentaryPolicyConfig](/api/@graphorin/server/config/type-aliases/DeliveryCommentaryPolicyConfig.md) | - |
| [IdempotencyRequireKeyMode](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md) | - |
| [SecretRefString](/api/@graphorin/server/config/type-aliases/SecretRefString.md) | String literal that flags a value as a `SecretRef` URI. The server's pre-bind step resolves every `*Ref` field through the `@graphorin/security` resolver registry before binding the listener; an unresolvable ref fails fast with import('./errors/index.js').PrebindSecretUnresolvableError. |
| [SecretsSource](/api/@graphorin/server/config/type-aliases/SecretsSource.md) | Selector for which `SecretsStore` flavour the server activates. Mirrors `--secrets-source` from DEC-136. |
| [ServerConfigInput](/api/@graphorin/server/config/type-aliases/ServerConfigInput.md) | Input shape accepted by [defineConfig](/api/@graphorin/server/config/functions/defineConfig.md). Every field is optional; missing values fall back to a documented default. |

## Variables

| Variable | Description |
| ------ | ------ |
| [ServerConfigSchema](/api/@graphorin/server/config/variables/ServerConfigSchema.md) | Zod schema for the resolved [ServerConfigSpec](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md). Exposed for advanced users that want to validate other config sources (env-only launch, CLI overrides, etc.). |

## Functions

| Function | Description |
| ------ | ------ |
| [defineConfig](/api/@graphorin/server/config/functions/defineConfig.md) | Helper for `graphorin.config.ts` files. Pure pass-through that provides editor autocomplete; the actual parsing happens at server startup so callers always see the same error path regardless of which loader (TS / JS / JSON) the operator picked. |
| [parseServerConfig](/api/@graphorin/server/config/functions/parseServerConfig.md) | Parse + validate user input. Returns a strongly-typed [ServerConfigSpec](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md); throws [ConfigInvalidError](/api/@graphorin/server/errors/classes/ConfigInvalidError.md) on any invalid field with a flattened issue list. |
