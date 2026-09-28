import { useState } from 'react';
import { Image, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Button, Card, Chip, Field, Page, Txt, useUi } from '../components/ui';
import { useApp } from '../state/AppProvider';
import { chooseContributionPhoto, uploadContributionPhoto } from '../lib/contribution-photo';
import { DatePicker } from '../components/DatePicker';
export default function Contribute() {
  const { s } = useUi();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { group: g, actor, demo, execute, busy, t, report } = useApp();
  const existing = g?.proposals.find((p) => p.id === id);
  const [title, setTitle] = useState(existing?.title ?? ''),
    [points, setPoints] = useState(String(existing?.points ?? 15)),
    [category, setCategory] = useState(existing?.category ?? g?.categories[0] ?? ''),
    [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.date ?? new Date().toLocaleDateString('sv-SE')),
    [templateId, setTemplate] = useState<string | undefined>(existing?.templateId),
    [showIdeas, setShowIdeas] = useState(false),
    [showCategories, setShowCategories] = useState(false),
    [photoUri, setPhotoUri] = useState<string | null>(null),
    [sending, setSending] = useState(false);
  const [requestId] = useState(() => Crypto.randomUUID());
  if (!g) return <Redirect href="/" />;
  return (
    <Page
      title={
        existing
          ? t('Vamos con otra versión', 'Let’s give it another go')
          : t('Sumar puntos', 'Add points')
      }
      subtitle={t(
        'Cuenta qué has hecho. Tu pareja o el resto del grupo debe aceptar los puntos antes de que se sumen.',
        'Say what you did. Your partner or the other members must accept the points before they are added.',
      )}
      action={<Button label={t('Cerrar', 'Close')} variant="ghost" onPress={() => router.back()} />}
    >
      {!existing && (
        <>
          <Button
            label={t(showIdeas ? 'Ocultar ideas' : 'Usar una idea del grupo', showIdeas ? 'Hide ideas' : 'Use a group idea')}
            variant="secondary"
            icon={showIdeas ? 'chevron-up' : 'sparkles-outline'}
            onPress={() => setShowIdeas(!showIdeas)}
          />
          {showIdeas && (
            <View style={s.wrap}>
              {g.templates.map((tp) => (
                <Chip
                  key={tp.id}
                  label={`${tp.title} · ${tp.points}`}
                  selected={templateId === tp.id}
                  onPress={() => {
                    setTitle(tp.title);
                    setPoints(String(tp.points));
                    setCategory(tp.category);
                    setTemplate(tp.id);
                    setShowIdeas(false);
                  }}
                />
              ))}
            </View>
          )}
        </>
      )}
      <Card>
        <Field
          label={t('¿Qué has hecho?', 'What did you do?')}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          placeholder={t('He hecho la cena', 'I made dinner')}
        />
        <Txt style={s.label}>{t('Categoría', 'Category')}</Txt>
        <Button
          label={category || t('Elige categoría', 'Choose a category')}
          icon={showCategories ? 'chevron-up' : 'chevron-down'}
          variant="secondary"
          onPress={() => setShowCategories(!showCategories)}
        />
        {showCategories && (
          <View style={s.wrap}>
            {g.categories.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={category === c}
                onPress={() => {
                  if (!existing) {
                    setCategory(c);
                    setTemplate(undefined);
                  }
                  setShowCategories(false);
                }}
              />
            ))}
          </View>
        )}
        <Field
          label={t('Puntos propuestos', 'Suggested points')}
          value={points}
          onChangeText={setPoints}
          keyboardType="number-pad"
        />
        <DatePicker value={date} onChange={setDate} disabled={!!existing} />
        <Field
          label={t('Nota opcional', 'Optional note')}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={1000}
          placeholder={t('El contexto también cuenta.', 'Context counts too.')}
        />
        {!existing && (
          <View style={{ gap: 10 }}>
            <Button
              label={t(photoUri ? 'Cambiar foto' : 'Añadir foto (opcional)', photoUri ? 'Change photo' : 'Add photo (optional)')}
              icon="image-outline"
              variant="secondary"
              onPress={async () => {
                try {
                  const uri = await chooseContributionPhoto();
                  if (uri) setPhotoUri(uri);
                } catch (e) { report(e); }
              }}
            />
            {photoUri && (
              <>
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: 180, borderRadius: 14 }} resizeMode="cover" />
                <Button label={t('Quitar foto', 'Remove photo')} variant="ghost" onPress={() => setPhotoUri(null)} />
              </>
            )}
            <Txt style={s.muted}>{t('Una foto pequeña basta. Solo la verá tu grupo.', 'A small photo is enough. Only your group can see it.')}</Txt>
          </View>
        )}
      </Card>
      <Button
        label={
          existing
            ? t('Reenviar al grupo', 'Resubmit to group')
            : t('Pedir que acepten mis puntos', 'Ask to accept my points')
        }
        loading={busy || sending}
        disabled={!title.trim() || !category}
        onPress={async () => {
          setSending(true);
          try {
          const photoPath = !existing && photoUri
            ? demo ? photoUri : await uploadContributionPhoto(g.id, actor, requestId, photoUri)
            : undefined;
          const ok = await execute(
            existing
              ? {
                  type: 'resubmit',
                  id: existing.id,
                  revision: existing.revision,
                  title,
                  points: Number(points),
                  note,
                }
              : {
                  type: 'submit',
                  id: requestId,
                  kind: 'contribution',
                  title,
                  points: Number(points),
                  category,
                  date,
                  note,
                  templateId,
                  photoPath,
                },
          );
          if (ok) router.replace('/(tabs)/pending');
          } catch (e) { report(e); }
          finally { setSending(false); }
        }}
      />
      <Txt style={s.muted}>
        {t(
          g.members.length === 2
            ? 'Los puntos se suman cuando tu pareja los acepta.'
            : 'Los puntos se suman cuando la mayoría de los demás miembros aprueba.',
          g.members.length === 2
            ? 'Your points are added when your partner accepts them.'
            : 'Points are added when a majority of the other members approves.',
        )}
      </Txt>
    </Page>
  );
}
