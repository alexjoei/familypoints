import { useState } from 'react';
import { Switch, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { Button, Card, Chip, Field, Page, Txt, useUi } from '../../components/ui';
import { useApp } from '../../state/AppProvider';
import { balance, Template } from '../../domain/model';
import { ThemePicker } from '../../components/ThemePicker';
export default function Settings() {
  const { colors, s } = useUi();
  const app = useApp(),
    { group: g, t } = app;
  const [category, setCategory] = useState(''),
    [edit, setEdit] = useState<Template | null>(null),
    [debtForm, setDebtForm] = useState(false),
    [debtValue, setDebtValue] = useState('100'),
    [remove, setRemove] = useState<string | null>(null),
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
      title={t('Configuración de grupo', 'Group settings')}
      subtitle={t(
        'Tu grupo. Vuestras reglas. Cero solemnidad.',
        'Your crew. Your rules. Zero ceremony.',
      )}
    >
      <Card>
        <Txt style={s.subtitle}>{g.name}</Txt>
        <Txt style={s.muted}>{t('Miembros y puntos acumulados', 'Members and accumulated points')}</Txt>
        {g.members.map((m) => (
          <View style={s.between} key={m.id}>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '700' }}>{m.name}</Txt>
              <Txt style={s.muted}>
                {m.id === g.owner
                  ? t('Administra el grupo', 'Group administrator')
                  : t('Miembro', 'Member')}
              </Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt style={{ fontWeight: '800', fontSize: 20 }}>{balance(g, m.id).total} pt</Txt>
              {balance(g, m.id).reserved > 0 && (
                <Txt style={s.muted}>
                  {balance(g, m.id).available} {t('disponibles', 'available')}
                </Txt>
              )}
            </View>
            {owner && m.id !== g.owner && (
              <Button label={t('Quitar', 'Remove')} variant="ghost" onPress={() => setRemove(m.id)} />
            )}
          </View>
        ))}
        {remove && !remove.includes(':') && (
          <View style={{ gap: 8, padding: 12, backgroundColor: colors.negativeBg, borderRadius: 14 }}>
            <Txt>{t(`¿Quitar a ${g.members.find((m) => m.id === remove)?.name}? Su historial seguirá visible. Resolved primero las solicitudes pendientes.`, `Remove ${g.members.find((m) => m.id === remove)?.name}? Their history stays visible. Resolve pending requests first.`)}</Txt>
            <Button label={t('Confirmar', 'Confirm')} disabled={app.busy || g.proposals.some((p) => p.status === 'pending')} onPress={async () => {
              if (await app.execute({ type: 'remove_member', id: remove })) setRemove(null);
            }} />
            <Button label={t('Cancelar', 'Cancel')} variant="ghost" onPress={() => setRemove(null)} />
          </View>
        )}
        {owner && !app.demo && <Button label={t('Compartir grupo y código', 'Share group and code')} icon="share-social-outline" onPress={() => router.push('/share')} />}
      </Card>
      {app.demo && (
        <Card style={{ backgroundColor: colors.peach }}>
          <Txt style={{ fontWeight: '700' }}>{t('Modo prueba: sin líos', 'Demo mode: no strings')}</Txt>
          <Txt>{t('Cambia de persona para probar los votos. Estos datos se guardan solo aquí.', 'Switch people to try voting. This data stays on this device.')}</Txt>
          <View style={s.wrap}>{g.members.map((m) => <Chip key={m.id} label={m.name} selected={m.id === app.actor} onPress={() => app.switchActor(m.id)} />)}</View>
        </Card>
      )}
      <ThemePicker />
      <Card>
        <Txt style={s.subtitle}>{t('Nuestros acuerdos', 'Our agreements')}</Txt>
        <Txt>
          {t(
            `Saldo individual · ${g.debtLimit ? `Hasta ${g.debtLimit} puntos negativos` : 'Sin saldo negativo'} · Sin autovotos`,
            `Individual balances · ${g.debtLimit ? `Up to ${g.debtLimit} negative points` : 'No negative balance'} · No self-voting`,
          )}
        </Txt>
        <Txt style={s.muted}>
          {t(
            g.members.length === 2
              ? 'Tu pareja acepta o rechaza. Si propone otros puntos y tú los aceptas, queda resuelto al momento.'
              : 'Mayoría de los demás miembros. Cada solicitud conserva sus votantes; quienes se unan después votarán en las nuevas solicitudes. Los ajustes necesitan la aceptación del autor y nuevos votos.',
            g.members.length === 2
              ? 'Your partner accepts or rejects. If they suggest different points and you accept, it is settled right away.'
              : 'Majority of the other members. Each proposal keeps its voters; people joining later vote on new proposals. Adjustments need the author’s acceptance and new votes.',
          )}
        </Txt>
        <Txt style={s.muted}>
          {t('El saldo negativo empieza desactivado. Si os viene bien, acordad juntos un límite de hasta 100 puntos.', 'Negative balances start off. If you want them, agree on a limit of up to 100 points together.')}
        </Txt>
        <Button
          label={t('Cambiar límite de saldo', 'Change balance limit')}
          variant="secondary"
          disabled={g.members.length < 2}
          onPress={() => {
            setDebtValue(String(g.debtLimit ?? 0));
            setDebtForm(!debtForm);
          }}
        />
        {debtForm && (
          <View style={{ gap: 10 }}>
            <Txt style={s.muted}>
              {t(
                'Propón un límite entre 0 y 100. El resto lo acepta o rechaza antes de aplicarlo.',
                'Suggest a limit from 0 to 100. The others accept or reject it before it applies.',
              )}
            </Txt>
            <Field
              label={t('Puntos negativos permitidos', 'Negative points allowed')}
              value={debtValue}
              onChangeText={setDebtValue}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Button
              label={t('Pedir acuerdo al grupo', 'Ask the group to agree')}
              disabled={app.busy || !/^\d{1,3}$/.test(debtValue) || Number(debtValue) > 100 || Number(debtValue) === (g.debtLimit ?? 0)}
              onPress={async () => {
                const amount = Number(debtValue);
                if (await app.execute({
                  type: 'submit', id: Crypto.randomUUID(), kind: 'debt_limit',
                  title: t(`Límite de saldo negativo: ${amount} puntos`, `Negative balance limit: ${amount} points`),
                  points: amount, category: '', note: '', date: new Date().toISOString().slice(0, 10),
                })) {
                  setDebtForm(false);
                  router.push('/(tabs)/pending');
                }
              }}
            />
          </View>
        )}
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
            <View key={c} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Chip label={c} />
              <Button label="×" variant="ghost" onPress={() => setRemove(`category:${c}`)} />
            </View>
          ))}
        </View>
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
        {g.templates.map((tp) => (
          <View key={tp.id} style={s.between}>
            <View style={{ flex: 1 }}>
              <Txt>{tp.title}</Txt>
              <Txt style={s.muted}>
                {tp.category} · {tp.points} pt
              </Txt>
            </View>
              <View style={s.row}>
                <Button label={t('Editar', 'Edit')} variant="ghost" onPress={() => setEdit(tp)} />
                <Button label={t('Quitar', 'Remove')} variant="ghost" onPress={() => setRemove(`template:${tp.id}`)} />
              </View>
          </View>
        ))}
          <Button
            label={t('Nueva plantilla', 'New template')}
            variant="secondary"
            disabled={g.categories.length === 0}
            onPress={() =>
              setEdit({ id: Crypto.randomUUID(), title: '', category: g.categories[0], points: 15 })
            }
          />
        {edit && (
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
        {remove?.startsWith('category:') && <View style={{ gap: 8 }}>
          <Txt>{t('¿Quitar esta categoría? Primero quita sus sugerencias.', 'Remove this category? Remove its suggestions first.')}</Txt>
          <Button label={t('Quitar categoría', 'Remove category')} disabled={app.busy || g.templates.some((tp) => tp.category === remove.slice(9))} onPress={async () => {
            if (await app.execute({ type: 'remove_category', title: remove.slice(9) })) setRemove(null);
          }} />
          <Button label={t('Cancelar', 'Cancel')} variant="ghost" onPress={() => setRemove(null)} />
        </View>}
        {remove?.startsWith('template:') && <View style={{ gap: 8 }}>
          <Txt>{t('¿Quitar esta sugerencia? Las aportaciones anteriores seguirán en el historial.', 'Remove this suggestion? Past contributions stay in history.')}</Txt>
          <Button label={t('Quitar sugerencia', 'Remove suggestion')} disabled={app.busy} onPress={async () => {
            if (await app.execute({ type: 'remove_template', id: remove.slice(9) })) setRemove(null);
          }} />
          <Button label={t('Cancelar', 'Cancel')} variant="ghost" onPress={() => setRemove(null)} />
        </View>}
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
        Family Points · 0.1.8
      </Txt>
    </Page>
  );
}
