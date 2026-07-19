/**
 * Conversion from Graphorin messages to the Anthropic Messages API
 * wire shape, used by `AnthropicAPICounter`.
 *
 * The `count_tokens` endpoint accepts the same body as `/v1/messages`:
 * only `user` / `assistant` roles in `messages`, system prompts in the
 * top-level `system` field, assistant tool calls as `tool_use` blocks,
 * tool results as `tool_result` blocks inside a **user** turn, and
 * images as `source` blocks. Posting Graphorin-shaped messages 400s on
 * any transcript containing a system / tool message or `toolCalls`,
 * silently downgrading the "native" counter to tiktoken.
 *
 * @internal
 */

import type { Message, MessageContent } from '@graphorin/core';

/** Anthropic-shaped count_tokens payload. */
export interface AnthropicCountPayload {
  readonly system?: string;
  readonly messages: ReadonlyArray<{
    readonly role: 'user' | 'assistant';
    readonly content: ReadonlyArray<Readonly<Record<string, unknown>>>;
  }>;
}

/**
 * Convert Graphorin messages to the Anthropic wire shape. Returns
 * `null` when nothing countable remains (the caller should use its
 * local fallback instead of paying an HTTP round trip for a 400).
 *
 * Consecutive same-role turns are merged and the transcript is forced
 * to start with a user turn - both hard requirements of the API.
 * Parts with no wire representation for counting purposes (audio,
 * non-PDF files, unsigned reasoning) are skipped; the count is then a
 * slight undercount rather than a guaranteed 400.
 *
 * @internal
 */
export function toAnthropicCountPayload(
  messages: ReadonlyArray<Message>,
): AnthropicCountPayload | null {
  const systemParts: string[] = [];
  const turns: Array<{ role: 'user' | 'assistant'; content: Array<Record<string, unknown>> }> = [];

  const pushBlocks = (role: 'user' | 'assistant', blocks: Array<Record<string, unknown>>): void => {
    if (blocks.length === 0) return;
    const last = turns[turns.length - 1];
    if (last !== undefined && last.role === role) {
      last.content.push(...blocks);
      return;
    }
    turns.push({ role, content: blocks });
  };

  for (const msg of messages) {
    switch (msg.role) {
      case 'system':
        if (msg.content.length > 0) systemParts.push(msg.content);
        break;
      case 'user':
        pushBlocks('user', contentToBlocks(msg.content, 'user'));
        break;
      case 'assistant': {
        const blocks = contentToBlocks(msg.content, 'assistant');
        for (const call of msg.toolCalls ?? []) {
          blocks.push({
            type: 'tool_use',
            id: call.toolCallId,
            name: call.toolName,
            input: toInputObject(call.args),
          });
        }
        pushBlocks('assistant', blocks);
        break;
      }
      case 'tool': {
        // Tool results live in the next USER turn on the Anthropic wire.
        const text = flattenToText(msg.content);
        pushBlocks('user', [
          {
            type: 'tool_result',
            tool_use_id: msg.toolCallId,
            ...(text.length > 0 ? { content: [{ type: 'text', text }] } : {}),
          },
        ]);
        break;
      }
    }
  }

  if (turns.length === 0 && systemParts.length === 0) return null;
  // The API requires the first message to be a user turn.
  if (turns.length === 0 || turns[0]?.role !== 'user') {
    turns.unshift({ role: 'user', content: [{ type: 'text', text: '.' }] });
  }
  return {
    ...(systemParts.length > 0 ? { system: systemParts.join('\n\n') } : {}),
    messages: turns,
  };
}

function contentToBlocks(
  content: string | ReadonlyArray<MessageContent>,
  role: 'user' | 'assistant',
): Array<Record<string, unknown>> {
  if (typeof content === 'string') {
    return content.length > 0 ? [{ type: 'text', text: content }] : [];
  }
  const blocks: Array<Record<string, unknown>> = [];
  for (const part of content) {
    switch (part.type) {
      case 'text':
        if (part.text.length > 0) blocks.push({ type: 'text', text: part.text });
        break;
      case 'image': {
        const source = toImageSource(part.image, part.mimeType);
        if (source !== null && role === 'user') blocks.push({ type: 'image', source });
        break;
      }
      case 'file': {
        // PDFs count as document blocks; other file kinds have no
        // countable wire form and are skipped.
        if (part.mimeType === 'application/pdf' && part.file instanceof Uint8Array) {
          blocks.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: toBase64(part.file),
            },
          });
        }
        break;
      }
      case 'reasoning': {
        // Only signed thinking blocks round-trip through the API;
        // unsigned reasoning would 400, so it is skipped (the default
        // retention policy strips it from outbound requests anyway).
        if (
          role === 'assistant' &&
          part.meta?.provider === 'anthropic' &&
          typeof part.meta.signature === 'string'
        ) {
          blocks.push({ type: 'thinking', thinking: part.text, signature: part.meta.signature });
        }
        break;
      }
      case 'audio':
        // No audio block on the Messages API; skip.
        break;
    }
  }
  return blocks;
}

function toImageSource(
  image: Uint8Array | URL,
  mimeType: string | undefined,
): Record<string, unknown> | null {
  if (image instanceof URL) {
    return { type: 'url', url: image.toString() };
  }
  if (image instanceof Uint8Array) {
    return {
      type: 'base64',
      media_type: mimeType ?? 'image/png',
      data: toBase64(image),
    };
  }
  return null;
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function toInputObject(args: unknown): Record<string, unknown> {
  if (typeof args === 'string') {
    try {
      const parsed: unknown = JSON.parse(args);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return typeof args === 'object' && args !== null ? (args as Record<string, unknown>) : {};
}

function flattenToText(content: string | ReadonlyArray<MessageContent>): string {
  if (typeof content === 'string') return content;
  const buffer: string[] = [];
  for (const part of content) {
    if (part.type === 'text' || part.type === 'reasoning') buffer.push(part.text);
  }
  return buffer.join('');
}
