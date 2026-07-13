import type { Block, Sensitivity, SessionScope, Tracer, ZodLikeSchema } from '@graphorin/core';
import {
  WorkingBlockOverflowError,
  WorkingBlockReadOnlyError,
  WorkingBlockReplaceMismatchError,
} from '../errors/index.js';
import { newMemoryId } from '../internal/id.js';
import { withMemorySpan } from '../internal/spans.js';
import type { MemoryStoreAdapter } from '../internal/storage-adapter.js';

/**
 * Author-time block specification accepted by
 * {@link defineBlock} and {@link WorkingMemory.define}.
 *
 * @stable
 */
export interface BlockSpec {
  readonly label: string;
  readonly description?: string;
  readonly schema?: ZodLikeSchema<unknown>;
  /** Maximum length of the rendered value in characters. */
  readonly charLimit: number;
  /** Default `'internal'`. */
  readonly sensitivity?: Sensitivity;
  /** Default `false`. */
  readonly readOnly?: boolean;
  /**
   * Per-block default value. Applied on first definition only; later
   * runs preserve any value already in storage.
   */
  readonly defaultValue?: string;
  /** Default `'truncate'` - `'reject'` opt-in for strict use cases. */
  readonly overflowPolicy?: 'truncate' | 'reject';
  /** Optional free-form labels surfaced through `tags`. */
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Frozen block definition returned by {@link defineBlock}. Re-used by
 * the agent runtime / context engine to know which blocks should be
 * compiled into the system prompt every step.
 *
 * @stable
 */
export interface BlockDefinition {
  readonly label: string;
  readonly description?: string;
  readonly schema?: ZodLikeSchema<unknown>;
  readonly charLimit: number;
  readonly sensitivity: Sensitivity;
  readonly readOnly: boolean;
  readonly defaultValue?: string;
  readonly overflowPolicy: 'truncate' | 'reject';
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Build a frozen {@link BlockDefinition}. Surfaced as `blocks.define(...)`
 * for ergonomic call-sites; the underlying object is the same shape
 * the {@link WorkingMemory.define} method accepts.
 *
 * @stable
 */
export function defineBlock(spec: BlockSpec): BlockDefinition {
  if (!spec.label || spec.label.length === 0) {
    throw new TypeError('[graphorin/memory] BlockSpec.label must be a non-empty string.');
  }
  if (!Number.isInteger(spec.charLimit) || spec.charLimit <= 0) {
    throw new TypeError(
      `[graphorin/memory] BlockSpec.charLimit must be a positive integer, got ${String(spec.charLimit)}.`,
    );
  }
  return Object.freeze({
    label: spec.label,
    ...(spec.description !== undefined ? { description: spec.description } : {}),
    ...(spec.schema !== undefined ? { schema: spec.schema } : {}),
    charLimit: spec.charLimit,
    sensitivity: spec.sensitivity ?? 'internal',
    readOnly: spec.readOnly ?? false,
    ...(spec.defaultValue !== undefined ? { defaultValue: spec.defaultValue } : {}),
    overflowPolicy: spec.overflowPolicy ?? 'truncate',
    ...(spec.tags !== undefined ? { tags: Object.freeze([...spec.tags]) } : {}),
  });
}

/**
 * `WorkingMemory` - labeled, character-bounded blocks rendered into
 * every system prompt. Operations:
 *
 *  - `define(spec)`: idempotently registers a block definition; the
 *    block's row is created in storage on the next `write` call so
 *    operators can change `description` between runs without
 *    triggering a write.
 *  - `read(scope, label)` / `list(scope)`: surface the current block
 *    contents.
 *  - `write(scope, label, value)`: full replace.
 *  - `append(scope, label, content)`: append-with-newline.
 *  - `replace(scope, label, oldUnique, newText)`: targeted replace
 *    with a uniqueness check.
 *  - `compile(scope)`: render the active blocks for the context
 *    engine (used by Phase 10d).
 *
 * @stable
 */
export class WorkingMemory {
  readonly #store: MemoryStoreAdapter;
  readonly #tracer: Tracer;
  readonly #defs: Map<string, BlockDefinition>;

  constructor(args: { store: MemoryStoreAdapter; tracer: Tracer }) {
    this.#store = args.store;
    this.#tracer = args.tracer;
    this.#defs = new Map();
  }

