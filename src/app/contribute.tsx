import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Button, Card, Chip, Field, Page, Txt, useUi } from '../components/ui';
import { useApp } from '../state/AppProvider';
import { chooseContributionPhoto, uploadContributionPhoto } from '../lib/contribution-photo';
import { DatePicker } from '../components/DatePicker';

export default function Contribute() {
  const { s, colors } = useUi();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { group: g, actor, demo, execute, busy, t, report } = useApp();
  const existing = g?.proposals.find((p) => p.id === id);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [points, setPoints] = useState(String(existing?.points ?? 15));
  const [category, setCategory] = useState(existing?.category ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.date ?? new Date().toLocaleDateString('sv-SE'));
  const [showIdeas, setShowIdeas] = useState(false);
  const [more, setMore] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [requestId] = useState(() => Crypto.randomUUID());
  if (!g) return <Redirect href="/" />;
  const ideas = g.templates.filter((tp) => !title.trim() || tp.title.toLocaleLowerCase().includes(title.toLocaleLowerCase())).slice(0, 3);
  const send = async () => {
    setSending(true);
    try {
      const photoPath = !existing && photoUri
        ? demo ? photoUri : await uploadContributionPhoto(g.id, actor, requestId, photoUri)
        : undefined;
      const ok = await execute(existing
        ? { type: 'resubmit', id: existing.id, revision: existing.revision, title, points: Number(points), note }
        : { type: 'submit', id: requestId, kind: 'contribution', title, points: Number(points), category, date, note, photoPath });
      if (ok) router.replace('/(tabs)/pending');
    } catch (e) { report(e); }
    finally { setSending(false); }
  };
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Page
      title={existing ? t('Vamos con otra versión', 'Let’s give it another go') : t('Sumar puntos', 'Add points')}
      subtitle={t('Cuenta qué hiciste y pide esos puntos. Tu pareja o grupo los acepta después.', 'Say what you did and ask for the points. Your partner or group accepts them later.')}
      action={<Button label={t('Cerrar', 'Close')} variant="ghost" onPress={() => router.back()} />}
    >
      <Card>
        <Field label={t('¿Qué has hecho?', 'What did you do?')} value={title} onChangeText={(value) => { setTitle(value); setShowIdeas(true); }} onFocus={() => setShowIdeas(true)} maxLength={100} placeholder={t('He hecho la cena', 'I made dinner')} />
        {!existing && showIdeas && ideas.length > 0 && <View style={{ gap: 4 }}>
          <Txt style={s.muted}>{t('Ideas del grupo (solo rellenan el texto)', 'Group ideas (fill in the text only)')}</Txt>
          <View style={s.wrap}>{ideas.map((idea) => <Chip key={idea.id} label={idea.title} selected={false} onPress={() => { setTitle(idea.title); setShowIdeas(false); }} />)}</View>
        </View>}
        <Field label={t('¿Cuántos puntos?', 'How many points?')} value={points} onChangeText={setPoints} keyboardType="number-pad" />
      </Card>
      <Button label={t(more ? 'Ocultar opciones' : 'Más opciones', more ? 'Hide options' : 'More options')} variant="ghost" icon={more ? 'chevron-up' : 'chevron-down'} onPress={() => setMore(!more)} />
      {more && <Card>
        {!existing && <>
          <Txt style={s.label}>{t('Categoría (opcional)', 'Category (optional)')}</Txt>
          <View style={s.wrap}><Chip label={t('Ninguna', 'None')} selected={!category} onPress={() => setCategory('')} />{g.categories.map((c) => <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />)}</View>
          <DatePicker value={date} onChange={setDate} />
        </>}
        <Field label={t('Nota (opcional)', 'Note (optional)')} value={note} onChangeText={setNote} multiline maxLength={1000} />
        {!existing && <>
          <Button label={t(photoUri ? 'Cambiar foto' : 'Añadir foto', photoUri ? 'Change photo' : 'Add photo')} icon="image-outline" variant="secondary" onPress={async () => { try { const uri = await chooseContributionPhoto(); if (uri) setPhotoUri(uri); } catch (e) { report(e); } }} />
          {photoUri && <Image source={{ uri: photoUri }} style={{ width: '100%', height: 180, borderRadius: 14 }} resizeMode="cover" />}
          {photoUri && <Button label={t('Quitar foto', 'Remove photo')} variant="ghost" onPress={() => setPhotoUri(null)} />}
        </>}
      </Card>}
      <Txt style={s.muted}>{t('Los puntos se suman cuando el resto acepta la solicitud.', 'Points are added when the others accept your request.')}</Txt>
    </Page>
    <View style={{ paddingHorizontal: 22, paddingVertical: 10, backgroundColor: colors.bg }}>
      <Button label={existing ? t('Reenviar solicitud', 'Resubmit request') : t('Solicitar puntos', 'Request points')} loading={busy || sending} disabled={!title.trim() || !Number.isInteger(Number(points)) || Number(points) < 1 || Number(points) > 100000} onPress={send} />
    </View>
  </KeyboardAvoidingView>;
}
