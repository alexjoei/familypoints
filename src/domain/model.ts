export type Language = 'es' | 'en';
export type Kind = 'contribution' | 'reward' | 'redemption' | 'reward_change' | 'debt_limit';
export type Status = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type Member = { id: string; name: string };
export type Template = { id: string; title: string; category: string; points: number };
export type Vote = { actor: string; choice: 'approve' | 'reject'; revision: number; at: string; reason?: string };
export type SeenReceipt = { actor: string; revision: number; at: string };
export type Proposal = {
  id: string;
  kind: Kind;
  author: string;
  title: string;
  category: string;
  points: number;
  date: string;
  note: string;
  templateId?: string;
  rewardId?: string;
  photoPath?: string;
  status: Status;
  revision: number;
  electorate: string[];
  votes: Vote[];
  retractedVotes?: Vote[];
  adjustment?: { actor: string; points: number };
  history?: Proposal[];
  seen?: SeenReceipt[];
};
export type Activity = {
  id: string;
  actor: string;
  type: string;
  title: string;
  at: string;
  points?: number;
  proposalId?: string;
};
export type ActivityCluster = { id: string; proposal?: Proposal; events: Activity[]; latest: Activity };
export type Group = {
  id: string;
  name: string;
  owner: string;
  members: Member[];
  categories: string[];
  templates: Template[];
  debtLimit?: number;
  proposals: Proposal[];
  activity: Activity[];
};
export type Command =
  | {
      type: 'submit';
      id: string;
      kind: Kind;
      title: string;
      category: string;
      points: number;
      date: string;
      note: string;
      templateId?: string;
      rewardId?: string;
      photoPath?: string;
    }
  | { type: 'vote'; id: string; revision: number; choice: 'approve' | 'reject'; reason?: string }
  | { type: 'undo_reject'; id: string; revision: number }
  | { type: 'adjust'; id: string; revision: number; points: number }
  | { type: 'accept_adjustment' | 'decline_adjustment' | 'withdraw'; id: string; revision: number }
  | { type: 'resubmit'; id: string; revision: number; points: number; title: string; note: string }
  | { type: 'template'; id: string; title: string; category: string; points: number }
  | { type: 'category'; title: string }
  | { type: 'rename_category'; title: string; newTitle: string }
  | { type: 'remove_category'; title: string }
  | { type: 'remove_template'; id: string }
  | { type: 'remove_member'; id: string };

