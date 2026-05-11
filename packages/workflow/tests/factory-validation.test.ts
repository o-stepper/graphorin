import { describe, expect, it } from 'vitest';

import {
  createNode,
  createWorkflow,
  InMemoryCheckpointStore,
  InvalidWorkflowConfigError,
  latestValue,
  TASKS_CHANNEL,
  UnknownNodeError,
} from '../src/index.js';

const cp = (): InMemoryCheckpointStore => new InMemoryCheckpointStore();

describe('createWorkflow — configuration validation', () => {
  it('rejects an empty name', () => {
    expect(() =>
      createWorkflow({
        name: '',
        channels: { v: latestValue<number>() },
        nodes: { n: createNode({ name: 'n', run: () => undefined }) },
        edges: [{ from: '__start__', to: 'n' }],
        checkpointStore: cp(),
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects an empty nodes record', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: {},
        edges: [],
        checkpointStore: cp(),
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects reserved node names', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: { __start__: createNode({ name: '__start__', run: () => undefined }) },
        edges: [{ from: '__start__', to: '__start__' }],
        checkpointStore: cp(),
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects edges referencing unknown nodes', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: { a: createNode({ name: 'a', run: () => undefined }) },
        edges: [
          { from: '__start__', to: 'a' },
          { from: 'a', to: 'missing' },
        ],
        checkpointStore: cp(),
      }),
    ).toThrow(UnknownNodeError);
  });

  it('requires at least one edge originating from __start__', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: { a: createNode({ name: 'a', run: () => undefined }) },
        edges: [{ from: 'a', to: '__end__' }],
        checkpointStore: cp(),
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects internal channel name reuse', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { [TASKS_CHANNEL]: latestValue<number>() } as Record<
          string,
          ReturnType<typeof latestValue>
        >,
        nodes: { a: createNode({ name: 'a', run: () => undefined }) },
        edges: [{ from: '__start__', to: 'a' }],
        checkpointStore: cp(),
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects an invalid durability mode', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: { a: createNode({ name: 'a', run: () => undefined }) },
        edges: [{ from: '__start__', to: 'a' }],
        checkpointStore: cp(),
        durability: 'fast' as unknown as 'sync',
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects a non-positive maxSteps', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: { a: createNode({ name: 'a', run: () => undefined }) },
        edges: [{ from: '__start__', to: 'a' }],
        checkpointStore: cp(),
        maxSteps: 0,
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('returns a workflow handle with a stable nodeNames listing', () => {
    const wf = createWorkflow({
      name: 'wf',
      channels: { v: latestValue<number>() },
      nodes: {
        a: createNode({ name: 'a', run: () => undefined }),
        b: createNode({ name: 'b', run: () => undefined }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: 'b' },
        { from: 'b', to: '__end__' },
      ],
      checkpointStore: cp(),
    });
    expect(wf.name).toBe('wf');
    expect(wf.nodeNames).toEqual(['a', 'b']);
  });

  it('rejects a negative cancelGraceMs', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: { a: createNode({ name: 'a', run: () => undefined }) },
        edges: [{ from: '__start__', to: 'a' }],
        checkpointStore: cp(),
        cancelGraceMs: -1,
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects a non-finite cancelGraceMs', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: { a: createNode({ name: 'a', run: () => undefined }) },
        edges: [{ from: '__start__', to: 'a' }],
        checkpointStore: cp(),
        cancelGraceMs: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects a node whose run is not a function', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: {
          // @ts-expect-error testing runtime guard
          a: { name: 'a' },
        },
        edges: [{ from: '__start__', to: 'a' }],
        checkpointStore: cp(),
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects an edge where from / to are not strings', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: { a: createNode({ name: 'a', run: () => undefined }) },
        edges: [
          { from: '__start__', to: 'a' },
          // @ts-expect-error testing runtime guard
          { from: 1, to: 'a' },
        ],
        checkpointStore: cp(),
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects a missing checkpointStore', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: { a: createNode({ name: 'a', run: () => undefined }) },
        edges: [{ from: '__start__', to: 'a' }],
        // @ts-expect-error testing runtime guard
        checkpointStore: undefined,
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects channels that are not an object', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        // @ts-expect-error testing runtime guard
        channels: null,
        nodes: { a: createNode({ name: 'a', run: () => undefined }) },
        edges: [{ from: '__start__', to: 'a' }],
        checkpointStore: cp(),
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects edges that are not an array', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        nodes: { a: createNode({ name: 'a', run: () => undefined }) },
        // @ts-expect-error testing runtime guard
        edges: 'oops',
        checkpointStore: cp(),
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });

  it('rejects nodes that are not an object', () => {
    expect(() =>
      createWorkflow({
        name: 'wf',
        channels: { v: latestValue<number>() },
        // @ts-expect-error testing runtime guard
        nodes: null,
        edges: [{ from: '__start__', to: 'a' }],
        checkpointStore: cp(),
      }),
    ).toThrow(InvalidWorkflowConfigError);
  });
});
