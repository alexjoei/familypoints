import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Button, Card, Chip, Field, Page, Txt, useUi } from '../components/ui';
import { useApp } from '../state/AppProvider';

export default function Grant() {
  const { s } = useUi();
  const { group, actor, execute, busy, t } = useApp();
  const others = group?.members.filter((m) => m.id !== actor) ?? [];
  const [recipient, setRecipient] = useState(others.length === 1 ? others[0].id : '');
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('10');
  const [requestId] = useState(() => Crypto.randomUUID());
  if (!group) return <Redirect href="/" />;
  return <Page title={t('Otorgar puntos', 'Give points')} subtitle={t('Dale puntos a otra persona por algo que ha hecho. Se suman al momento, sin pedir aprobación.', 'Give someone points for something they did. They are added instantly, with no approval needed.')} action={<Button label={t('Cerrar', 'Close')} variant="ghost" onPress={() => router.back()} />}>
    <Card>
      <Txt style={s.label}>{t('¿A quién?', 'Who gets them?')}</Txt>
      {others.length === 0 ? <Txt>{t('Comparte tu grupo para poder otorgar puntos.', 'Invite someone before giving points.')}</Txt> : <>{others.map((m) => <Chip key={m.id} label={m.name} selected={recipient === m.id} onPress={() => setRecipient(m.id)} />)}</>}
      <Field label={t('¿Por qué?', 'What for?')} value={title} onChangeText={setTitle} maxLength={100} placeholder={t('Por salvar la cena', 'For saving dinner')} />
      <Field label={t('¿Cuántos puntos?', 'How many points?')} value={points} onChangeText={setPoints} keyboardType="number-pad" />
      <Button label={t('Otorgar puntos', 'Give points')} loading={busy} disabled={!recipient || !title.trim() || !Number.isInteger(Number(points)) || Number(points) < 1 || Number(points) > 100000} onPress={async () => {
        if (await execute({ type: 'grant', id: requestId, recipient, title, points: Number(points) })) router.replace('/(tabs)/home');
      }} />
    </Card>
    <Txt style={s.muted}>{t('Estos puntos son nuevos: no salen de tu saldo. Quedará registrado quién los otorgó.', 'These are new points; they do not come out of your balance. The giver is recorded.')}</Txt>
  </Page>;
}
