import type { SessionScope, SpanAttributes, SpanType, Tracer } from '@graphorin/core';

/**
 * Sanitize a `SessionScope` for span attributes — the raw user id is
 * surfaced as-is (it is a stable opaque identifier per DEC-005), but
 * session and agent ids are emitted only when defined to avoid
 * polluting the trace with `null` strings.
 *
 * @internal
 */
export function scopeAttrs(scope: SessionScope): SpanAttributes {
  const attrs: Record<string, string> = {
    'memory.scope.user_id': scope.userId,
  };
  if (scope.sessionId !== undefined) attrs['memory.scope.session_id'] = scope.sessionId;
  if (scope.agentId !== undefined) attrs['memory.scope.agent_id'] = scope.agentId;
  return Object.freeze(attrs);
}

/**
 * Run an async function inside a `memory.*` span with the standard
 * scope attributes already populated. Adds the span result count and
 * status automatically.
 *
 * @internal
 */
export async function withMemorySpan<T extends SpanType, R>(
  tracer: Tracer,
  type: T,
  scope: SessionScope,
  extras: SpanAttributes,
  fn: (span: import('@graphorin/core').AISpan<T>) => Promise<R>,
): Promise<R> {
  return tracer.span({ type, attrs: { ...scopeAttrs(scope), ...extras } }, fn);
}
