/**
 * Registry plumbing that lets the server route handlers locate user-
 * defined agents, workflows, sessions, memory, skills, and MCP
 * server bindings without taking a hard peer dependency on every
 * sibling package.
 *
 * Every entry is keyed by string id; lookups never throw - callers
 * receive `undefined` and the route handler decides how to surface
 * the miss (typically a 404 with a typed error body).
 *
 * @packageDocumentation
 */

/**
 * Minimal shape the server needs from an `Agent`. Compatible with
 * the `Agent` interface from `@graphorin/agent` but kept
 * structurally so we avoid the peer dependency.
 *
 * @stable
 */
export interface ServerAgentLike {
  readonly id: string;
  run(
    input: unknown,
    options?: {
      readonly signal?: AbortSignal;
      readonly sessionId?: string;
      readonly userId?: string;
    },
  ): Promise<unknown>;
  /**
   * Streaming surface (IP-2). `@graphorin/agent` agents satisfy this
   * structurally; `POST /agents/:id/stream` consumes it and emits
   * every event onto the run's WS subject. Optional so plain
   * run-only fixtures keep working (they emit a single terminal frame).
   */
  stream?(
    input: unknown,
    options?: {
      readonly signal?: AbortSignal;
      readonly sessionId?: string;
      readonly userId?: string;
    },
  ): AsyncIterable<unknown>;
}

/**
 * Minimal shape the server needs from a `Workflow`. Mirrors the
 * `Workflow` surface from `@graphorin/workflow`.
 *
 * @stable
 */
export interface ServerWorkflowLike {
  readonly name: string;
  execute(
    input: unknown,
    options?: { readonly signal?: AbortSignal; readonly threadId?: string },
  ): AsyncIterable<unknown>;
  resume?(
    threadId: string,
    directive?: { readonly resume?: unknown },
    opts?: { readonly signal?: AbortSignal },
  ): AsyncIterable<unknown>;
  /** W-119: replay a failed/aborted thread (`POST /:id/retry`). */
  retry?(threadId: string, opts?: { readonly signal?: AbortSignal }): AsyncIterable<unknown>;
  /** W-119: fire a due durable timer (`POST /:id/tick`). */
  tick?(
    threadId: string,
    opts?: { readonly now?: number },
  ): Promise<{ readonly fired: boolean; readonly nextWakeAt: number | null }>;
  /**
   * W-119: resolve a NAMED awakeable/approval (`POST /:id/resume` with
   * `name`) - `approve` is the same primitive under the hood.
   */
  resolveAwakeable?(
    threadId: string,
    name: string,
    value?: unknown,
    opts?: { readonly signal?: AbortSignal },
  ): AsyncIterable<unknown>;
  /** W-119: fork a new thread from a checkpoint (`POST /:id/fork`). */
  fork?(
    threadId: string,
    fromCheckpointId: string,
  ): Promise<{ readonly newThreadId: string }>;
  getState?(threadId: string): Promise<unknown>;
  listCheckpoints?(threadId: string): Promise<ReadonlyArray<unknown>>;
  /** W-005: per-thread checkpoint erasure (`DELETE /:id/threads/:threadId`). */
  deleteThread?(threadId: string): Promise<void>;
}

/**
 * Snapshot record returned by {@link AgentRegistry.list}.
 *
 * @stable
 */
export interface AgentSummary {
  readonly id: string;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Snapshot record returned by {@link WorkflowRegistry.list}.
 *
 * @stable
 */
export interface WorkflowSummary {
  readonly id: string;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Internal registry entry - pairs the user-supplied object with the
 * metadata routes serve to clients.
 *
 * @internal
 */
interface AgentEntry {
  readonly id: string;
  readonly agent: ServerAgentLike;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * @internal
 */
interface WorkflowEntry {
  readonly id: string;
  readonly workflow: ServerWorkflowLike;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Registration descriptor accepted by {@link AgentRegistry.register}.
 *
 * @stable
 */
export interface AgentRegistration {
  readonly id: string;
  readonly agent: ServerAgentLike;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Registration descriptor accepted by {@link WorkflowRegistry.register}.
 *
 * @stable
 */
export interface WorkflowRegistration {
  readonly id: string;
  readonly workflow: ServerWorkflowLike;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Read/write registry for agents the server should expose. Every
 * mutation is synchronous and the lookup is `O(1)`.
 *
 * The class is intentionally tiny - extension points (e.g. lazy
 * factory loading, per-tenant scoping) live in higher-level packages
 * and consume this surface as a primitive.
 *
 * @stable
 */
export class AgentRegistry {
  readonly #entries: Map<string, AgentEntry> = new Map();

  register(entry: AgentRegistration): void {
    this.#entries.set(entry.id, {
      id: entry.id,
      agent: entry.agent,
      ...(entry.description !== undefined ? { description: entry.description } : {}),
      ...(entry.tags !== undefined ? { tags: Object.freeze(entry.tags.slice()) } : {}),
    });
  }

  unregister(id: string): boolean {
    return this.#entries.delete(id);
  }

  get(id: string): ServerAgentLike | undefined {
    return this.#entries.get(id)?.agent;
  }

  has(id: string): boolean {
    return this.#entries.has(id);
  }

  list(): ReadonlyArray<AgentSummary> {
    return Object.freeze(
      [...this.#entries.values()].map((entry) =>
        Object.freeze({
          id: entry.id,
          ...(entry.description !== undefined ? { description: entry.description } : {}),
          ...(entry.tags !== undefined ? { tags: entry.tags } : {}),
        }),
      ),
    );
  }

  describe(id: string): AgentSummary | undefined {
    const entry = this.#entries.get(id);
    if (entry === undefined) return undefined;
    return Object.freeze({
      id: entry.id,
      ...(entry.description !== undefined ? { description: entry.description } : {}),
      ...(entry.tags !== undefined ? { tags: entry.tags } : {}),
    });
  }

  size(): number {
    return this.#entries.size;
  }
}

/**
 * @stable
 */
export class WorkflowRegistry {
  readonly #entries: Map<string, WorkflowEntry> = new Map();

  register(entry: WorkflowRegistration): void {
    this.#entries.set(entry.id, {
      id: entry.id,
      workflow: entry.workflow,
      ...(entry.description !== undefined ? { description: entry.description } : {}),
      ...(entry.tags !== undefined ? { tags: Object.freeze(entry.tags.slice()) } : {}),
    });
  }

  unregister(id: string): boolean {
    return this.#entries.delete(id);
  }

  get(id: string): ServerWorkflowLike | undefined {
    return this.#entries.get(id)?.workflow;
  }

  has(id: string): boolean {
    return this.#entries.has(id);
  }

  list(): ReadonlyArray<WorkflowSummary> {
    return Object.freeze(
      [...this.#entries.values()].map((entry) =>
        Object.freeze({
          id: entry.id,
          ...(entry.description !== undefined ? { description: entry.description } : {}),
          ...(entry.tags !== undefined ? { tags: entry.tags } : {}),
        }),
      ),
    );
  }

  describe(id: string): WorkflowSummary | undefined {
    const entry = this.#entries.get(id);
    if (entry === undefined) return undefined;
    return Object.freeze({
      id: entry.id,
      ...(entry.description !== undefined ? { description: entry.description } : {}),
      ...(entry.tags !== undefined ? { tags: entry.tags } : {}),
    });
  }

  size(): number {
    return this.#entries.size;
  }
}
