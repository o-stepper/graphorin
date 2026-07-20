[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SandboxTrustLevel

# Type Alias: SandboxTrustLevel

```ts
type SandboxTrustLevel = "built-in" | "user-defined" | "trusted" | "untrusted";
```

Defined in: packages/security/src/sandbox/tier-resolver.ts:38

**`Stable`**

Trust level discriminator. The union mirrors the
`graphorin-trust-level` frontmatter axis from the skills loader,
plus the synthetic `'built-in'` value used by trusted built-in tools.