export const quorum = (electorate: string[]) => Math.floor(electorate.length / 2) + 1;
export type VoterStatus = 'approved' | 'rejected' | 'seen' | 'pending';
export function voterStatus(proposal: Proposal, actor: string): VoterStatus {
  const vote = proposal.votes.find((v) => v.actor === actor && v.revision === proposal.revision);
  if (vote) return vote.choice === 'approve' ? 'approved' : 'rejected';
  return proposal.seen?.some((r) => r.actor === actor && r.revision === proposal.revision)
    ? 'seen'
    : 'pending';
}
export function recordSeen(
  source: Group,
  actor: string,
  id: string,
  revision: number,
  at = new Date().toISOString(),
): Group {
  requireThat(
    source.members.some((m) => m.id === actor),
    'not_member',
  );
  const proposal = source.proposals.find((p) => p.id === id);
  requireThat(proposal, 'not_found');
  requireThat(proposal.revision === revision, 'stale_revision');
  requireThat(proposal.electorate.includes(actor), 'not_allowed');
  if (proposal.seen?.some((r) => r.actor === actor && r.revision === revision)) return source;
  return {
    ...source,
    proposals: source.proposals.map((p) =>
      p.id === id ? { ...p, seen: [...(p.seen ?? []), { actor, revision, at }] } : p,
    ),
  };
}
export function balance(group: Group, member: string) {
  const own = group.proposals.filter((p) => p.author === member);
  const earned = own
    .filter((p) => p.kind === 'contribution' && p.status === 'approved')
    .reduce((n, p) => n + p.points, 0);
  const spent = own
    .filter((p) => p.kind === 'redemption' && p.status === 'approved')
    .reduce((n, p) => n + p.points, 0);
  const reserved = own
    .filter((p) => p.kind === 'redemption' && p.status === 'pending')
    .reduce((n, p) => n + p.points, 0);
  return { earned, spent, reserved, total: earned - spent, available: earned - spent - reserved };
}
export function activityClusters(group: Group): ActivityCluster[] {
  const clusters = new Map<string, ActivityCluster>();
  const order = new Map<string, number>();
  for (const [index, event] of group.activity.entries()) {
    const id = event.proposalId ?? event.id;
    order.set(id, index);
    const cluster = clusters.get(id);
    if (cluster) {
      cluster.events.push(event);
      cluster.latest = event;
    } else {
      clusters.set(id, {
        id,
        proposal: group.proposals.find((p) => p.id === event.proposalId),
        events: [event],
        latest: event,
      });
    }
  }
  return [...clusters.values()].sort((a, b) => (order.get(b.id) ?? 0) - (order.get(a.id) ?? 0));
}
export function rewardCost(group: Group, reward: Proposal) {
  // Proposals are ordered by creation; use the latest approval event, not creation time.
  const changes = group.activity.filter(
    (e) =>
      e.type === 'approved' &&
      group.proposals.some(
        (p) => p.id === e.proposalId && p.kind === 'reward_change' && p.rewardId === reward.id,
      ),
  );
  const last = changes[changes.length - 1];
  return last ? group.proposals.find((p) => p.id === last.proposalId)!.points : reward.points;
}
function requireThat(ok: unknown, code: string): asserts ok {
  if (!ok) throw new Error(code);
}
function validPoints(n: number) {
  requireThat(Number.isSafeInteger(n) && n > 0 && n <= 100000, 'invalid_points');
}
function validText(s: string, max = 100) {
  requireThat(!!s.trim() && s.trim().length <= max, 'invalid_text');
}
export function applyCommand(
  source: Group,
  actor: string,
  cmd: Command,
  at = new Date().toISOString(),
): Group {
  const g: Group = JSON.parse(JSON.stringify(source));
  requireThat(
    g.members.some((m) => m.id === actor),
    'not_member',
  );
  const event = (type: string, title: string, points?: number, proposalId?: string) =>
    g.activity.push({
      id: `${at}-${g.activity.length}`,
      actor,
      type,
      title,
      at,
      points,
      proposalId,
    });
  const electorate = () => g.members.filter((m) => m.id !== actor).map((m) => m.id);
  if (cmd.type === 'category') {
    validText(cmd.title, 40);
    requireThat(!g.categories.includes(cmd.title.trim()), 'duplicate');
    g.categories.push(cmd.title.trim());
    event('category', cmd.title.trim());
    return g;
  }
  if (cmd.type === 'rename_category') {
    validText(cmd.newTitle, 40);
    requireThat(g.categories.includes(cmd.title), 'not_found');
    requireThat(cmd.title === cmd.newTitle.trim() || !g.categories.includes(cmd.newTitle.trim()), 'duplicate');
    g.categories = g.categories.map((c) => c === cmd.title ? cmd.newTitle.trim() : c);
    g.templates = g.templates.map((t) => t.category === cmd.title ? { ...t, category: cmd.newTitle.trim() } : t);
    event('category_renamed', `${cmd.title} → ${cmd.newTitle.trim()}`);
    return g;
  }
  if (cmd.type === 'remove_category') {
    requireThat(g.categories.includes(cmd.title), 'not_found');
    requireThat(!g.templates.some((t) => t.category === cmd.title), 'category_in_use');
    g.categories = g.categories.filter((c) => c !== cmd.title);
    event('category_removed', cmd.title);
    return g;
  }
  if (cmd.type === 'remove_template') {
    const template = g.templates.find((t) => t.id === cmd.id);
    requireThat(template, 'not_found');
    g.templates = g.templates.filter((t) => t.id !== cmd.id);
    event('template_removed', template.title);
    return g;
  }
  if (cmd.type === 'remove_member') {
    requireThat(actor === g.owner, 'owner_only');
    requireThat(cmd.id !== g.owner, 'not_allowed');
    const member = g.members.find((m) => m.id === cmd.id);
    requireThat(member, 'not_found');
    requireThat(!g.proposals.some((p) => p.status === 'pending'), 'pending_requests');
    g.members = g.members.filter((m) => m.id !== cmd.id);
    event('member_removed', member.name);
    return g;
  }
  if (cmd.type === 'template') {
    validPoints(cmd.points);
    validText(cmd.title);
    requireThat(g.categories.includes(cmd.category), 'invalid_category');
    const t = { id: cmd.id, title: cmd.title.trim(), category: cmd.category, points: cmd.points };
    const i = g.templates.findIndex((t) => t.id === cmd.id);
    if (i < 0) g.templates.push(t);
    else g.templates[i] = t;
    event('template', t.title, t.points);
    return g;
  }
  if (cmd.type === 'submit') {
    requireThat(!g.proposals.some((p) => p.id === cmd.id), 'duplicate');
    if (cmd.kind === 'debt_limit')
      requireThat(Number.isSafeInteger(cmd.points) && cmd.points >= 0 && cmd.points <= 100, 'invalid_points');
    else validPoints(cmd.points);
    validText(cmd.title);
    requireThat(cmd.note.length <= 1000, 'invalid_note');
    requireThat(
      /^\d{4}-\d{2}-\d{2}$/.test(cmd.date) &&
        !Number.isNaN(Date.parse(cmd.date)) &&
        new Date(cmd.date).toISOString().slice(0, 10) === cmd.date,
      'invalid_date',
    );
    let points = cmd.points,
      title = cmd.title.trim();
    if (cmd.kind === 'contribution') {
      requireThat(g.categories.includes(cmd.category), 'invalid_category');
      if (cmd.templateId)
        requireThat(
          g.templates.some((t) => t.id === cmd.templateId && t.category === cmd.category),
          'invalid_template',
        );
    }
    if (cmd.kind === 'redemption' || cmd.kind === 'reward_change') {
      const reward = g.proposals.find(
        (p) => p.id === cmd.rewardId && p.kind === 'reward' && p.status === 'approved',
      );
      requireThat(reward, 'invalid_reward');
      title = reward.title;
      if (cmd.kind === 'redemption') {
        points = rewardCost(g, reward);
        requireThat(balance(g, actor).available - points >= -(g.debtLimit ?? 0), 'insufficient_balance');
      }
    }
    g.proposals.push({
      ...cmd,
      title,
      points,
      author: actor,
      status: 'pending',
      revision: 1,
      electorate: electorate(),
      votes: [],
    });
    event('submitted', title, points, cmd.id);
    return g;
  }
  const p = g.proposals.find((p) => p.id === cmd.id);
  requireThat(p, 'not_found');
  requireThat(p.revision === cmd.revision, 'stale_revision');
  const archive = () => {
    const previous = { ...p };
    delete previous.history;
    delete previous.adjustment;
    p.history = [...(p.history ?? []), previous];
  };
  if (cmd.type === 'resubmit') {
    requireThat(
      p.author === actor && p.status === 'rejected' && p.kind === 'contribution',
      'not_allowed',
    );
    validPoints(cmd.points);
    validText(cmd.title);
    requireThat(cmd.note.length <= 1000, 'invalid_note');
    archive();
    Object.assign(p, {
      title: cmd.title.trim(),
      points: cmd.points,
      note: cmd.note,
      status: 'pending',
      revision: p.revision + 1,
      electorate: electorate(),
      adjustment: undefined,
    });
    event('resubmitted', p.title, p.points, p.id);
    return g;
  }
  if (cmd.type === 'undo_reject') {
    requireThat(p.status === 'rejected' || p.status === 'pending', 'already_closed');
    const vote = p.votes.find((v) => v.actor === actor && v.revision === p.revision && v.choice === 'reject');
    requireThat(vote, 'not_allowed');
    p.retractedVotes = [...(p.retractedVotes ?? []), vote];
    p.votes = p.votes.filter((v) => v !== vote);
    p.status = 'pending';
    event('reject_undone', p.title, p.points, p.id);
    return g;
  }
  requireThat(p.status === 'pending', 'already_closed');
  if (cmd.type === 'withdraw') {
    requireThat(actor === p.author, 'author_only');
    p.status = 'withdrawn';
    event('withdrawn', p.title, p.points, p.id);
    return g;
  }
  if (cmd.type === 'adjust') {
    requireThat(p.kind !== 'redemption' && p.kind !== 'debt_limit' && p.electorate.includes(actor), 'not_allowed');
    requireThat(!p.adjustment, 'adjustment_pending');
    validPoints(cmd.points);
    p.adjustment = { actor, points: cmd.points };
    event('adjusted', p.title, cmd.points, p.id);
    return g;
  }
  if (cmd.type === 'accept_adjustment' || cmd.type === 'decline_adjustment') {
    requireThat(actor === p.author && p.adjustment, 'author_only');
    if (cmd.type === 'accept_adjustment') {
      archive();
      const adjuster = p.adjustment.actor;
      p.points = p.adjustment.points;
      p.revision++;
      event('adjustment_accepted', p.title, p.points, p.id);
      if (p.electorate.length === 1) {
        p.votes.push({ actor: adjuster, choice: 'approve', revision: p.revision, at });
        p.status = 'approved';
        event('approved', p.title, p.points, p.id);
        if (p.kind === 'contribution' && p.templateId) {
          const template = g.templates.find((t) => t.id === p.templateId);
          if (template) template.points = p.points;
        }
      }
    } else event('adjustment_declined', p.title, p.adjustment.points, p.id);
    delete p.adjustment;
    return g;
  }
  requireThat(cmd.type === 'vote' && p.electorate.includes(actor), 'self_vote');
  requireThat(!p.adjustment, 'adjustment_pending');
  requireThat(
    !p.votes.some((v) => v.actor === actor && v.revision === p.revision),
    'already_voted',
  );
  requireThat(!cmd.reason || cmd.reason.trim().length <= 200, 'invalid_note');
  p.votes.push({ actor, choice: cmd.choice, revision: p.revision, at, ...(cmd.choice === 'reject' && cmd.reason?.trim() ? { reason: cmd.reason.trim() } : {}) });
  event(cmd.choice === 'approve' ? 'voted_approve' : 'voted_reject', p.title, p.points, p.id);
  const votes = p.votes.filter((v) => v.revision === p.revision);
  if (votes.filter((v) => v.choice === cmd.choice).length >= quorum(p.electorate)) {
    p.status = cmd.choice === 'approve' ? 'approved' : 'rejected';
    event(p.status, p.title, p.points, p.id);
    if (p.status === 'approved' && p.kind === 'contribution' && p.templateId) {
      const t = g.templates.find((t) => t.id === p.templateId);
      if (t) t.points = p.points;
    }
    if (p.status === 'approved' && p.kind === 'debt_limit') g.debtLimit = p.points;
  }
  return g;
}
