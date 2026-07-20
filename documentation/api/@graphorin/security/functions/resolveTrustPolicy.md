[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / resolveTrustPolicy

# Function: resolveTrustPolicy()

```ts
function resolveTrustPolicy(source, trustLevel): ResolvedSkillTrustPolicy;
```

Defined in: packages/security/src/supply-chain/policy.ts:132

**`Stable`**

Resolve the trust policy for a (source, trust-level) tuple. The
resolver enforces the project-wide rule that npm/git installs
always run with `--ignore-scripts` and that signature verification
is mandatory for `untrusted`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | [`SkillSource`](/api/@graphorin/security/type-aliases/SkillSource.md) |
| `trustLevel` | \| [`SkillTrustLevel`](/api/@graphorin/security/type-aliases/SkillTrustLevel.md) \| `undefined` |

## Returns

[`ResolvedSkillTrustPolicy`](/api/@graphorin/security/interfaces/ResolvedSkillTrustPolicy.md)
