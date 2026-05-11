/**
 * Emission helpers that attach OpenTelemetry GenAI semantic-convention
 * attributes / events to an existing span.
 *
 * The helpers are deliberately additive — they NEVER remove or rename
 * existing attributes. The new `gen_ai.*` family sits on top of the
 * Graphorin-prefixed family. Sensitivity defaults follow the catalogue
 * documented alongside the canonical mapping table:
 *
 * - `gen_ai.system` / `gen_ai.request.model` / `gen_ai.response.model` /
 *   `gen_ai.response.id` / `gen_ai.usage.{input,output}_tokens` /
 *   `gen_ai.response.finish_reasons` / `gen_ai.tool.{name,type,call.id,description}` /
 *   `gen_ai.agent.{id,name}` / `gen_ai.session.id` /
 *   `gen_ai.operation.name` → `'public'`
 * - `gen_ai.request.messages` / per-message events / `gen_ai.response.content`
 *   → `'internal'` (default-deny non-public per DEC-141)
 * - `gen_ai.tool.output` → inherits per-tool `Tool.sensitivity`
 *
 * @packageDocumentation
 */

import type { AISpan, SpanAttributes, SpanAttributeValue, SpanType } from '@graphorin/core';

import type { GraphorinSpan } from '../tracer/span.js';
import { asGraphorinSpan } from '../tracer/tracer.js';

import { operationNameFor } from './operation-mapping.js';
import type { GenAIAttributes, GenAIMessage, GenAIMessageRole } from './types.js';

const PUBLIC_KEY_PREFIXES = [
  'gen_ai.system',
  'gen_ai.request.model',
  'gen_ai.response.model',
  'gen_ai.response.id',
  'gen_ai.response.finish_reasons',
  'gen_ai.usage.input_tokens',
  'gen_ai.usage.output_tokens',
  'gen_ai.tool.name',
  'gen_ai.tool.type',
  'gen_ai.tool.call.id',
  'gen_ai.tool.description',
  'gen_ai.agent.id',
  'gen_ai.agent.name',
  'gen_ai.session.id',
  'gen_ai.operation.name',
] as const;

/**
 * Attach the canonical `gen_ai.*` attribute set to a span. The helper
 * is additive on the existing Graphorin-prefixed attributes and applies
 * the per-attribute sensitivity defaults catalogue.
 *
 * @stable
 */
export function emitGenAIAttributes<T extends SpanType>(
  span: AISpan<T>,
  attrs: GenAIAttributes,
): void {
  const gs = asGraphorinSpan(span);
  const operation = attrs.operation ?? operationNameFor(span.type);
  if (operation !== undefined) setPublic(gs, span, 'gen_ai.operation.name', operation);

  if (attrs.system !== undefined) setPublic(gs, span, 'gen_ai.system', attrs.system);
  if (attrs.requestModel !== undefined)
    setPublic(gs, span, 'gen_ai.request.model', attrs.requestModel);
  if (attrs.responseModel !== undefined)
    setPublic(gs, span, 'gen_ai.response.model', attrs.responseModel);
  if (attrs.responseId !== undefined) setPublic(gs, span, 'gen_ai.response.id', attrs.responseId);
  if (attrs.inputTokens !== undefined)
    setPublic(gs, span, 'gen_ai.usage.input_tokens', attrs.inputTokens);
  if (attrs.outputTokens !== undefined)
    setPublic(gs, span, 'gen_ai.usage.output_tokens', attrs.outputTokens);
  if (attrs.finishReasons !== undefined)
    setPublic(gs, span, 'gen_ai.response.finish_reasons', [...attrs.finishReasons]);
  if (attrs.agentId !== undefined) setPublic(gs, span, 'gen_ai.agent.id', attrs.agentId);
  if (attrs.agentName !== undefined) setPublic(gs, span, 'gen_ai.agent.name', attrs.agentName);
  if (attrs.sessionId !== undefined) setPublic(gs, span, 'gen_ai.session.id', attrs.sessionId);
  if (attrs.toolName !== undefined) setPublic(gs, span, 'gen_ai.tool.name', attrs.toolName);
  if (attrs.toolType !== undefined) setPublic(gs, span, 'gen_ai.tool.type', attrs.toolType);
  if (attrs.toolCallId !== undefined) setPublic(gs, span, 'gen_ai.tool.call.id', attrs.toolCallId);
  if (attrs.toolDescription !== undefined)
    setPublic(gs, span, 'gen_ai.tool.description', attrs.toolDescription);
}

/**
 * Emit per-message OpenTelemetry GenAI span events. The helper records
 * one event per message — the per-message-event emission shape per the
 * OTel semconv discipline (size-bounded individually; safer than the
 * aggregate-attribute shape on large prompts).
 *
 * @stable
 */
export function emitGenAIMessageEvents<T extends SpanType>(
  span: AISpan<T>,
  messages: ReadonlyArray<GenAIMessage>,
  opts: { readonly system?: string } = {},
): void {
  for (const message of messages) {
    span.addEvent(eventNameFor(message.role), buildEventAttrs(message, opts.system));
  }
}

function eventNameFor(role: GenAIMessageRole): string {
  switch (role) {
    case 'system':
      return 'gen_ai.system.message';
    case 'user':
      return 'gen_ai.user.message';
    case 'assistant':
      return 'gen_ai.assistant.message';
    case 'tool':
      return 'gen_ai.tool.message';
  }
}

function buildEventAttrs(message: GenAIMessage, system?: string): SpanAttributes {
  const out: Record<string, SpanAttributeValue> = {
    'gen_ai.message.role': message.role,
    content: message.content,
  };
  if (system !== undefined) out['gen_ai.system'] = system;
  if (message.name !== undefined) out['gen_ai.message.name'] = message.name;
  if (message.toolCallId !== undefined) out['gen_ai.tool.call.id'] = message.toolCallId;
  if (message.toolCalls !== undefined && message.toolCalls.length > 0) {
    out['gen_ai.tool.calls'] = JSON.stringify(message.toolCalls);
  }
  return Object.freeze(out) as SpanAttributes;
}

function setPublic(
  gs: GraphorinSpan | null,
  span: AISpan,
  key: string,
  value: SpanAttributeValue,
): void {
  if (
    gs !== null &&
    PUBLIC_KEY_PREFIXES.some((prefix) => key === prefix || key.startsWith(`${prefix}.`))
  ) {
    gs.setAttribute(key, value, { sensitivity: 'public' });
    return;
  }
  span.setAttributes({ [key]: value });
}
