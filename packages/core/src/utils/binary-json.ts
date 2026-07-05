/**
 * JSON-safe projection of binary-bearing message content (W-004).
 *
 * `Message` and `ToolResult.contentParts` carry `Uint8Array | URL`
 * payloads that a naive `JSON.stringify` silently corrupts: a
 * `Uint8Array` turns into an object with numeric keys and a `URL`
 * into `{}`. The wire types below replace those fields with explicit
 * {@link EncodedBytes} / {@link EncodedUrl} envelopes so a run state
 * (or any message transcript) survives `JSON.parse(JSON.stringify(x))`
 * byte-for-byte.
 *
 * The codec is runtime-neutral by design: base64 is hand-rolled (no
 * `Buffer`, no `btoa`) so the module works in browsers, workers and
 * edge runtimes exactly as it does under Node.
 *
 * @packageDocumentation
 */

import type {
  AssistantMessage,
  AudioContent,
  FileContent,
  ImageContent,
  Message,
  MessageContent,
  SystemMessage,
  ToolMessage,
  UserMessage,
} from '../types/message.js';
import type { RunState, RunStep } from '../types/run.js';
import type { CompletedToolCall, ToolError, ToolResult } from '../types/tool.js';

/**
 * Base64-encoded binary payload as it appears on the wire.
 *
 * @stable
 */
export interface EncodedBytes {
  readonly enc: 'base64';
  readonly data: string;
}

/**
 * URL reference as it appears on the wire (`URL` instances do not
 * survive `JSON.stringify`).
 *
 * @stable
 */
export interface EncodedUrl {
  readonly enc: 'url';
  readonly href: string;
}

/**
 * Wire form of a `Uint8Array | URL` binary field.
 *
 * @stable
 */
export type EncodedBinary = EncodedBytes | EncodedUrl;

/** Wire twin of {@link ImageContent}. @stable */
export interface WireImageContent extends Omit<ImageContent, 'image'> {
  readonly image: EncodedBinary;
}

/** Wire twin of {@link AudioContent}. @stable */
export interface WireAudioContent extends Omit<AudioContent, 'audio'> {
  readonly audio: EncodedBinary;
}

/** Wire twin of {@link FileContent}. @stable */
export interface WireFileContent extends Omit<FileContent, 'file'> {
  readonly file: EncodedBinary;
}

/**
 * JSON-safe twin of {@link MessageContent}: binary-bearing variants
 * carry {@link EncodedBinary} envelopes, text/reasoning variants pass
 * through untouched.
 *
 * @stable
 */
export type WireMessageContent =
  | Exclude<MessageContent, ImageContent | AudioContent | FileContent>
  | WireImageContent
  | WireAudioContent
  | WireFileContent;

/** Wire twin of {@link UserMessage}. @stable */
export interface WireUserMessage extends Omit<UserMessage, 'content'> {
  readonly content: string | readonly WireMessageContent[];
}

/** Wire twin of {@link AssistantMessage}. @stable */
export interface WireAssistantMessage extends Omit<AssistantMessage, 'content'> {
  readonly content: string | readonly WireMessageContent[];
}

/** Wire twin of {@link ToolMessage}. @stable */
export interface WireToolMessage extends Omit<ToolMessage, 'content'> {
  readonly content: string | readonly WireMessageContent[];
}

/**
 * JSON-safe twin of {@link Message}. System messages are plain strings
 * and pass through unchanged.
 *
 * @stable
 */
export type WireMessage = SystemMessage | WireUserMessage | WireAssistantMessage | WireToolMessage;

/** Wire twin of {@link ToolResult}: `contentParts` are encoded. @stable */
export type WireToolResult<TOutput = unknown> = Omit<ToolResult<TOutput>, 'contentParts'> & {
  readonly contentParts?: readonly WireMessageContent[];
};

/** Wire twin of `ToolOutcome`. @stable */
export type WireToolOutcome<TOutput = unknown> = WireToolResult<TOutput> | ToolError;

/** Wire twin of {@link CompletedToolCall}. @stable */
export type WireCompletedToolCall<TOutput = unknown> = Omit<
  CompletedToolCall<TOutput>,
  'outcome'
> & {
  readonly outcome: WireToolOutcome<TOutput>;
};

