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
      title={t('Aceptar puntos', 'Accept points')}
      subtitle={t(
        'Revisa quién quiere sumar o canjear puntos. Acepta, rechaza o propón otra cantidad.',
        'Review who wants to add or redeem points. Accept, reject or suggest another amount.',
      )}
    >
      <View style={s.wrap}>
        <Chip
          label={t('Todo el grupo', 'Whole group')}
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
