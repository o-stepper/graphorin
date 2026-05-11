import type { MemoryRecord, Tracer } from '@graphorin/core';
import { withMemorySpan } from '../internal/spans.js';
import type { MemoryStoreAdapter } from '../internal/storage-adapter.js';

/**
 * `SharedMemory` — many-to-many attach mode for blocks / facts /
 * rules across multiple agents. Storage adapters represent
 * attachments as a join table (`shared_attachments` in
 * `@graphorin/store-sqlite`).
 *
 * @stable
 */
export class SharedMemory {
  readonly #store: MemoryStoreAdapter;
  readonly #tracer: Tracer;

  constructor(args: { store: MemoryStoreAdapter; tracer: Tracer }) {
    this.#store = args.store;
    this.#tracer = args.tracer;
  }

  /** Attach `recordId` to `agentId`. Idempotent. */
  async attach(recordId: string, agentId: string, userId: string): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.shared',
      { userId, agentId },
      { 'memory.shared.action': 'attach', 'memory.shared.record_id': recordId },
      async () => {
        await this.#store.shared.attach(recordId, agentId);
      },
    );
  }

  /** Detach `recordId` from `agentId`. Idempotent. */
  async detach(recordId: string, agentId: string, userId: string): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.shared',
      { userId, agentId },
      { 'memory.shared.action': 'detach', 'memory.shared.record_id': recordId },
      async () => {
        await this.#store.shared.detach(recordId, agentId);
      },
    );
  }

  /** List every attachment for `agentId`. */
  async listFor(agentId: string, userId: string): Promise<ReadonlyArray<MemoryRecord>> {
    return withMemorySpan(
      this.#tracer,
      'memory.read.shared',
      { userId, agentId },
      {},
      async (span) => {
        const out = await this.#store.shared.listFor(agentId);
        span.setAttributes({ 'memory.read.shared.count': out.length });
        return out;
      },
    );
  }
}