/** Wire twin of {@link RunStep}. @stable */
export type WireRunStep = Omit<RunStep, 'toolCalls'> & {
  readonly toolCalls: readonly WireCompletedToolCall[];
};

/**
 * JSON-safe twin of {@link RunState}: `messages` and every
 * `steps[].toolCalls[].outcome.contentParts` are projected through the
 * binary codec. Everything else is structurally identical.
 *
 * `pendingApprovals[].args` and `ToolResult.output` are model-produced
 * JSON and are assumed JSON-safe already - the projection does not
 * walk them.
 *
 * @stable
 */
export type WireRunState = Omit<RunState, 'messages' | 'steps'> & {
  readonly messages: readonly WireMessage[];
  readonly steps: readonly WireRunStep[];
};

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const B64_LOOKUP: ReadonlyMap<string, number> = new Map(
  [...B64_ALPHABET].map((ch, i) => [ch, i] as const),
);

/**
 * Encode bytes as standard (padded) base64 without relying on `Buffer`
 * or `btoa`.
 *
 * @stable
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] as number;
    const b1 = i + 1 < bytes.length ? (bytes[i + 1] as number) : undefined;
    const b2 = i + 2 < bytes.length ? (bytes[i + 2] as number) : undefined;
    out += B64_ALPHABET[b0 >> 2];
    out += B64_ALPHABET[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? '=' : B64_ALPHABET[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? '=' : B64_ALPHABET[b2 & 0x3f];
  }
  return out;
}

/**
 * Decode standard base64 (padding optional). Throws on characters
 * outside the base64 alphabet.
 *
 * @stable
 */
