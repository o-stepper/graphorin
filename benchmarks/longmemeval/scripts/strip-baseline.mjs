#!/usr/bin/env node
/**
 * Strip a LongMemEval JSON report down to committable-baseline size.
 *
 * A real-provider report embeds every case's full `haystackSessions`
 * (~0.5 MB per case, 16-83 MB per ability), which cannot land in git
 * and trips biome's 1 MiB file cap. The regression gate
 * (`detectRegressions`) needs none of it: it reads `summary`,
 * `results[].caseId`, `results[].scores` (McNemar pairing) and
 * durations. This script deletes `results[].input.haystackSessions`
 * in place (question/askedAt/ability stay for human context).
 *
 * Usage: node scripts/strip-baseline.mjs <report.json> [...more]
 */
import { readFileSync, writeFileSync } from 'node:fs';

for (const path of process.argv.slice(2)) {
  const report = JSON.parse(readFileSync(path, 'utf8'));
  let dropped = 0;
  for (const row of report.results ?? []) {
    if (row.input && 'haystackSessions' in row.input) {
      delete row.input.haystackSessions;
      dropped += 1;
    }
  }
  writeFileSync(path, `${JSON.stringify(report, null, 1)}\n`);
  console.log(`[strip-baseline] ${path}: stripped haystackSessions from ${dropped} case(s)`);
}
