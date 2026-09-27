import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Group, balance, voterStatus } from '../src/domain/model';
let db: PGlite;
const people = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
async function as(index: number) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [people[index]]);
}
async function makeGroup(count = 3) {
  await as(0);
  const result = await db.query<{ id: string }>(
    "select fp_create_group('Test group','Alex','es') id",
  );
  const id = result.rows[0].id;
  const inv = await db.query<{ inv: { code: string } }>('select fp_invite($1) inv', [id]);
  for (let i = 1; i < count; i++) {
    await as(i);
    await db.query('select fp_join_group($1,$2)', [
      inv.rows[0].inv.code,
      ['Alex', 'Sam', 'Dani'][i],
    ]);
  }
  return id;
}
async function act(group: string, actor: number, cmd: object, request = randomUUID()) {
  await as(actor);
  const result = await db.query<{ g: Group }>('select fp_action($1,$2::jsonb,$3) g', [
    group,
    JSON.stringify(cmd),
    request,
  ]);
  return result.rows[0].g;
}
const contribution = (id = 'c', points = 40) => ({
  type: 'submit',
  id,
  kind: 'contribution',
  title: 'Cena',
  category: 'Cocinar',
  points,
  date: '2026-09-26',
  note: '',
  templateId: 'template-0',
});
const vote = (id: string, choice = 'approve', revision = 1) => ({
  type: 'vote',
  id,
  choice,
  revision,
});
describe('read receipt permissions', () => {
  it('records only the authenticated viewer, idempotently, without voting', async () => {
    const id = await makeGroup();
    await act(id, 0, contribution());
    await as(1);
    const first = await db.query<{ r: { actor: string; revision: number; at: string } }>(
      'select fp_mark_seen($1,$2,1) r',
      [id, 'c'],
    );
    const again = await db.query<{ r: { actor: string; revision: number; at: string } }>(
      'select fp_mark_seen($1,$2,1) r',
      [id, 'c'],
    );
    expect(first.rows[0].r.actor).toBe(people[1]);
    expect(again.rows).toEqual(first.rows);
    const { rows } = await db.query<{ g: Group }>('select fp_snapshot($1) g', [id]);
    expect(voterStatus(rows[0].g.proposals[0], people[1])).toBe('seen');
    expect(voterStatus(rows[0].g.proposals[0], people[2])).toBe('pending');
    expect(rows[0].g.proposals[0].votes).toEqual([]);
    expect(balance(rows[0].g, people[0]).available).toBe(0);
  });
  it('does not carry a previous revision’s seen status into a new vote', async () => {
    const id = await makeGroup();
    await act(id, 0, contribution());
    await as(1);
    await db.query('select fp_mark_seen($1,$2,1)', [id, 'c']);
    await act(id, 2, { type: 'adjust', id: 'c', revision: 1, points: 20 });
    const g = await act(id, 0, { type: 'accept_adjustment', id: 'c', revision: 1 });
    expect(voterStatus(g.proposals[0], people[1])).toBe('pending');
    await as(1);
    await expect(db.query('select fp_mark_seen($1,$2,1)', [id, 'c'])).rejects.toThrow(
      'stale_revision',
    );
  });
  it('protects reads and writes from other groups and disallows author receipts', async () => {
    const id = await makeGroup();
    await act(id, 0, contribution());
    await expect(db.query('select fp_mark_seen($1,$2,1)', [id, 'c'])).rejects.toThrow(
      'not_allowed',
    );
    await as(3);
    await db.exec('set role authenticated');
    try {
      expect(
        (await db.query('select * from fp_seen_receipts where group_id=$1', [id])).rows,
      ).toHaveLength(0);
      await expect(db.query('select fp_mark_seen($1,$2,1)', [id, 'c'])).rejects.toThrow(
        'not_member',
      );
      await expect(
        db.query(
          'insert into fp_seen_receipts(group_id,proposal_id,revision,actor) values($1,$2,1,$3)',
          [id, 'c', people[1]],
        ),
      ).rejects.toThrow('permission denied');
    } finally {
      await db.exec('reset role');
    }
  });
});
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated;",
  );
  for (const id of people) await db.query('insert into auth.users values ($1)', [id]);
  for (const file of (await readdir('supabase/migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort())
    await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'));
});
afterAll(async () => {
  await db?.close();
});
describe('PostgreSQL RPC and permission integration', () => {
  it('creates an isolated group with templates and expiring invitations', async () => {
    const id = await makeGroup();
    await as(0);
    const { rows } = await db.query<{ g: Group }>('select fp_snapshot($1) g', [id]);
    expect(rows[0].g.members).toHaveLength(3);
    expect(rows[0].g.templates).toHaveLength(7);
    expect(rows[0].g).not.toHaveProperty('invite');
    await as(3);
    await expect(db.query('select fp_snapshot($1)', [id])).rejects.toThrow('not_member');
  });
  it('enforces majority, self-vote protection, immutable approvals and last approved suggestion', async () => {
    const id = await makeGroup();
    await act(id, 0, contribution());
    await expect(act(id, 0, vote('c'))).rejects.toThrow('self_vote');
    let g = await act(id, 1, vote('c'));
    expect(balance(g, people[0]).available).toBe(0);
    await expect(act(id, 1, vote('c'))).rejects.toThrow('already_voted');
    g = await act(id, 2, vote('c'));
    expect(balance(g, people[0]).available).toBe(40);
    expect(g.templates[0].points).toBe(40);
    await expect(act(id, 2, vote('c'))).rejects.toThrow('already_closed');
  });
  it('makes a replay idempotent but rejects reusing its key for a different command', async () => {
    const id = await makeGroup(),
      key = randomUUID(),
      cmd = contribution();
    const first = await act(id, 0, cmd, key),
      second = await act(id, 0, cmd, key);
    expect(second.activity).toHaveLength(first.activity.length);
    expect(second.proposals).toHaveLength(1);
    await expect(act(id, 0, { ...cmd, points: 1 }, key)).rejects.toThrow('duplicate');
  });
  it('retains prior votes and requires new votes after an accepted adjustment', async () => {
    const id = await makeGroup();
    await act(id, 0, contribution());
    await act(id, 1, vote('c'));
    await act(id, 2, { type: 'adjust', id: 'c', revision: 1, points: 20 });
    await expect(act(id, 2, vote('c'))).rejects.toThrow('adjustment_pending');
    await expect(act(id, 1, { type: 'accept_adjustment', id: 'c', revision: 1 })).rejects.toThrow(
      'author_only',
    );
    await act(id, 0, { type: 'accept_adjustment', id: 'c', revision: 1 });
    await expect(act(id, 2, vote('c'))).rejects.toThrow('stale_revision');
    let g = await act(id, 1, vote('c', 'approve', 2));
    expect(balance(g, people[0]).available).toBe(0);
    g = await act(id, 2, vote('c', 'approve', 2));
    expect(balance(g, people[0]).available).toBe(20);
    expect(g.proposals[0].votes).toHaveLength(3);
  });
  it('uses approved reward costs, reserves funds and prevents double spending', async () => {
    const id = await makeGroup();
    await act(id, 0, contribution());
    await act(id, 1, vote('c'));
    await act(id, 2, vote('c'));
    await act(id, 1, { ...contribution('r', 30), kind: 'reward' });
    await act(id, 0, vote('r'));
    await act(id, 2, vote('r'));
    const redeem = { ...contribution('redeem', 1), kind: 'redemption', rewardId: 'r' };
    let g = await act(id, 0, redeem);
    expect(balance(g, people[0])).toMatchObject({ available: 10, reserved: 30, spent: 0 });
    await expect(act(id, 0, { ...redeem, id: 'redeem2' })).rejects.toThrow('insufficient_balance');
    await act(id, 1, vote('redeem'));
    g = await act(id, 2, vote('redeem'));
    expect(balance(g, people[0])).toMatchObject({ available: 10, reserved: 0, spent: 30 });
  });
  it('releases rejected reservations and does not alter existing redemptions when reward price changes', async () => {
    const id = await makeGroup();
    await act(id, 0, contribution());
    await act(id, 1, vote('c'));
    await act(id, 2, vote('c'));
    await act(id, 1, { ...contribution('r', 30), kind: 'reward' });
    await act(id, 0, vote('r'));
    await act(id, 2, vote('r'));
    await act(id, 0, { ...contribution('d'), kind: 'redemption', rewardId: 'r' });
    await act(id, 1, { ...contribution('change', 10), kind: 'reward_change', rewardId: 'r' });
    await act(id, 0, vote('change'));
    let g = await act(id, 2, vote('change'));
    expect(g.proposals.find((p) => p.id === 'd')?.points).toBe(30);
    await act(id, 1, vote('d', 'reject'));
    g = await act(id, 2, vote('d', 'reject'));
    expect(balance(g, people[0]).available).toBe(40);
    g = await act(id, 0, { ...contribution('d2'), kind: 'redemption', rewardId: 'r' });
    expect(g.proposals.find((p) => p.id === 'd2')?.points).toBe(10);
  });
  it('prevents outsiders, table writes and internal helper invocation using actual authenticated role', async () => {
    const id = await makeGroup();
    await act(id, 0, contribution());
    await as(3);
    await db.exec('set role authenticated');
    try {
      expect(
        (await db.query('select * from fp_proposals where group_id=$1', [id])).rows,
      ).toHaveLength(0);
      await expect(db.query('select fp_snapshot($1)', [id])).rejects.toThrow('not_member');
      await expect(
        db.query("update fp_proposals set data='{}' where group_id=$1", [id]),
      ).rejects.toThrow('permission denied');
      await expect(db.query('select fp_available($1,$2)', [id, people[0]])).rejects.toThrow(
        'permission denied',
      );
      await expect(db.query('select * from fp_groups')).rejects.toThrow('permission denied');
    } finally {
      await db.exec('reset role');
    }
  });
  it('allows authenticated member RPC writes without direct table privileges', async () => {
    const id = await makeGroup();
    await as(0);
    await db.exec('set role authenticated');
    try {
      const { rows } = await db.query<{ g: Group }>('select fp_action($1,$2::jsonb,$3) g', [
        id,
        JSON.stringify(contribution()),
        randomUUID(),
      ]);
      expect(rows[0].g.proposals).toHaveLength(1);
    } finally {
      await db.exec('reset role');
    }
  });
  it('revokes invitations on rotation and rejects non-admin changes', async () => {
    const id = await makeGroup();
    await as(0);
    const { rows } = await db.query<{ i: { code: string } }>('select fp_invite($1) i', [id]);
    await db.query('select fp_invite($1,true)', [id]);
    await as(3);
    await expect(db.query("select fp_join_group($1,'Other')", [rows[0].i.code])).rejects.toThrow(
      'invalid_invite',
    );
    await expect(act(id, 1, { type: 'category', title: 'Travel' })).rejects.toThrow('owner_only');
  });
  it('rejects invalid dates, decimal points and blank titles', async () => {
    const id = await makeGroup();
    await expect(act(id, 0, { ...contribution(), date: '2026-02-30' })).rejects.toThrow(
      'invalid_date',
    );
    await expect(act(id, 0, contribution('c', 1.5))).rejects.toThrow('invalid_points');
    await expect(act(id, 0, { ...contribution(), title: ' ' })).rejects.toThrow('invalid_text');
  });
  it('preserves the exact previous proposal when resubmitted', async () => {
    const id = await makeGroup();
    await act(id, 0, { ...contribution(), note: 'Original note' });
    await act(id, 1, vote('c', 'reject'));
    await act(id, 2, vote('c', 'reject'));
    const g = await act(id, 0, {
      type: 'resubmit',
      id: 'c',
      revision: 1,
      title: 'New title',
      points: 15,
      note: 'New note',
    });
    expect(g.proposals[0].history?.[0]).toMatchObject({
      title: 'Cena',
      note: 'Original note',
      points: 40,
      status: 'rejected',
    });
    expect(g.proposals[0].votes).toHaveLength(2);
    expect(balance(g, people[0]).available).toBe(0);
  });
  it('keeps the electorate stable when a new member joins and uses new members on new requests', async () => {
    const id = await makeGroup(2);
    await act(id, 0, contribution());
    await as(0);
    const { rows } = await db.query<{ i: { code: string } }>('select fp_invite($1) i', [id]);
    await as(2);
    await db.query("select fp_join_group($1,'Dani')", [rows[0].i.code]);
    let g = await act(id, 1, vote('c'));
    expect(g.proposals[0].status).toBe('approved');
    g = await act(id, 0, contribution('new'));
    expect(g.proposals.find((p) => p.id === 'new')?.electorate).toHaveLength(2);
  });
  it('resolves a retried approval without issuing duplicate credit', async () => {
    const id = await makeGroup(2);
    await act(id, 0, contribution());
    const key = randomUUID();
    await act(id, 1, vote('c'), key);
    const g = await act(id, 1, vote('c'), key);
    expect(balance(g, people[0]).available).toBe(40);
    expect(g.activity.filter((e) => e.type === 'approved')).toHaveLength(1);
  });
  it('blocks anonymous RPC access and null categories', async () => {
    const id = await makeGroup();
    await expect(act(id, 0, { ...contribution(), category: null })).rejects.toThrow(
      'invalid_category',
    );
    await db.exec('set role anon');
    try {
      await expect(db.query('select fp_snapshot($1)', [id])).rejects.toThrow('permission denied');
    } finally {
      await db.exec('reset role');
    }
  });
});
