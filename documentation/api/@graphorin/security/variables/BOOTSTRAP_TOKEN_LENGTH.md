[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / BOOTSTRAP\_TOKEN\_LENGTH

# Variable: BOOTSTRAP\_TOKEN\_LENGTH

```ts
const BOOTSTRAP_TOKEN_LENGTH: 43 = 43;
```

Defined in: packages/security/src/hardening/crypto.ts:28

**`Stable`**

Canonical base62-url encoded width for the 32-byte (256-bit)
bootstrap token. `ceil(256 / log2(62)) = 43`; the encoder pads to
this width so every emitted token is the same length, regardless
of how many leading bytes happen to be small. Stable downstream
verifiers can reject tokens whose width drifts.
