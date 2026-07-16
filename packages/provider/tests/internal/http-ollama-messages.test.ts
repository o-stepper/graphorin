/**
 * PS-13 - the native Ollama `/api/chat` path must serialize replayed assistant
 * `tool_calls` with object `arguments` (not a JSON string) and without the
 * OpenAI-only `id` / `type` fields, which the Go server's unmarshaller rejects.
 */
import { describe, expect, it } from 'vitest';

import { toOllamaChatMessages, toOpenAIChatMessages } from '../../src/internal/http.js';

describe('REASONING-01 - preserved reasoning parts reach the wire reasoning slot', () => {
  const assistantWithReasoning = {
    role: 'assistant' as const,
    content: [
      { type: 'reasoning', text: 'CHAIN-abc' },
      { type: 'text', text: 'final answer' },
    ],
  };

  it('serializes reasoning onto Ollama native `thinking`, not dropped', () => {
    const [msg] = toOllamaChatMessages([assistantWithReasoning]);
    expect(msg?.content).toBe('final answer');
    expect(msg?.thinking).toBe('CHAIN-abc');
  });

  it('serializes reasoning onto OpenAI-compat `reasoning_content`, not dropped', () => {
    const [msg] = toOpenAIChatMessages([assistantWithReasoning]);
    expect(msg?.content).toBe('final answer');
    expect(msg?.reasoning_content).toBe('CHAIN-abc');
  });

  it('emits no reasoning slot when there is no reasoning part', () => {
    const [ollama] = toOllamaChatMessages([{ role: 'assistant', content: 'plain' }]);
    const [openai] = toOpenAIChatMessages([{ role: 'assistant', content: 'plain' }]);
    expect(ollama?.thinking).toBeUndefined();
    expect(openai?.reasoning_content).toBeUndefined();
  });
});

describe('toOllamaChatMessages (PS-13)', () => {
  it('emits object arguments and drops OpenAI-only id/type on tool_calls', () => {
    const [msg] = toOllamaChatMessages([
      {
        role: 'assistant',
        content: '',
        toolCalls: [{ toolCallId: 'x', toolName: 'get_weather', args: { city: 'Tbilisi' } }],
      },
    ]);
    const calls = msg?.tool_calls as Array<Record<string, unknown>>;
    expect(calls).toHaveLength(1);
    const call = calls[0] as { id?: unknown; type?: unknown; function: Record<string, unknown> };
    expect(call.id).toBeUndefined();
    expect(call.type).toBeUndefined();
    expect(call.function.name).toBe('get_weather');
    // Native Ollama wants a map, not a JSON-stringified blob.
    expect(call.function.arguments).toEqual({ city: 'Tbilisi' });
    expect(typeof call.function.arguments).toBe('object');
  });

  it('parses string args back into an object (lenient)', () => {
    const [msg] = toOllamaChatMessages([
      {
        role: 'assistant',
        content: '',
        toolCalls: [{ toolCallId: 'x', toolName: 'f', args: '{"n":1}' }],
      },
    ]);
    const call = (msg?.tool_calls as Array<{ function: { arguments: unknown } }>)[0];
    expect(call?.function.arguments).toEqual({ n: 1 });
  });

  it('keeps role + content for plain and tool-result messages', () => {
    const out = toOllamaChatMessages([
      { role: 'user', content: 'hi' },
      { role: 'tool', content: 'result text', toolCallId: 'x' },
    ]);
    expect(out[0]).toEqual({ role: 'user', content: 'hi' });
    expect(out[1]?.role).toBe('tool');
    expect(out[1]?.content).toBe('result text');
  });
});
