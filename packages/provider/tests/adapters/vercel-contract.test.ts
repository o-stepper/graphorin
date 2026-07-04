/**
 * core-provider-01 contract tests: the vercel adapter run against the
 * REAL `ai` peer (a devDependency), not fixtures. Every request built
 * by the adapter flows through the SDK's actual zod prompt validation
 * (`standardizePrompt`) and tool preparation, so any drift between the
 * conversion layer and the installed SDK fails here — without network.
 *
 * Pre-fix, the adapter forwarded Graphorin `ToolDefinition[]` and raw
 * Graphorin messages verbatim; the SDK rejected the second step of any
 * tool conversation with `AI_InvalidPromptError` and advertised tools
 * under array-index names. The last test pins that failure mode so the
 * conversion layer cannot be "simplified" back out.
 */
import type { Message, ProviderEvent } from '@graphorin/core';
import * as realAi from 'ai';
import { convertArrayToReadableStream, MockLanguageModelV4 } from 'ai/test';
import { describe, expect, it } from 'vitest';
import { type VercelRuntimeOverrides, vercelAdapter } from '../../src/adapters/vercel.js';
import {
  toAiSdkPrompt,
  toAiSdkToolChoice,
  toAiSdkTools,
} from '../../src/adapters/vercel-messages.js';

/** A two-step tool conversation in Graphorin shapes. */
const TOOL_CONVERSATION: ReadonlyArray<Message> = [
  { role: 'system', content: 'be terse' },
  { role: 'user', content: 'weather in kyiv?' },
  {
    role: 'assistant',
    content: 'checking',
    toolCalls: [{ toolCallId: 'call-1', toolName: 'weather', args: { city: 'kyiv' } }],
  },
  { role: 'tool', toolCallId: 'call-1', content: 'sunny, 25C' },
];

const WEATHER_TOOL = {
  name: 'weather',
  description: 'look up the weather',
  inputSchema: {
    type: 'object',
    properties: { city: { type: 'string' } },
    required: ['city'],
  },
} as const;

function realRuntime(): VercelRuntimeOverrides {
  return {
    streamText: realAi.streamText,
    generateText: realAi.generateText,
  } as unknown as VercelRuntimeOverrides;
}

