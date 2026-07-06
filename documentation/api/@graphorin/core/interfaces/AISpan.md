[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AISpan

# Interface: AISpan\&lt;T\&gt;

Defined in: packages/core/src/contracts/tracer.ts:116

Typed span. Generic over `SpanType` so consumers can specialize a
function on a particular span kind without losing the discriminator.

## Stable

## Extended by

- [`GraphorinSpan`](/api/@graphorin/observability/interfaces/GraphorinSpan.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) | [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/core/src/contracts/tracer.ts:118 |
| <a id="property-parentid"></a> `parentId?` | `readonly` | `string` | packages/core/src/contracts/tracer.ts:120 |
| <a id="property-traceid"></a> `traceId` | `readonly` | `string` | packages/core/src/contracts/tracer.ts:119 |
| <a id="property-type"></a> `type` | `readonly` | `T` | packages/core/src/contracts/tracer.ts:117 |

## Methods

### addEvent()

```ts
addEvent(name, attrs?): void;
```

Defined in: packages/core/src/contracts/tracer.ts:124

Append a span event (attribute-bearing time-stamped marker).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `attrs?` | `Readonly`\<`Record`\&lt;`string`, [`SpanAttributeValue`](/api/@graphorin/core/type-aliases/SpanAttributeValue.md)\&gt;\> |

#### Returns

`void`

***

### end()

```ts
end(): void;
```

Defined in: packages/core/src/contracts/tracer.ts:130

End the span. Idempotent.

#### Returns

`void`

***

### recordException()

```ts
recordException(err): void;
```

Defined in: packages/core/src/contracts/tracer.ts:126

Record an exception. Multiple calls are kept in the span event log.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `err` | `unknown` |

#### Returns

`void`

***

### setAttributes()

```ts
setAttributes(attrs): void;
```

Defined in: packages/core/src/contracts/tracer.ts:122

Add or replace attributes. Repeated calls are merged (last write wins).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `attrs` | [`SpanAttributes`](/api/@graphorin/core/type-aliases/SpanAttributes.md) |

#### Returns

`void`

***

### setStatus()

```ts
setStatus(status, message?): void;
```

Defined in: packages/core/src/contracts/tracer.ts:128

Set the terminal status.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `status` | [`SpanStatus`](/api/@graphorin/core/type-aliases/SpanStatus.md) |
| `message?` | `string` |

#### Returns

`void`