  /** Register a block definition. Returns the same definition object. */
  define(definition: BlockDefinition): BlockDefinition {
    this.#defs.set(definition.label, definition);
    return definition;
  }

  /** Snapshot of every registered definition. */
  definitions(): ReadonlyArray<BlockDefinition> {
    return Array.from(this.#defs.values());
  }

  /** Lookup a definition by label. */
  definitionFor(label: string): BlockDefinition | undefined {
    return this.#defs.get(label);
  }

  /** List active (non-deleted) blocks for the supplied scope. */
  async list(scope: SessionScope): Promise<ReadonlyArray<Block>> {
    return withMemorySpan(this.#tracer, 'memory.read.working', scope, {}, async (span) => {
      const out = await this.#store.working.list(scope);
      span.setAttributes({ 'memory.read.working.count': out.length });
      return out;
    });
  }

  /** Read a single block's value (or `null` when absent). */
  async read(scope: SessionScope, label: string): Promise<string | null> {
    return withMemorySpan(
      this.#tracer,
      'memory.read.working',
      scope,
      { 'memory.block.label': label },
      async (span) => {
        const block = await this.#store.working.get(scope, label);
        span.setAttributes({ 'memory.read.working.found': block !== null });
        if (block !== null) return block.value;
        // MST-8: a defined-but-unwritten block answers with its declared
        // defaultValue (previously advertised, copied into the
        // definition, and then never read by anything).
        const definition = this.#defs.get(label);
        return definition?.defaultValue ?? null;
      },
    );
  }

  /** Replace a block's value entirely. Honours overflow policy. */
  async write(scope: SessionScope, label: string, value: string): Promise<Block> {
    return this.#mutate(scope, label, async () => value);
  }

  /** Append `content` to a block (with a newline separator). */
  async append(scope: SessionScope, label: string, content: string): Promise<Block> {
    return this.#mutate(scope, label, async (current) => {
      if (current === '' || current === undefined) return content;
      return `${current}\n${content}`;
    });
  }