export function base64ToBytes(data: string): Uint8Array {
  const stripped = data.replace(/=+$/, '');
  const out = new Uint8Array(Math.floor((stripped.length * 6) / 8));
  let offset = 0;
  let buffer = 0;
  let bits = 0;
  for (const ch of stripped) {
    const value = B64_LOOKUP.get(ch);
    if (value === undefined) {
      throw new Error(`base64ToBytes: invalid base64 character ${JSON.stringify(ch)}`);
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[offset] = (buffer >> bits) & 0xff;
      offset += 1;
    }
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function encodeBinary(value: Uint8Array | URL | EncodedBinary): EncodedBinary {
  if (value instanceof Uint8Array) return { enc: 'base64', data: bytesToBase64(value) };
  if (value instanceof URL) return { enc: 'url', href: value.href };
  // Already wire-encoded (idempotent re-projection).
  return value;
}

/**
 * Repair the exact corruption `JSON.stringify(Uint8Array)` produces: an
 * object whose keys are the dense indices `0..n-1` with byte values.
 * Applied ONLY to known binary fields of legacy (schema <= 1.1)
 * payloads; anything else is returned as-is.
 */
function repairNumericKeyBytes(value: Record<string, unknown>): Uint8Array | undefined {
  const keys = Object.keys(value);
  if (keys.length === 0) return undefined;
  const out = new Uint8Array(keys.length);
  for (let i = 0; i < keys.length; i += 1) {
    const raw = value[String(i)];
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0 || raw > 255) {
      return undefined;
    }
    out[i] = raw;
  }
  return out;
}

function decodeBinary(value: unknown): Uint8Array | URL | unknown {
  if (value instanceof Uint8Array || value instanceof URL) return value;
  if (!isRecord(value)) return value;
  if (value.enc === 'base64' && typeof value.data === 'string') {
    return base64ToBytes(value.data);
  }
  if (value.enc === 'url' && typeof value.href === 'string') {
    return new URL(value.href);
  }
  // Legacy repair path: schema 1.0/1.1 checkpoints stringified the raw
  // Uint8Array into a numeric-key object. A corrupted URL serialized to
  // `{}` and is unrecoverable - it stays as-is.
  const repaired = repairNumericKeyBytes(value);
  return repaired ?? value;
}

function encodeContentPart(part: MessageContent | WireMessageContent): WireMessageContent {
  switch (part.type) {
    case 'image':
      return { ...part, image: encodeBinary(part.image) };
    case 'audio':
      return { ...part, audio: encodeBinary(part.audio) };
    case 'file':
      return { ...part, file: encodeBinary(part.file) };
    default:
      return part;
  }
}

function decodeContentPart(part: WireMessageContent | MessageContent): MessageContent {
  switch (part.type) {
    case 'image':
      return { ...part, image: decodeBinary(part.image) as Uint8Array | URL };
    case 'audio':
      return { ...part, audio: decodeBinary(part.audio) as Uint8Array | URL };
    case 'file':
      return { ...part, file: decodeBinary(part.file) as Uint8Array | URL };
    default:
      return part;
  }
}

/**
 * Project multimodal content parts into their JSON-safe wire form.
 * Text and reasoning parts pass through untouched.
 *
 * @stable
 */
export function toJsonSafeContentParts(
  parts: readonly MessageContent[],
): readonly WireMessageContent[] {
  return parts.map(encodeContentPart);
}

/**
 * Inverse of {@link toJsonSafeContentParts}. Accepts legacy corrupted
 * payloads (numeric-key byte objects) and repairs them best-effort.
 *
 * @stable
 */
export function fromJsonSafeContentParts(
  parts: readonly WireMessageContent[],
): readonly MessageContent[] {
  return parts.map(decodeContentPart);
}

/**
 * Project a {@link Message} into its JSON-safe wire form. Idempotent:
 * projecting an already-wire message returns an equivalent value.
 *
 * @stable
 */
export function toJsonSafeMessage(message: Message | WireMessage): WireMessage {
  if (message.role === 'system' || typeof message.content === 'string') {
    return message as WireMessage;
  }
  return { ...message, content: message.content.map(encodeContentPart) } as WireMessage;
}

/**
 * Inverse of {@link toJsonSafeMessage}.
 *
 * @stable
 */
export function fromJsonSafeMessage(message: WireMessage | Message): Message {
  if (message.role === 'system' || typeof message.content === 'string') {
    return message as Message;
  }
  return { ...message, content: message.content.map(decodeContentPart) } as Message;
}

function encodeOutcome(outcome: CompletedToolCall['outcome']): WireToolOutcome {
  // Defensive: tolerate loose historical/fixture shapes where the
  // outcome is missing or not an object.
  if (isRecord(outcome) && Array.isArray(outcome.contentParts)) {
    return {
      ...outcome,
      contentParts: toJsonSafeContentParts(outcome.contentParts as readonly MessageContent[]),
    } as WireToolOutcome;
  }
  return outcome as WireToolOutcome;
}

function decodeOutcome(outcome: WireToolOutcome): CompletedToolCall['outcome'] {
  if (isRecord(outcome) && Array.isArray(outcome.contentParts)) {
    return {
      ...outcome,
      contentParts: fromJsonSafeContentParts(outcome.contentParts as readonly WireMessageContent[]),
    } as CompletedToolCall['outcome'];
  }
  return outcome as CompletedToolCall['outcome'];
}

function encodeStep(step: RunStep | WireRunStep): WireRunStep {
  if (step.toolCalls.length === 0) return step as WireRunStep;
  return {
    ...step,
    toolCalls: step.toolCalls.map((tc) => ({
      ...tc,
      outcome: encodeOutcome(tc.outcome as CompletedToolCall['outcome']),
    })),
  };
}

function decodeStep(step: WireRunStep): RunStep {
  if (step.toolCalls.length === 0) return step as unknown as RunStep;
  return {
    ...step,
    toolCalls: step.toolCalls.map((tc) => ({ ...tc, outcome: decodeOutcome(tc.outcome) })),
  } as unknown as RunStep;
}

/**
 * Project a full {@link RunState} into its JSON-safe {@link WireRunState}
 * twin: `messages` and `steps[].toolCalls[].outcome.contentParts` go
 * through the binary codec, everything else is copied structurally.
 *
 * @stable
 */
export function toJsonSafeRunState(state: RunState | WireRunState): WireRunState {
  return {
    ...state,
    messages: state.messages.map(toJsonSafeMessage),
    steps: state.steps.map(encodeStep),
  } as WireRunState;
}

/**
 * Inverse of {@link toJsonSafeRunState}. Best-effort: legacy corrupted
 * binary fields (numeric-key byte objects from schema <= 1.1 payloads)
 * are repaired to `Uint8Array`; unrecoverable shapes are left as-is.
 *
 * @stable
 */
export function fromJsonSafeRunState(state: WireRunState): RunState {
  return {
    ...state,
    messages: state.messages.map(fromJsonSafeMessage),
    steps: state.steps.map(decodeStep),
  } as RunState;
}
