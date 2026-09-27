import { describe, it, expect } from 'vitest';
import { applyCommand, balance, Group, quorum, rewardCost } from '../src/domain/model';
import { createDemo } from '../src/domain/demo';
const command = {
  type: 'submit' as const,
  id: 'new',
  kind: 'contribution' as const,
  title: 'Dinner',
  points: 20,
  category: 'Cocinar',
  date: '2026-09-26',
  note: '',
  templateId: 'template-0',
};
const vote = (
  g: Group,
  actor: string,
  id = 'new',
  choice: 'approve' | 'reject' = 'approve',
  revision = 1,
) => applyCommand(g, actor, { type: 'vote', id, choice, revision });
describe('group agreements', () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 2],
    [4, 3],
  ])('requires strict majority of %i others: %i', (n, want) =>
    expect(quorum(Array.from({ length: n }, (_, i) => String(i)))).toBe(want),
  );
  it('does not credit pending contributions; approval updates only future suggestions', () => {
    let g = createDemo('es');
    const before = balance(g, 'alex').available;
    g = applyCommand(g, 'alex', command);
    expect(balance(g, 'alex').available).toBe(before);
    g = vote(g, 'sam');
    expect(balance(g, 'alex').available).toBe(before);
    g = vote(g, 'dani');
    expect(balance(g, 'alex').available).toBe(before + 20);
    expect(g.templates[0].points).toBe(20);
    expect(g.proposals.find((p) => p.id === 'demo-c1')?.points).toBe(40);
    expect(() => vote(g, 'dani')).toThrow('already_closed');
  });
  it('blocks self-votes, duplicate votes and outsiders', () => {
    let g = applyCommand(createDemo('es'), 'alex', command);
    expect(() => vote(g, 'alex')).toThrow('self_vote');
    expect(() => vote(g, 'outsider')).toThrow('not_member');
    g = vote(g, 'sam');
    expect(() => vote(g, 'sam')).toThrow('already_voted');
  });
  it('keeps a tied proposal pending', () => {
    let g = applyCommand(createDemo('es'), 'alex', command);
    g = vote(g, 'sam');
    g = vote(g, 'dani', 'new', 'reject');
    expect(g.proposals.find((p) => p.id === 'new')?.status).toBe('pending');
  });
  it('requires author acceptance of adjustments and fresh votes, preserving the old record', () => {
    let g = applyCommand(createDemo('es'), 'alex', command);
    g = vote(g, 'sam');
    g = applyCommand(g, 'dani', { type: 'adjust', id: 'new', revision: 1, points: 10 });
    expect(() => vote(g, 'dani')).toThrow('adjustment_pending');
    expect(() =>
      applyCommand(g, 'sam', { type: 'accept_adjustment', id: 'new', revision: 1 }),
    ).toThrow('author_only');
    g = applyCommand(g, 'alex', { type: 'accept_adjustment', id: 'new', revision: 1 });
    expect(() => vote(g, 'dani')).toThrow('stale_revision');
    g = vote(g, 'sam', 'new', 'approve', 2);
    expect(g.proposals.find((p) => p.id === 'new')?.status).toBe('pending');
    g = vote(g, 'dani', 'new', 'approve', 2);
    expect(g.proposals.find((p) => p.id === 'new')?.votes).toHaveLength(3);
    expect(balance(g, 'alex').available).toBe(50);
  });
  it('can reject and resubmit without crediting the rejected revision', () => {
    let g = applyCommand(createDemo('es'), 'alex', command);
    g = vote(vote(g, 'sam', 'new', 'reject'), 'dani', 'new', 'reject');
    g = applyCommand(g, 'alex', {
      type: 'resubmit',
      id: 'new',
      revision: 1,
      title: 'Simple dinner',
      points: 10,
      note: '',
    });
    expect(balance(g, 'alex').available).toBe(40);
    expect(g.proposals.find((p) => p.id === 'new')?.revision).toBe(2);
  });
  it('reserves funds immediately, prevents overspending, and releases on withdrawal', () => {
    let g = createDemo('es');
    const cmd = { ...command, kind: 'redemption' as const, rewardId: 'demo-r1', points: 1 };
    g = applyCommand(g, 'alex', cmd);
    expect(balance(g, 'alex')).toMatchObject({ available: 10, reserved: 30, spent: 0 });
    expect(() => applyCommand(g, 'alex', { ...cmd, id: 'other' })).toThrow('insufficient_balance');
    g = applyCommand(g, 'alex', { type: 'withdraw', id: 'new', revision: 1 });
    expect(balance(g, 'alex').available).toBe(40);
  });
  it('spends a reserved redemption only once', () => {
    let g = applyCommand(createDemo('es'), 'alex', {
      ...command,
      kind: 'redemption',
      rewardId: 'demo-r1',
    });
    g = vote(vote(g, 'sam'), 'dani');
    expect(balance(g, 'alex')).toMatchObject({ available: 10, reserved: 0, spent: 30 });
    expect(() => vote(g, 'sam')).toThrow('already_closed');
  });
  it('updates reward price for future redemptions only', () => {
    let g = applyCommand(createDemo('es'), 'alex', {
      ...command,
      kind: 'redemption',
      rewardId: 'demo-r1',
    });
    g = applyCommand(g, 'sam', {
      ...command,
      id: 'price',
      kind: 'reward_change',
      rewardId: 'demo-r1',
      points: 10,
    });
    g = vote(vote(g, 'alex', 'price'), 'dani', 'price');
    expect(
      rewardCost(
        g,
        g.proposals.find((p) => p.id === 'demo-r1')!,
      ),
    ).toBe(10);
    expect(g.proposals.find((p) => p.id === 'new')?.points).toBe(30);
  });
  it.each([0, -1, 1.5, Infinity, NaN, 100001])('rejects invalid points %s', (points) =>
    expect(() => applyCommand(createDemo('es'), 'alex', { ...command, points })).toThrow(
      'invalid_points',
    ),
  );
  it('rejects impossible dates and template/category mismatch', () => {
    const g = createDemo('es');
    expect(() => applyCommand(g, 'alex', { ...command, date: '2026-02-30' })).toThrow(
      'invalid_date',
    );
    expect(() => applyCommand(g, 'alex', { ...command, category: 'Compra' })).toThrow(
      'invalid_template',
    );
  });
  it('does not mutate the source on failed or successful actions', () => {
    const g = createDemo('es'),
      before = JSON.stringify(g);
    applyCommand(g, 'alex', command);
    expect(JSON.stringify(g)).toBe(before);
  });
});
