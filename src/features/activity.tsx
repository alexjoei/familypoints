import { View } from 'react-native';
import { router } from 'expo-router';
import { Activity } from '../domain/model';
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
  template: ['ha actualizado la plantilla', 'updated the template'],
  category: ['ha añadido una categoría', 'added a category'],
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
