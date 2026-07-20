[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ValidateSecretRefsOptions

# Interface: ValidateSecretRefsOptions

Defined in: packages/security/src/secrets/secret-ref.ts:86

**`Stable`**

Options for `validateSecretRefs(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowliteral"></a> `allowLiteral?` | `readonly` | `boolean` | Allow `literal:` refs in the input. Off by default - `literal:` is gated by the resolver, but validation can fail-fast as well. | packages/security/src/secrets/secret-ref.ts:91 |
| <a id="property-fieldnamematcher"></a> `fieldNameMatcher?` | `readonly` | (`key`) => `boolean` | Names of fields that should be treated as `*Ref` strings. Defaults to a heuristic match: any string-valued field whose key ends in `Ref`, `_ref`, `REF`, or `_REF`. | packages/security/src/secrets/secret-ref.ts:97 |
| <a id="property-knownschemes"></a> `knownSchemes?` | `readonly` | readonly `string`[] | Restrict the accepted scheme set. Defaults to `BUILTIN_SCHEMES` plus any scheme registered through `registerResolver(...)`. | packages/security/src/secrets/secret-ref.ts:102 |
