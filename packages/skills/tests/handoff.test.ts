import { describe, expect, it } from 'vitest';

import { InputFilterRequiredError } from '../src/errors/index.js';
import { loadSkillFromSource, requireHandoffInputFilter } from '../src/loader/index.js';

async function inline(
  name: string,
  extras: string[],
): Promise<Awaited<ReturnType<typeof loadSkillFromSource>>> {
  const manifest = [
    '---',
    `name: ${name}`,
    'description: test skill',
    ...extras,
    '---',
    'BODY',
  ].join('\n');
  return loadSkillFromSource({ kind: 'inline', skill: { skillMd: manifest } });
}

describe('requireHandoffInputFilter', () => {
  it('returns the declared filter for trusted skills', async () => {
    const skill = await inline('t', [
      'graphorin-trust-level: trusted',
      'graphorin-handoff-input-filter: lastUser',
    ]);
    expect(requireHandoffInputFilter(skill.metadata)).toEqual({ kind: 'lastUser' });
  });

  it('returns the framework default lastN(10) for trusted skills without a declaration', async () => {
    const skill = await inline('t-default', ['graphorin-trust-level: trusted']);
    expect(requireHandoffInputFilter(skill.metadata)).toEqual({ kind: 'lastN', n: 10 });
  });

  it('throws InputFilterRequiredError for untrusted skills missing the declaration', async () => {
    const skill = await inline('u', ['graphorin-trust-level: untrusted']);
    expect(() => requireHandoffInputFilter(skill.metadata)).toThrowError(InputFilterRequiredError);
  });

  it('returns the declared filter for untrusted skills that declared one', async () => {
    const skill = await inline('u-with-filter', [
      'graphorin-trust-level: untrusted',
      'graphorin-handoff-input-filter: lastN-3',
    ]);
    expect(requireHandoffInputFilter(skill.metadata)).toEqual({ kind: 'lastN', n: 3 });
  });

  it("rejects 'full' for untrusted skills and falls back to 'lastUser'", async () => {
    const skill = await inline('u-full', [
      'graphorin-trust-level: untrusted',
      'graphorin-handoff-input-filter: full',
    ]);
    // Loader emits a WARN diagnostic on the skill.
    const diag = skill
      .diagnostics()
      .find((d) => d.kind === 'untrusted-handoff-filter-required' && d.severity === 'warn');
    expect(diag?.message).toMatch(/full-message filter is rejected/u);
    // requireHandoffInputFilter falls back to 'lastUser'.
    expect(requireHandoffInputFilter(skill.metadata)).toEqual({ kind: 'lastUser' });
  });

  it("'unknown' skills also require an explicit filter declaration", async () => {
    const skill = await inline('unk', ['graphorin-trust-level: unknown']);
    expect(() => requireHandoffInputFilter(skill.metadata)).toThrowError(InputFilterRequiredError);
  });
});
