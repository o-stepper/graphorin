[**Graphorin API reference v0.13.8**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [testkit](/api/@graphorin/channels/testkit/index.md) / ConformanceTestApi

# Interface: ConformanceTestApi

Defined in: packages/channels/src/testkit/conformance.ts:30

**`Stable`**

The subset of the vitest/jest API the conformance suite needs -
injected so this module has no test-framework dependency.

## Methods

### describe()

```ts
describe(name, body): void;
```

Defined in: packages/channels/src/testkit/conformance.ts:31

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `body` | () => `void` |

#### Returns

`void`

***

### expect()

```ts
expect(value): {
  toBe: void;
  toBeDefined: void;
  toBeGreaterThan: void;
  toBeTruthy: void;
  toEqual: void;
};
```

Defined in: packages/channels/src/testkit/conformance.ts:33

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

#### Returns

```ts
{
  toBe: void;
  toBeDefined: void;
  toBeGreaterThan: void;
  toBeTruthy: void;
  toEqual: void;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `toBe()` | (`expected`) => `void` | packages/channels/src/testkit/conformance.ts:34 |
| `toBeDefined()` | () => `void` | packages/channels/src/testkit/conformance.ts:35 |
| `toBeGreaterThan()` | (`expected`) => `void` | packages/channels/src/testkit/conformance.ts:36 |
| `toBeTruthy()` | () => `void` | packages/channels/src/testkit/conformance.ts:38 |
| `toEqual()` | (`expected`) => `void` | packages/channels/src/testkit/conformance.ts:37 |

***

### it()

```ts
it(name, body): void;
```

Defined in: packages/channels/src/testkit/conformance.ts:32

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `body` | () => `void` \| `Promise`\&lt;`void`\&gt; |

#### Returns

`void`
