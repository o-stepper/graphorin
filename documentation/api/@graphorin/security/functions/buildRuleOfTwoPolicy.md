[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / buildRuleOfTwoPolicy

# Function: buildRuleOfTwoPolicy()

```ts
function buildRuleOfTwoPolicy(profile): RuleOfTwoCompilation;
```

Defined in: [packages/security/src/policy/tool-argument-policy.ts:164](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L164)

Compile a Rule-of-Two profile into an enforceable policy. When the
profile denies external side effects, the compilation yields a
`'read-only'` capability floor AND a forbid rule over writer tools;
when it denies sensitive data, sensitive tools are default-denied.
Holding all three legs is surfaced (`holdsFullTrifecta`) so the caller
can refuse or warn - the preset never silently permits the trifecta.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `profile` | [`RuleOfTwoProfile`](/api/@graphorin/security/interfaces/RuleOfTwoProfile.md) |

## Returns

[`RuleOfTwoCompilation`](/api/@graphorin/security/interfaces/RuleOfTwoCompilation.md)

## Stable
