[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DEFAULT\_MEMORY\_LIMITS\_MB

# Variable: DEFAULT\_MEMORY\_LIMITS\_MB

```ts
const DEFAULT_MEMORY_LIMITS_MB: Readonly<Record<SandboxKind, number>>;
```

Defined in: packages/security/src/sandbox/sandbox.ts:113

Default per-tier memory limits (MB). The defaults follow the
canonical sandbox tier table — `worker-threads` 256 MB; mandatory
untrusted-skill tier 128 MB; `isolated-vm` 128 MB.

## Stable
