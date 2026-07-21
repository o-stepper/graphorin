[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / InjectionClassifier

# Interface: InjectionClassifier

Defined in: packages/security/src/inspect/injection-classifier.ts:50

**`Stable`**

The pluggable classifier contract.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable engine id for audit rows, e.g. `'deberta-injection-v2'`. | packages/security/src/inspect/injection-classifier.ts:52 |

## Methods

### classify()

```ts
classify(input): Promise<InjectionClassification>;
```

Defined in: packages/security/src/inspect/injection-classifier.ts:53

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`InjectionClassifierInput`](/api/@graphorin/security/interfaces/InjectionClassifierInput.md) |

#### Returns

`Promise`\&lt;[`InjectionClassification`](/api/@graphorin/security/interfaces/InjectionClassification.md)\&gt;
