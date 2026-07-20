[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AsyncContext

# Interface: AsyncContext\&lt;T\&gt;

Defined in: packages/core/src/utils/async-context.ts:17

**`Stable`**

Thin typed wrapper around Node's `AsyncLocalStorage`. Used to thread a
tool-execution / request-scoped context through the async stack
without explicit parameter passing.

The wrapper exists because:
- The Node API requires a fresh `AsyncLocalStorage<T>` per scope; this
  helper centralizes the construction with consistent typing.
- Downstream packages (security, tools) want a single canonical
  constructor so that their `getStore()` code paths share the same
  identity (matters for HMR / multi-realm setups).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Methods

### disable()

```ts
disable(): void;
```

Defined in: packages/core/src/utils/async-context.ts:27

Exit any in-flight scope (advanced; rarely needed).

#### Returns

`void`

***

### enterWith()

```ts
enterWith(value): void;
```

Defined in: packages/core/src/utils/async-context.ts:25

Replace the value of the current scope (advanced; rarely needed).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |

#### Returns

`void`

***

### get()

```ts
get(): T | undefined;
```

Defined in: packages/core/src/utils/async-context.ts:23

Get the value of the current scope, or `undefined` outside one.

#### Returns

`T` \| `undefined`

***

### run()

```ts
run<R>(value, fn): R;
```

Defined in: packages/core/src/utils/async-context.ts:19

Run `fn` inside a fresh scope carrying `value`.

#### Type Parameters

| Type Parameter |
| ------ |
| `R` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |
| `fn` | () => `R` |

#### Returns

`R`

***

### runAsync()

```ts
runAsync<R>(value, fn): Promise<R>;
```

Defined in: packages/core/src/utils/async-context.ts:21

Run `fn` inside a fresh scope carrying `value` (async-friendly).

#### Type Parameters

| Type Parameter |
| ------ |
| `R` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |
| `fn` | () => `Promise`\&lt;`R`\&gt; |

#### Returns

`Promise`\&lt;`R`\&gt;
