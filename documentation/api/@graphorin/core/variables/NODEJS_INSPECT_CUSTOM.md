[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / NODEJS\_INSPECT\_CUSTOM

# Variable: NODEJS\_INSPECT\_CUSTOM

```ts
const NODEJS_INSPECT_CUSTOM: unique symbol;
```

Defined in: [packages/core/src/contracts/secret-value.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secret-value.ts#L20)

Well-known symbol used by `node:util.inspect()` to format the wrapper.
Re-exported here so downstream packages can reference it without taking
an unconditional dependency on `node:util`.

Equivalent to `Symbol.for('nodejs.util.inspect.custom')`.

## Stable
