[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / PROVIDER\_CLASS\_TO\_GEN\_AI\_SYSTEM

# Variable: PROVIDER\_CLASS\_TO\_GEN\_AI\_SYSTEM

```ts
const PROVIDER_CLASS_TO_GEN_AI_SYSTEM: ReadonlyArray<readonly [RegExp, GenAISystem]>;
```

Defined in: packages/observability/src/gen-ai/system-derivation.ts:16

**`Stable`**

Canonical mapping from a provider class name (or substring) to the
`gen_ai.system` enum value. The table is an export so consumers
(e.g. provider adapters in Phase 06) can introspect or extend it.
