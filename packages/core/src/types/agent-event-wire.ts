/**
 * JSON-safe wire projection of {@link AgentEvent} (W-046).
 *
 * Three `AgentEvent` variants carry payloads that `JSON.stringify`
 * corrupts: `file.generated` (`data: Uint8Array`),
 * `tool.execute.partial` (binary `ContentChunk`) and - the bulk -
 * `agent.end`, whose `result.state: RunState` embeds multimodal
 * messages and tool-outcome `contentParts`. The wire twins below
 * project those payloads through the binary codec so a server can
 * `JSON.stringify` any event without silently mangling it.
 *
 * `AgentResult.output` (`TOutput`) is assumed JSON-safe already
 * (a string, or a value parsed from JSON structured output) - the
 * projection does not touch it.
 *
 * @packageDocumentation
 */

import {
  base64ToBytes,
  bytesToBase64,
  type EncodedBytes,
  fromJsonSafeRunState,
  toJsonSafeRunState,
  type WireRunState,
} from '../utils/binary-json.js';
import type {
  AgentEndEvent,
  AgentEvent,
  AgentResult,
  FileGeneratedEvent,
  ToolExecutePartialEvent,
} from './agent-event.js';
import type { ContentChunk } from './tool.js';

/** Wire twin of the binary {@link ContentChunk} variant. @stable */
export type WireContentChunk =
  | Exclude<ContentChunk, { readonly kind: 'image' }>
  | { readonly kind: 'image'; readonly data: EncodedBytes; readonly mediaType: string };

/** Wire twin of {@link FileGeneratedEvent}. @stable */
export interface WireFileGeneratedEvent extends Omit<FileGeneratedEvent, 'data'> {
  readonly data: EncodedBytes;
}

/** Wire twin of {@link ToolExecutePartialEvent}. @stable */
export interface WireToolExecutePartialEvent extends Omit<ToolExecutePartialEvent, 'chunk'> {
  readonly chunk: WireContentChunk;
}

/**
 * Wire twin of {@link AgentEndEvent}: `result.state` is the JSON-safe
 * {@link WireRunState} projection.
 *
 * @stable
 */
export interface WireAgentEndEvent<TOutput = string>
  extends Omit<AgentEndEvent<TOutput>, 'result'> {
  readonly result: Omit<AgentResult<TOutput>, 'state'> & { readonly state: WireRunState };
}

/**
 * JSON-safe twin of {@link AgentEvent}: the three binary-bearing
 * variants are replaced by their wire twins, every other variant
 * passes through structurally unchanged.
 *
 * This is the actual payload shape a server puts on the wire (inside
 * the `{ eventId, subject, type, payload }` envelope) - see
 * {@link toWireAgentEvent}.
 *
 * @stable
 */
export type WireAgentEvent<TOutput = string> =
  | Exclude<
      AgentEvent<TOutput>,
      FileGeneratedEvent | ToolExecutePartialEvent | AgentEndEvent<TOutput>
    >
  | WireFileGeneratedEvent
  | WireToolExecutePartialEvent
  | WireAgentEndEvent<TOutput>;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Registry-hosted agents are structurally typed and may emit an
 * `agent.end` without a full `result.state` (e.g. plain `{ status,
 * output }`). Only a state that actually carries the walked arrays is
 * projected; anything else passes through untouched.
 */
function hasProjectableState(result: unknown): result is { state: { messages: unknown[] } } {
  if (!isRecord(result)) return false;
  const state = result.state;
  return isRecord(state) && Array.isArray(state.messages) && Array.isArray(state.steps);
}

function encodeBytesField(data: Uint8Array | EncodedBytes): EncodedBytes {
  if (data instanceof Uint8Array) return { enc: 'base64', data: bytesToBase64(data) };
  return data;
}

function decodeBytesField(data: EncodedBytes | Uint8Array | unknown): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (isRecord(data) && data.enc === 'base64' && typeof data.data === 'string') {
    return base64ToBytes(data.data);
  }
  // Unrecoverable legacy shape - degrade to empty bytes rather than throw.
  return new Uint8Array(0);
}

/**
 * Project an {@link AgentEvent} into its JSON-safe {@link WireAgentEvent}
 * twin. Idempotent: projecting an already-wire event returns an
 * equivalent value. Events of unknown `type` pass through untouched.
 *
 * @stable
 */
export function toWireAgentEvent<TOutput = string>(
  ev: AgentEvent<TOutput> | WireAgentEvent<TOutput>,
): WireAgentEvent<TOutput> {
  switch (ev.type) {
    case 'file.generated':
      return { ...ev, data: encodeBytesField(ev.data) };
    case 'tool.execute.partial': {
      const chunk = ev.chunk;
      if (chunk.kind === 'image') {
        return { ...ev, chunk: { ...chunk, data: encodeBytesField(chunk.data) } };
      }
      return ev as WireAgentEvent<TOutput>;
    }
    case 'agent.end':
      if (!hasProjectableState(ev.result)) return ev as WireAgentEvent<TOutput>;
      return {
        ...ev,
        result: { ...ev.result, state: toJsonSafeRunState(ev.result.state) },
      };
    default:
      return ev as WireAgentEvent<TOutput>;
  }
}

/**
 * Inverse of {@link toWireAgentEvent}: decode base64 envelopes back
 * into `Uint8Array` / `URL` instances. Exposed for `@graphorin/client`
 * consumers that want runtime types back after `JSON.parse`.
 *
 * @stable
 */
export function fromWireAgentEvent<TOutput = string>(
  ev: WireAgentEvent<TOutput> | AgentEvent<TOutput>,
): AgentEvent<TOutput> {
  switch (ev.type) {
    case 'file.generated':
      return { ...ev, data: decodeBytesField(ev.data) };
    case 'tool.execute.partial': {
      const chunk = ev.chunk;
      if (chunk.kind === 'image') {
        return { ...ev, chunk: { ...chunk, data: decodeBytesField(chunk.data) } };
      }
      return ev as AgentEvent<TOutput>;
    }
    case 'agent.end':
      if (!hasProjectableState(ev.result)) return ev as AgentEvent<TOutput>;
      return {
        ...ev,
        result: {
          ...ev.result,
          state: fromJsonSafeRunState(ev.result.state as unknown as WireRunState),
        },
      } as AgentEvent<TOutput>;
    default:
      return ev as AgentEvent<TOutput>;
  }
}
