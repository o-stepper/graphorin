import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  fromIterable,
  groupAndExtract,
  loadCsvDataset,
  loadDatasetFromTraces,
  loadJsonlDataset,
  parseCsv,
  parseJsonl,
} from '../src/loaders/index.js';

function tempFile(contents: string, ext: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'graphorin-evals-loader-'));
  const path = join(dir, `data.${ext}`);
  writeFileSync(path, contents, 'utf8');
  return path;
}

describe('parseJsonl', () => {
  it('parses a JSONL stream into Cases', () => {
    const text = '{"input":"q1","expected":"e1"}\n{"id":"x","input":"q2"}\n';
    const cases = parseJsonl(text);
    expect(cases).toHaveLength(2);
    expect(cases[0]).toMatchObject({ input: 'q1', expected: 'e1' });
    expect(cases[1]).toMatchObject({ id: 'x', input: 'q2' });
  });

  it('skips empty lines', () => {
    expect(parseJsonl('\n\n')).toHaveLength(0);
  });

  it('throws on malformed JSON with the line number', () => {
    expect(() => parseJsonl('{"input":"q1"}\nnotjson\n')).toThrow(/line 2/);
  });

  it('rejects non-object lines', () => {
    expect(() => parseJsonl('"just a string"\n')).toThrow(/must be a JSON object/);
  });

  it('honours a custom mapper', () => {
    const cases = parseJsonl('{"q":"x"}\n', (line) => ({ input: line.q }));
    expect(cases[0]?.input).toBe('x');
  });
});

describe('loadJsonlDataset', () => {
  it('round-trips through the filesystem', async () => {
    const path = tempFile('{"input":"q1"}\n{"input":"q2","expected":"e2"}\n', 'jsonl');
    const ds = await loadJsonlDataset(path, { name: 'fixture', description: 'test' });
    expect(ds.cases).toHaveLength(2);
    expect(ds.metadata?.name).toBe('fixture');
  });
});

describe('parseCsv', () => {
  it('parses a basic CSV with headers', () => {
    const cases = parseCsv('input,expected\nhello,world\nfoo,bar\n');
    expect(cases).toHaveLength(2);
    expect(cases[0]).toMatchObject({ input: 'hello', expected: 'world' });
  });

  it('handles quoted cells with embedded delimiters and quotes', () => {
    const cases = parseCsv('input,expected\n"a, b","contains ""quotes"""\n');
    expect(cases[0]?.input).toBe('a, b');
    expect(cases[0]?.expected).toBe('contains "quotes"');
  });

  it('skips fully-empty rows', () => {
    expect(parseCsv('input\n\n')).toHaveLength(0);
  });

  it('parses metadata column as JSON when present', () => {
    const cases = parseCsv('input,metadata\nq,"{""k"":1}"\n');
    expect(cases[0]?.metadata).toEqual({ k: 1 });
  });

  it('throws when input column is missing', () => {
    expect(() => parseCsv('foo,bar\nbaz,qux\n')).toThrow(/required 'input'/);
  });
});

describe('loadCsvDataset', () => {
  it('round-trips through the filesystem', async () => {
    const path = tempFile('input,expected\nhello,world\n', 'csv');
    const ds = await loadCsvDataset(path);
    expect(ds.cases[0]?.input).toBe('hello');
  });
});

describe('groupAndExtract / loadDatasetFromTraces', () => {
  const traces =
    '{"runId":"r1","type":"agent.start","payload":{"input":"q1"}}\n' +
    '{"runId":"r1","type":"agent.complete","payload":{"output":"a1"}}\n' +
    '{"runId":"r2","type":"agent.start","payload":{"input":"q2"}}\n' +
    '{"runId":"r2","type":"agent.complete","payload":{"output":"a2"}}\n';

  it('groups events by runId and applies the extractor', () => {
    const ds = groupAndExtract<string, string>(traces, {
      extract: (events) => {
        const start = events.find((e) => e.type === 'agent.start');
        const complete = events.find((e) => e.type === 'agent.complete');
        if (start === undefined || complete === undefined) return null;
        return {
          input: start.payload.input as string,
          expected: complete.payload.output as string,
        };
      },
    });
    expect(ds.cases).toHaveLength(2);
  });

  it('skips groups whose extractor returns null', () => {
    const ds = groupAndExtract(traces, { extract: () => null });
    expect(ds.cases).toHaveLength(0);
  });

  it('round-trips through the filesystem', async () => {
    const path = tempFile(traces, 'jsonl');
    const ds = await loadDatasetFromTraces<string, string>(path, {
      extract: (events) => {
        const start = events.find((e) => e.type === 'agent.start');
        if (start === undefined) return null;
        return { input: start.payload.input as string };
      },
    });
    expect(ds.cases).toHaveLength(2);
  });
});

describe('fromIterable', () => {
  it('wraps an array', () => {
    const ds = fromIterable([{ input: 'q1' }, { input: 'q2' }]);
    expect(ds.cases).toHaveLength(2);
  });

  it('materialises an iterable', () => {
    function* gen() {
      yield { input: 'a' };
      yield { input: 'b' };
    }
    const ds = fromIterable(gen());
    expect(ds.cases).toHaveLength(2);
  });
});
