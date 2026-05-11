[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenVerifier

# Class: TokenVerifier

Defined in: packages/security/src/auth/verify.ts:143

Stateful verifier. One instance is constructed per server runtime;
tests use the optional `now` to drive the sliding windows.

## Stable

## Constructors

### Constructor

```ts
new TokenVerifier(options): TokenVerifier;
```

Defined in: packages/security/src/auth/verify.ts:162

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`VerifierOptions`](/api/@graphorin/security/interfaces/VerifierOptions.md) |

#### Returns

`TokenVerifier`

## Methods

### \_simulateOverloadForTesting()

```ts
_simulateOverloadForTesting(): never;
```

Defined in: packages/security/src/auth/verify.ts:315

Throw an overload error if invoked. Test hook for the cap.

#### Returns

`never`

***

### clearIpLockout()

```ts
clearIpLockout(ip): void;
```

Defined in: packages/security/src/auth/verify.ts:309

Lift a per-IP lockout. Used by privileged operators.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ip` | `string` |

#### Returns

`void`

***

### clearTokenLockout()

```ts
clearTokenLockout(tokenId): void;
```

Defined in: packages/security/src/auth/verify.ts:303

Lift a per-token lockout. Used by `revokeToken` / `rotateToken`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tokenId` | `string` |

#### Returns

`void`

***

### invalidate()

```ts
invalidate(rawTokenOrHashHex): void;
```

Defined in: packages/security/src/auth/verify.ts:289

Force-evict a single token from the warm cache.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rawTokenOrHashHex` | `string` |

#### Returns

`void`

***

### invalidateAll()

```ts
invalidateAll(): void;
```

Defined in: packages/security/src/auth/verify.ts:298

Drop every cached entry.

#### Returns

`void`

***

### status()

```ts
status(): TokenVerifierStatus;
```

Defined in: packages/security/src/auth/verify.ts:279

Snapshot of the verifier's current load. Useful for the
`/v1/health/secrets` endpoint and for in-process metrics.

#### Returns

[`TokenVerifierStatus`](/api/@graphorin/security/interfaces/TokenVerifierStatus.md)

#### Stable

***

### verify()

```ts
verify(rawToken, ctx?): Promise<VerifyResult>;
```

Defined in: packages/security/src/auth/verify.ts:184

Run the verify pipeline against a single raw token. The promise
always resolves; failures surface as `{ ok: false, reason }` so
callers can map them straight to HTTP responses.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rawToken` | `string` |
| `ctx` | [`VerifyContext`](/api/@graphorin/security/interfaces/VerifyContext.md) |

#### Returns

`Promise`\&lt;[`VerifyResult`](/api/@graphorin/security/type-aliases/VerifyResult.md)\&gt;

#### Stable
