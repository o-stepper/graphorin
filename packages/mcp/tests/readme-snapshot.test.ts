import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const README_PATH = resolve(__dirname, '..', 'README.md');

describe('package README — reverse-proxy operational snippet', () => {
  let readme: string;

  it('reads the package README file', async () => {
    readme = await readFile(README_PATH, 'utf8');
    expect(readme.length).toBeGreaterThan(0);
  });

  it('contains the canonical nginx snippet directives', async () => {
    if (readme === undefined) readme = await readFile(README_PATH, 'utf8');
    expect(readme).toContain('proxy_buffering off');
    expect(readme).toContain('chunked_transfer_encoding on');
    expect(readme).toContain('proxy_read_timeout 600s');
  });

  it('mentions the analogous notes for AWS ALB, Cloudflare, and GCP LB', async () => {
    if (readme === undefined) readme = await readFile(README_PATH, 'utf8');
    expect(readme).toContain('AWS ALB');
    expect(readme).toContain('Cloudflare');
    expect(readme).toContain('GCP Load Balancer');
  });

  it('credits the author and the MIT license', async () => {
    if (readme === undefined) readme = await readFile(README_PATH, 'utf8');
    expect(readme).toContain('Oleksiy Stepurenko');
    expect(readme).toContain('MIT');
  });

  it('documents the inbound sanitization policy reference', async () => {
    if (readme === undefined) readme = await readFile(README_PATH, 'utf8');
    expect(readme).toContain('detect-and-strip-and-wrap');
    expect(readme).toContain('pass-through');
  });
});
