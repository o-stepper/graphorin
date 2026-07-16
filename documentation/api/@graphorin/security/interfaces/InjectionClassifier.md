[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / InjectionClassifier

# Interface: InjectionClassifier

Defined in: [packages/security/src/inspect/injection-classifier.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/inspect/injection-classifier.ts#L50)

The pluggable classifier contract.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable engine id for audit rows, e.g. `'deberta-injection-v2'`. | [packages/security/src/inspect/injection-classifier.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/inspect/injection-classifier.ts#L52) |

## Methods

### classify()

```ts
classify(input): Promise<InjectionClassification>;
```

Defined in: [packages/security/src/inspect/injection-classifier.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/inspect/injection-classifier.ts#L53)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`InjectionClassifierInput`](/api/@graphorin/security/interfaces/InjectionClassifierInput.md) |

#### Returns

`Promise`\&lt;[`InjectionClassification`](/api/@graphorin/security/interfaces/InjectionClassification.md)\&gt;
