import {
  createNode,
  createWorkflow,
  type InMemoryCheckpointStore,
  latestValue,
  listAggregate,
  pause,
  type Workflow,
  type WorkflowPauseAt,
} from '../../src/index.js';

export interface OrderState {
  status: 'pending' | 'validated' | 'awaiting-approval' | 'approved' | 'rejected' | 'shipped';
  notes: ReadonlyArray<string>;
  decision?: 'approved' | 'rejected';
}

export interface OrderInput extends Partial<OrderState> {
  amount: number;
}

export interface BuildArgs {
  readonly checkpointStore: InMemoryCheckpointStore;
  readonly pauseAt?: WorkflowPauseAt;
  readonly highValueThreshold?: number;
}

export function buildOrderProcessingWorkflow(
  args: BuildArgs,
): Workflow<OrderState & { amount?: number }, OrderInput> {
  const threshold = args.highValueThreshold ?? 100;
  return createWorkflow<OrderState & { amount?: number }, OrderInput>({
    name: 'order-processing',
    channels: {
      status: latestValue<OrderState['status']>({ default: 'pending' }),
      notes: listAggregate<string>({ default: [] }),
      decision: latestValue<OrderState['decision']>(),
      amount: latestValue<number>(),
    },
    nodes: {
      validate: createNode({
        name: 'validate',
        run: async (state) => ({
          status: 'validated',
          notes: [`validated amount=${state.amount ?? 0}`],
        }),
      }),
      requestApproval: createNode({
        name: 'requestApproval',
        run: async (state) => {
          const decision = pause<{ kind: 'approval'; amount: number }, 'approved' | 'rejected'>({
            kind: 'approval',
            amount: state.amount ?? 0,
          });
          return {
            decision,
            status: decision === 'approved' ? 'approved' : 'rejected',
            notes: [`operator decided: ${decision}`],
          };
        },
      }),
      autoApprove: createNode({
        name: 'autoApprove',
        run: async () => ({ status: 'approved', notes: ['auto-approved'] }),
      }),
      ship: createNode({
        name: 'ship',
        run: async () => ({ status: 'shipped', notes: ['shipped'] }),
      }),
    },
    edges: [
      { from: '__start__', to: 'validate' },
      {
        from: 'validate',
        to: 'requestApproval',
        when: (s) => (s.amount ?? 0) >= threshold,
      },
      {
        from: 'validate',
        to: 'autoApprove',
        when: (s) => (s.amount ?? 0) < threshold,
      },
      { from: 'autoApprove', to: 'ship' },
      { from: 'requestApproval', to: 'ship', when: (s) => s.decision === 'approved' },
      { from: 'requestApproval', to: '__end__', when: (s) => s.decision !== 'approved' },
      { from: 'ship', to: '__end__' },
    ],
    checkpointStore: args.checkpointStore,
    ...(args.pauseAt !== undefined ? { pauseAt: args.pauseAt } : {}),
  });
}
