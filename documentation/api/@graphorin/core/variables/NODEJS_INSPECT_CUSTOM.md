[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / NODEJS\_INSPECT\_CUSTOM

# Variable: NODEJS\_INSPECT\_CUSTOM

```ts
const NODEJS_INSPECT_CUSTOM: unique symbol;
```

Defined in: packages/core/src/contracts/secret-value.ts:20

**`Stable`**

Well-known symbol used by `node:util.inspect()` to format the wrapper.
Re-exported here so downstream packages can reference it without taking
an unconditional dependency on `node:util`.

Equivalent to `Symbol.for('nodejs.util.inspect.custom')`.
