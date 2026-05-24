[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SecretValue

# Interface: SecretValue

Defined in: packages/core/src/contracts/secret-value.ts:46

Runtime-safe wrapper around an opaque secret (API key, token, password).

The shape declared here is the **interface contract**: the concrete
wrapper class lives in `@graphorin/security`. Downstream packages typing
a parameter as `SecretValue` therefore avoid taking a security
dependency.

Note: `SecretValue` is **not** a TypeScript branded primitive — it is
a full wrapper class with explicit leakage barriers
(`Symbol.toPrimitive`, `toJSON`, `[nodejs.util.inspect.custom]`, …).
Any conforming implementation must ensure that:

- String coercion (`String(s)`, `` `${s}` ``, `s + ''`, …) yields a
  redacted placeholder, **not** the underlying value.
- JSON serialization (`JSON.stringify({ apiKey: s })`) yields a
  redacted placeholder.
- Inspector output (`util.inspect(s)`) yields
  `'SecretValue([REDACTED])'`.
- The underlying value is only reachable through `.use(fn)`,
  `.useBuffer(fn)` or the audited `.reveal()` escape hatch.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-secret_value_brand"></a> `[SECRET_VALUE_BRAND]` | `readonly` | `true` | Cross-realm brand. Implementations set this to `SECRET_VALUE_BRAND`. | packages/core/src/contracts/secret-value.ts:77 |
| <a id="property-length"></a> `length` | `readonly` | `number` | Number of bytes in the wrapped value. Safe to log. | packages/core/src/contracts/secret-value.ts:48 |

## Methods

### \[NODEJS\_INSPECT\_CUSTOM\]()

```ts
[NODEJS_INSPECT_CUSTOM](%0A%20%20%20depth?,%20%0A%20%20%20opts?,%20%0A%20%20%20inspect?): string;
```

Defined in: packages/core/src/contracts/secret-value.ts:90

Leakage barrier for `node:util.inspect(...)`. Returns the placeholder
(`'SecretValue([REDACTED])'`) so that REPL / `console.log` /
structured-logger output never reveals the underlying value.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `depth?` | `number` |
| `opts?` | `unknown` |
| `inspect?` | `unknown` |

#### Returns

`string`

***

### \[toPrimitive\]()

```ts
toPrimitive: string | number;
```

Defined in: packages/core/src/contracts/secret-value.ts:80

Leakage barrier for ToPrimitive coercion. Returns the placeholder.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `hint` | `string` |

#### Returns

`string` \| `number`

***

### dispose()

```ts
dispose(): void;
```

Defined in: packages/core/src/contracts/secret-value.ts:74

Best-effort zeroization of the underlying buffer. Does not affect
derived V8 strings already created via `.use(fn)` / `.reveal()`.

#### Returns

`void`

***

### reveal()

```ts
reveal(): string;
```

Defined in: packages/core/src/contracts/secret-value.ts:68

One-shot reveal as a string. Audited by the implementation. Prefer
`.use(fn)` whenever possible.

#### Returns

`string`

***

### toJSON()

```ts
toJSON(): string;
```

Defined in: packages/core/src/contracts/secret-value.ts:83

Leakage barrier for `JSON.stringify(...)`. Returns the placeholder.

#### Returns

`string`

***

### use()

```ts
use<T>(fn): Promise<T>;
```

Defined in: packages/core/src/contracts/secret-value.ts:55

Run `fn` with the unwrapped string and return its result. Preferred
over `.reveal()` because it scopes the unwrapped value to a single
synchronous / asynchronous turn.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | (`raw`) => `T` \| `Promise`\&lt;`T`\&gt; |

#### Returns

`Promise`\&lt;`T`\&gt;

***

### useBuffer()

```ts
useBuffer<T>(fn): Promise<T>;
```

Defined in: packages/core/src/contracts/secret-value.ts:62

Run `fn` with the unwrapped value as a `Buffer`. Useful for binary
secrets (encryption keys, HMAC keys) where round-tripping through a
V8 string would defeat the wrapper's hygiene.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | (`buf`) => `T` \| `Promise`\&lt;`T`\&gt; |

#### Returns

`Promise`\&lt;`T`\&gt;
