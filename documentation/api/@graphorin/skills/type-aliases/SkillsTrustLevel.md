[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SkillsTrustLevel

# Type Alias: SkillsTrustLevel

```ts
type SkillsTrustLevel = 
  | SkillTrustLevel
  | "unknown";
```

Defined in: packages/skills/src/types/index.ts:31

Trust level recognised by the skills loader. Extends the
supply-chain trust ladder with a third `'unknown'` value the
loader uses for skills that have no explicit declaration. The
sandbox tier resolver treats `'unknown'` like `'untrusted'`
(mandatory `worker-threads + no-net + no-fs`); the supply-chain
installer treats it as untrusted EXCEPT that the signature
requirement is downgraded from mandatory to optional — signature
is a trust upgrade, not a gate (Phase 08 § Risks & mitigations).

## Stable
