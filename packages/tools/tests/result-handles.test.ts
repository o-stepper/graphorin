import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createReadResultTool } from '../src/built-in/index.js';
import {
  createDefaultSpillWriter,
  createFileResultReader,
  truncateBody,
} from '../src/result/index.js';
import type { SpillWriter } from '../src/result/truncate.js';

// --- shared fixtures --------------------------------------------------------

/** A spill writer that captures whether it was invoked. */
function recordingSpillWriter(): { writer: SpillWriter; writes: () => number } {
  let writes = 0;
  return {
    writer: {
      artifactRoot: '/tmp/graphorin-test',
      async write(opts) {
        writes += 1;
        return {
          path: `/tmp/graphorin-test/${opts.runId}/${opts.toolCallId}.${opts.extension}`,
          bytes: opts.body.length,
        };
      },
    },
    writes: () => writes,
  };
}

const tmpRoots: string[] = [];

/** Create an isolated artifact root with one file written under it. */
async function seedArtifact(relPath: string, body: string): Promise<{ root: string; uri: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'graphorin-rh-'));
  tmpRoots.push(root);
  const abs = path.join(root, ...relPath.split('/'));
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, body);
  return { root, uri: `graphorin-spill:${relPath}` };
}

afterEach(async () => {
  while (tmpRoots.length > 0) {
    const root = tmpRoots.pop();
    if (root !== undefined) await fs.rm(root, { recursive: true, force: true }).catch(() => {});
  }
});

// --- sensitivity gate (truncation pipeline) ---------------------------------

describe('WI-10 — spill sensitivity gate', () => {
  it('never spills a secret-tier body — falls back to in-place truncation, no handle', async () => {
    const { writer, writes } = recordingSpillWriter();
    const result = await truncateBody({
      body: 'S'.repeat(4000),
      maxTokens: 50,
      strategy: 'spill-to-file',
      options: {
        runId: 'run-secret',
        toolCallId: 'call-secret',
        spill: writer,
        toolSensitivityTier: 'secret',
      },
    });
    expect(writes()).toBe(0); // the writer was never invoked
    expect(result.strategyApplied).toBe('middle'); // truncated in place instead
    expect(result.artifactPath).toBeUndefined();
    expect(result.resultHandle).toBeUndefined();
    expect(result.body).not.toContain('graphorin-spill:');
  });

  it('spills a non-secret body, surfacing an opaque handle in the annotation', async () => {
    const { writer, writes } = recordingSpillWriter();
    const result = await truncateBody({
      body: 'I'.repeat(4000),
      maxTokens: 50,
      strategy: 'spill-to-file',
      options: {
        runId: 'run-int',
        toolCallId: 'call-int',
        spill: writer,
        toolSensitivityTier: 'internal',
      },
    });
    expect(writes()).toBe(1);
    expect(result.strategyApplied).toBe('spill-to-file');
    expect(result.resultHandle).toBe('graphorin-spill:run-int/call-int.txt');
    expect(result.body).toContain(result.resultHandle!);
  });
});

// --- file result reader -----------------------------------------------------

describe('WI-10 — createFileResultReader', () => {
  it('reads the full artifact when no range is given', async () => {
    const { root, uri } = await seedArtifact('run-1/call-1.txt', 'hello world');
    const reader = createFileResultReader({ artifactRoot: root });
    const out = await reader.read(uri);
    expect(out.content).toBe('hello world');
    expect(out.totalBytes).toBe(11);
    expect(out.bytes).toBe(11);
    expect(out.eof).toBe(true);
  });

  it('returns only the requested byte range (offset/length)', async () => {
    const { root, uri } = await seedArtifact('run-1/call-1.txt', '0123456789');
    const reader = createFileResultReader({ artifactRoot: root });
    const out = await reader.read(uri, { offset: 2, length: 3 });
    expect(out.content).toBe('234');
    expect(out.bytes).toBe(3);
    expect(out.totalBytes).toBe(10);
    expect(out.eof).toBe(false);
  });

  it('returns only the requested line range (startLine/endLine, 1-based inclusive)', async () => {
    const { root, uri } = await seedArtifact('run-1/rows.txt', 'l1\nl2\nl3\nl4\nl5');
    const reader = createFileResultReader({ artifactRoot: root });
    const out = await reader.read(uri, { startLine: 2, endLine: 4 });
    expect(out.content).toBe('l2\nl3\nl4');
    expect(out.eof).toBe(false); // line 5 not included
    const tail = await reader.read(uri, { startLine: 5 });
    expect(tail.content).toBe('l5');
    expect(tail.eof).toBe(true);
  });

  it('caps the returned slice at maxBytes and flags eof=false', async () => {
    const { root, uri } = await seedArtifact('run-1/big.txt', 'A'.repeat(1000));
    const reader = createFileResultReader({ artifactRoot: root });
    const out = await reader.read(uri, { maxBytes: 100 });
    expect(out.bytes).toBe(100);
    expect(out.totalBytes).toBe(1000);
    expect(out.eof).toBe(false);
  });

  it('rejects a handle that escapes the artifact root (path traversal)', async () => {
    const { root } = await seedArtifact('run-1/call-1.txt', 'secret');
    const reader = createFileResultReader({ artifactRoot: root });
    await expect(reader.read('graphorin-spill:../../../etc/passwd')).rejects.toThrow(
      /escapes the artifact root/,
    );
  });

  it('rejects an unsupported handle scheme', async () => {
    const { root } = await seedArtifact('run-1/call-1.txt', 'x');
    const reader = createFileResultReader({ artifactRoot: root });
    await expect(reader.read('file:///etc/passwd')).rejects.toThrow(/Unsupported result handle/);
  });
});

// --- read_result built-in tool ----------------------------------------------

describe('WI-10 — createReadResultTool', () => {
  it('round-trips a spilled artifact: spill writer writes, read_result fetches a range', async () => {
    const writer = createDefaultSpillWriter();
    tmpRoots.push(writer.artifactRoot); // best-effort cleanup of the run dir
    const { path: abs } = await writer.write({
      runId: 'rr-run',
      toolCallId: 'rr-call',
      extension: 'json',
      body: '0123456789ABCDEF',
    });
    // Sanity: the artifact really landed under the writer's root.
    expect(abs.startsWith(writer.artifactRoot)).toBe(true);

    const reader = createFileResultReader({ artifactRoot: writer.artifactRoot });
    const readResult = createReadResultTool({ reader });
    expect(readResult.name).toBe('read_result');
    expect(readResult.sideEffectClass).toBe('read-only');

    const ctx = { runId: 'rr-run' } as never;
    const out = (await readResult.execute(
      { handle: 'graphorin-spill:rr-run/rr-call.json', offset: 10, length: 6 },
      ctx,
    )) as { content: string; bytes: number; totalBytes: number; eof: boolean };
    expect(out.content).toBe('ABCDEF');
    expect(out.totalBytes).toBe(16);
    expect(out.eof).toBe(true);

    await fs
      .rm(path.join(writer.artifactRoot, 'rr-run'), { recursive: true, force: true })
      .catch(() => {});
  });
});
