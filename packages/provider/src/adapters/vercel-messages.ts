/**
 * Conversion layer between Graphorin shapes and the Vercel AI SDK
 * call contract (core-provider-01).
 *
 * The AI SDK does NOT accept Graphorin messages or tool definitions
 * verbatim:
 *
 * - `tools` must be a `Record<string, Tool>` keyed by tool name whose
 *   `inputSchema` is a zod / Standard Schema value or a `jsonSchema()`
 *   wrapped `Schema` object. A `ToolDefinition[]` array advertises
 *   tools under index keys (`"0"`, `"1"`, ...) with schemas the SDK
 *   cannot consume.
 * - Assistant tool calls must be `{type: 'tool-call'}` *content parts*
 *   and tool results `{role: 'tool', content: [{type: 'tool-result'}]}`
 *   messages; Graphorin's separate `toolCalls` field and string-content
 *   `ToolMessage` fail the SDK's `standardizePrompt` zod validation
 *   (`AI_InvalidPromptError`) on the second step of any tool loop.
 *
 * Where the AI SDK renamed keys between major versions the converters
 * emit BOTH spellings (PS-6 dual-shape): `input` + `args` on tool-call
 * parts, `output` + `result` on tool-result parts, `mediaType` +
 * `mimeType` on binary parts, `inputSchema` + `parameters` on tools.
 * Both peers zod-strip the key they do not know.
 *
 * @internal
 */

import type { Message, MessageContent, ToolChoice, ToolDefinition } from '@graphorin/core';

/**
 * Registered symbols used by the AI SDK's `asSchema()` detection. They
 * are created with `Symbol.for(...)` in the SDK, so a structurally
 * hand-rolled wrapper is indistinguishable from the SDK's own
 * `jsonSchema()` output — including across duplicated copies of the
 * SDK in a node_modules tree.
 */
const AI_SDK_SCHEMA_SYMBOL = Symbol.for('vercel.ai.schema');
const AI_SDK_VALIDATOR_SYMBOL = Symbol.for('vercel.ai.validator');

/**
 * Wrap a plain JSON Schema record into the AI SDK `Schema` shape the
 * SDK's `asSchema()` accepts. Equivalent to importing `jsonSchema`
 * from `ai`, but hand-rolled so the converter works with fixture
 * runtimes and does not force the optional peer at module scope.
 *
 * @internal
 */
export function wrapAsAiSdkSchema(
  schema: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return {
    [AI_SDK_SCHEMA_SYMBOL]: true,
    [AI_SDK_VALIDATOR_SYMBOL]: true,
    _type: undefined,
    jsonSchema: schema,
    validate: undefined,
  } as Readonly<Record<string, unknown>>;
}

/**
 * Convert Graphorin `ToolDefinition[]` to the AI SDK's name-keyed tool
 * record.
 *
 * @internal
 */
export function toAiSdkTools(
  tools: ReadonlyArray<ToolDefinition>,
): Readonly<Record<string, unknown>> {
  const record: Record<string, unknown> = {};
  for (const t of tools) {
    const schema = wrapAsAiSdkSchema(t.inputSchema);
    record[t.name] = {
      ...(t.description !== undefined ? { description: t.description } : {}),
      // v5+/v7 reads `inputSchema`; v4 reads `parameters` (PS-6).
      inputSchema: schema,
      parameters: schema,
    };
  }
  return record;
}

/**
 * Convert a Graphorin `ToolChoice` to the AI SDK's spelling. The
 * string modes are identical; the named-tool form differs
 * (`{tool: name}` vs `{type: 'tool', toolName: name}`).
 *
 * @internal
 */
export function toAiSdkToolChoice(choice: ToolChoice): unknown {
  if (choice === 'auto' || choice === 'required' || choice === 'none') return choice;
  return { type: 'tool', toolName: choice.tool };
}

/**
 * Result of {@link toAiSdkPrompt}: the converted message array plus the
 * hoisted system text (the SDK rejects `role: 'system'` entries inside
 * `messages` — system prompts ride the request-level option).
 *
 * @internal
 */
export interface AiSdkPrompt {
  readonly messages: ReadonlyArray<Readonly<Record<string, unknown>>>;
  readonly system?: string;
}

/**
 * Convert Graphorin messages to AI SDK `ModelMessage`s:
 *
 * - system-role messages are hoisted into `system` (v7 rejects them
 *   inside the `messages` array outright),
 * - assistant `toolCalls` become `tool-call` content parts,
 * - `ToolMessage`s become `{role: 'tool'}` messages carrying a
 *   `tool-result` part whose `toolName` is recovered from the paired
 *   assistant call earlier in the transcript,
 * - binary content parts are renamed onto the SDK's part vocabulary
 *   (`file` parts carry `data`; audio has no dedicated user part and
 *   rides as a `file` part).
 *
 * @internal
 */
