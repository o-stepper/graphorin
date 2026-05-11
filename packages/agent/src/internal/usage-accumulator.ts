/**
 * Minimal {@link UsageAccumulator} implementation used by the agent
 * runtime when the consumer does not pass a custom one through
 * `RunContext.usage`. Tracks per-model breakdown and a running
 * aggregate.
 *
 * @packageDocumentation
 */

import type { ModelUsage, Usage, UsageAccumulator, UsageSnapshot } from '@graphorin/core';

export class InMemoryUsageAccumulator implements UsageAccumulator {
  #aggregate: Usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  readonly #byModel = new Map<string, ModelUsage>();

  get total(): Usage {
    return this.#aggregate;
  }

  get byModel(): ReadonlyMap<string, ModelUsage> {
    return this.#byModel;
  }

  add(modelId: string, usage: Usage): void {
    const prev = this.#byModel.get(modelId);
    if (prev === undefined) {
      this.#byModel.set(modelId, {
        modelId,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        callCount: 1,
        ...(usage.reasoningTokens !== undefined ? { reasoningTokens: usage.reasoningTokens } : {}),
        ...(usage.cost !== undefined ? { cost: usage.cost } : {}),
      });
    } else {
      const merged: ModelUsage = {
        modelId,
        promptTokens: prev.promptTokens + usage.promptTokens,
        completionTokens: prev.completionTokens + usage.completionTokens,
        totalTokens: prev.totalTokens + usage.totalTokens,
        callCount: prev.callCount + 1,
        ...(usage.reasoningTokens !== undefined || prev.reasoningTokens !== undefined
          ? {
              reasoningTokens: (prev.reasoningTokens ?? 0) + (usage.reasoningTokens ?? 0),
            }
          : {}),
      };
      this.#byModel.set(modelId, merged);
    }
    this.#aggregate = {
      promptTokens: this.#aggregate.promptTokens + usage.promptTokens,
      completionTokens: this.#aggregate.completionTokens + usage.completionTokens,
      totalTokens: this.#aggregate.totalTokens + usage.totalTokens,
      ...(usage.reasoningTokens !== undefined || this.#aggregate.reasoningTokens !== undefined
        ? {
            reasoningTokens: (this.#aggregate.reasoningTokens ?? 0) + (usage.reasoningTokens ?? 0),
          }
        : {}),
    };
  }

  reset(): void {
    this.#aggregate = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    this.#byModel.clear();
  }

  snapshot(): UsageSnapshot {
    return {
      total: { ...this.#aggregate },
      byModel: Array.from(this.#byModel.values()).map((m) => ({ ...m })),
    };
  }
}
