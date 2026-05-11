/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Token-count regression harness: counts tokens for a pinned multi-turn
 * transcript with {@link JsTiktokenCounter}, compares against
 * `data/baseline.json`, fails when growth exceeds the tolerance ratio
 * (default 10 %). Optional env `COST_REGRESSION_STRICT=0` skips exitCode.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Message } from '@graphorin/core';
import { calculateCost } from '@graphorin/pricing';
import { JsTiktokenCounter } from '@graphorin/provider/counters';

export const VERSION = '0.1.0';

const PINNED_MESSAGES: ReadonlyArray<Message> = [
  { role: 'user', content: 'Remember: my favorite color is blue and I work in Milan.' },
  { role: 'assistant', content: 'Noted. I will remember blue and Milan.' },
  { role: 'user', content: 'Also I prefer morning meetings.' },
  { role: 'assistant', content: 'Stored preference: morning meetings.' },
  { role: 'user', content: 'What city do I work in?' },
];

interface BaselineFile {
  readonly pinnedMessageTokens: number;
  readonly toleranceRatio: number;
  readonly scenarioId: string;
}

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

async function loadBaseline(): Promise<BaselineFile> {
  const raw = await readFile(join(pkgRoot(), 'data', 'baseline.json'), 'utf8');
  return JSON.parse(raw) as BaselineFile;
}

export async function runCostRegression(): Promise<{
  readonly tokens: number;
  readonly baseline: number;
  readonly ratio: number;
  readonly usd: number | null;
}> {
  const baseline = await loadBaseline();
  const counter = new JsTiktokenCounter({});
  const tokens = await counter.count(PINNED_MESSAGES);
  const ratio = (tokens - baseline.pinnedMessageTokens) / baseline.pinnedMessageTokens;
  const cost = calculateCost({
    provider: 'openai',
    model: 'gpt-4o-mini-2024-07-18',
    inputTokens: tokens,
    outputTokens: 0,
  });
  const usd = cost?.amount ?? null;
  return { tokens, baseline: baseline.pinnedMessageTokens, ratio, usd };
}

export async function main(): Promise<void> {
  const smoke = process.argv.includes('--smoke');
  const baselineFile = await loadBaseline();
  const { tokens, baseline, ratio, usd } = await runCostRegression();
  const maxGrowth = baselineFile.toleranceRatio;
  const bad = ratio > maxGrowth;
  const summary = [
    `[benchmark-cost] Graphorin v${VERSION}`,
    `tokens=${tokens} baseline=${baseline} deltaRatio=${ratio.toFixed(4)} tolerance=${maxGrowth}`,
    usd !== null
      ? `nominalUsd@gpt-4o-mini-2024-07-18-input=${usd.toFixed(6)}`
      : 'nominalUsd=unavailable',
  ].join(' — ');
  console.log(summary);

  const out = join(pkgRoot(), 'RESULTS.md');
  if (!smoke) {
    await writeFile(
      out,
      [
        '# Token cost regression — results',
        '',
        `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
        '',
        `_Generated: ${new Date().toISOString()}_`,
        '',
        '| Metric | Value |',
        '| --- | --- |',
        `| Pinned transcript tokens | ${String(tokens)} |`,
        `| Baseline tokens | ${String(baseline)} |`,
        `| Delta ratio | ${ratio.toFixed(4)} |`,
        `| Tolerance | ${String(maxGrowth)} |`,
        `| Pass | ${bad ? 'no' : 'yes'} |`,
        '',
      ].join('\n'),
      'utf8',
    );
  }

  const strict = process.env.COST_REGRESSION_STRICT !== '0' && !smoke;
  if (bad && strict) {
    console.error(
      `[benchmark-cost] regression: token count grew by ${(ratio * 100).toFixed(2)}% (> ${(maxGrowth * 100).toFixed(0)}%)`,
    );
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
