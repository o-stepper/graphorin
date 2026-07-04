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
        ...(usage.cachedReadTokens !== undefined
          ? { cachedReadTokens: usage.cachedReadTokens }
          : {}),
        ...(usage.cacheWriteTokens !== undefined
          ? { cacheWriteTokens: usage.cacheWriteTokens }
          : {}),
        ...(usage.cost !== undefined ? { cost: usage.cost } : {}),
      });
    } else {
      const merged: ModelUsage = {
        modelId,
        promptTokens: prev.promptTokens + usage.promptTokens,
        completionTokens: prev.completionTokens + usage.completionTokens,
        totalTokens: prev.totalTokens + usage.totalTokens,
        callCount: prev.callCount + 1,
        ...sumOptional('reasoningTokens', prev.reasoningTokens, usage.reasoningTokens),
        ...sumOptional('cachedReadTokens', prev.cachedReadTokens, usage.cachedReadTokens),
        ...sumOptional('cacheWriteTokens', prev.cacheWriteTokens, usage.cacheWriteTokens),
      };
      this.#byModel.set(modelId, merged);
    }
    this.#aggregate = {
      promptTokens: this.#aggregate.promptTokens + usage.promptTokens,
      completionTokens: this.#aggregate.completionTokens + usage.completionTokens,
      totalTokens: this.#aggregate.totalTokens + usage.totalTokens,
      ...sumOptional('reasoningTokens', this.#aggregate.reasoningTokens, usage.reasoningTokens),
      ...sumOptional('cachedReadTokens', this.#aggregate.cachedReadTokens, usage.cachedReadTokens),
      ...sumOptional('cacheWriteTokens', this.#aggregate.cacheWriteTokens, usage.cacheWriteTokens),
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

/**
 * Sum an optional token field: present in the output only when at least
 * one side carries it (so a run that never saw the field keeps the same
 * serialized shape as before the field existed).
 */
function sumOptional<K extends string>(
  key: K,
  a: number | undefined,
  b: number | undefined,
): Partial<Record<K, number>> {
  if (a === undefined && b === undefined) return {};
  return { [key]: (a ?? 0) + (b ?? 0) } as Partial<Record<K, number>>;
}