describe('vercelAdapter against the real AI SDK', () => {
  it('generate(): a tool conversation passes SDK validation and reaches the model converted', async () => {
    let seenParams: Record<string, unknown> | undefined;
    const model = new MockLanguageModelV4({
      // The flat result shape below predates the nested V4 spec types;
      // the v7 runtime normalizes it, and this test targets the
      // OUTBOUND params, so the return value is deliberately loose.
      doGenerate: (async (params: unknown) => {
        seenParams = params as Record<string, unknown>;
        return {
          finishReason: 'stop',
          usage: { inputTokens: 7, outputTokens: 3, totalTokens: 10 },
          content: [{ type: 'text', text: 'sunny' }],
          warnings: [],
        };
      }) as never,
    });
    const adapter = vercelAdapter(model, { runtimeOverrides: realRuntime() });

    const response = await adapter.generate({
      messages: TOOL_CONVERSATION,
      tools: [WEATHER_TOOL],
      toolChoice: 'auto',
    });

    expect(response.text).toBe('sunny');
    // Tools reached the model keyed by NAME with the JSON Schema intact
    // (pre-fix: index keys and an unusable schema value).
    const tools = seenParams?.tools as ReadonlyArray<{
      name: string;
      inputSchema: unknown;
      description?: string;
    }>;
    expect(tools.map((t) => t.name)).toEqual(['weather']);
    expect(tools[0]?.inputSchema).toEqual(WEATHER_TOOL.inputSchema);
    expect(tools[0]?.description).toBe('look up the weather');
    // The prompt round-tripped the tool loop: assistant tool-call part
    // followed by a tool-result message (pre-fix: AI_InvalidPromptError).
    // The transcript's system message was hoisted into the system slot
    // (v7 rejects system-role entries inside `messages`).
    const prompt = seenParams?.prompt as ReadonlyArray<{ role: string; content: unknown }>;
    expect(prompt.map((m) => m.role)).toEqual(['system', 'user', 'assistant', 'tool']);
    expect(prompt[0]?.content).toBe('be terse');
    const assistantParts = prompt[2]?.content as ReadonlyArray<Record<string, unknown>>;
    expect(assistantParts.some((p) => p.type === 'tool-call' && p.toolName === 'weather')).toBe(
      true,
    );
    const toolParts = prompt[3]?.content as ReadonlyArray<Record<string, unknown>>;
    expect(toolParts[0]?.type).toBe('tool-result');
    expect(toolParts[0]?.toolCallId).toBe('call-1');
    expect(toolParts[0]?.toolName).toBe('weather');
  });

  it('stream(): real streamText chunks map back onto Graphorin ProviderEvents', async () => {
    const model = new MockLanguageModelV4({
      doStream: (async () => ({
        stream: convertArrayToReadableStream([
          { type: 'stream-start', warnings: [] },
          { type: 'text-start', id: 't1' },
          { type: 'text-delta', id: 't1', delta: 'hello ' },
          { type: 'text-end', id: 't1' },
          { type: 'tool-input-start', id: 'call-9', toolName: 'weather' },
          { type: 'tool-input-delta', id: 'call-9', delta: '{"city":"kyiv"}' },
          { type: 'tool-input-end', id: 'call-9' },
          {
            type: 'tool-call',
            toolCallId: 'call-9',
            toolName: 'weather',
            input: '{"city":"kyiv"}',
          },
          {
            type: 'finish',
            finishReason: 'tool-calls',
            usage: { inputTokens: 3, outputTokens: 5, totalTokens: 8 },
          },
        ] as never),
      })) as never,
    });
    const adapter = vercelAdapter(model, { runtimeOverrides: realRuntime() });

    const events: ProviderEvent[] = [];
    for await (const event of adapter.stream({
      messages: TOOL_CONVERSATION,
      tools: [WEATHER_TOOL],
    })) {
      events.push(event);
    }

    const types = events.map((e) => e.type);
    expect(types[0]).toBe('stream-start');
    expect(types).toContain('text-delta');
    expect(types).toContain('tool-call-start');
    expect(types).toContain('tool-call-input-delta');
    expect(types).toContain('tool-call-end');
    const end = events.find((e) => e.type === 'tool-call-end');
    expect(end !== undefined && 'toolCallId' in end && end.toolCallId).toBe('call-9');
    // The real v7 stream parses tool input into an object before `tool-call`.
    expect(end !== undefined && 'finalArgs' in end && end.finalArgs).toEqual({ city: 'kyiv' });
    expect(types.at(-1)).toBe('finish');
  });

  it('every converted message validates against the SDK modelMessageSchema', () => {
    const prompt = toAiSdkPrompt(TOOL_CONVERSATION);
    // System text is hoisted out of the array, never a message.
    expect(prompt.system).toBe('be terse');
    expect(prompt.messages.some((m) => m.role === 'system')).toBe(false);
    for (const message of prompt.messages) {
      const parsed = (
        realAi.modelMessageSchema as { safeParse: (v: unknown) => { success: boolean } }
      ).safeParse(message);
      expect(parsed.success).toBe(true);
    }
  });

  it('toAiSdkTools produces values the SDK asSchema() accepts', () => {
    const record = toAiSdkTools([WEATHER_TOOL]) as Record<string, { inputSchema: unknown }>;
    const schema = realAi.asSchema(record.weather?.inputSchema as never);
    expect(schema.jsonSchema).toEqual(WEATHER_TOOL.inputSchema);
  });

  it('toAiSdkToolChoice maps the named-tool form onto the SDK spelling', () => {
    expect(toAiSdkToolChoice('auto')).toBe('auto');
    expect(toAiSdkToolChoice('required')).toBe('required');
    expect(toAiSdkToolChoice('none')).toBe('none');
    expect(toAiSdkToolChoice({ tool: 'weather' })).toEqual({ type: 'tool', toolName: 'weather' });
  });

  it('REGRESSION: raw Graphorin tool shapes are rejected by the real SDK', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: (async () => ({
        finishReason: 'stop',
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        content: [{ type: 'text', text: 'ok' }],
        warnings: [],
      })) as never,
    });
    // What buildCallArgs used to send: raw messages + a ToolDefinition[].
    await expect(
      realAi.generateText({
        model,
        messages: TOOL_CONVERSATION,
        tools: [WEATHER_TOOL],
      } as never),
    ).rejects.toThrow(/messages do not match|InvalidPrompt|system messages are not allowed/i);
  });
});

