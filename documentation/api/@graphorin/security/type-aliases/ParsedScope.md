[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ParsedScope

# Type Alias: ParsedScope

```ts
type ParsedScope = 
  | {
  action: string;
  kind: "two-segment";
  raw: string;
  resource: string;
}
  | {
  action: string;
  kind: "three-segment";
  raw: string;
  resource: string;
  target: string;
};
```

Defined in: packages/security/src/auth/scope.ts:24

Result of `parseScope(...)`. The `kind` discriminator lets callers
branch between two- and three-segment scopes without re-parsing the
raw string.

## Stable
