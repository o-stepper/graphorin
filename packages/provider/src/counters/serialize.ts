/**
 * Canonical text-only serialization of a Graphorin `Message`. Used by
 * counters that lack a vendor-native API (`JsTiktokenCounter`,
 * `HeuristicCounter`).
 *
 * @internal
 */

import type { Message, MessageContent } from '@graphorin/core';

/**
 * Plain-text projection of a {@link Message}. The shape is what the
 * counter actually feeds the tokenizer.
 *
 * @internal
 */
export interface SerializedMessage {
  readonly role: string;
  readonly text: string;
  readonly toolCalls: ReadonlyArray<{ readonly name: string; readonly args: string }>;
}

/**
 * Project a `Message` into a flat string suitable for tokenizers that
 * do not understand multimodal content. Image / audio / file parts
 * are replaced with the canonical placeholder `[image]` / `[audio]` /
 * `[file:<mimeType>]` so byte counts stay deterministic.
 *
 * @internal
 */
export function serialiseMessageForCount(msg: Message): SerializedMessage {
  const role = msg.role;
  const text = serialiseContent(msg.content);
  const toolCalls =
    (msg as { toolCalls?: ReadonlyArray<{ toolName: string; args: unknown }> }).toolCalls?.map(
      (tc) => ({
        name: tc.toolName,
        args: typeof tc.args === 'string' ? tc.args : JSON.stringify(tc.args),
      }),
    ) ?? [];
  return { role, text, toolCalls };
}

function serialiseContent(content: string | ReadonlyArray<MessageContent>): string {
  if (typeof content === 'string') return content;
  const buffer: string[] = [];
  for (const part of content) {
    switch (part.type) {
      case 'text':
        buffer.push(part.text);
        break;
      case 'image':
        buffer.push('[image]');
        break;
      case 'audio':
        buffer.push('[audio]');
        break;
      case 'file':
        buffer.push(`[file:${part.mimeType}]`);
        break;
      case 'reasoning':
        buffer.push(part.text);
        break;
      default:
        // Unknown content variants are silently skipped to keep the
        // counter forward-compatible.
        break;
    }
  }
  return buffer.join('\n');
}

/**
 * Render a `SerializedMessage` as a single string with role prefix.
 * Useful for naive estimators that count by character length.
 *
 * @internal
 */
export function serializedToString(msg: SerializedMessage): string {
  const parts = [`[${msg.role}]`, msg.text];
  for (const tc of msg.toolCalls) {
    parts.push(`[tool-call:${tc.name}] ${tc.args}`);
  }
  return parts.join('\n');
}
