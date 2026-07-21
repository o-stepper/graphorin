[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / TrustClass

# Type Alias: TrustClass

```ts
type TrustClass = "loopback" | "public-tls" | "public-mtls" | "untrusted-skill";
```

Defined in: packages/agent/src/lateral-leak/merge-guard.ts:18

**`Stable`**

Trust-class baseline used by the guard's `sourceTrust`
computation. Mirrors the DEC-149 trust-class taxonomy from
`@graphorin/provider`.
