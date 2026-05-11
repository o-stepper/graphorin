import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = fileURLToPath(new URL('.', import.meta.url));

describe('benchmarks/locomo-multilingual hook directory', () => {
  it('ships a top-level README explaining how to contribute a per-locale subset', () => {
    const readme = `${HERE}/../README.md`;
    expect(existsSync(readme)).toBe(true);
    const body = readFileSync(readme, 'utf8');
    expect(body).toMatch(/MIT License/);
    expect(body).toMatch(/Oleksiy Stepurenko/);
    expect(body).toMatch(/locale|subset/i);
  });
});
