import { describe, expect, it } from 'vitest';
import { createDemo } from '../src/domain/demo';
import { applyCommand, balance, recordSeen, voterStatus } from '../src/domain/model';
describe('read receipts are separate from votes', () => {
  it('only records the viewer and never changes balance, votes or activity', () => {
    const g = createDemo('es'),
      p = g.proposals.find((p) => p.id === 'demo-c3')!;
    expect(voterStatus(p, 'alex')).toBe('pending');
    const next = recordSeen(g, 'alex', p.id, 1, '2026-09-26T12:00:00Z');
    const seen = next.proposals.find((p) => p.id === 'demo-c3')!;
    expect(voterStatus(seen, 'alex')).toBe('seen');
    expect(voterStatus(seen, 'dani')).toBe('pending');
    expect(seen.votes).toEqual([]);
    expect(next.activity).toEqual(g.activity);
    expect(balance(next, 'sam')).toEqual(balance(g, 'sam'));
    expect(recordSeen(next, 'alex', p.id, 1)).toBe(next);
  });
  it('shows actual votes before read status and resets status for a new revision', () => {
    let g = recordSeen(createDemo('es'), 'alex', 'demo-c3', 1);
    g = applyCommand(g, 'alex', { type: 'vote', id: 'demo-c3', revision: 1, choice: 'approve' });
    g = applyCommand(g, 'dani', { type: 'vote', id: 'demo-c3', revision: 1, choice: 'reject' });
    let p = g.proposals.find((p) => p.id === 'demo-c3')!;
    expect(voterStatus(p, 'alex')).toBe('approved');
    expect(voterStatus(p, 'dani')).toBe('rejected');
    g = applyCommand(g, 'dani', { type: 'adjust', id: p.id, revision: 1, points: 10 });
    g = applyCommand(g, 'sam', { type: 'accept_adjustment', id: p.id, revision: 1 });
    p = g.proposals.find((p) => p.id === 'demo-c3')!;
    expect(voterStatus(p, 'alex')).toBe('pending');
    expect(voterStatus(p, 'dani')).toBe('pending');
    expect(() => recordSeen(g, 'alex', p.id, 1)).toThrow('stale_revision');
  });
  it('rejects outsiders and excludes the author from the voter roster', () => {
    const g = createDemo('es');
    expect(() => recordSeen(g, 'outsider', 'demo-c3', 1)).toThrow('not_member');
    expect(() => recordSeen(g, 'sam', 'demo-c3', 1)).toThrow('not_allowed');
  });
});
