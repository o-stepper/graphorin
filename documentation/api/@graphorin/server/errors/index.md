[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / errors

# errors

Typed error surface for `@graphorin/server`. Every server-side
configuration / lifecycle / runtime failure that an operator must
be able to reason about flows through one of the classes in this
module so it carries a stable `kind` discriminator + `hint` field
pointing the operator at the next remediation step.

## Classes

| Class | Description |
| ------ | ------ |
| [AgentNotFoundError](/api/@graphorin/server/errors/classes/AgentNotFoundError.md) | - |
| [ConfigInvalidError](/api/@graphorin/server/errors/classes/ConfigInvalidError.md) | - |
| [GraphorinServerError](/api/@graphorin/server/errors/classes/GraphorinServerError.md) | Base error class. Every server-emitted typed error inherits from here so middleware can pattern-match a single union. |
| [IdempotencyConflictError](/api/@graphorin/server/errors/classes/IdempotencyConflictError.md) | - |
| [IdempotencyKeyRequiredError](/api/@graphorin/server/errors/classes/IdempotencyKeyRequiredError.md) | - |
| [LifecycleDoubleStartError](/api/@graphorin/server/errors/classes/LifecycleDoubleStartError.md) | - |
| [LifecycleNotStartedError](/api/@graphorin/server/errors/classes/LifecycleNotStartedError.md) | - |
| [MigrationFailedError](/api/@graphorin/server/errors/classes/MigrationFailedError.md) | - |
| [PrebindEncryptionPeerMissingError](/api/@graphorin/server/errors/classes/PrebindEncryptionPeerMissingError.md) | - |
| [PrebindEncryptionRequiredError](/api/@graphorin/server/errors/classes/PrebindEncryptionRequiredError.md) | - |
| [PrebindPepperMissingError](/api/@graphorin/server/errors/classes/PrebindPepperMissingError.md) | - |
| [PrebindSecretUnresolvableError](/api/@graphorin/server/errors/classes/PrebindSecretUnresolvableError.md) | - |
| [RouteHandlerMissingError](/api/@graphorin/server/errors/classes/RouteHandlerMissingError.md) | - |
| [ShutdownTimeoutError](/api/@graphorin/server/errors/classes/ShutdownTimeoutError.md) | - |
| [WorkflowNotFoundError](/api/@graphorin/server/errors/classes/WorkflowNotFoundError.md) | - |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [GraphorinServerErrorCode](/api/@graphorin/server/errors/type-aliases/GraphorinServerErrorCode.md) | Stable string discriminator for [GraphorinServerError](/api/@graphorin/server/errors/classes/GraphorinServerError.md). Each value maps to a single failure scenario; never reuse a value for a different cause. |
