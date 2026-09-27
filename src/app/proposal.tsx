import { useEffect } from 'react';
import { Redirect, router, useLocalSearchParams, useIsFocused } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { Button, Card, Page, Txt, useUi } from '../components/ui';
import { ProposalCard } from '../features/ProposalCard';
import { ActivityRow } from '../features/activity';
export default function Detail() {
  const { s } = useUi();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { group, t, actor, markSeen } = useApp();
  const focused = useIsFocused();
  const p = group?.proposals.find((p) => p.id === id);
  const revision = p?.revision;
  useEffect(() => {
    if (focused && id && revision) void markSeen(id, revision).catch(() => {});
  }, [focused, id, revision, actor, markSeen]);
  if (!group) return <Redirect href="/" />;
  return (
    <Page
      title={t('El acuerdo, al detalle', 'The agreement, in detail')}
      action={
        <Button
          label={t('Volver', 'Back')}
          variant="ghost"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/history'))}
        />
      }
    >
      {p ? (
        <>
          <ProposalCard proposal={p} detail />
          {p.history?.map((old) => (
            <Card key={old.revision}>
              <Txt style={s.eyebrow}>
                {t(`REVISIÓN ${old.revision}`, `REVISION ${old.revision}`)}
              </Txt>
              <Txt style={s.subtitle}>
                {old.title} · {old.points} pt
              </Txt>
              {!!old.note && <Txt>{old.note}</Txt>}
              {old.votes
                .filter((v) => v.revision === old.revision)
                .map((v) => (
                  <Txt key={v.actor}>
                    {group.members.find((m) => m.id === v.actor)?.name}:{' '}
                    {v.choice === 'approve' ? t('a favor', 'approve') : t('en contra', 'reject')}
                  </Txt>
                ))}
            </Card>
          ))}
          <Txt style={s.subtitle}>{t('Registro de decisiones', 'Decision history')}</Txt>
          <Card>
            {group.activity
              .filter((e) => e.proposalId === id)
              .reverse()
              .map((e) => (
                <ActivityRow key={e.id} item={{ ...e, proposalId: undefined }} />
              ))}
          </Card>
        </>
      ) : (
        <Txt>{t('No encontramos esta solicitud.', 'We could not find this proposal.')}</Txt>
      )}
    </Page>
  );
}
