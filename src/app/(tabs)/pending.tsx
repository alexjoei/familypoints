import { View } from 'react-native';
import { useState } from 'react';
import { useApp } from '../../state/AppProvider';
import { Chip, Empty, Page, useUi } from '../../components/ui';
import { ProposalCard } from '../../features/ProposalCard';
export default function Pending() {
  const { s } = useUi();
  const { group, actor, t } = useApp();
  const [mine, setMine] = useState(false);
  const proposals =
    group?.proposals
      .filter((p) => p.status === 'pending' && (!mine || p.author === actor))
      .reverse() ?? [];
  return (
    <Page
      title={t('Solicitudes pendientes', 'Pending requests')}
      subtitle={t(
        group?.members.length === 2
          ? 'Aquí decidís entre los dos: acepta, rechaza o propón otros puntos.'
          : 'Revisa puntos, canjes y acuerdos del grupo. Acepta, rechaza o propón otra cantidad cuando toque.',
        group?.members.length === 2
          ? 'Decide together: accept, reject or suggest a different number of points.'
          : 'Review points, redemptions and group agreements. Accept, reject or suggest another amount when it fits.',
      )}
    >
      <View style={s.wrap}>
        <Chip
          label={group?.members.length === 2 ? t('Los dos', 'Both of us') : t('Todo el grupo', 'Whole group')}
          selected={!mine}
          onPress={() => setMine(false)}
        />
        <Chip
          label={t('Mis solicitudes', 'My requests')}
          selected={mine}
          onPress={() => setMine(true)}
        />
      </View>
      {proposals.length ? (
        proposals.map((p) => <ProposalCard key={p.id} proposal={p} />)
      ) : (
        <Empty
          title={t('Todo al día', 'All caught up')}
          body={t(
            'No hay puntos ni canjes pendientes de aceptar en esta vista.',
            'No points or redemptions waiting for acceptance in this view.',
          )}
        />
      )}
    </Page>
  );
}
