import type {
  Block,
  Episode,
  Fact,
  MemoryHit,
  MemoryRecord,
  MemorySearchOptions,
  Rule,
} from '../types/memory.js';
import type { Message } from '../types/message.js';
import type { SessionScope } from '../types/session-scope.js';

/**
 * Persistent storage interface for the six memory tiers. Implementations
 * live in the storage adapter packages (`@graphorin/store-sqlite` is the
 * default).
 *
 * Sub-namespaces map 1:1 to the six tiers so each implementation can
 * pick its own physical layout (one big table, six tables, mixed) while
 * preserving append-only semantics - soft-delete only.
 *
 * @stable
 */
export interface MemoryStore {
  readonly working: WorkingMemoryStore;
  readonly session: SessionMemoryStore;
  readonly episodic: EpisodicMemoryStore;
  readonly semantic: SemanticMemoryStore;
  readonly procedural: ProceduralMemoryStore;
  readonly shared: SharedMemoryStore;

  /** Initialize / migrate the underlying storage. Idempotent. */
  init(): Promise<void>;
  /** Cleanly close any underlying handles. Idempotent. */
  close(): Promise<void>;
}

/** @stable */
export interface WorkingMemoryStore {
  list(scope: SessionScope): Promise<ReadonlyArray<Block>>;
  get(scope: SessionScope, label: string): Promise<Block | null>;
  upsert(scope: SessionScope, block: Block): Promise<void>;
  delete(scope: SessionScope, label: string, reason?: string): Promise<void>;
}

/**
 * Reference returned by `SessionMemoryStore.push(...)`. Carries the
 * persisted message id and a sequence number for ordering.
 *
 * @stable
 */
export interface MessageRef {
  readonly messageId: string;
  readonly sequence: number;
  readonly persistedAt: string;
}

/**
 * A stored message paired with its persisted identity (RP-5). The {@link Message}
 * type itself carries no id / timestamp; these come from the store row, so an
 * exporter can preserve message identity + chronology across a round-trip.
 *
 * @stable
 */
export interface SessionMessageWithMetadata {
  readonly message: Message;
  readonly messageId: string;
  readonly sequence: number;
  readonly createdAt: string;
}

/** @stable */
export interface SessionMemoryStore {
  push(scope: SessionScope, message: Message): Promise<MessageRef>;
  list(scope: SessionScope, opts?: SessionListOptions): Promise<ReadonlyArray<Message>>;
  /**
   * List messages with their persisted identity (RP-5). Optional: stores that
   * don't implement it fall back to `list` + fabricated ids on the export path.
   */
  listWithMetadata?(
    scope: SessionScope,
    opts?: SessionListOptions,
  ): Promise<ReadonlyArray<SessionMessageWithMetadata>>;
  search(
    scope: SessionScope,
    query: string,
    opts?: MemorySearchOptions,
  ): Promise<ReadonlyArray<MemoryHit>>;
}

/** @stable */
export interface SessionListOptions {
  readonly lastN?: number;
  readonly sinceMessageId?: string;
  readonly agentId?: string;
  readonly role?: 'system' | 'user' | 'assistant' | 'tool';
}

/** @stable */
export interface EpisodicMemoryStore {
  put(episode: Episode): Promise<void>;
  search(
    scope: SessionScope,
    opts: MemorySearchOptions,
  ): Promise<ReadonlyArray<MemoryHit<Episode>>>;
  get(id: string): Promise<Episode | null>;
}

/** @stable */
export interface SemanticMemoryStore {
  remember(fact: Fact): Promise<void>;
  search(scope: SessionScope, opts: MemorySearchOptions): Promise<ReadonlyArray<MemoryHit<Fact>>>;
  supersede(oldId: string, newFact: Fact, reason?: string): Promise<void>;
  forget(id: string, reason?: string): Promise<void>;
}

/** @stable */
export interface ProceduralMemoryStore {
  add(rule: Rule): Promise<void>;
  list(scope: SessionScope): Promise<ReadonlyArray<Rule>>;
  remove(id: string, reason?: string): Promise<void>;
}

/** @stable */
export interface SharedMemoryStore {
  attach(recordId: string, agentId: string): Promise<void>;
  detach(recordId: string, agentId: string): Promise<void>;
  listFor(agentId: string): Promise<ReadonlyArray<MemoryRecord>>;
}
