[**Graphorin API reference v0.10.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [testkit](/api/@graphorin/channels/testkit/index.md) / ConformanceTestApi

# Interface: ConformanceTestApi

Defined in: [packages/channels/src/testkit/conformance.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/conformance.ts#L30)

The subset of the vitest/jest API the conformance suite needs -
injected so this module has no test-framework dependency.

## Stable

## Methods

### describe()

```ts
describe(name, body): void;
```

Defined in: [packages/channels/src/testkit/conformance.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/conformance.ts#L31)

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

Defined in: [packages/channels/src/testkit/conformance.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/conformance.ts#L33)

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
| `toBe()` | (`expected`) => `void` | [packages/channels/src/testkit/conformance.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/conformance.ts#L34) |
| `toBeDefined()` | () => `void` | [packages/channels/src/testkit/conformance.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/conformance.ts#L35) |
| `toBeGreaterThan()` | (`expected`) => `void` | [packages/channels/src/testkit/conformance.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/conformance.ts#L36) |
| `toBeTruthy()` | () => `void` | [packages/channels/src/testkit/conformance.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/conformance.ts#L38) |
| `toEqual()` | (`expected`) => `void` | [packages/channels/src/testkit/conformance.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/conformance.ts#L37) |

***

### it()

```ts
it(name, body): void;
```

Defined in: [packages/channels/src/testkit/conformance.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/conformance.ts#L32)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `body` | () => `void` \| `Promise`\&lt;`void`\&gt; |

#### Returns

`void`
