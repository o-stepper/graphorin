[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Logger

# Interface: Logger

Defined in: [packages/core/src/contracts/logger.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/logger.ts#L32)

Pluggable logger contract consumed by every `@graphorin/*` runtime
package. The concrete implementation lives in `@graphorin/observability`
- declaring the interface here keeps level-zero packages free of an
observability dependency.

Loggers are intentionally **structured** and **side-effect-free** in the
type contract: the `info(msg, fields?)` signature is a hint, not a
mandate to actually emit anything. Implementations may sample, drop, or
batch.

## Stable

## Methods

### child()

```ts
child(fields): Logger;
```

Defined in: [packages/core/src/contracts/logger.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/logger.ts#L43)

Return a child logger with `fields` merged into every record's
structured payload. Useful for binding `runId` / `sessionId` /
`agentId` once at the top of a request.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fields` | [`LogFields`](/api/@graphorin/core/type-aliases/LogFields.md) |

#### Returns

`Logger`

***

### debug()

```ts
debug(message, fields?): void;
```

Defined in: [packages/core/src/contracts/logger.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/logger.ts#L34)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `fields?` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> |

#### Returns

`void`

***

### error()

```ts
error(message, fields?): void;
```

Defined in: [packages/core/src/contracts/logger.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/logger.ts#L37)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `fields?` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> |

#### Returns

`void`

***

### info()

```ts
info(message, fields?): void;
```

Defined in: [packages/core/src/contracts/logger.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/logger.ts#L35)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `fields?` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> |

#### Returns

`void`

***

### trace()

```ts
trace(message, fields?): void;
```

Defined in: [packages/core/src/contracts/logger.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/logger.ts#L33)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `fields?` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> |

#### Returns

`void`

***

### warn()

```ts
warn(message, fields?): void;
```

Defined in: [packages/core/src/contracts/logger.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/logger.ts#L36)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `fields?` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> |

#### Returns

`void`
