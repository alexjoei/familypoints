import { useState } from 'react';
import { View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useApp } from '../../state/AppProvider';
import { balance, Proposal, rewardCost } from '../../domain/model';
import { Button, Card, Empty, Field, Icon, Page, Txt, useUi } from '../../components/ui';
export default function Rewards() {
  const { colors, s } = useUi();
  const { group: g, actor, t, execute, busy } = useApp();
  const [form, setForm] = useState(false),
    [title, setTitle] = useState(''),
    [points, setPoints] = useState('30'),
    [change, setChange] = useState<Proposal | null>(null),
    [confirm, setConfirm] = useState<Proposal | null>(null);
  const [formId, setFormId] = useState(() => Crypto.randomUUID());
  const [redemptionId, setRedemptionId] = useState(() => Crypto.randomUUID());
  if (!g) return null;
  const rewards = g.proposals.filter((p) => p.kind === 'reward' && p.status === 'approved'),
    b = balance(g, actor);
  return (
    <Page
      title={t('Canjear puntos', 'Redeem points')}
      subtitle={t(
        'Pide el canje. Cuando tu pareja lo acepte, los puntos se descuentan solos.',
        'Request a redemption. Once your partner approves it, your points are deducted automatically.',
      )}
    >
      <Card style={{ backgroundColor: colors.mint, borderColor: colors.mint }}>
        <View style={s.between}>
          <View>
            <Txt style={s.label}>{t('Puntos disponibles', 'Available points')}</Txt>
            <Txt style={{ fontSize: 32, lineHeight: 38, fontWeight: '800' }}>{b.available} pt</Txt>
          </View>
          <Icon name="gift-outline" size={40} />
        </View>
        {b.reserved > 0 && (
          <Txt style={s.muted}>
            {b.reserved} {t('puntos reservados', 'points reserved')}
          </Txt>
        )}
        <Txt style={s.muted}>
          {(g.debtLimit ?? 0) > 0
            ? t(`Podéis llegar hasta -${g.debtLimit} pt.`, `You can go down to -${g.debtLimit} pt.`)
            : t('Por ahora, solo puedes canjear los puntos que tienes.', 'For now, you can only redeem points you have.')}
        </Txt>
      </Card>
      <Button
        label={t('Canjear puntos', 'Redeem points')}
        icon="add"
        variant="secondary"
        onPress={() => {
          setForm(!form);
          setChange(null);
          setTitle('');
          setPoints('30');
          setFormId(Crypto.randomUUID());
        }}
      />
      {form && (
        <Card>
          <Txt style={s.subtitle}>
            {change
              ? t('Proponer nuevo coste', 'Propose new cost')
              : t('¿Qué os apetece?', 'What sounds good?')}
          </Txt>
          <Field
            label={t('¿En qué quieres canjear puntos?', 'What do you want to redeem points for?')}
            value={change?.title ?? title}
            editable={!change}
            onChangeText={setTitle}
            maxLength={100}
            placeholder={t('Yo elijo la película', 'I pick the movie')}
          />
          <Field
            label={t('Coste en puntos', 'Cost in points')}
            value={points}
            onChangeText={setPoints}
            keyboardType="number-pad"
          />
          <Button
            label={t('Pedir al grupo acordar el coste', 'Ask the group to agree on the cost')}
            loading={busy}
            onPress={async () => {
              if (
                await execute({
                  type: 'submit',
                  id: formId,
                  kind: change ? 'reward_change' : 'reward',
                  title: change?.title ?? title,
                  points: Number(points),
                  category: '',
                  note: '',
                  date: new Date().toLocaleDateString('sv-SE'),
                  rewardId: change?.id,
                })
              ) {
                setForm(false);
                setChange(null);
                setFormId(Crypto.randomUUID());
                router.push('/(tabs)/pending');
              }
            }}
          />
          <Button label={t('Cancelar', 'Cancel')} variant="ghost" onPress={() => setForm(false)} />
        </Card>
      )}
      {!rewards.length && (
        <>
          <Empty
            title={t('Algo bueno está por venir', 'Something good is coming')}
            body={t(
              'Añade en qué quieres canjear puntos. Primero acordáis el coste; después puedes pedir el canje.',
              'Add what you want to redeem points for. First agree on the cost; then request the redemption.',
            )}
            icon="gift-outline"
          />
          {[
            [t('Yo elijo la película', 'I pick the movie'), 30],
            [t('Una noche sin cocinar', 'A night off cooking'), 50],
            [t('Noche libre', 'A free evening'), 100],
          ].map(([name, cost]) => (
            <Button
              key={name}
              label={`${name} · ${cost} pt`}
              variant="secondary"
              onPress={() => {
                setTitle(String(name));
                setPoints(String(cost));
                setForm(true);
                setChange(null);
              }}
            />
          ))}
        </>
      )}
      {rewards.map((r, i) => {
        const cost = rewardCost(g, r);
        return (
          <Card key={r.id}>
            <View style={s.between}>
              <View style={[s.iconCircle, { backgroundColor: i % 2 ? colors.peach : colors.mint }]}>
                <Icon
                  name={
                    i % 3 === 0
                      ? 'film-outline'
                      : i % 3 === 1
                        ? 'restaurant-outline'
                        : 'moon-outline'
                  }
                  size={28}
                />
              </View>
              <Txt style={{ fontSize: 24, fontWeight: '800' }}>{cost} pt</Txt>
            </View>
            <Txt style={s.subtitle}>{r.title}</Txt>
            <Txt style={s.muted}>
              {t(
                'Coste acordado. Pide el canje para que el resto lo acepte.',
                'Agreed cost. Request a redemption for the others to approve.',
              )}
            </Txt>
            <Button
              label={
                b.available - cost >= -(g.debtLimit ?? 0)
                  ? t('Canjear puntos', 'Redeem points')
                  : t(
                      `Te faltan ${cost - b.available - (g.debtLimit ?? 0)} puntos`,
                      `${cost - b.available - (g.debtLimit ?? 0)} more points to go`,
                    )
              }
              disabled={b.available - cost < -(g.debtLimit ?? 0) || busy}
              onPress={() => {
                setConfirm(r);
                setRedemptionId(Crypto.randomUUID());
              }}
            />
            <Button
              label={t('Proponer otro coste', 'Propose another cost')}
              variant="ghost"
              onPress={() => {
                setChange(r);
                setPoints(String(cost));
                setForm(true);
                setFormId(Crypto.randomUUID());
              }}
            />
            {confirm?.id === r.id && (
              <View style={{ gap: 10, padding: 14, backgroundColor: colors.bg, borderRadius: 14 }}>
                <Txt>
                  {t(
                    `Se reservarán ${cost} puntos. Si lo aceptan, quedará canjeado y se descontarán de tu saldo.`,
                    `${cost} points will be reserved. If approved, the redemption is complete and the points leave your balance.`,
                  )}
                </Txt>
                <Button
                  label={t('Pedir canje al grupo', 'Request redemption')}
                  loading={busy}
                  onPress={async () => {
                    if (
                      await execute({
                        type: 'submit',
                        id: redemptionId,
                        kind: 'redemption',
                        title: r.title,
                        points: cost,
                        category: '',
                        date: new Date().toLocaleDateString('sv-SE'),
                        note: '',
                        rewardId: r.id,
                      })
                    ) {
                      setConfirm(null);
                      router.push('/(tabs)/pending');
                    }
                  }}
                />
                <Button
                  label={t('Ahora no', 'Not now')}
                  variant="ghost"
                  onPress={() => setConfirm(null)}
                />
              </View>
            )}
          </Card>
        );
      })}
    </Page>
  );
}
