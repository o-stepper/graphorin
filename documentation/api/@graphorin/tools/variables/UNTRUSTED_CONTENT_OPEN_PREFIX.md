[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / UNTRUSTED\_CONTENT\_OPEN\_PREFIX

# Variable: UNTRUSTED\_CONTENT\_OPEN\_PREFIX

```ts
const UNTRUSTED_CONTENT_OPEN_PREFIX: "<<<untrusted_content" = '<<<untrusted_content';
```

Defined in: [packages/tools/src/inbound/envelope.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/envelope.ts#L35)

Opening delimiter prefix of the untrusted-content envelope. The full
opening marker carries attributes and the `>>>` terminator; the
prefix is the stable part both the wrapper and the neutralizer key
on.

## Stable
