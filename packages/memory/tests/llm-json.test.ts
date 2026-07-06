import { describe, expect, it } from 'vitest';
import { sliceJsonObject, stripFence } from '../src/internal/llm-json.js';

describe('stripFence (W-055 single definition)', () => {
  it('unwraps a plain fenced block', () => {
    expect(stripFence('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('unwraps a fenced block with a language tag', () => {
    expect(stripFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('unwraps a fence whose info-string carries trailing junk', () => {
    expect(stripFence('```json extra words\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('leaves plain text untouched', () => {
    expect(stripFence('{"a":1}')).toBe('{"a":1}');
  });

  it('leaves an unterminated fence untouched', () => {
    const text = '```json\n{"a":1}';
    expect(stripFence(text)).toBe(text);
  });

  it('preserves nested JSON bodies verbatim', () => {
    const fence = '```';
    const body = '{"outer":{"inner":[1,2,{"deep":true}]}}';
    expect(stripFence(`${fence}json\n${body}\n${fence}`)).toBe(body);
  });

  it('ReDoS regression: a megabyte-long info-string completes quickly', () => {
    const fence = '```';
    const hostile = `${fence}${'a'.repeat(1_000_000)}\n{"a":1}\n${fence}`;
    const start = performance.now();
    expect(stripFence(hostile)).toBe('{"a":1}');
    expect(performance.now() - start).toBeLessThan(1_000);
  });
});

describe('sliceJsonObject (W-055 single definition)', () => {
  it('slices an object embedded in prose', () => {
    expect(sliceJsonObject('Sure! Here it is: {"a":1} Hope that helps.')).toBe('{"a":1}');
  });

  it('spans first { to last } across nested objects', () => {
    expect(sliceJsonObject('x {"a":{"b":2}} y {"c":3} z')).toBe('{"a":{"b":2}} y {"c":3}');
  });

  it('returns null when no object span exists', () => {
    expect(sliceJsonObject('no json here')).toBeNull();
    expect(sliceJsonObject('} reversed {')).toBeNull();
  });
});
