[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / InjectionClassifier

# Interface: InjectionClassifier

Defined in: packages/security/dist/inspect/injection-classifier.d.ts:27

**`Stable`**

The pluggable classifier contract.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable engine id for audit rows, e.g. `'deberta-injection-v2'`. | packages/security/dist/inspect/injection-classifier.d.ts:29 |

## Methods

### classify()

```ts
classify(input): Promise<InjectionClassification>;
```

Defined in: packages/security/dist/inspect/injection-classifier.d.ts:30

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`InjectionClassifierInput`](/api/@graphorin/security/interfaces/InjectionClassifierInput.md) |

#### Returns

`Promise`\&lt;[`InjectionClassification`](/api/@graphorin/security/interfaces/InjectionClassification.md)\&gt;
