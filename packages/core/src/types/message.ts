import type { ToolCall } from './tool.js';

/**
 * A single multimodal content part attached to a chat-style message.
 *
 * The discriminated union is exhaustive: every variant carries a literal
 * `type` field used by both the runtime and the type system to pick the
 * branch. New variants must be added to all three of: this union, every
 * `assertNever` switch in the codebase, and the wire-stable adapters.
 *
 * @stable
 */
export type MessageContent =
  | TextContent
  | ImageContent
  | AudioContent
  | FileContent
  | ReasoningContent;

/**
 * Plain UTF-8 text part. The default for textual replies and tool I/O.
 *
 * @stable
 */
export interface TextContent {
  readonly type: 'text';
  readonly text: string;
  /**
   * Optional opaque trace of the agent-runtime decisions that produced
   * this content part. Bounded-length, no PII, no secret values.
   * Round-tripped bytes-equal through `Session.push / list / export /
   * import`. See `@graphorin/sessions` commentary-phase sanitization.
   */
  readonly causalityChain?: ReadonlyArray<string>;
}

/**
 * Image attachment. The `image` field accepts either raw bytes or a `URL`
 * — adapters dereference the URL when the provider only accepts inline
 * payloads.
 *
 * @stable
 */
export interface ImageContent {
  readonly type: 'image';
  readonly image: Uint8Array | URL;
  readonly mimeType?: string;
  /** See {@link TextContent.causalityChain}. */
  readonly causalityChain?: ReadonlyArray<string>;
}

/**
 * Audio attachment (e.g. voice messages). Note: voice realtime / TTS / STT
 * are out of scope for v0.1 — these messages are static blobs.
 *
 * @stable
 */
export interface AudioContent {
  readonly type: 'audio';
  readonly audio: Uint8Array | URL;
  readonly mimeType?: string;
  /** See {@link TextContent.causalityChain}. */
  readonly causalityChain?: ReadonlyArray<string>;
}

/**
 * Generic file attachment (PDF, CSV, …). `mimeType` is mandatory because
 * many providers gate file ingestion on it.
 *
 * @stable
 */
export interface FileContent {
  readonly type: 'file';
  readonly file: Uint8Array | URL;
  readonly mimeType: string;
  readonly filename?: string;
  /** See {@link TextContent.causalityChain}. */
  readonly causalityChain?: ReadonlyArray<string>;
}

/**
 * Reasoning content emitted by reasoning-capable models. Stored
 * separately from `text` so that consumers can choose to hide / strip
 * it (per the streaming-first principle and the replay-redaction
 * policy).
 *
 * @stable
 */
export interface ReasoningContent {
  readonly type: 'reasoning';
  readonly text: string;
  /**
   * Provider-specific opaque metadata that MUST round-trip byte-equal
   * when the effective `reasoningRetention` is not `'strip'`. The
   * field is provider-supplied protocol payload, not user content,
   * and is therefore exempt from prompt-redaction scanning.
   *
   * Anthropic Claude tool-use thinking blocks supply
   * `{ provider: 'anthropic', signature, data? }`; other providers
   * are free to populate whatever opaque keys their wire contract
   * requires. Adapters that do not need round-tripping omit this
   * field entirely.
   */
  readonly meta?: ReasoningContentMeta;
  /** See {@link TextContent.causalityChain}. */
  readonly causalityChain?: ReadonlyArray<string>;
}

/**
 * Opaque metadata round-tripped on `ReasoningContent`. Adapter-defined
 * keys; consumers must NOT introspect or modify the contents.
 *
 * @stable
 */
export interface ReasoningContentMeta {
  readonly provider?: string;
  readonly signature?: string;
  readonly data?: string;
  readonly [extraKey: string]: unknown;
}

/**
 * Logical role of a message in a conversation.
 *
 * @stable
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Chat message. The shape is provider-agnostic: adapters convert it to /
 * from the wire format.
 *
 * - System messages must be plain strings (multimodal system messages are
 *   not in the v0.1 surface).
 * - Assistant messages may carry `toolCalls` alongside their content.
 * - Tool messages carry the originating `toolCallId` so the model can
 *   correlate the response to its previous request.
 *
 * @stable
 */
export type Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage;

/** @stable */
export interface SystemMessage {
  readonly role: 'system';
  readonly content: string;
}

/** @stable */
export interface UserMessage {
  readonly role: 'user';
  readonly content: string | readonly MessageContent[];
  /** Multi-agent attribution: which user persona this came from, if any. */
  readonly userId?: string;
}

/** @stable */
export interface AssistantMessage {
  readonly role: 'assistant';
  readonly content: string | readonly MessageContent[];
  readonly toolCalls?: readonly ToolCall[];
  /**
   * Multi-agent attribution: which agent produced this message. Required
   * by the multi-agent crew acceptance criteria.
   */
  readonly agentId?: string;
}

/** @stable */
export interface ToolMessage {
  readonly role: 'tool';
  readonly toolCallId: string;
  readonly content: string | readonly MessageContent[];
}
