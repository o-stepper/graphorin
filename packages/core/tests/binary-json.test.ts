import { describe, expect, it } from 'vitest';

import type { Message, RunState, WireRunState } from '../src/index.js';
import {
  base64ToBytes,
  bytesToBase64,
  fromJsonSafeContentParts,
  fromJsonSafeMessage,
  fromJsonSafeRunState,
  toJsonSafeContentParts,
  toJsonSafeMessage,
  toJsonSafeRunState,
  zeroUsage,
} from '../src/index.js';

const BYTES = new Uint8Array([0, 1, 2, 250, 251, 255, 137, 80, 78, 71]);

function jsonRoundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('base64 helpers', () => {
  it('round-trips bytes for every length modulo 3', () => {
    for (const len of [0, 1, 2, 3, 4, 5, 31, 32, 33, 256]) {
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i += 1) bytes[i] = (i * 37 + 11) % 256;
      const encoded = bytesToBase64(bytes);
      expect(base64ToBytes(encoded)).toEqual(bytes);
    }
  });

  it('produces standard padded base64', () => {
    expect(bytesToBase64(new Uint8Array([77, 97, 110]))).toBe('TWFu');
    expect(bytesToBase64(new Uint8Array([77, 97]))).toBe('TWE=');
    expect(bytesToBase64(new Uint8Array([77]))).toBe('TQ==');
  });

  it('rejects characters outside the alphabet', () => {
    expect(() => base64ToBytes('ab!c')).toThrow(/invalid base64/);
  });
});

describe('toJsonSafeMessage / fromJsonSafeMessage', () => {
  it('round-trips an image message byte-for-byte through JSON', () => {
    const message: Message = {
      role: 'user',
      content: [
        { type: 'text', text: 'look at this' },
        { type: 'image', image: BYTES, mimeType: 'image/png' },
      ],
    };
    const wire = jsonRoundTrip(toJsonSafeMessage(message));
    const restored = fromJsonSafeMessage(wire);
    expect(restored.role).toBe('user');
    const parts = restored.content as readonly { type: string }[];
    expect(parts[0]).toEqual({ type: 'text', text: 'look at this' });
    const image = parts[1] as { type: 'image'; image: Uint8Array; mimeType: string };
    expect(image.image).toBeInstanceOf(Uint8Array);
    expect(image.image).toEqual(BYTES);
    expect(image.mimeType).toBe('image/png');
  });

  it('restores URL-backed attachments as URL instances', () => {
    const message: Message = {
      role: 'user',
      content: [
        {
          type: 'file',
          file: new URL('https://example.com/report.pdf'),
          mimeType: 'application/pdf',
        },
      ],
    };
    const restored = fromJsonSafeMessage(jsonRoundTrip(toJsonSafeMessage(message)));
    const file = (restored.content as readonly { type: string }[])[0] as unknown as {
      file: URL;
    };
    expect(file.file).toBeInstanceOf(URL);
    expect(file.file.href).toBe('https://example.com/report.pdf');
  });

  it('passes system and plain-string messages through untouched', () => {
    const system: Message = { role: 'system', content: 'be nice' };
    const plain: Message = { role: 'assistant', content: 'done' };
    expect(toJsonSafeMessage(system)).toBe(system);
    expect(toJsonSafeMessage(plain)).toBe(plain);
  });

  it('passes text and reasoning parts through untouched (meta intact)', () => {
    const message: Message = {
      role: 'assistant',
      content: [
        { type: 'reasoning', text: 'thinking', meta: { provider: 'anthropic', signature: 'sig' } },
        { type: 'text', text: 'answer' },
      ],
    };
    const restored = fromJsonSafeMessage(jsonRoundTrip(toJsonSafeMessage(message)));
    expect(restored).toEqual(message);
  });

  it('is idempotent: projecting an already-wire message keeps the envelope', () => {
    const message: Message = {
      role: 'user',
      content: [{ type: 'audio', audio: BYTES, mimeType: 'audio/wav' }],
    };
    const once = toJsonSafeMessage(message);
    const twice = toJsonSafeMessage(once);
    expect(twice).toEqual(once);
  });
});

