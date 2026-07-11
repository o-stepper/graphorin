// Fixture handlers for the sandbox unit tests. Plain ESM JS so the
// worker entry can `await import(...)` it without a TypeScript runtime.

export async function echo(input) {
  return { hello: input };
}

export async function addOne(input) {
  return Number(input) + 1;
}

export async function sleepForever() {
  // A live timer handle keeps the worker's event loop alive, so the
  // run can only end via the sandbox timeout / abort terminate(). A
  // handle-less never-resolving promise would instead drain the loop
  // and exit 0 (see neverSettles below).
  await new Promise((resolve) => setTimeout(resolve, 2 ** 31 - 1));
}

export async function neverSettles() {
  // No handles at all: the worker's event loop drains and the worker
  // exits 0 without ever posting a result. Regression fixture for the
  // exit-0 settle path (e2e finding S-19/7).
  return new Promise(() => {});
}

export async function readPackageJson() {
  const { readFile } = await import('node:fs/promises');
  return readFile('package.json', 'utf8');
}

export async function tryFetch() {
  const res = await fetch('http://127.0.0.1:1');
  return res.status;
}

export async function tryHttp() {
  const http = await import('node:http');
  return typeof http.request;
}

export async function alwaysThrow() {
  throw new Error('fixture intentionally throws');
}

export async function readEnv(input) {
  const name = input?.name;
  return {
    value: (name && process.env[name]) ?? null,
    keys: Object.keys(process.env),
  };
}

export async function trySpawnEsm() {
  const cp = await import('node:child_process');
  return typeof cp.spawn;
}

export async function trySpawnRequire() {
  // The CJS require() escape - the ESM resolve hook does not see this.
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const cp = require('node:child_process');
  return typeof cp.spawn;
}

export async function tryFsRequire() {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const fs = require('node:fs');
  return typeof fs.readFileSync;
}
