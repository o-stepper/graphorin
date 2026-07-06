[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretValue

# Class: SecretValue

Defined in: [packages/security/src/secrets/secret-value.ts:146](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L146)

Runtime-safe wrapper around an opaque secret string or byte string.

`SecretValue` is the **single canonical implementation** of the
`SecretValue` contract declared in `@graphorin/core`. Every secret
crossing module boundaries inside the framework is wrapped in a
`SecretValue` so that:

- `console.log(value)`, `JSON.stringify({ apiKey: value })`,
  `` `Bearer ${value}` ``, `String(value)`, `util.inspect(value)`,
  and `new Error(String(value)).message` all emit a redacted
  placeholder rather than the underlying value.
- The wrapper exposes the raw bytes only through `use(fn)` /
  `useBuffer(fn)` (scoped reads) or the audited one-shot `reveal()`
  escape hatch.
- `dispose()` makes a best-effort attempt to zero the backing
  `Buffer`. (V8 strings derived through `use(fn)` / `reveal()` are
  immutable and cannot be zeroed; this is documented honestly.)

The class fixes the `[SECRET_VALUE_BRAND]` symbol so the cross-realm
type guard `SecretValue.isSecretValue(...)` works for instances
constructed in Worker threads or `vm` contexts.

## Stable

## Implements

- [`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md)

## Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-secret_value_brand"></a> `[SECRET_VALUE_BRAND]` | `readonly` | `true` | `true` | Cross-realm brand. Implementations set this to `SECRET_VALUE_BRAND`. | [packages/security/src/secrets/secret-value.ts:160](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L160) |
| <a id="property-fetchedat"></a> `fetchedAt` | `readonly` | `number` | `undefined` | Epoch milliseconds at construction time. Safe to log. | [packages/security/src/secrets/secret-value.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L153) |
| <a id="property-source"></a> `source?` | `readonly` | \{ `ref?`: `string`; `resolver?`: `string`; \} | `undefined` | Free-form provenance string carried for audit telemetry. | [packages/security/src/secrets/secret-value.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L151) |
| `source.ref?` | `readonly` | `string` | `undefined` | - | [packages/security/src/secrets/secret-value.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L151) |
| `source.resolver?` | `readonly` | `string` | `undefined` | - | [packages/security/src/secrets/secret-value.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L151) |
| <a id="property-ttlms"></a> `ttlMs?` | `readonly` | `number` | `undefined` | Optional TTL in milliseconds. Carriers for resolver caching. | [packages/security/src/secrets/secret-value.ts:155](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L155) |

## Accessors

### disposed

#### Get Signature

```ts
get disposed(): boolean;
```

Defined in: [packages/security/src/secrets/secret-value.ts:236](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L236)

Whether `dispose()` has been called.

##### Returns

`boolean`

***

### length

#### Get Signature

```ts
get length(): number;
```

Defined in: [packages/security/src/secrets/secret-value.ts:231](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L231)

Length of the wrapped value in bytes. Safe to log.

##### Returns

`number`

Number of bytes in the wrapped value. Safe to log.

#### Implementation of

[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md).[`length`](/api/@graphorin/core/interfaces/SecretValue.md#property-length)

## Methods

### \[NODEJS\_INSPECT\_CUSTOM\]()

```ts
NODEJS_INSPECT_CUSTOM: string;
```

Defined in: [packages/security/src/secrets/secret-value.ts:378](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L378)

Custom inspector hook used by `console.log`, `util.inspect`, and
`util.format('%O', value)`. Returns a verbose, distinct marker so
a `SecretValue` is recognisable in REPL / structured output.

#### Returns

`string`

#### Stable

#### Implementation of

[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md).[`[NODEJS_INSPECT_CUSTOM]`](/api/@graphorin/core/interfaces/SecretValue.md#nodejs_inspect_custom)

***

### \[toPrimitive\]()

```ts
toPrimitive: string | number;
```

Defined in: [packages/security/src/secrets/secret-value.ts:355](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L355)

`Symbol.toPrimitive` takes precedence over `toString` /
`valueOf` for both `String` and `Number` hints, so this is the
primary leakage barrier for template literals.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `hint` | `string` |

#### Returns

`string` \| `number`

#### Stable

#### Implementation of

[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md).[`[toPrimitive]`](/api/@graphorin/core/interfaces/SecretValue.md#toprimitive)

***

### dispose()

```ts
dispose(): void;
```

Defined in: [packages/security/src/secrets/secret-value.ts:324](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L324)

Best-effort zeroization of the underlying buffer. Idempotent. Does
not affect derived V8 strings already created via `.use(fn)` /
`.reveal()` - that limitation is fundamental and documented.

#### Returns

`void`

#### Stable

#### Implementation of

[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md).[`dispose`](/api/@graphorin/core/interfaces/SecretValue.md#dispose)

***

### reveal()

```ts
reveal(): string;
```

Defined in: [packages/security/src/secrets/secret-value.ts:290](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L290)

One-shot escape hatch - returns the unwrapped string. Audited.
Prefer `.use(fn)` whenever possible.

#### Returns

`string`

#### Stable

#### Implementation of

[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md).[`reveal`](/api/@graphorin/core/interfaces/SecretValue.md#reveal)

***

### toJSON()

```ts
toJSON(): string;
```

Defined in: [packages/security/src/secrets/secret-value.ts:367](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L367)

`JSON.stringify({ apiKey: secret })` invokes `toJSON()` per
ECMA-262 § 25.5.2 - returning the placeholder ensures structured
logging never serializes the raw value.

#### Returns

`string`

#### Stable

#### Implementation of

[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md).[`toJSON`](/api/@graphorin/core/interfaces/SecretValue.md#tojson)

***

### toString()

```ts
toString(): string;
```

Defined in: [packages/security/src/secrets/secret-value.ts:344](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L344)

`String(value)` / `'' + value` / `Buffer.from(value)` go through
`Symbol.toPrimitive` first per ECMA-262 § 7.1.1 and end up here.

#### Returns

`string`

#### Stable

***

### ~~unwrap()~~

```ts
unwrap(): string;
```

Defined in: [packages/security/src/secrets/secret-value.ts:313](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L313)

#### Returns

`string`

#### Deprecated

Use `.reveal()` for the explicit one-shot read or
  `.use(fn)` for the preferred scoped read. Retained for the
  `0.x` compatibility window only - slated for removal in the
  next major release. The companion lint rule
  `@graphorin/no-secret-unwrap` flags every use of this method.

#### Stable

***

### use()

```ts
use<T>(fn): Promise<T>;
```

Defined in: [packages/security/src/secrets/secret-value.ts:247](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L247)

Run `fn` with the unwrapped string and return its (possibly
`Promise`-wrapped) result. Preferred over `.reveal()` because it
scopes the V8 string literal to a single call.

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

#### Stable

#### Implementation of

[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md).[`use`](/api/@graphorin/core/interfaces/SecretValue.md#use)

***

### useBuffer()

```ts
useBuffer<T>(fn): Promise<T>;
```

Defined in: [packages/security/src/secrets/secret-value.ts:268](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L268)

Run `fn` with the unwrapped value as a `Buffer`. Use this for
binary secrets (encryption keys, HMAC keys) where round-tripping
through a V8 string would defeat the wrapper's hygiene.

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

#### Stable

#### Implementation of

[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md).[`useBuffer`](/api/@graphorin/core/interfaces/SecretValue.md#usebuffer)

***

### fromBuffer()

```ts
static fromBuffer(buf, opts?): SecretValue;
```

Defined in: [packages/security/src/secrets/secret-value.ts:200](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L200)

Wrap a `Buffer`. The buffer is **defensively copied**; callers may
safely zero or reuse their input.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buf` | `Buffer` |
| `opts?` | [`SecretValueOptions`](/api/@graphorin/core/interfaces/SecretValueOptions.md) & \{ `ttlMs?`: `number`; \} |

#### Returns

`SecretValue`

#### Stable

***

### fromString()

```ts
static fromString(raw, opts?): SecretValue;
```

Defined in: [packages/security/src/secrets/secret-value.ts:190](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L190)

Wrap a UTF-8 string. Use this at the I/O boundary (env reads,
keyring reads, file reads, OAuth callback response) - not from
deep inside business logic where the raw value would already have
leaked to a V8 string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |
| `opts?` | [`SecretValueOptions`](/api/@graphorin/core/interfaces/SecretValueOptions.md) & \{ `ttlMs?`: `number`; \} |

#### Returns

`SecretValue`

#### Stable

***

### isSecretValue()

```ts
static isSecretValue(value): value is SecretValue;
```

Defined in: [packages/security/src/secrets/secret-value.ts:211](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L211)

Cross-realm safe `instanceof` replacement. Returns `true` for any
object carrying `Symbol.for('graphorin.SecretValue')` set to `true`
- including instances constructed in Worker threads / vm contexts.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

#### Returns

`value is SecretValue`

#### Stable

***

### timingSafeEquals()

```ts
static timingSafeEquals(a, b): boolean;
```

Defined in: [packages/security/src/secrets/secret-value.ts:224](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-value.ts#L224)

Constant-time byte equality. Returns `false` if either input has
been disposed or the lengths differ; otherwise delegates to
`crypto.timingSafeEqual` to avoid leaking length-independent
timing information.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | `SecretValue` |
| `b` | `SecretValue` |

#### Returns

`boolean`

#### Stable
