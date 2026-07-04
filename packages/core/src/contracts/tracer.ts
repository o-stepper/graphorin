/**
 * Discriminator union for typed observability spans.
 *
 * The list mirrors the span taxonomy documented for the observability
 * layer; concrete implementations live in `@graphorin/observability`.
 *
 * @stable
 */
export type SpanType =
  | 'agent.run'
  | 'agent.step'
  | 'agent.handoff'
  | 'agent.suspend'
  | 'agent.resume'
  | 'provider.generate'
  | 'provider.stream'
  | 'tool.execute'
  | 'tool.approval'
  | 'memory.read.working'
  | 'memory.read.session'
  | 'memory.read.episodic'
  | 'memory.read.semantic'
  | 'memory.read.procedural'
  | 'memory.read.shared'
  | 'memory.write.working'
  | 'memory.write.session'
  | 'memory.write.episodic'
  | 'memory.write.semantic'
  | 'memory.write.procedural'
  | 'memory.write.shared'
  | 'memory.search.working'
  | 'memory.search.session'
  | 'memory.search.episodic'
  | 'memory.search.semantic'
  | 'memory.search.procedural'
  | 'memory.search.shared'
  | 'memory.consolidate.light'
  | 'memory.consolidate.standard'
  | 'memory.consolidate.deep'
  | 'memory.consolidate.reflect'
  | 'memory.consolidate.learned-context'
  | 'memory.search.insight'
  | 'memory.read.insight'
  | 'memory.write.insight'
  | 'memory.conflict'
  | 'memory.embed'
  | 'workflow.run'
  | 'workflow.step'
  | 'workflow.task'
  | 'workflow.checkpoint'
  | 'skill.activate'
  | 'skill.load'
  | 'mcp.connect'
  | 'mcp.call'
  | 'mcp.list-tools';

/**
 * Status of a finished span. Mirrors the OTel status convention with
 * `'ok' | 'error'` short forms instead of the verbose tristate.
 *
 * @stable
 */
export type SpanStatus = 'ok' | 'error' | 'cancelled';

/**
 * Free-form attributes attached to a span.
 *
 * @stable
 */
export type SpanAttributes = Readonly<Record<string, SpanAttributeValue>>;

/** @stable */
export type SpanAttributeValue =
  | string
  | number
  | boolean
  | null
  | ReadonlyArray<string>
  | ReadonlyArray<number>
  | ReadonlyArray<boolean>;

/**
 * Typed span. Generic over `SpanType` so consumers can specialize a
 * function on a particular span kind without losing the discriminator.
 *
 * @stable
 */
export interface AISpan<T extends SpanType = SpanType> {
  readonly type: T;
  readonly id: string;
  readonly traceId: string;
  readonly parentId?: string;
  /** Add or replace attributes. Repeated calls are merged (last write wins). */
  setAttributes(attrs: SpanAttributes): void;
  /** Append a span event (attribute-bearing time-stamped marker). */
  addEvent(name: string, attrs?: SpanAttributes): void;
  /** Record an exception. Multiple calls are kept in the span event log. */
  recordException(err: unknown): void;
  /** Set the terminal status. */
  setStatus(status: SpanStatus, message?: string): void;
  /** End the span. Idempotent. */
  end(): void;
}

/**
 * Span constructor parameters.
 *
 * @stable
 */
export interface StartSpanOptions<T extends SpanType = SpanType> {
  readonly type: T;
  readonly attrs?: SpanAttributes;
  readonly parent?: AISpan;
}

/**
 * Pluggable tracer. Implementations live in `@graphorin/observability`.
 * The interface intentionally mirrors a subset of the OTel API so that
 * adapter code is a thin pass-through.
 *
 * @stable
 */
export interface Tracer {
  startSpan<T extends SpanType>(opts: StartSpanOptions<T>): AISpan<T>;
  /**
   * Convenience wrapper: start a span, run `fn` inside, and call
   * `setStatus('ok' | 'error')` + `end()` based on the outcome.
   */
  span<T extends SpanType, R>(
    opts: StartSpanOptions<T>,
    fn: (span: AISpan<T>) => R | Promise<R>,
  ): Promise<R>;
  /** Force-flush any pending spans. */
  shutdown(): Promise<void>;
}

/**
 * Minimal no-op tracer. Useful as a typed default when downstream code
 * needs a non-null `Tracer` without taking the observability dependency.
 *
 * @stable
 */
export const NOOP_TRACER: Tracer = {
  startSpan<T extends SpanType>(opts: StartSpanOptions<T>): AISpan<T> {
    const span: AISpan<T> = {
      type: opts.type,
      id: '',
      traceId: '',
      setAttributes(): void {},
      addEvent(): void {},
      recordException(): void {},
      setStatus(): void {},
      end(): void {},
    };
    return span;
  },
  async span<T extends SpanType, R>(
    opts: StartSpanOptions<T>,
    fn: (span: AISpan<T>) => R | Promise<R>,
  ): Promise<R> {
    const span = this.startSpan(opts);
    try {
      return await fn(span);
    } finally {
      span.end();
    }
  },
  async shutdown(): Promise<void> {},
};
