[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / TimerDriver

# Interface: TimerDriver

Defined in: [packages/workflow/src/timer-driver.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/timer-driver.ts#L90)

Handle returned by [createTimerDriver](/api/@graphorin/workflow/functions/createTimerDriver.md).

## Stable

## Methods

### start()

```ts
start(): void;
```

Defined in: [packages/workflow/src/timer-driver.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/timer-driver.ts#L91)

#### Returns

`void`

***

### status()

```ts
status(): TimerDriverStatus;
```

Defined in: [packages/workflow/src/timer-driver.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/timer-driver.ts#L93)

#### Returns

[`TimerDriverStatus`](/api/@graphorin/workflow/interfaces/TimerDriverStatus.md)

***

### stop()

```ts
stop(): void;
```

Defined in: [packages/workflow/src/timer-driver.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/timer-driver.ts#L92)

#### Returns

`void`

***

### sweep()

```ts
sweep(): Promise<number>;
```

Defined in: [packages/workflow/src/timer-driver.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/timer-driver.ts#L95)

Run one poll pass immediately; resolves with the fired count.

#### Returns

`Promise`\&lt;`number`\&gt;
