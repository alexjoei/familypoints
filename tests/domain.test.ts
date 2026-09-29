import { describe, it, expect } from 'vitest';
import { activityClusters, applyCommand, balance, Group, quorum, rewardCost } from '../src/domain/model';
import { createDemo } from '../src/domain/demo';
const command = {
  type: 'submit' as const,
  id: 'new',
  kind: 'contribution' as const,
  title: 'Dinner',
  points: 20,
  category: 'Cocina',
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
    let g = createDemo('es', 'group');
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
    let g = applyCommand(createDemo('es', 'group'), 'alex', command);
    expect(() => vote(g, 'alex')).toThrow('self_vote');
    expect(() => vote(g, 'outsider')).toThrow('not_member');
    g = vote(g, 'sam');
    expect(() => vote(g, 'sam')).toThrow('already_voted');
  });
  it('keeps a tied proposal pending', () => {
    let g = applyCommand(createDemo('es', 'group'), 'alex', command);
    g = vote(g, 'sam');
    g = vote(g, 'dani', 'new', 'reject');
    expect(g.proposals.find((p) => p.id === 'new')?.status).toBe('pending');
  });
  it('requires author acceptance of adjustments and fresh votes, preserving the old record', () => {
    let g = applyCommand(createDemo('es', 'group'), 'alex', command);
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
  it('settles a partner’s suggested points as soon as the author accepts', () => {
    let g = applyCommand(createDemo('es'), 'alex', command);
    g = applyCommand(g, 'sam', { type: 'adjust', id: 'new', revision: 1, points: 10 });
    g = applyCommand(g, 'alex', { type: 'accept_adjustment', id: 'new', revision: 1 });
    const proposal = g.proposals.find((p) => p.id === 'new')!;
    expect(proposal).toMatchObject({ points: 10, status: 'approved', revision: 2 });
    expect(proposal.votes.at(-1)).toMatchObject({ actor: 'sam', choice: 'approve', revision: 2 });
    expect(balance(g, 'alex').earned).toBe(50);
    expect(() => vote(g, 'sam', 'new', 'approve', 2)).toThrow('already_closed');
  });
  it('can reject and resubmit without crediting the rejected revision', () => {
    let g = applyCommand(createDemo('es', 'group'), 'alex', command);
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
  it('undoes a rejection without erasing its history or reason', () => {
    let g = applyCommand(createDemo('es'), 'alex', command);
    g = applyCommand(g, 'sam', { type: 'vote', id: 'new', revision: 1, choice: 'reject', reason: 'Hablemos de la cantidad' });
    expect(g.proposals.find((p) => p.id === 'new')?.status).toBe('rejected');
    expect(g.proposals.find((p) => p.id === 'new')?.votes[0].reason).toBe('Hablemos de la cantidad');
    g = applyCommand(g, 'sam', { type: 'undo_reject', id: 'new', revision: 1 });
    expect(g.proposals.find((p) => p.id === 'new')?.status).toBe('pending');
    expect(g.proposals.find((p) => p.id === 'new')?.votes).toHaveLength(0);
    expect(g.proposals.find((p) => p.id === 'new')?.retractedVotes?.[0].reason).toBe('Hablemos de la cantidad');
    expect(g.activity.map((e) => e.type)).toContain('reject_undone');
    g = vote(g, 'sam');
    expect(balance(g, 'alex').earned).toBe(60);
  });
  it('lets any member edit suggestions and categories, but protects member removal', () => {
    let g = createDemo('es');
    expect(() => applyCommand(g, 'sam', { type: 'remove_member', id: 'alex' })).toThrow('owner_only');
    g = applyCommand(g, 'sam', { type: 'remove_category', title: g.categories[0] });
    expect(g.templates.some((tp) => tp.id === 'template-0')).toBe(false);
    g = applyCommand(g, 'sam', { type: 'category', title: 'Planes' });
    g = applyCommand(g, 'sam', { type: 'template', id: 'plans', title: 'Organizar salida', category: 'Planes', points: 12 });
    g = applyCommand(g, 'sam', { type: 'remove_template', id: 'plans' });
    expect(g.templates.some((tp) => tp.id === 'plans')).toBe(false);
    g = applyCommand(g, 'sam', { type: 'template', id: 'plans', title: 'Organizar salida', category: 'Planes', points: 12 });
    g = applyCommand(g, 'sam', { type: 'rename_category', title: 'Planes', newTitle: 'Salidas' });
    expect(g.categories).toContain('Salidas');
    expect(g.templates.find((tp) => tp.id === 'plans')?.category).toBe('Salidas');
    expect(g.templates.find((tp) => tp.id === 'plans')?.points).toBe(12);
    expect(g.templates.some((tp) => tp.id === 'template-0')).toBe(false);
    expect(g.categories).not.toContain('Cocina');
    g = applyCommand(g, 'alex', { ...command, category: g.categories[0], templateId: undefined });
    expect(() => applyCommand(g, 'alex', { type: 'remove_member', id: 'sam' })).toThrow('pending_requests');
    g = applyCommand(g, 'alex', { type: 'withdraw', id: 'new', revision: 1 });
    g = { ...g, proposals: g.proposals.filter((p) => p.status !== 'pending') };
    g = applyCommand(g, 'alex', { type: 'remove_member', id: 'sam' });
    expect(g.members).toHaveLength(1);
  });
  it('reserves funds immediately, prevents overspending, and releases on withdrawal', () => {
    let g = createDemo('es', 'group');
    const cmd = { ...command, kind: 'redemption' as const, rewardId: 'demo-r1', points: 1 };
    expect(() => applyCommand(g, 'alex', { ...cmd, id: 'too-early', rewardId: 'demo-r2' })).toThrow('insufficient_balance');
    g = applyCommand(g, 'alex', {
      type: 'submit', id: 'limit', kind: 'debt_limit', title: 'Allow negative balance',
      points: 100, category: '', note: '', date: '2026-09-26',
    });
    g = vote(vote(g, 'sam', 'limit'), 'dani', 'limit');
    g = applyCommand(g, 'alex', cmd);
    expect(balance(g, 'alex')).toMatchObject({ available: 10, reserved: 30, spent: 0 });
    for (const id of ['other', 'third', 'fourth']) g = applyCommand(g, 'alex', { ...cmd, id });
    expect(balance(g, 'alex').available).toBe(-80);
    expect(() => applyCommand(g, 'alex', { ...cmd, id: 'fifth' })).toThrow('insufficient_balance');
    g = applyCommand(g, 'alex', { type: 'withdraw', id: 'new', revision: 1 });
    expect(balance(g, 'alex').available).toBe(-50);
  });
  it('enables negative balances only after group approval', () => {
    let g = createDemo('es', 'group');
    g = applyCommand(g, 'alex', {
      type: 'submit', id: 'limit', kind: 'debt_limit', title: 'Allow negative points',
      points: 100, category: '', note: '', date: '2026-09-26',
    });
    expect(g.debtLimit).toBe(0);
    g = vote(vote(g, 'sam', 'limit'), 'dani', 'limit');
    expect(g.debtLimit).toBe(100);
    g = applyCommand(g, 'alex', { ...command, id: 'redeem', kind: 'redemption', rewardId: 'demo-r1' });
    expect(balance(g, 'alex').available).toBe(10);
    expect(balance(g, 'alex').available).toBe(10);
  });
  it('spends a redemption only after the group approves it', () => {
    let g = applyCommand(createDemo('es', 'group'), 'alex', {
      ...command,
      kind: 'redemption',
      rewardId: 'demo-r1',
    });
    g = vote(vote(g, 'sam'), 'dani');
    expect(balance(g, 'alex')).toMatchObject({ available: 10, reserved: 0, spent: 30 });
    expect(() => vote(g, 'sam')).toThrow('already_closed');
  });
  it('updates reward price for future redemptions only', () => {
    let g = applyCommand(createDemo('es', 'group'), 'alex', {
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
    expect(() => applyCommand(createDemo('es', 'group'), 'alex', { ...command, points })).toThrow(
      'invalid_points',
    ),
  );
  it('rejects impossible dates and template/category mismatch', () => {
    const g = createDemo('es', 'group');
    expect(() => applyCommand(g, 'alex', { ...command, date: '2026-02-30' })).toThrow(
      'invalid_date',
    );
    expect(() => applyCommand(g, 'alex', { ...command, category: 'Casa' })).toThrow(
      'invalid_template',
    );
  });
  it('does not mutate the source on failed or successful actions', () => {
    const g = createDemo('es', 'group'),
      before = JSON.stringify(g);
    applyCommand(g, 'alex', command);
    expect(JSON.stringify(g)).toBe(before);
  });
  it('groups the steps of one contribution into one movement', () => {
    let g = applyCommand(createDemo('es'), 'alex', command);
    g = vote(g, 'sam');
    const cluster = activityClusters(g).find((item) => item.id === 'new')!;
    expect(cluster.events.map((event) => event.type)).toEqual(['submitted', 'voted_approve', 'approved']);
    expect(activityClusters(g).filter((item) => item.id === 'new')).toHaveLength(1);
  });
});
