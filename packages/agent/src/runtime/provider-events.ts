/**
 * Provider stream bridging for the agent runtime: the per-step
 * accumulation of `ProviderEvent`s into agent-visible events / final
 * tool calls, thrown-provider-error classification for the fallback
 * chain, and the `ModelSpec` -> `Provider` projection. Extracted
 * verbatim from `factory.ts` (issue #23).
 *
 * @packageDocumentation
 */

import type {
  AgentEvent,
  ModelSpec,
  Provider,
  ProviderError,
  ProviderErrorKind,
  ProviderEvent,
  ReasoningContent,
  ToolCall,
  Usage,
} from '@graphorin/core';

/**
 * AG-21: classify a **thrown** provider error into a {@link ProviderErrorKind}
 * so the fallback chain can act on it, instead of flattening every exception to
 * `'unknown'` (which is always fallback-ineligible). Structural - reads the
 * `kind` carried by `@graphorin/provider`'s `GraphorinProviderError` subclasses
 * without importing them, keeping the agent decoupled from the provider package.
 */
/** Canonical `ProviderErrorKind` values honoured off a thrown error's `errorKind`. */
const CANONICAL_PROVIDER_ERROR_KINDS: ReadonlySet<string> = new Set([
  'rate-limit',
  'capacity',
  'context-length',
  'transient',
  'invalid-request',
  'unauthorized',
  'content-filter',
]);

export function classifyThrownProviderErrorKind(cause: unknown): ProviderErrorKind {
  if (typeof cause === 'object' && cause !== null) {
    // B1: `ProviderHttpError` carries the canonical mapped kind on
    // `errorKind` (its `kind` stays the stable 'provider-http'
    // discriminant) - honour it so a thrown 429 / context overflow is
    // classified like the structured-event equivalent.
    const errorKind = (cause as { readonly errorKind?: unknown }).errorKind;
    if (typeof errorKind === 'string' && CANONICAL_PROVIDER_ERROR_KINDS.has(errorKind)) {
      return errorKind as ProviderErrorKind;
    }
    switch ((cause as { readonly kind?: unknown }).kind) {
      case 'rate-limit-exceeded':
        return 'rate-limit';
    }
  }
  return 'unknown';
}

export function specToProvider(spec: ModelSpec): Provider {
  if ('provider' in spec) return spec.provider as Provider;
  return spec as Provider;
}

export interface ToolCallAccumulator {
  readonly toolCallId: string;
  toolName: string;
  argsBuffer: string;
}

export interface ProviderEventOutcome {
  readonly emit?: AgentEvent;
  readonly providerError?: ProviderError;
  readonly usage?: Usage;
  readonly finished?: boolean;
}

export interface ProviderEventCollector {
  textBuffer: string;
  reasoningBuffer: string;
  reasoningParts: ReasoningContent[];
  calls: Map<string, ToolCallAccumulator>;
  finalCalls: ToolCall[];
}

export function handleProviderEvent(
  ev: ProviderEvent,
  state: ProviderEventCollector,
): ProviderEventOutcome {
  switch (ev.type) {
    case 'stream-start':
      return {};
    case 'reasoning-delta':
      state.reasoningBuffer += ev.delta;
      return { emit: { type: 'reasoning.delta', delta: ev.delta } };
    case 'text-delta':
      state.textBuffer += ev.delta;
      return { emit: { type: 'text.delta', delta: ev.delta } };
    case 'tool-call-start':
      state.calls.set(ev.toolCallId, {
        toolCallId: ev.toolCallId,
        toolName: ev.toolName,
        argsBuffer: '',
      });
      return {
        emit: {
          type: 'tool.call.start',
          toolCallId: ev.toolCallId,
          toolName: ev.toolName,
          args: undefined,
        },
      };
    case 'tool-call-input-delta': {
      const acc = state.calls.get(ev.toolCallId);
      if (acc !== undefined) acc.argsBuffer += ev.argsDelta;
      return {
        emit: { type: 'tool.call.delta', toolCallId: ev.toolCallId, argsDelta: ev.argsDelta },
      };
    }
    case 'tool-call-end': {
      const acc = state.calls.get(ev.toolCallId);
      if (acc === undefined) {
        // AG-26: an end without a matching start has no tool name - the
        // old path dispatched it as the unknown tool ''. Drop it loudly.
        process.stderr.write(
          `[graphorin/agent] dropped tool-call-end '${ev.toolCallId}' with no matching tool-call-start.\n`,
        );
        return {};
      }
      state.finalCalls.push({
        toolCallId: ev.toolCallId,
        toolName: acc.toolName,
        args: ev.finalArgs,
      });
      return {
        emit: { type: 'tool.call.end', toolCallId: ev.toolCallId, finalArgs: ev.finalArgs },
      };
    }
    // AG-26: provider-generated files / citations are consumer-observable
    // events instead of silently vanishing.
    case 'file':
      return { emit: { type: 'file.generated', mimeType: ev.mimeType, data: ev.data } };
    case 'source':
      return {
        emit: {
          type: 'source.cited',
          uri: ev.uri,
          ...(ev.title !== undefined ? { title: ev.title } : {}),
        },
      };
    case 'finish':
      return { usage: ev.usage, finished: true };
    case 'error':
      return { providerError: ev.error };
    default: {
      const _exhaustive: never = ev;
      void _exhaustive;
      return {};
    }
  }
}
