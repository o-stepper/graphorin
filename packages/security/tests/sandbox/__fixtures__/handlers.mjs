// Fixture handlers for the sandbox unit tests. Plain ESM JS so the
// worker entry can `await import(...)` it without a TypeScript runtime.

export async function echo(input) {
  return { hello: input };
}

export async function addOne(input) {
  return Number(input) + 1;
}

export async function sleepForever() {
  await new Promise(() => {
    // Never resolves — the test asserts the worker's wall-clock
    // timeout terminates the run.
  });
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
  const name = input && input.name;
  return {
    value: (name && process.env[name]) ?? null,
    keys: Object.keys(process.env),
  };
}
