import { describe, expect, it } from 'vitest';

import { listMissingModels, setLookupWarnSink } from '../src/index.js';

describe('@graphorin/pricing - listMissingModels', () => {
  setLookupWarnSink(() => {});

  it('reports unknown (provider, model) pairs sorted by descending count', () => {
    const result = listMissingModels([
      { attributes: { 'gen_ai.system': 'unknown', 'gen_ai.request.model': 'gpt-9' } },
      { attributes: { 'gen_ai.system': 'unknown', 'gen_ai.request.model': 'gpt-9' } },
      { attributes: { 'gen_ai.system': 'unknown', 'gen_ai.request.model': 'gpt-7' } },
      // Known model - must not appear in the result.
      { attributes: { 'gen_ai.system': 'openai', 'gen_ai.request.model': 'gpt-4o-2024-11-20' } },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ provider: 'unknown', model: 'gpt-9', count: 2 });
    expect(result[1]).toEqual({ provider: 'unknown', model: 'gpt-7', count: 1 });
  });

  it('falls back to graphorin.* attributes when gen_ai.* is absent', () => {
    const result = listMissingModels([
      {
        attributes: {
          'graphorin.provider.id': 'unknown',
          'graphorin.provider.model': 'gpt-9',
        },
      },
    ]);
    expect(result).toEqual([{ provider: 'unknown', model: 'gpt-9', count: 1 }]);
  });

  it('skips spans missing provider or model', () => {
    const result = listMissingModels([
      { attributes: {} },
      { attributes: { 'gen_ai.system': 'unknown' } },
      { attributes: { 'gen_ai.request.model': 'gpt-9' } },
    ]);
    expect(result).toEqual([]);
  });
});
