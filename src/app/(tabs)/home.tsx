import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Chip, Empty, Icon, Page, Txt, useUi } from '../../components/ui';
import { balance } from '../../domain/model';
import { useApp } from '../../state/AppProvider';
import { ActivityRow } from '../../features/activity';
export default function Home() {
  const { colors, s } = useUi();
  const app = useApp(),
    { group: g, actor, t } = app;
  if (!g) return null;
  const b = balance(g, actor),
    me = g.members.find((m) => m.id === actor);
  const pending = g.proposals.filter((p) => p.status === 'pending');
  const needsMe = pending.filter((p) =>
    p.adjustment
      ? p.author === actor
      : p.electorate.includes(actor) &&
        !p.votes.some((v) => v.actor === actor && v.revision === p.revision),
  ).length;
  return (
    <Page
      title={t(`Hola, ${me?.name}.`, `Hi, ${me?.name}.`)}
      subtitle={g.name}
      action={
        <View style={s.iconCircle}>
          <Icon name="sunny-outline" size={28} />
        </View>
      }
    >
      <View style={{ backgroundColor: colors.green, padding: 26, borderRadius: 26, gap: 14 }}>
        <View style={s.between}>
          <Txt style={{ color: colors.heroMuted, fontWeight: '600' }}>
            {t('Puntos acumulados', 'Accumulated points')}
          </Txt>
          <Icon name="sparkles-outline" color={colors.heroMuted} size={25} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <Txt
            style={{
              fontSize: 66,
              lineHeight: 76,
              fontWeight: '800',
              letterSpacing: -3,
              color: colors.onPrimary,
            }}
          >
            {b.earned - b.spent}
          </Txt>
          <Txt style={{ color: colors.heroMuted, fontSize: 18 }}>Family Points</Txt>
        </View>
        <Txt style={{ color: colors.heroMuted }}>
          {t(`${b.available} disponibles para canjear`, `${b.available} available to redeem`)}
          {b.reserved > 0 ? t(` · ${b.reserved} reservados`, ` · ${b.reserved} reserved`) : ''}
        </Txt>
        <Button
          label={t('Sumar puntos', 'Add points')}
          icon="add"
          variant="secondary"
          onPress={() => router.push('/contribute')}
        />
        <Button
          label={t('Canjear puntos', 'Redeem points')}
          icon="gift-outline"
          variant="secondary"
          onPress={() => router.push('/(tabs)/rewards')}
        />
      </View>
      {!app.demo && app.actor === g.owner && (
        <Card style={{ backgroundColor: colors.mint }}>
          <Txt style={s.subtitle}>
            {g.members.length === 1
              ? t('Ya tienes grupo. Falta tu gente.', 'Your group is ready. Invite your people.')
              : t('¿Alguien más se apunta?', 'Anyone else joining?')}
          </Txt>
          <Txt>
            {t(
              'Comparte el código para que se unan desde su móvil.',
              'Share the code so they can join from their own phone.',
            )}
          </Txt>
          <Button
            label={t('Compartir grupo', 'Share group')}
            icon="share-social-outline"
            onPress={() => router.push('/share')}
          />
        </Card>
      )}
      {pending.length > 0 && (
        <Card style={{ backgroundColor: colors.peach, borderColor: colors.peach }}>
          <View style={s.row}>
            <Icon name="hand-left-outline" />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '700' }}>
                {t(
                  needsMe
                    ? needsMe === 1
                      ? '1 solicitud necesita tu respuesta'
                      : `${needsMe} solicitudes necesitan tu respuesta`
                    : pending.length === 1
                      ? '1 solicitud esperando al grupo'
                      : `${pending.length} solicitudes esperando al grupo`,
                  needsMe
                    ? `${needsMe} requests need your response`
                    : `${pending.length} requests waiting for the group`,
                )}
              </Txt>
              <Txt style={s.muted}>
                {t(
                  'Revisa quién quiere sumar o canjear puntos. Tus solicitudes esperan al resto del grupo.',
                  'Review who wants to add or redeem points. Your requests await the other members.',
                )}
              </Txt>
            </View>
          </View>
          <Button
            label={t('Revisar pendientes', 'Review pending requests')}
            variant="secondary"
            onPress={() => router.push('/(tabs)/pending')}
          />
        </Card>
      )}
      <Card>
        <Txt style={s.subtitle}>{t('Así funciona', 'How it works')}</Txt>
        <Txt>
          {t(
            '1. Sumar puntos: cuenta qué has hecho y cuántos puntos pides.',
            '1. Add points: say what you did and how many points you request.',
          )}
        </Txt>
        <Txt>
          {t(
            '2. Aceptar puntos: tu pareja o la mayoría del resto del grupo revisa y acepta. Entonces se suman.',
            '2. Accept points: your partner or a majority of the other members reviews and accepts. Then the points are added.',
          )}
        </Txt>
        <Txt>
          {t(
            '3. Canjear puntos: elige en qué disfrutarlos y pide al grupo aceptar el canje.',
            '3. Redeem points: choose what to enjoy and ask your group to accept the redemption.',
          )}
        </Txt>
      </Card>
      {app.demo && (
        <View style={s.wrap}>
          <Chip
            label={t('DEMO · solo en este dispositivo', 'DEMO · on this device only')}
            selected
          />
          {g.members.map((m) => (
            <Chip
              key={m.id}
              label={m.name}
              selected={m.id === actor}
              onPress={() => app.switchActor(m.id)}
            />
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1 }}>
          <Icon name="checkmark-done-outline" />
          <Txt style={{ fontSize: 26, fontWeight: '800' }}>{b.earned}</Txt>
          <Txt style={s.muted}>{t('puntos ganados en total', 'total points earned')}</Txt>
        </Card>
        <Card style={{ flex: 1 }}>
          <Icon name="gift-outline" />
          <Txt style={{ fontSize: 26, fontWeight: '800' }}>{b.spent}</Txt>
          <Txt style={s.muted}>{t('puntos canjeados', 'points redeemed')}</Txt>
        </Card>
      </View>
      <View style={{ gap: 12 }}>
        <Txt style={s.subtitle}>{t('Los puntos del grupo', 'Everyone’s points')}</Txt>
        <Card>
          {g.members.map((m) => {
            const mb = balance(g, m.id);
            return (
              <View key={m.id} style={s.between}>
                <View style={s.row}>
                  <View style={[s.iconCircle, { width: 38, height: 38, borderRadius: 19 }]}>
                    <Txt style={{ fontWeight: '700' }}>{m.name.slice(0, 1).toUpperCase()}</Txt>
                  </View>
                  <Txt>
                    {m.name}
                    {m.id === actor ? t(' · tú', ' · you') : ''}
                  </Txt>
                </View>
                <View>
                  <Txt style={{ fontWeight: '700', textAlign: 'right' }}>{mb.available} pt</Txt>
                  {mb.reserved > 0 && (
                    <Txt style={s.muted}>
                      {mb.reserved} {t('reservados', 'reserved')}
                    </Txt>
                  )}
                </View>
              </View>
            );
          })}
        </Card>
      </View>
      <View style={{ gap: 10 }}>
        <View style={s.between}>
          <Txt style={s.subtitle}>{t('Últimos movimientos', 'Latest moves')}</Txt>
          <Button
            label={t('Ver todo', 'See all')}
            variant="ghost"
            onPress={() => router.push('/(tabs)/history')}
          />
        </View>
        {g.activity.length ? (
          <Card>
            {g.activity
              .slice(-4)
              .reverse()
              .map((e) => (
                <ActivityRow item={e} key={e.id} />
              ))}
          </Card>
        ) : (
          <Empty
            title={t('Esto acaba de empezar', 'This is just the beginning')}
            body={t(
              'Tu primera aportación tiene sitio aquí.',
              'There is room here for your first contribution.',
            )}
          />
        )}
      </View>
    </Page>
  );
}
