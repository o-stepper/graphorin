/**
 * Helpers for translating between `Tool.execute(...)` return shapes
 * (`TOutput`, `ToolReturn<TOutput>`, `void`) and the canonical
 * {@link ResultEnvelope} consumed by the truncation + sanitization
 * pipelines downstream.
 *
 * @packageDocumentation
 */

import type { ContentChunk, MessageContent, TextContent, ToolReturn } from '@graphorin/core';

/**
 * Canonical envelope passed through the executor's downstream
 * pipeline. The text-shaped portion (`textBody`) is the only field
 * subject to the result-size cap and the inbound sanitization scan.
 *
 * @stable
 */
export interface ResultEnvelope<TOutput = unknown> {
  /** Typed structured payload (the model-facing `output`). */
  readonly output: TOutput | undefined;
  /** Plain-text rendering of the structured payload (used for cap accounting). */
  readonly textBody: string;
  /** Multipart wire payload (text + non-text parts). */
  readonly contentParts: ReadonlyArray<MessageContent>;
}

/**
 * Convert a raw `execute(...)` return value into a canonical
 * {@link ResultEnvelope}. Streaming-hint tools that returned `void`
 * use the `chunks` parameter to materialise the assembled body.
 *
 * @stable
 */
export function toResultEnvelope<TOutput>(opts: {
  readonly raw: TOutput | ToolReturn<TOutput> | void;
  readonly chunks?: ReadonlyArray<ContentChunk>;
}): ResultEnvelope<TOutput> {
  const { raw, chunks } = opts;
  // Streaming case — assemble from chunks.
  if (raw === undefined && chunks !== undefined && chunks.length > 0) {
    return assembleFromChunks<TOutput>(chunks);
  }
  // ToolReturn envelope.
  if (isToolReturn<TOutput>(raw)) {
    const textBody = renderText(raw.output);
    return Object.freeze({
      output: raw.output,
      textBody,
      contentParts: Object.freeze([...(raw.contentParts ?? [])]),
    });
  }
  // Raw output.
  const output = raw as TOutput | undefined;
  return Object.freeze({
    output,
    textBody: renderText(output),
    contentParts: Object.freeze([] as MessageContent[]),
  });
}

/**
 * Split an envelope into its text-shaped payload (subject to the
 * truncation pipeline + inbound sanitization scan) and its non-text
 * content parts (passed through untouched).
 *
 * @stable
 */
export function splitTextAndContentParts(envelope: ResultEnvelope): {
  readonly text: string;
  readonly nonText: ReadonlyArray<MessageContent>;
  readonly textParts: ReadonlyArray<TextContent>;
} {
  const text = envelope.textBody;
  const nonText: MessageContent[] = [];
  const textParts: TextContent[] = [];
  for (const part of envelope.contentParts) {
    if (part.type === 'text') {
      textParts.push(part);
    } else {
      nonText.push(part);
    }
  }
  return Object.freeze({
    text,
    nonText: Object.freeze(nonText),
    textParts: Object.freeze(textParts),
  });
}

function assembleFromChunks<TOutput>(chunks: ReadonlyArray<ContentChunk>): ResultEnvelope<TOutput> {
  let text = '';
  let jsonState: unknown;
  const contentParts: MessageContent[] = [];
  let textPieces: string[] | null = null;
  for (const chunk of chunks) {
    switch (chunk.kind) {
      case 'text': {
        if (textPieces !== null) {
          textPieces.push(chunk.text);
        } else {
          text += chunk.text;
          if (text.length > 4096) {
            // Switch to array-and-join strategy for long streams.
            textPieces = [text];
            text = '';
          }
        }
        break;
      }
      case 'json-delta': {
        jsonState = applyJsonPatch(jsonState, chunk.path, chunk.value);
        break;
      }
      case 'image': {
        contentParts.push({
          type: 'image',
          image: chunk.data,
          mimeType: chunk.mediaType,
        });
        break;
      }
    }
  }
  if (textPieces !== null) {
    text = textPieces.join('');
  }
  // The streaming output is a `string` (text) by default, OR the
  // assembled JSON state when only json-delta chunks were received.
  let output: unknown = text.length > 0 ? text : jsonState;
  if (text.length === 0 && jsonState === undefined && contentParts.length > 0) {
    // Image-only stream — surface an empty string so consumers do not
    // get `undefined` output.
    output = '';
  }
  const textBody = text.length > 0 ? text : renderText(output);
  return Object.freeze({
    output: output as TOutput | undefined,
    textBody,
    contentParts: Object.freeze(contentParts),
  });
}

function applyJsonPatch(state: unknown, path: string, value: unknown): unknown {
  const segments = path.split('/').filter((s) => s.length > 0);
  if (segments.length === 0) return value;
  const root = (state ?? {}) as Record<string, unknown>;
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    if (segment === undefined) continue;
    const next = cursor[segment];
    if (next === undefined || next === null || typeof next !== 'object') {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  const last = segments[segments.length - 1];
  if (last !== undefined) cursor[last] = value;
  return root;
}

function renderText(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function isToolReturn<TOutput>(value: unknown): value is ToolReturn<TOutput> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.hasOwn(value, 'output') &&
    !Array.isArray(value)
  );
}