export function toAiSdkPrompt(messages: ReadonlyArray<Message>): AiSdkPrompt {
  const out: Array<Readonly<Record<string, unknown>>> = [];
  const systemParts: string[] = [];
  const toolNameById = new Map<string, string>();
  for (const msg of messages) {
    switch (msg.role) {
      case 'system':
        if (msg.content.length > 0) systemParts.push(msg.content);
        break;
      case 'user':
        out.push({
          role: 'user',
          content: typeof msg.content === 'string' ? msg.content : msg.content.flatMap(toUserPart),
        });
        break;
      case 'assistant': {
        for (const call of msg.toolCalls ?? []) {
          toolNameById.set(call.toolCallId, call.toolName);
        }
        const hasCalls = msg.toolCalls !== undefined && msg.toolCalls.length > 0;
        if (!hasCalls && typeof msg.content === 'string') {
          out.push({ role: 'assistant', content: msg.content });
          break;
        }
        const parts: Array<Readonly<Record<string, unknown>>> = [];
        if (typeof msg.content === 'string') {
          if (msg.content.length > 0) parts.push({ type: 'text', text: msg.content });
        } else {
          for (const part of msg.content) parts.push(...toAssistantPart(part));
        }
        for (const call of msg.toolCalls ?? []) {
          parts.push({
            type: 'tool-call',
            toolCallId: call.toolCallId,
            toolName: call.toolName,
            // v5+/v7 reads `input`; v4 reads `args` (PS-6).
            input: call.args,
            args: call.args,
          });
        }
        out.push({ role: 'assistant', content: parts });
        break;
      }
      case 'tool': {
        const text = flattenToText(msg.content);
        out.push({
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: msg.toolCallId,
              toolName: toolNameById.get(msg.toolCallId) ?? 'unknown_tool',
              // v5+/v7 reads `output`; v4 reads `result` (PS-6).
              output: { type: 'text', value: text },
              result: text,
            },
          ],
        });
        break;
      }
    }
  }
  return {
    messages: out,
    ...(systemParts.length > 0 ? { system: systemParts.join('\n\n') } : {}),
  };
}

function toUserPart(part: MessageContent): ReadonlyArray<Readonly<Record<string, unknown>>> {
  switch (part.type) {
    case 'text':
      return [{ type: 'text', text: part.text }];
    case 'image':
      return [
        {
          type: 'image',
          image: part.image,
          // v5+/v7 reads `mediaType`; v4 reads `mimeType` (PS-6).
          ...(part.mimeType !== undefined
            ? { mediaType: part.mimeType, mimeType: part.mimeType }
            : {}),
        },
      ];
    case 'audio':
      return [filePart(part.audio, part.mimeType ?? 'application/octet-stream')];
    case 'file':
      return [filePart(part.file, part.mimeType, part.filename)];
    case 'reasoning':
      // Reasoning belongs to assistant turns; a stray part in user
      // content has no SDK representation. Drop it.
      return [];
  }
}

function toAssistantPart(part: MessageContent): ReadonlyArray<Readonly<Record<string, unknown>>> {
  switch (part.type) {
    case 'text':
      return part.text.length > 0 ? [{ type: 'text', text: part.text }] : [];
    case 'reasoning': {
      const meta = part.meta;
      const anthropic: Record<string, unknown> = {};
      if (meta?.provider === 'anthropic') {
        if (typeof meta.signature === 'string') anthropic.signature = meta.signature;
        if (typeof meta.data === 'string') anthropic.redactedData = meta.data;
      }
      return [
        {
          type: 'reasoning',
          text: part.text,
          ...(Object.keys(anthropic).length > 0 ? { providerOptions: { anthropic } } : {}),
        },
      ];
    }
    case 'image':
      return [filePart(part.image, part.mimeType ?? 'image/png')];
    case 'audio':
      return [filePart(part.audio, part.mimeType ?? 'application/octet-stream')];
    case 'file':
      return [filePart(part.file, part.mimeType, part.filename)];
  }
}

function filePart(
  data: Uint8Array | URL,
  mimeType: string,
  filename?: string,
): Readonly<Record<string, unknown>> {
  return {
    type: 'file',
    data,
    // v5+/v7 reads `mediaType`; v4 reads `mimeType` (PS-6).
    mediaType: mimeType,
    mimeType,
    ...(filename !== undefined ? { filename } : {}),
  };
}

function flattenToText(content: string | ReadonlyArray<MessageContent>): string {
  if (typeof content === 'string') return content;
  const buffer: string[] = [];
  for (const part of content) {
    if (part.type === 'text' || part.type === 'reasoning') buffer.push(part.text);
  }
  return buffer.join('');
}

/**
 * Decorate the first and last converted conversation messages with an
 * Anthropic `cacheControl` provider option (core-provider-02).
 *
 * The first-message anchor makes tools + system + the stable prefix a
 * cache segment that is written once and read on every later step; the
 * last-message anchor caches the whole conversation so each step's write
 * becomes the next step's read. Non-Anthropic models ignore the option.
 * A single-message conversation gets one anchor.
 */
export function applyCacheAnchors(
  messages: ReadonlyArray<Readonly<Record<string, unknown>>>,
  ttl?: '5m' | '1h',
): ReadonlyArray<Readonly<Record<string, unknown>>> {
  if (messages.length === 0) return messages;
  const cacheControl: Record<string, unknown> = {
    type: 'ephemeral',
    ...(ttl === '1h' ? { ttl: '1h' } : {}),
  };
  const decorate = (msg: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> => {
    const existing =
      typeof msg.providerOptions === 'object' && msg.providerOptions !== null
        ? (msg.providerOptions as Record<string, unknown>)
        : {};
    const anthropic =
      typeof existing.anthropic === 'object' && existing.anthropic !== null
        ? (existing.anthropic as Record<string, unknown>)
        : {};
    return {
      ...msg,
      providerOptions: { ...existing, anthropic: { ...anthropic, cacheControl } },
    };
  };
  if (messages.length === 1) {
    const only = messages[0];
    return only === undefined ? messages : [decorate(only)];
  }
  const first = messages[0];
  const last = messages[messages.length - 1];
  if (first === undefined || last === undefined) return messages;
  return [decorate(first), ...messages.slice(1, -1), decorate(last)];
}