describe('prompt-cache economics against the real AI SDK (core-provider-02)', () => {
  it('stream(): v7 inputTokenDetails map onto Usage cache legs; reasoning is split out', async () => {
    const model = new MockLanguageModelV4({
      doStream: (async () => ({
        stream: convertArrayToReadableStream([
          { type: 'stream-start', warnings: [] },
          { type: 'text-start', id: 't1' },
          { type: 'text-delta', id: 't1', delta: 'hi' },
          { type: 'text-end', id: 't1' },
          {
            type: 'finish',
            finishReason: 'stop',
            usage: {
              inputTokens: { total: 100, noCache: 10, cacheRead: 80, cacheWrite: 10 },
              outputTokens: { total: 9, text: 5, reasoning: 4 },
            },
          },
        ] as never),
      })) as never,
    });
    const adapter = vercelAdapter(model, { runtimeOverrides: realRuntime() });

    let finish: Extract<ProviderEvent, { type: 'finish' }> | undefined;
    for await (const event of adapter.stream({ messages: TOOL_CONVERSATION })) {
      if (event.type === 'finish') finish = event;
    }

    expect(finish?.usage.promptTokens).toBe(100);
    expect(finish?.usage.cachedReadTokens).toBe(80);
    expect(finish?.usage.cacheWriteTokens).toBe(10);
    // Exclusive split: completion + reasoning === the wire's output total.
    expect(finish?.usage.completionTokens).toBe(5);
    expect(finish?.usage.reasoningTokens).toBe(4);
  });

  it('generate(): cache legs survive the one-shot path too', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: (async () => ({
        finishReason: 'stop',
        usage: {
          inputTokens: { total: 50, noCache: 50 },
          outputTokens: { total: 3, text: 3 },
        },
        content: [{ type: 'text', text: 'ok' }],
        warnings: [],
      })) as never,
    });
    const adapter = vercelAdapter(model, { runtimeOverrides: realRuntime() });
    const response = await adapter.generate({ messages: TOOL_CONVERSATION });
    expect(response.usage.promptTokens).toBe(50);
    // Zero cache activity leaves the pre-cache Usage shape untouched.
    expect(response.usage.cachedReadTokens).toBeUndefined();
    expect(response.usage.cacheWriteTokens).toBeUndefined();
  });

  it("cachePolicy 'auto' anchors cache_control on the first and last conversation messages", async () => {
    let seenParams: Record<string, unknown> | undefined;
    const model = new MockLanguageModelV4({
      doGenerate: (async (params: unknown) => {
        seenParams = params as Record<string, unknown>;
        return {
          finishReason: 'stop',
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
          content: [{ type: 'text', text: 'ok' }],
          warnings: [],
        };
      }) as never,
    });
    const adapter = vercelAdapter(model, { runtimeOverrides: realRuntime() });

    await adapter.generate({
      messages: TOOL_CONVERSATION,
      tools: [WEATHER_TOOL],
      cachePolicy: { breakpoints: 'auto', ttl: '1h' },
    });

    // The system message was hoisted, so the anchored conversation is
    // [user, assistant, tool]: first + last carry the anthropic
    // cacheControl provider option, the middle stays untouched.
    const prompt = seenParams?.prompt as ReadonlyArray<{
      role: string;
      providerOptions?: { anthropic?: { cacheControl?: { type?: string; ttl?: string } } };
    }>;
    const conversation = prompt.filter((m) => m.role !== 'system');
    expect(conversation).toHaveLength(3);
    expect(conversation[0]?.providerOptions?.anthropic?.cacheControl).toEqual({
      type: 'ephemeral',
      ttl: '1h',
    });
    expect(conversation[1]?.providerOptions).toBeUndefined();
    expect(conversation[2]?.providerOptions?.anthropic?.cacheControl).toEqual({
      type: 'ephemeral',
      ttl: '1h',
    });
  });

  it("cachePolicy 'none' / absent leaves messages byte-identical", async () => {
    let seenParams: Record<string, unknown> | undefined;
    const model = new MockLanguageModelV4({
      doGenerate: (async (params: unknown) => {
        seenParams = params as Record<string, unknown>;
        return {
          finishReason: 'stop',
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
          content: [{ type: 'text', text: 'ok' }],
          warnings: [],
        };
      }) as never,
    });
    const adapter = vercelAdapter(model, { runtimeOverrides: realRuntime() });
    await adapter.generate({ messages: TOOL_CONVERSATION, cachePolicy: { breakpoints: 'none' } });
    const prompt = seenParams?.prompt as ReadonlyArray<Record<string, unknown>>;
    expect(prompt.every((m) => m.providerOptions === undefined)).toBe(true);
  });
});

describe('C2 — adapter-level worked-example folding', () => {
  it('folds ToolDefinition.examples into the wire description on the RAW adapter path', async () => {
    let seenParams: Record<string, unknown> | undefined;
    const model = new MockLanguageModelV4({
      doGenerate: (async (params: unknown) => {
        seenParams = params as Record<string, unknown>;
        return {
          finishReason: 'stop',
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
          content: [{ type: 'text', text: 'ok' }],
          warnings: [],
        };
      }) as never,
    });
    const adapter = vercelAdapter(model, { runtimeOverrides: realRuntime() });
    await adapter.generate({
      messages: [{ role: 'user', content: 'hi' }],
      tools: [
        {
          ...WEATHER_TOOL,
          examples: [{ input: { city: 'kyiv' }, output: 'sunny, 25C', comment: 'plain city name' }],
        },
      ],
    });
    const tools = seenParams?.tools as ReadonlyArray<{ description?: string }>;
    expect(tools[0]?.description).toContain('Examples:');
    expect(tools[0]?.description).toContain('"city":"kyiv"');
    expect(tools[0]?.description).toContain('// plain city name');
  });
});
