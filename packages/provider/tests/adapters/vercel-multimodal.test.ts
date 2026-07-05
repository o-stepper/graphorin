/**
 * `vercelAdapter` multimodal conversion coverage. Image parts keep the
 * SDK's `image` part shape (with `mediaType` added); audio and file
 * parts ride as AI SDK `file` parts carrying `data` + `mediaType`
 * (the SDK has no dedicated audio user part). Payload bytes must be
 * forwarded by reference, never copied or re-encoded.
 */
import type { Message, UserMessage } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  type AISDKChunk,
  type LanguageModelLike,
  type VercelRuntimeOverrides,
  vercelAdapter,
} from '../../src/adapters/vercel.js';

const MODEL: LanguageModelLike = {
  provider: 'fixture',
  modelId: 'fixture-multimodal',
  specificationVersion: 'v4',
};

function makeOverrides(capture: { lastArgs?: Record<string, unknown> }): VercelRuntimeOverrides {
  return {
    streamText: (args) => {
      capture.lastArgs = { ...args };
      const empty: ReadonlyArray<AISDKChunk> = [];
      return {
        fullStream: (async function* () {
          for (const c of empty) yield c;
        })(),
      };
    },
    generateText: async (args) => {
      capture.lastArgs = { ...args };
      return { text: '' };
    },
  };
}

describe('vercelAdapter - multimodal content pass-through', () => {
  it('forwards image content parts unchanged', async () => {
    const capture: { lastArgs?: Record<string, unknown> } = {};
    const adapter = vercelAdapter(MODEL, { runtimeOverrides: makeOverrides(capture) });
    const imageBytes = new Uint8Array([0xff, 0xd8, 0xff]);
    const userMsg: UserMessage = {
      role: 'user',
      content: [
        { type: 'text', text: 'what is this?' },
        { type: 'image', image: imageBytes, mimeType: 'image/jpeg' },
      ],
    };
    for await (const _ of adapter.stream({ messages: [userMsg] })) void _;
    const forwarded = capture.lastArgs?.messages as ReadonlyArray<Message> | undefined;
    const forwardedUser = forwarded?.[0] as UserMessage;
    const parts = forwardedUser.content as ReadonlyArray<{
      type: string;
      image?: Uint8Array;
      mimeType?: string;
    }>;
    expect(parts).toHaveLength(2);
    expect(parts[1]?.type).toBe('image');
    expect(parts[1]?.image).toBe(imageBytes);
    expect(parts[1]?.mimeType).toBe('image/jpeg');
  });

  it('converts audio content parts to AI SDK file parts (bytes by reference)', async () => {
    const capture: { lastArgs?: Record<string, unknown> } = {};
    const adapter = vercelAdapter(MODEL, { runtimeOverrides: makeOverrides(capture) });
    const audioBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46]);
    const userMsg: UserMessage = {
      role: 'user',
      content: [{ type: 'audio', audio: audioBytes, mimeType: 'audio/wav' }],
    };
    await adapter.generate({ messages: [userMsg] });
    const forwarded = capture.lastArgs?.messages as ReadonlyArray<Message> | undefined;
    const parts = (forwarded?.[0] as UserMessage).content as ReadonlyArray<{
      type: string;
      data?: Uint8Array;
      mediaType?: string;
      mimeType?: string;
    }>;
    // The AI SDK has no dedicated audio user part - audio rides as a
    // `file` part with `data` + `mediaType` (+ v4's `mimeType`).
    expect(parts[0]?.type).toBe('file');
    expect(parts[0]?.data).toBe(audioBytes);
    expect(parts[0]?.mediaType).toBe('audio/wav');
    expect(parts[0]?.mimeType).toBe('audio/wav');
  });

  it('converts file content parts (e.g. PDF) to AI SDK file parts', async () => {
    const capture: { lastArgs?: Record<string, unknown> } = {};
    const adapter = vercelAdapter(MODEL, { runtimeOverrides: makeOverrides(capture) });
    const fileBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const userMsg: UserMessage = {
      role: 'user',
      content: [
        {
          type: 'file',
          file: fileBytes,
          mimeType: 'application/pdf',
          filename: 'doc.pdf',
        },
      ],
    };
    for await (const _ of adapter.stream({ messages: [userMsg] })) void _;
    const forwarded = capture.lastArgs?.messages as ReadonlyArray<Message> | undefined;
    const parts = (forwarded?.[0] as UserMessage).content as ReadonlyArray<{
      type: string;
      data?: Uint8Array;
      mediaType?: string;
      mimeType?: string;
      filename?: string;
    }>;
    expect(parts[0]?.type).toBe('file');
    // The SDK's file part carries the payload under `data`.
    expect(parts[0]?.data).toBe(fileBytes);
    expect(parts[0]?.mediaType).toBe('application/pdf');
    expect(parts[0]?.mimeType).toBe('application/pdf');
    expect(parts[0]?.filename).toBe('doc.pdf');
  });

  it('preserves content arrays with mixed text + image + file parts', async () => {
    const capture: { lastArgs?: Record<string, unknown> } = {};
    const adapter = vercelAdapter(MODEL, { runtimeOverrides: makeOverrides(capture) });
    const userMsg: UserMessage = {
      role: 'user',
      content: [
        { type: 'text', text: 'analyse:' },
        { type: 'image', image: new Uint8Array([1, 2, 3]) },
        { type: 'file', file: new Uint8Array([4, 5]), mimeType: 'application/pdf' },
      ],
    };
    for await (const _ of adapter.stream({ messages: [userMsg] })) void _;
    const forwarded = capture.lastArgs?.messages as ReadonlyArray<Message> | undefined;
    const parts = (forwarded?.[0] as UserMessage).content as ReadonlyArray<{ type: string }>;
    expect(parts.map((p) => p.type)).toEqual(['text', 'image', 'file']);
  });
});
