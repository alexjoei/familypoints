import { useState } from 'react';
import { View } from 'react-native';
import { useApp } from '../../state/AppProvider';
import { Card, Chip, Empty, Page, useUi } from '../../components/ui';
import { ActivityClusterRow } from '../../features/activity';
import { ProposalCard } from '../../features/ProposalCard';
import { activityClusters } from '../../domain/model';
export default function History() {
  const { s } = useUi();
  const { group: g, t } = useApp();
  const [filter, setFilter] = useState('all'),
    [member, setMember] = useState('all');
  if (!g) return null;
  const clusters = activityClusters(g).filter((cluster) =>
    (member === 'all' || (cluster.proposal?.author ?? cluster.latest.actor) === member) &&
    (filter === 'all' || cluster.proposal?.kind === filter),
  );
  const rejected = g.proposals.filter(
    (p) => p.status === 'rejected' && (member === 'all' || p.author === member),
  );
  return (
    <Page
      title={t('Aquí está la película.', 'Here’s the whole story.')}
      subtitle={t(
        'Los puntos que se suman, se aceptan y se canjean.',
        'Points added, accepted and redeemed.',
      )}
    >
      <View style={s.wrap}>
        {[
          ['all', t('Todo', 'All')],
          ['contribution', t('Aportaciones', 'Contributions')],
          ['redemption', t('Canjes', 'Redemptions')],
          ['debt_limit', t('Reglas', 'Rules')],
          ['rejected', t('Rechazadas', 'Rejected')],
        ].map(([key, label]) => (
          <Chip key={key} label={label} selected={filter === key} onPress={() => setFilter(key)} />
        ))}
      </View>
      <View style={s.wrap}>
        <Chip
          label={t('Todos', 'Everyone')}
          selected={member === 'all'}
          onPress={() => setMember('all')}
        />
        {g.members.map((m) => (
          <Chip
            key={m.id}
            label={m.name}
            selected={member === m.id}
            onPress={() => setMember(m.id)}
          />
        ))}
      </View>
      {filter === 'rejected' ? (
        rejected.length ? (
          rejected.map((p) => <ProposalCard key={p.id} proposal={p} />)
        ) : (
          <Empty
            title={t('Nada por aquí', 'Nothing here')}
            body={t(
              'No hay solicitudes rechazadas con estos filtros.',
              'No rejected proposals match these filters.',
            )}
          />
        )
      ) : clusters.length ? (
        <Card>
          {clusters.map((cluster) => (
            <ActivityClusterRow key={cluster.id} cluster={cluster} />
          ))}
        </Card>
      ) : (
        <Empty
          title={t('Una página en blanco', 'A blank page')}
          body={t(
            'La actividad que buscas aparecerá aquí.',
            'The activity you are looking for will appear here.',
          )}
        />
      )}
    </Page>
  );
}
