[**Graphorin API reference v0.13.11**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [config](/api/@graphorin/server/config/index.md) / SecretRefString

# Type Alias: SecretRefString

```ts
type SecretRefString = string;
```

Defined in: packages/server/src/config.ts:29

**`Stable`**

String literal that flags a value as a `SecretRef` URI. The
server's pre-bind step resolves every `*Ref` field through the
`@graphorin/security` resolver registry before binding the
listener; an unresolvable ref fails fast with
`PrebindSecretUnresolvableError`.
