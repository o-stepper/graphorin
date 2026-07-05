/**
 * Default human-readable span name per {@link SpanType}. Operators
 * can override the name by passing `name` through a custom
 * `setAttributes(...)` call after `startSpan(...)` returns.
 *
 * E8 (audit 2026-07-04): the OTel GenAI semantic conventions name spans
 * `"{operation} {target}"` (`chat gpt-4.1`, `execute_tool get_weather`,
 * `invoke_agent planner`) so trace UIs group like operations while
 * keeping the target visible. When the span's initial attributes carry
 * the target we emit that shape; otherwise the raw span type remains
 * the stable fallback.
 *
 * @packageDocumentation
 */

import type { SpanType } from '@graphorin/core';

function attrString(
  attrs: Readonly<Record<string, unknown>> | undefined,
  keys: readonly string[],
): string | undefined {
  if (attrs === undefined) return undefined;
  for (const key of keys) {
    const value = attrs[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

/**
 * @stable
 */
export function spanNameFor(type: SpanType, attrs?: Readonly<Record<string, unknown>>): string {
  switch (type) {
    case 'provider.generate':
    case 'provider.stream': {
      const model = attrString(attrs, ['gen_ai.request.model', 'graphorin.provider.model']);
      return model === undefined ? type : `chat ${model}`;
    }
    case 'tool.execute': {
      const tool = attrString(attrs, ['gen_ai.tool.name', 'graphorin.tool.name']);
      return tool === undefined ? type : `execute_tool ${tool}`;
    }
    case 'agent.run':
    case 'agent.step': {
      const agent = attrString(attrs, ['gen_ai.agent.name', 'gen_ai.agent.id']);
      return agent === undefined ? type : `invoke_agent ${agent}`;
    }
    default:
      return type;
  }
}
