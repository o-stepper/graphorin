/**
 * W-095: multimodal conversion in the local-adapter message converters.
 * With `multimodal: true` images reach the wire (OpenAI `image_url`
 * parts / native-Ollama `images` base64 array); everything that cannot
 * be represented is dropped LOUDLY through the warn sink; the
 * text-only default stays byte-identical.
 */
import { describe, expect, it } from 'vitest';

import { toOllamaChatMessages, toOpenAIChatMessages } from '../../src/internal/http.js';

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const PNG_BASE64 = Buffer.from(PNG_BYTES).toString('base64');

function imageMessage(image: Uint8Array | URL, mimeType?: string) {
  return {
    role: 'user' as const,
    content: [
      { type: 'text', text: 'what is on this picture?' },
      { type: 'image', image, ...(mimeType !== undefined ? { mimeType } : {}) },
    ],
  };
}

describe('toOpenAIChatMessages - multimodal (W-095)', () => {
  it('emits text + image_url parts; bytes become a data URI with the declared mime', () => {
    const [msg] = toOpenAIChatMessages([imageMessage(PNG_BYTES, 'image/png')], {
      multimodal: true,
    });
    expect(msg?.content).toEqual([
      { type: 'text', text: 'what is on this picture?' },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${PNG_BASE64}` } },
    ]);
  });

  it('defaults the data-URI mime to image/png and passes URL images as strings', () => {
    const [bytes] = toOpenAIChatMessages([imageMessage(PNG_BYTES)], { multimodal: true });
    expect(JSON.stringify(bytes?.content)).toContain('data:image/png;base64,');
    const [url] = toOpenAIChatMessages([imageMessage(new URL('https://img.example/x.png'))], {
      multimodal: true,
    });
    expect(JSON.stringify(url?.content)).toContain('https://img.example/x.png');
  });

  it('audio/file parts have no portable wire form - dropped with ONE warn', () => {
    const warns: string[] = [];
    const [msg] = toOpenAIChatMessages(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'listen' },
            { type: 'audio', audio: PNG_BYTES },
            { type: 'file', file: PNG_BYTES, mimeType: 'application/pdf' },
          ],
        },
      ],
      { multimodal: true, warn: (m) => warns.push(m) },
    );
    expect(msg?.content).toEqual([{ type: 'text', text: 'listen' }]);
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('audio');
    expect(warns[0]).toContain('file');
  });

  it('multimodal=false: flat string exactly as before + one warn naming the dropped kind', () => {
    const warns: string[] = [];
    const [msg] = toOpenAIChatMessages([imageMessage(PNG_BYTES)], {
      multimodal: false,
      warn: (m) => warns.push(m),
    });
    expect(msg?.content).toBe('what is on this picture?');
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('image');
    expect(warns[0]).toContain('capabilities.multimodal');
  });

  it('no options: byte-identical legacy behaviour (flatten, no warn)', () => {
    const [msg] = toOpenAIChatMessages([imageMessage(PNG_BYTES)]);
    expect(msg?.content).toBe('what is on this picture?');
  });
});

describe('toOllamaChatMessages - multimodal (W-095)', () => {
  it('collects raw base64 (no data prefix) into the per-message images array', () => {
    const [msg] = toOllamaChatMessages([imageMessage(PNG_BYTES, 'image/png')], {
      multimodal: true,
    });
    expect(msg?.content).toBe('what is on this picture?');
    expect(msg?.images).toEqual([PNG_BASE64]);
    expect(JSON.stringify(msg)).not.toContain('data:image');
  });

  it('URL images cannot be inlined on the native path - dropped with a warn', () => {
    const warns: string[] = [];
    const [msg] = toOllamaChatMessages([imageMessage(new URL('https://img.example/x.png'))], {
      multimodal: true,
      warn: (m) => warns.push(m),
    });
    expect(msg?.images).toBeUndefined();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('URL');
  });

  it('text-only messages never grow an images field', () => {
    const [msg] = toOllamaChatMessages([{ role: 'user', content: 'plain' }], {
      multimodal: true,
    });
    expect(msg).toEqual({ role: 'user', content: 'plain' });
  });
});
