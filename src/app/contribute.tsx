import { useState } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Button, Card, Chip, Field, Page, Txt, useUi } from '../components/ui';
import { useApp } from '../state/AppProvider';
export default function Contribute() {
  const { s } = useUi();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { group: g, execute, busy, t } = useApp();
  const existing = g?.proposals.find((p) => p.id === id);
  const [title, setTitle] = useState(existing?.title ?? ''),
    [points, setPoints] = useState(String(existing?.points ?? 15)),
    [category, setCategory] = useState(existing?.category ?? g?.categories[0] ?? ''),
    [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.date ?? new Date().toLocaleDateString('sv-SE')),
    [templateId, setTemplate] = useState<string | undefined>(existing?.templateId);
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
          <Txt style={s.subtitle}>{t('Tira de ideas', 'Need an idea?')}</Txt>
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
                }}
              />
            ))}
          </View>
          <Txt style={s.muted}>
            {t(
              'Sugerencias de vuestro grupo. Puedes proponer otro valor.',
              'Your group’s suggestions. You can propose another value.',
            )}
          </Txt>
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
              }}
            />
          ))}
        </View>
        <Field
          label={t('Puntos propuestos', 'Suggested points')}
          value={points}
          onChangeText={setPoints}
          keyboardType="number-pad"
        />
        <Field
          label={t('Fecha (AAAA-MM-DD)', 'Date (YYYY-MM-DD)')}
          value={date}
          onChangeText={setDate}
          editable={!existing}
          maxLength={10}
        />
        <Field
          label={t('Nota opcional', 'Optional note')}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={1000}
          placeholder={t('El contexto también cuenta.', 'Context counts too.')}
        />
      </Card>
      <Button
        label={
          existing
            ? t('Reenviar al grupo', 'Resubmit to group')
            : t('Pedir que acepten mis puntos', 'Ask to accept my points')
        }
        loading={busy}
        disabled={!title.trim()}
        onPress={async () => {
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
                },
          );
          if (ok) router.replace('/(tabs)/pending');
        }}
      />
      <Txt style={s.muted}>
        {t(
          'Los puntos se suman cuando la mayoría de los demás miembros aprueba.',
          'Points are added when a majority of the other members approves.',
        )}
      </Txt>
    </Page>
  );
}
