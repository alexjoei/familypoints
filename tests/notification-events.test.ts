import { describe, expect, it } from 'vitest';
import { createDemo } from '../src/domain/demo';
import { applyCommand } from '../src/domain/model';
import { defaultNotificationPreferences, notificationForEvent } from '../src/features/notification-events';

describe('notification recipients and preferences', () => {
  it('alerts the other person to review a contribution and the author to its decision', () => {
    let group = createDemo('es');
    const author = group.members[0].id;
    const reviewer = group.members[1].id;
    group = applyCommand(group, author, { type: 'submit', id: 'notice-1', kind: 'contribution', title: 'Hacer la cena', category: group.categories[0], points: 10, date: '2026-09-29', note: '' });
    const submitted = group.activity[group.activity.length - 1];
    expect(notificationForEvent(group, submitted, author, 'es', defaultNotificationPreferences)).toBeNull();
    expect(notificationForEvent(group, submitted, reviewer, 'es', defaultNotificationPreferences)?.body).toContain('10 puntos');
    expect(notificationForEvent(group, submitted, reviewer, 'es', { ...defaultNotificationPreferences, requests: false })).toBeNull();
    group = applyCommand(group, reviewer, { type: 'vote', id: 'notice-1', revision: 1, choice: 'approve' });
    const approved = group.activity[group.activity.length - 1];
    expect(notificationForEvent(group, approved, author, 'es', defaultNotificationPreferences)?.title).toBe('¡Puntos aceptados!');
    expect(notificationForEvent(group, approved, reviewer, 'es', defaultNotificationPreferences)).toBeNull();
    expect(notificationForEvent(group, approved, author, 'es', { ...defaultNotificationPreferences, decisions: false })).toBeNull();
  });
});
