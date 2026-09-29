import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { Proposal, quorum } from '../domain/model';
import { useApp } from '../state/AppProvider';
import { Button, Card, Field, Txt, useUi } from '../components/ui';
import { VoterStates } from './VoterStates';
import { contributionPhotoUrl } from '../lib/contribution-photo';
export function ProposalCard({
  proposal: p,
  detail = false,
}: {
  proposal: Proposal;
  detail?: boolean;
}) {
  const { colors, s } = useUi();
  const { group: g, actor, t, execute, busy, language } = useApp();
  const [adjust, setAdjust] = useState(false),
    [confirmReject, setConfirmReject] = useState(false),
    [rejectReason, setRejectReason] = useState(''),
    [points, setPoints] = useState(String(p.points)),
    [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!p.photoPath) return;
    contributionPhotoUrl(p.photoPath).then((url) => {
      if (active) setPhotoUrl(url);
    }).catch(() => {});
    return () => { active = false; };
  }, [p.photoPath]);
  const votes = p.votes.filter((v) => v.revision === p.revision),
    own = p.author === actor,
    canVote = p.electorate.includes(actor) && !votes.some((v) => v.actor === actor);
  const kind =
    p.kind === 'debt_limit'
      ? t('REGLA DEL GRUPO', 'GROUP RULE')
      : p.kind === 'contribution'
      ? t('SUMAR PUNTOS', 'ADD POINTS')
      : p.kind === 'redemption'
        ? t('CANJE', 'REDEMPTION')
        : p.kind === 'reward_change'
          ? t('CAMBIO DE COSTE', 'COST CHANGE')
          : t('NUEVA OPCIÓN DE CANJE', 'NEW REDEMPTION OPTION');
  const author = g?.members.find((m) => m.id === p.author)?.name;
  const couple = g?.members.length === 2;
  const partner = g?.members.find((m) => m.id !== p.author)?.name ?? t('tu pareja', 'your partner');
  return (
    <Card>
      <View style={s.between}>
        <Txt style={s.eyebrow}>{kind}</Txt>
        <Txt style={{ fontSize: 22, fontWeight: '800', color: colors.green }}>{p.points} pt</Txt>
      </View>
      <Txt style={s.subtitle}>
        {p.status === 'pending'
          ? p.kind === 'debt_limit'
            ? t(`${author} propone un límite de ${p.points} puntos negativos`, `${author} suggests a ${p.points}-point negative balance limit`)
            : p.kind === 'contribution'
            ? t(
                `${author} quiere sumar ${p.points} puntos`,
                `${author} wants to add ${p.points} points`,
              )
            : p.kind === 'redemption'
              ? t(
                  `${author} quiere canjear ${p.points} puntos`,
                  `${author} wants to redeem ${p.points} points`,
                )
              : p.kind === 'reward'
                ? t(
                    `${author} quiere añadir un canje de ${p.points} puntos`,
                    `${author} wants to add a ${p.points}-point redemption option`,
                  )
                : t(
                    `${author} propone un coste de ${p.points} puntos`,
                    `${author} suggests a cost of ${p.points} points`,
                  )
          : p.title}
      </Txt>
      {p.status === 'pending' && <Txt>{p.title}</Txt>}
      {p.status === 'pending' && (
        <Txt style={s.muted}>
          {own && p.adjustment
            ? t(
                'Te han propuesto otra cantidad. Acéptala o mantén tus puntos.',
                'Someone suggested another amount. Accept it or keep your points.',
              )
            : p.adjustment
              ? t(
                  couple ? `Esperando a que ${author} acepte los ${p.adjustment.points} puntos.` : 'Esperando a que quien lo pidió revise la nueva cantidad.',
                  couple ? `Waiting for ${author} to accept ${p.adjustment.points} points.` : 'Waiting for the requester to review the new amount.',
                )
              : own
                ? t(
                    couple ? `Esperando a que ${partner} acepte.` : 'Esperando a que el resto del grupo acepte.',
                    couple ? `Waiting for ${partner} to accept.` : 'Waiting for the other members to accept.',
                  )
                : canVote
                  ? p.kind === 'debt_limit'
                    ? t('Te toca revisar: acepta o rechaza el nuevo límite.', 'Your turn: accept or reject the new limit.')
                    : p.kind === 'redemption'
                    ? t(
                        'Te toca revisar: acepta o rechaza el canje.',
                        'Your turn to review: accept or reject the redemption.',
                      )
                    : t(
                        'Te toca revisar: acepta, rechaza o propone puntos.',
                        'Your turn to review: accept, reject or suggest points.',
                      )
                  : t(
                      'Ya has respondido o esta solicitud no necesita tu voto.',
                      'You have already responded or this request does not need your vote.',
                    )}
        </Txt>
      )}
      <Txt style={s.muted}>
        {author} · {new Date(`${p.date}T12:00:00`).toLocaleDateString(language)}
        {p.category ? ` · ${p.category}` : ''}
      </Txt>
      {!!p.note && <Txt>{p.note}</Txt>}
      {photoUrl && <Image source={{ uri: photoUrl }} style={{ width: '100%', height: 190, borderRadius: 14 }} resizeMode="cover" />}
      {!couple && <Txt style={{ fontSize: 13, fontWeight: '600' }}>
        {t(
          `${votes.filter((v) => v.choice === 'approve').length} de ${quorum(p.electorate)} aprobaciones`,
          `${votes.filter((v) => v.choice === 'approve').length} of ${quorum(p.electorate)} approvals`,
        )}{' '}
        · {t(`revisión ${p.revision}`, `revision ${p.revision}`)}
      </Txt>}
      {p.status === 'pending' && (
        <>
          {p.electorate.length === 0 && (
            <Txt style={s.muted}>
              {t(
                'Invita a alguien al grupo y retira y vuelve a crear esta solicitud para que pueda votar.',
                'Invite someone, then withdraw and recreate this request so they can vote.',
              )}
            </Txt>
          )}
          {p.adjustment ? (
            <View style={{ backgroundColor: colors.peach, padding: 14, borderRadius: 12, gap: 10 }}>
              <Txt>
                {t(
                  `${g?.members.find((m) => m.id === p.adjustment!.actor)?.name} propone ${p.adjustment.points} puntos.`,
                  `${g?.members.find((m) => m.id === p.adjustment!.actor)?.name} suggests ${p.adjustment.points} points.`,
                )}
              </Txt>
              {own ? (
                <>
                  <Button
                    label={couple ? t('Aceptar los nuevos puntos', 'Accept the new points') : t('Aceptar ajuste y volver a votar', 'Accept adjustment and vote again')}
                    disabled={busy}
                    onPress={() =>
                      execute({ type: 'accept_adjustment', id: p.id, revision: p.revision })
                    }
                  />
                  <Button
                    label={t('Mantener mis puntos', 'Keep my points')}
                    variant="secondary"
                    disabled={busy}
                    onPress={() =>
                      execute({ type: 'decline_adjustment', id: p.id, revision: p.revision })
                    }
                  />
                </>
              ) : (
                <Txt style={s.muted}>
                  {t(couple ? `Esperando la respuesta de ${author}.` : 'Esperando la respuesta del autor.', couple ? `Waiting for ${author} to respond.` : 'Waiting for the author to respond.')}
                </Txt>
              )}
            </View>
          ) : canVote ? (
            <>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('Aceptar', 'Accept')}
                    icon="checkmark"
                    disabled={busy}
                    onPress={() =>
                      execute({ type: 'vote', id: p.id, revision: p.revision, choice: 'approve' })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('Rechazar', 'Reject')}
                    variant="secondary"
                    disabled={busy}
                    onPress={() => setConfirmReject(true)}
                  />
                </View>
              </View>
              {confirmReject && (
                <View style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.negativeBg }}>
                  <Txt style={{ fontWeight: '700' }}>{t('¿Rechazar esta solicitud?', 'Reject this request?')}</Txt>
                  <Txt style={s.muted}>{t('Puedes dejar un motivo breve. Tu decisión quedará en el historial y podrás deshacerla.', 'You can add a short reason. Your decision will stay in the history and you can undo it.')}</Txt>
                  <Field label={t('Motivo (opcional)', 'Reason (optional)')} value={rejectReason} onChangeText={setRejectReason} maxLength={200} />
                  <Button label={t('Confirmar rechazo', 'Confirm rejection')} disabled={busy} onPress={async () => {
                    if (await execute({ type: 'vote', id: p.id, revision: p.revision, choice: 'reject', reason: rejectReason })) {
                      setConfirmReject(false);
                      setRejectReason('');
                    }
                  }} />
                  <Button label={t('Cancelar', 'Cancel')} variant="ghost" onPress={() => setConfirmReject(false)} />
                </View>
              )}
            </>
          ) : (
            !own && (
              <Txt style={s.muted}>
                {votes.some((v) => v.actor === actor)
                  ? t('Tu voto está registrado.', 'Your vote is recorded.')
                  : t('No formas parte de esta votación.', 'You are not part of this vote.')}
              </Txt>
            )
          )}
          {!own && p.electorate.includes(actor) && p.kind !== 'redemption' && p.kind !== 'debt_limit' && !p.adjustment && (
            <Button
              label={t('Proponer puntos', 'Suggest points')}
              variant="ghost"
              onPress={() => setAdjust(!adjust)}
              disabled={busy}
            />
          )}
          {adjust && !p.adjustment && (
            <>
              <Field
                label={t('Puntos propuestos', 'Suggested points')}
                value={points}
                onChangeText={setPoints}
                keyboardType="number-pad"
              />
              <Button
                label={t('Enviar ajuste', 'Send adjustment')}
                disabled={busy}
                onPress={async () => {
                  if (
                    await execute({
                      type: 'adjust',
                      id: p.id,
                      revision: p.revision,
                      points: Number(points),
                    })
                  )
                    setAdjust(false);
                }}
              />
            </>
          )}
          {own && (
            <Button
              label={t('Retirar solicitud', 'Withdraw request')}
              variant="ghost"
              disabled={busy}
              onPress={() => execute({ type: 'withdraw', id: p.id, revision: p.revision })}
            />
          )}
        </>
      )}
      <VoterStates proposal={p} />
      {votes.filter((v) => v.choice === 'reject' && v.reason).map((v) => (
        <Txt key={v.actor} style={s.muted}>{g?.members.find((m) => m.id === v.actor)?.name}: {v.reason}</Txt>
      ))}
      {detail && p.retractedVotes?.map((v, index) => (
        <Txt key={`${v.actor}-${index}`} style={s.muted}>
          {t(`${g?.members.find((m) => m.id === v.actor)?.name ?? 'Alguien'} retiró un rechazo`, `${g?.members.find((m) => m.id === v.actor)?.name ?? 'Someone'} undid a rejection`)}{v.reason ? `: ${v.reason}` : ''}
        </Txt>
      ))}
      {(p.status === 'rejected' || p.status === 'pending') && votes.some((v) => v.actor === actor && v.choice === 'reject') && (
        <Button label={t('Deshacer mi rechazo', 'Undo my rejection')} variant="secondary" disabled={busy} onPress={() => execute({ type: 'undo_reject', id: p.id, revision: p.revision })} />
      )}
      {!detail && (
        <Button
          label={t('Ver detalle', 'View details')}
          variant="ghost"
          onPress={() => router.navigate({ pathname: '/proposal', params: { id: p.id } })}
        />
      )}
      {p.status !== 'pending' && (
        <Txt style={{ fontWeight: '600' }}>
          {p.status === 'approved'
            ? t('Aprobada', 'Approved')
            : p.status === 'rejected'
              ? t('Rechazada', 'Rejected')
              : t('Retirada', 'Withdrawn')}
        </Txt>
      )}
      {p.status === 'rejected' && own && p.kind === 'contribution' && (
        <Button
          label={t('Corregir y reenviar', 'Edit and resubmit')}
          variant="secondary"
          onPress={() => router.push({ pathname: '/contribute', params: { id: p.id } })}
        />
      )}
      {detail && p.votes.some((v) => v.revision !== p.revision) && (
        <Txt style={s.muted}>
          {t(
            'Los votos de revisiones anteriores se conservan en el historial.',
            'Votes on previous revisions remain in the history.',
          )}
        </Txt>
      )}
    </Card>
  );
}
