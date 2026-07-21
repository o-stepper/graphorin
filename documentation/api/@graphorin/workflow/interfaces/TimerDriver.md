[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / TimerDriver

# Interface: TimerDriver

Defined in: packages/workflow/src/timer-driver.ts:90

**`Stable`**

Handle returned by [createTimerDriver](/api/@graphorin/workflow/functions/createTimerDriver.md).

## Methods

### start()

```ts
start(): void;
```

Defined in: packages/workflow/src/timer-driver.ts:91

#### Returns

`void`

***

### status()

```ts
status(): TimerDriverStatus;
```

Defined in: packages/workflow/src/timer-driver.ts:93

#### Returns

[`TimerDriverStatus`](/api/@graphorin/workflow/interfaces/TimerDriverStatus.md)

***

### stop()

```ts
stop(): void;
```

Defined in: packages/workflow/src/timer-driver.ts:92

#### Returns

`void`

***

### sweep()

```ts
sweep(): Promise<number>;
```

Defined in: packages/workflow/src/timer-driver.ts:95

Run one poll pass immediately; resolves with the fired count.

#### Returns

`Promise`\&lt;`number`\&gt;
