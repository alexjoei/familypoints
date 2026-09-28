import { View } from 'react-native';
import { Proposal, voterStatus } from '../domain/model';
import { useApp } from '../state/AppProvider';
import { Icon, Txt, useUi } from '../components/ui';
export function VoterStates({ proposal }: { proposal: Proposal }) {
  const { group, t } = useApp();
  const { colors, s } = useUi();
  return (
    <View style={{ gap: 8 }}>
      <Txt style={s.label}>{group?.members.length === 2 ? t('Respuesta de tu pareja', "Your partner's reply") : t('¿Cómo va la cosa?', 'Where do we stand?')}</Txt>
      <View style={s.wrap}>
        {proposal.electorate.map((id) => {
          const status = voterStatus(proposal, id),
            name = group?.members.find((m) => m.id === id)?.name ?? t('Miembro', 'Member');
          const color =
            status === 'approved'
              ? colors.positive
              : status === 'rejected'
                ? colors.negative
                : colors.waiting;
          const bg =
            status === 'approved'
              ? colors.positiveBg
              : status === 'rejected'
                ? colors.negativeBg
                : colors.waitingBg;
          const label =
            status === 'approved'
              ? t('Aprobado', 'Approved')
              : status === 'rejected'
                ? t('Rechazado', 'Rejected')
                : status === 'seen'
                  ? t('Visto, sin votar', 'Seen, no vote yet')
                  : t('Pendiente', 'Pending');
          return (
            <View
              key={id}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${name}: ${label}`}
              testID={`voter-${id}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 14,
                backgroundColor: bg,
              }}
            >
              <Icon
                name={
                  status === 'approved'
                    ? 'checkmark-circle'
                    : status === 'rejected'
                      ? 'close-circle'
                      : status === 'seen'
                        ? 'eye-outline'
                        : 'time-outline'
                }
                size={24}
                color={color}
              />
              <View>
                <Txt style={{ fontWeight: '700', fontSize: 13, color }}>{name}</Txt>
                <Txt style={{ fontSize: 11, lineHeight: 16, color }}>{label}</Txt>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
