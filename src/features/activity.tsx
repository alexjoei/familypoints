import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Activity, ActivityCluster } from '../domain/model';
import { useApp } from '../state/AppProvider';
import { Button, Icon, Txt, useUi } from '../components/ui';
const labels: Record<string, [string, string]> = {
  submitted: ['ha propuesto', 'proposed'],
  approved: ['Aprobado', 'Approved'],
  rejected: ['Rechazado', 'Rejected'],
  voted_approve: ['ha votado a favor', 'voted to approve'],
  voted_reject: ['ha votado en contra', 'voted to reject'],
  adjusted: ['ha propuesto un ajuste', 'proposed an adjustment'],
  adjustment_accepted: ['ha aceptado el ajuste', 'accepted the adjustment'],
  adjustment_declined: ['ha descartado el ajuste', 'declined the adjustment'],
  withdrawn: ['ha retirado', 'withdrew'],
  resubmitted: ['ha reenviado', 'resubmitted'],
  template: ['ha guardado una sugerencia', 'saved a suggestion'],
  category: ['ha añadido una categoría', 'added a category'],
  category_removed: ['ha quitado una categoría', 'removed a category'],
  category_renamed: ['ha cambiado una categoría', 'renamed a category'],
  template_removed: ['ha quitado una sugerencia', 'removed a suggestion'],
  granted: ['ha otorgado puntos por', 'gave points for'],
  member_removed: ['ha quitado a un miembro', 'removed a member'],
  reject_undone: ['ha deshecho su rechazo', 'undid a rejection'],
  group_created: ['ha creado el grupo', 'created the group'],
  joined: ['se ha unido al grupo', 'joined the group'],
  invitation_rotated: ['ha renovado la invitación', 'renewed the invitation'],
};
export function ActivityRow({ item }: { item: Activity }) {
  const { colors, s } = useUi();
  const { group, t, language } = useApp();
  const name = group?.members.find((m) => m.id === item.actor)?.name ?? t('Miembro', 'Member');
  const label = labels[item.type] ?? [item.type, item.type];
  return (
    <View
      style={[
        s.row,
        {
          alignItems: 'flex-start',
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        },
      ]}
    >
      <View
        style={[
          s.iconCircle,
          {
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: item.type === 'approved' ? colors.mint : colors.bg,
          },
        ]}
      >
        <Icon
          name={
            item.type === 'approved'
              ? 'checkmark-outline'
              : item.type === 'rejected'
                ? 'close-outline'
                : 'time-outline'
          }
          size={19}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt style={{ fontWeight: '600' }}>{item.title}</Txt>
        <Txt style={s.muted}>
          {['approved', 'rejected'].includes(item.type) ? t(...label) : `${name} ${t(...label)}`}
        </Txt>
        <Txt style={{ fontSize: 11, color: colors.muted }}>
          {new Date(item.at).toLocaleString(language, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Txt>
        {item.proposalId && (
          <Button
            label={t('Ver detalle', 'View details')}
            variant="ghost"
            onPress={() => router.push({ pathname: '/proposal', params: { id: item.proposalId! } })}
          />
        )}
      </View>
      {item.points != null && (
        <Txt style={{ fontWeight: '700', color: colors.green }}>{item.points} pt</Txt>
      )}
    </View>
  );
}

export function ActivityClusterRow({ cluster }: { cluster: ActivityCluster }) {
  const [expanded, setExpanded] = useState(false);
  const { colors, s } = useUi();
  const { group, language, t } = useApp();
  const p = cluster.proposal;
  if (!p) return <ActivityRow item={cluster.latest} />;
  const author = group?.members.find((m) => m.id === p.author)?.name ?? t('Alguien', 'Someone');
  const result = p.status === 'approved'
    ? p.kind === 'contribution'
      ? t(`${p.points} puntos sumados`, `${p.points} points added`)
      : p.kind === 'grant'
        ? t(`${p.points} puntos otorgados`, `${p.points} points given`)
      : p.kind === 'redemption'
        ? t(`${p.points} puntos canjeados`, `${p.points} points redeemed`)
        : t('Acordado', 'Agreed')
    : p.status === 'rejected'
      ? t('No aceptado', 'Not accepted')
      : p.status === 'withdrawn'
        ? t('Retirado', 'Withdrawn')
        : t('Esperando respuesta', 'Waiting for a reply');
  return (
    <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 4 }}>
      <View style={s.between}>
        <Txt style={{ fontWeight: '700', flex: 1 }}>{p.title}</Txt>
        <Txt style={{ color: colors.green, fontWeight: '800' }}>{p.points} pt</Txt>
      </View>
      <Txt style={s.muted}>{author} · {result}</Txt>
      <Txt style={{ fontSize: 11, color: colors.muted }}>
        {new Date(cluster.latest.at).toLocaleString(language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </Txt>
      <View style={s.wrap}>
        {cluster.events.length > 1 && (
          <Button
            label={expanded ? t('Ocultar pasos', 'Hide steps') : t(`Ver ${cluster.events.length} pasos`, `See ${cluster.events.length} steps`)}
            variant="ghost"
            onPress={() => setExpanded(!expanded)}
          />
        )}
        <Button label={t('Ver detalle', 'View details')} variant="ghost" onPress={() => router.push({ pathname: '/proposal', params: { id: p.id } })} />
      </View>
      {expanded && cluster.events.map((event) => {
        const name = group?.members.find((m) => m.id === event.actor)?.name ?? t('Miembro', 'Member');
        const label = labels[event.type] ?? [event.type, event.type];
        return <Txt key={event.id} style={s.muted}>• {name} {t(...label)}</Txt>;
      })}
    </View>
  );
}
