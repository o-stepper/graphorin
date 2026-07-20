[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DEFAULT\_TIMEOUTS\_MS

# Variable: DEFAULT\_TIMEOUTS\_MS

```ts
const DEFAULT_TIMEOUTS_MS: Readonly<Record<SandboxKind, number>>;
```

Defined in: packages/security/src/sandbox/sandbox.ts:99

**`Stable`**

Default per-tier policies, per the canonical sandbox tier table.
Operator overrides are merged into these defaults inside
`resolveSandbox(...)`.