describe('content-part codec for tool outcomes', () => {
  it('round-trips binary contentParts', () => {
    const parts = [
      { type: 'image' as const, image: BYTES, mimeType: 'image/png' },
      { type: 'text' as const, text: 'caption' },
    ];
    const restored = fromJsonSafeContentParts(jsonRoundTrip(toJsonSafeContentParts(parts)));
    expect(restored).toEqual(parts);
    expect((restored[0] as { image: Uint8Array }).image).toBeInstanceOf(Uint8Array);
  });
});

function makeState(): RunState {
  return {
    id: 'run-1',
    agentId: 'agent-1',
    currentAgentId: 'agent-1',
    sessionId: 'session-1',
    status: 'awaiting_approval',
    steps: [
      {
        stepNumber: 1,
        startedAt: '2026-07-05T00:00:00.000Z',
        agentId: 'agent-1',
        toolCalls: [
          {
            call: { toolCallId: 'tc-1', toolName: 'render', args: {} },
            outcome: {
              toolCallId: 'tc-1',
              toolName: 'render',
              output: 'ok',
              durationMs: 5,
              contentParts: [{ type: 'image', image: BYTES, mimeType: 'image/png' }],
            },
            stepNumber: 1,
          },
        ],
      },
    ],
    messages: [
      { role: 'system', content: 'sys' },
      {
        role: 'user',
        content: [
          { type: 'image', image: BYTES, mimeType: 'image/png' },
          { type: 'file', file: new URL('https://example.com/a.pdf'), mimeType: 'application/pdf' },
        ],
      },
    ],
    pendingApprovals: [],
    handoffs: [],
    usage: zeroUsage(),
    startedAt: '2026-07-05T00:00:00.000Z',
  };
}

describe('toJsonSafeRunState / fromJsonSafeRunState', () => {
  it('round-trips a multimodal RunState through JSON byte-for-byte', () => {
    const state = makeState();
    const restored = fromJsonSafeRunState(jsonRoundTrip(toJsonSafeRunState(state)));
    const userMessage = restored.messages[1] as { content: readonly { type: string }[] };
    const image = userMessage.content[0] as unknown as { image: Uint8Array };
    const file = userMessage.content[1] as unknown as { file: URL };
    expect(image.image).toBeInstanceOf(Uint8Array);
    expect(image.image).toEqual(BYTES);
    expect(file.file).toBeInstanceOf(URL);
    expect(file.file.href).toBe('https://example.com/a.pdf');
    const outcome = restored.steps[0]?.toolCalls[0]?.outcome as {
      contentParts: readonly { image: Uint8Array }[];
    };
    expect(outcome.contentParts[0]?.image).toBeInstanceOf(Uint8Array);
    expect(outcome.contentParts[0]?.image).toEqual(BYTES);
  });

  it('repairs legacy numeric-key byte objects on known binary fields', () => {
    const corrupted = {
      ...makeState(),
      messages: [
        {
          role: 'user',
          // Exact shape JSON.stringify(new Uint8Array([1,2,3])) produces.
          content: [{ type: 'image', image: { '0': 1, '1': 2, '2': 3 } }],
        },
      ],
      steps: [],
    } as unknown as WireRunState;
    const restored = fromJsonSafeRunState(corrupted);
    const image = (restored.messages[0] as { content: readonly { image: unknown }[] }).content[0];
    expect(image?.image).toBeInstanceOf(Uint8Array);
    expect(image?.image).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('leaves unrecoverable shapes as-is instead of guessing', () => {
    const corrupted = {
      ...makeState(),
      messages: [
        {
          role: 'user',
          content: [{ type: 'image', image: { '0': 'not-a-byte' } }],
        },
      ],
      steps: [],
    } as unknown as WireRunState;
    const restored = fromJsonSafeRunState(corrupted);
    const image = (restored.messages[0] as { content: readonly { image: unknown }[] }).content[0];
    expect(image?.image).toEqual({ '0': 'not-a-byte' });
  });
});
