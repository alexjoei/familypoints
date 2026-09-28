import { useState } from 'react';
import { Switch, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { Button, Card, Chip, Field, Page, Txt, useUi } from '../../components/ui';
import { useApp } from '../../state/AppProvider';
import { Template } from '../../domain/model';
import { ThemePicker } from '../../components/ThemePicker';
export default function Settings() {
  const { colors, s } = useUi();
  const app = useApp(),
    { group: g, t } = app;
  const [category, setCategory] = useState(''),
    [edit, setEdit] = useState<Template | null>(null),
    [working, setWorking] = useState(false);
  if (!g) return null;
  const run = async (fn: () => Promise<unknown>) => {
    setWorking(true);
    try {
      await fn();
    } catch (e) {
      app.report(e);
    } finally {
      setWorking(false);
    }
  };
  const owner = app.actor === g.owner;
  return (
    <Page
      title={g.name}
      subtitle={t(
        'Tu grupo. Vuestras reglas. Cero solemnidad.',
        'Your crew. Your rules. Zero ceremony.',
      )}
    >
      {app.actor === g.owner && !app.demo && (
        <Card style={{ backgroundColor: colors.mint }}>
          <Txt style={s.subtitle}>{t('Compartir grupo', 'Share group')}</Txt>
          <Txt>{t('Tu código de invitación, a un toque.', 'Your invitation code, one tap away.')}</Txt>
          <Button
            label={t('Compartir grupo', 'Share group')}
            icon="share-social-outline"
            onPress={() => router.push('/share')}
          />
        </Card>
      )}
      <ThemePicker />
      {app.demo && (
        <Card style={{ backgroundColor: colors.peach }}>
          <Txt style={{ fontWeight: '700' }}>
            {t('Modo prueba: sin líos', 'Demo mode: no strings')}
          </Txt>
          <Txt>
            {t(
              'Los datos se guardan solo aquí. Cambia de persona para probar los votos.',
              'Data is saved only here. Switch people to try voting.',
            )}
          </Txt>
          <View style={s.wrap}>
            {g.members.map((m) => (
              <Chip
                key={m.id}
                label={m.name}
                selected={m.id === app.actor}
                onPress={() => app.switchActor(m.id)}
              />
            ))}
          </View>
        </Card>
      )}
      <Card>
        <Txt style={s.subtitle}>{t('Miembros', 'Members')}</Txt>
        {g.members.map((m) => (
          <View style={s.between} key={m.id}>
            <Txt>{m.name}</Txt>
            <Txt style={s.muted}>
              {m.id === g.owner
                ? t('Administra el grupo', 'Group administrator')
                : t('Miembro', 'Member')}
            </Txt>
          </View>
        ))}
      </Card>
      <Card>
        <Txt style={s.subtitle}>{t('Nuestros acuerdos', 'Our agreements')}</Txt>
        <Txt>
          {t(
            'Saldo individual · Sin deudas · Sin autovotos',
            'Individual balances · No debt · No self-voting',
          )}
        </Txt>
        <Txt style={s.muted}>
          {t(
            'Mayoría de los demás miembros. Cada solicitud conserva sus votantes; quienes se unan después votarán en las nuevas solicitudes. Los ajustes necesitan la aceptación del autor y nuevos votos.',
            'Majority of the other members. Each proposal keeps its voters; people joining later vote on new proposals. Adjustments need the author’s acceptance and new votes.',
          )}
        </Txt>
      </Card>
      <Card>
        <Txt style={s.subtitle}>{t('A tu manera', 'Your way')}</Txt>
        <View style={s.between}>
          <Txt>{t('Idioma de la app', 'App language')}</Txt>
          <View style={s.row}>
            <Chip
              label="ES"
              selected={app.language === 'es'}
              onPress={() => app.setLanguage('es')}
            />
            <Chip
              label="EN"
              selected={app.language === 'en'}
              onPress={() => app.setLanguage('en')}
            />
          </View>
        </View>
        <View style={s.between}>
          <View style={{ flex: 1 }}>
            <Txt>{t('Un poco de humor', 'A little humor')}</Txt>
            <Txt style={s.muted}>
              {t('Ligero, como una buena sobremesa.', 'Light, like a good after-dinner chat.')}
            </Txt>
          </View>
          <Switch
            accessibilityLabel={t('Un poco de humor', 'A little humor')}
            value={app.humor}
            onValueChange={app.setHumor}
            trackColor={{ true: colors.green }}
          />
        </View>
      </Card>
      <Card>
        <Txt style={s.subtitle}>{t('Categorías y sugerencias', 'Categories and suggestions')}</Txt>
        <View style={s.wrap}>
          {g.categories.map((c) => (
            <Chip key={c} label={c} />
          ))}
        </View>
        {owner && (
          <>
            <Field
              label={t('Nueva categoría', 'New category')}
              value={category}
              onChangeText={setCategory}
              maxLength={40}
            />
            <Button
              label={t('Añadir categoría', 'Add category')}
              variant="secondary"
              disabled={app.busy || !category.trim()}
              onPress={async () => {
                if (await app.execute({ type: 'category', title: category })) setCategory('');
              }}
            />
          </>
        )}
        {g.templates.map((tp) => (
          <View key={tp.id} style={s.between}>
            <View style={{ flex: 1 }}>
              <Txt>{tp.title}</Txt>
              <Txt style={s.muted}>
                {tp.category} · {tp.points} pt
              </Txt>
            </View>
            {owner && (
              <Button label={t('Editar', 'Edit')} variant="ghost" onPress={() => setEdit(tp)} />
            )}
          </View>
        ))}
        {owner && (
          <Button
            label={t('Nueva plantilla', 'New template')}
            variant="secondary"
            onPress={() =>
              setEdit({ id: Crypto.randomUUID(), title: '', category: g.categories[0], points: 15 })
            }
          />
        )}
        {edit && owner && (
          <View style={{ gap: 12 }}>
            <Field
              label={t('Nombre de plantilla', 'Template name')}
              value={edit.title}
              onChangeText={(title) => setEdit({ ...edit, title })}
              maxLength={100}
            />
            <Field
              label={t('Puntos sugeridos', 'Suggested points')}
              value={String(edit.points || '')}
              onChangeText={(v) => setEdit({ ...edit, points: Number(v) })}
              keyboardType="number-pad"
            />
            <View style={s.wrap}>
              {g.categories.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={edit.category === c}
                  onPress={() => setEdit({ ...edit, category: c })}
                />
              ))}
            </View>
            <Button
              label={t('Guardar plantilla', 'Save template')}
              disabled={app.busy}
              onPress={async () => {
                if (await app.execute({ type: 'template', ...edit })) setEdit(null);
              }}
            />
            <Button label={t('Cancelar', 'Cancel')} variant="ghost" onPress={() => setEdit(null)} />
          </View>
        )}
      </Card>
      {!app.demo && (
        <Button
          label={t('Cambiar o añadir grupo', 'Switch or add group')}
          variant="secondary"
          disabled={app.busy || working}
          onPress={() => run(app.openGroups)}
        />
      )}
      <Button
        label={app.demo ? t('Salir de la demo', 'Exit demo') : t('Cerrar sesión', 'Sign out')}
        variant="secondary"
        disabled={app.busy || working}
        onPress={() => run(app.exit)}
      />
      <Txt style={{ textAlign: 'center', fontSize: 12, color: colors.muted }}>
        Family Points · 0.1.4
      </Txt>
    </Page>
  );
}