  /**
   * Replace the unique substring `oldUnique` inside the block's value
   * with `newText`. Throws `WorkingBlockReplaceMismatchError` when
   * the substring is missing or appears more than once.
   */
  async replace(
    scope: SessionScope,
    label: string,
    oldUnique: string,
    newText: string,
  ): Promise<Block> {
    return this.#mutate(scope, label, async (current) => {
      const haystack = current ?? '';
      const occurrences = countOccurrences(haystack, oldUnique);
      if (occurrences !== 1) {
        throw new WorkingBlockReplaceMismatchError(label, occurrences);
      }
      return haystack.replace(oldUnique, newText);
    });
  }

  /** Run `mutator(current) => next` and persist the result. */
  async rethink(
    scope: SessionScope,
    label: string,
    mutator: (current: string) => string | Promise<string>,
  ): Promise<Block> {
    return this.#mutate(scope, label, async (current) => mutator(current ?? ''));
  }

  /** Soft-delete a block. */
  async forget(scope: SessionScope, label: string, reason?: string): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.working',
      scope,
      { 'memory.block.label': label, 'memory.write.working.action': 'forget' },
      async () => {
        await this.#store.working.delete(scope, label, reason);
      },
    );
  }

  /**
   * Hard-delete a block (wave-D D2, GDPR path). Unlike {@link forget}
   * (soft tombstone), the stored value is gone. This is the erasure
   * surface for USER-scoped blocks (e.g. the `profile` projection): the
   * session-delete cascade never reaches rows without a session id, so
   * user-level erasure must call this explicitly. Throws when the
   * storage adapter does not implement the optional
   * `WorkingMemoryStoreExt.purge` - a silent soft-delete fallback would
   * misreport erasure.
   */
  async purge(scope: SessionScope, label: string): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.working',
      scope,
      { 'memory.block.label': label, 'memory.write.working.action': 'purge' },
      async () => {
        if (typeof this.#store.working.purge !== 'function') {
          throw new TypeError(
            '[graphorin/memory] the storage adapter does not implement working.purge ' +
              '(hard block erasure). Upgrade the adapter or fall back to forget() ' +
              '(soft-delete) explicitly.',
          );
        }
        await this.#store.working.purge(scope, label);
      },
    );
  }

  /**
   * Attach a working block to an additional agent. Backed by the
   * adapter's `shared.attach(...)` join table so multi-agent crews
   * can share the same block without duplicating storage.
   */
  async attach(scope: SessionScope, blockId: string, agentId: string): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.working',
      scope,
      {
        'memory.write.working.action': 'attach',
        'memory.block.id': blockId,
        'memory.write.working.target_agent_id': agentId,
      },
      async () => {
        await this.#store.shared.attach(blockId, agentId);
      },
    );
  }

  /** Detach a working block from an agent. */
  async detach(scope: SessionScope, blockId: string, agentId: string): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.working',
      scope,
      {
        'memory.write.working.action': 'detach',
        'memory.block.id': blockId,
        'memory.write.working.target_agent_id': agentId,
      },
      async () => {
        await this.#store.shared.detach(blockId, agentId);
      },
    );
  }

  /**
   * Render a deterministic `<memory_blocks>` XML fragment for the
   * supplied scope. The full layered system prompt (six layers) is
   * produced by Phase 10d's ContextEngine; this method ships the
   * minimum-viable rendering used by the smoke acceptance criteria.
   *
   * The optional `agentId` argument is reserved for the per-agent
   * filtering Phase 10d wires through. In Phase 10a the argument is
   * accepted but ignored - the rendering is scope-wide.
   */
  async compile(scope: SessionScope, agentId?: string): Promise<string> {
    void agentId;
    const blocks = await this.list(scope);
    if (blocks.length === 0) return '';
    const lines = ['<memory_blocks>'];
    for (const block of blocks) {
      const description =
        block.description !== undefined ? ` description="${escapeXml(block.description)}"` : '';
      lines.push(`  <block label="${escapeXml(block.label)}"${description}>`);
      lines.push(`    ${escapeXml(block.value)}`);
      lines.push('  </block>');
    }
    lines.push('</memory_blocks>');
    return lines.join('\n');
  }

  async #mutate(
    scope: SessionScope,
    label: string,
    nextValueFn: (current: string | undefined) => Promise<string>,
  ): Promise<Block> {
    return withMemorySpan(
      this.#tracer,
      'memory.write.working',
      scope,
      { 'memory.block.label': label },
      async (span) => {
        const definition = this.#requireDefinition(label);
        if (definition.readOnly === true) {
          // MRET-14: a dedicated kind - the old
          // WorkingBlockReplaceMismatchError(label, 0) read as "substring
          // matched 0 times" and misled replace-retry callers.
          throw new WorkingBlockReadOnlyError(label);
        }
        const existing = await this.#store.working.get(scope, label);
        // MST-8: first materialization starts from the declared default,
        // so an append/replace on an unwritten block composes with it.
        const candidate = await nextValueFn(existing?.value ?? definition.defaultValue);
        const enforcedValue = enforceCharLimit(candidate, definition);
        const now = new Date().toISOString();
        const id = existing?.id ?? newMemoryId('block');
        const block: Block = {
          id,
          kind: 'working',
          userId: scope.userId,
          ...(scope.sessionId !== undefined ? { sessionId: scope.sessionId } : {}),
          ...(scope.agentId !== undefined ? { agentId: scope.agentId } : {}),
          sensitivity: definition.sensitivity,
          label,
          ...(definition.description !== undefined ? { description: definition.description } : {}),
          value: enforcedValue,
          charLimit: definition.charLimit,
          readOnly: definition.readOnly,
          ...(definition.tags !== undefined ? { tags: definition.tags } : {}),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        await this.#store.working.upsert(scope, block);
        span.setAttributes({
          'memory.write.working.action': existing === null ? 'create' : 'update',
          'memory.write.working.length': enforcedValue.length,
        });
        return block;
      },
    );
  }

  #requireDefinition(label: string): BlockDefinition {
    const def = this.#defs.get(label);
    if (def !== undefined) return def;
    throw new TypeError(
      `[graphorin/memory] working block '${label}' was not defined. ` +
        'Call memory.working.define(blocks.define({...})) before writing to it.',
    );
  }
}

function enforceCharLimit(value: string, definition: BlockDefinition): string {
  if (value.length <= definition.charLimit) return value;
  if (definition.overflowPolicy === 'reject') {
    throw new WorkingBlockOverflowError(definition.label, value.length, definition.charLimit);
  }
  return value.slice(0, definition.charLimit);
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let idx = 0;
  for (;;) {
    const next = haystack.indexOf(needle, idx);
    if (next === -1) return count;
    count += 1;
    idx = next + needle.length;
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
