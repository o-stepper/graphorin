[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / createDataFlowPolicy

# Function: createDataFlowPolicy()

```ts
function createDataFlowPolicy(config): DataFlowPolicy;
```

Defined in: packages/security/src/dataflow/policy.ts:58

**`Stable`**

Build a [DataFlowPolicy](/api/@graphorin/security/interfaces/DataFlowPolicy.md) from config.

Decision procedure for a sink call:
1. `mode === 'off'` or the tool is not a sink → `allow`.
2. Arguments carry untrusted content verbatim → `untrusted-to-sink`.
3. Else, if `derivedTaint: 'strict'` and untrusted content has entered
   the run → `derived-untrusted-to-sink` (paraphrase-robust).
4. Else, if `guardTrifecta` (default on) and both untrusted **and**
   secret-tier content have entered the run → `lethal-trifecta`.
5. No tainted flow → `allow`.
6. A tainted flow into a `declassifySinks` sink → `declassify` (audited,
   allowed). Otherwise `'shadow'` → `flag` (audited, allowed),
   `'enforce'` → `block`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`DataFlowPolicyConfig`](/api/@graphorin/security/interfaces/DataFlowPolicyConfig.md) |

## Returns

[`DataFlowPolicy`](/api/@graphorin/security/interfaces/DataFlowPolicy.md)
