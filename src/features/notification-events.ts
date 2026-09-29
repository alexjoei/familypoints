import { Activity, Group, Language } from '../domain/model';

export type NotificationPreferences = {
  requests: boolean;
  decisions: boolean;
  changes: boolean;
};
export const defaultNotificationPreferences: NotificationPreferences = {
  requests: true,
  decisions: true,
  changes: false,
};
export type PointNotification = { id: string; title: string; body: string; proposalId?: string };

export function notificationForEvent(
  group: Group,
  event: Activity,
  actor: string,
  language: Language,
  prefs: NotificationPreferences,
): PointNotification | null {
  if (event.actor === actor) return null;
  const proposal = group.proposals.find((p) => p.id === event.proposalId);
  const name = group.members.find((m) => m.id === event.actor)?.name ?? (language === 'es' ? 'Alguien' : 'Someone');
  const es = language === 'es';
  if (proposal) {
    if (prefs.requests && ['submitted', 'resubmitted'].includes(event.type) && proposal.electorate.includes(actor)) {
      return { id: event.id, title: es ? 'Te toca decidir' : 'Your call', body: es ? `${name} quiere ${proposal.kind === 'redemption' ? 'canjear' : 'sumar'} ${event.points} puntos por ${event.title}. Revisa y acepta o rechaza.` : `${name} wants to ${proposal.kind === 'redemption' ? 'redeem' : 'add'} ${event.points} points for ${event.title}. Review and decide.`, proposalId: proposal.id };
    }
    if (prefs.decisions && proposal.author === actor) {
      if (event.type === 'adjusted') return { id: event.id, title: es ? 'Te proponen otros puntos' : 'A new points suggestion', body: es ? `${name} propone ${event.points} puntos para ${event.title}.` : `${name} suggests ${event.points} points for ${event.title}.`, proposalId: proposal.id };
      if (['approved', 'rejected'].includes(event.type)) return { id: event.id, title: event.type === 'approved' ? (proposal.kind === 'redemption' ? (es ? 'Canje aprobado' : 'Redemption approved') : proposal.kind === 'contribution' ? (es ? '¡Puntos aceptados!' : 'Points approved!') : (es ? 'Acuerdo aprobado' : 'Agreement approved')) : (es ? 'Solicitud rechazada' : 'Request declined'), body: es ? `${event.title} · ${event.points} puntos.` : `${event.title} · ${event.points} points.`, proposalId: proposal.id };
      if (['adjustment_accepted', 'adjustment_declined'].includes(event.type)) return { id: event.id, title: es ? 'Respuesta al ajuste' : 'Adjustment reply', body: es ? `${name} ha respondido sobre ${event.title}.` : `${name} replied about ${event.title}.`, proposalId: proposal.id };
    }
  }
  if (prefs.changes && ['joined', 'member_removed', 'category', 'category_removed', 'template', 'template_removed'].includes(event.type)) {
    return { id: event.id, title: es ? 'Novedad en el grupo' : 'Group update', body: `${name}: ${event.title}` };
  }
  return null;
}
