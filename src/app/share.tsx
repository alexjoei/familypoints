import { useEffect, useState } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { Button, Card, Page, Txt, useUi } from '../components/ui';
import { useApp } from '../state/AppProvider';
import { getInvitation, Invitation } from '../lib/invitation';

export default function ShareGroup() {
  const app = useApp();
  const { colors, s } = useUi();
  const group = app.group;
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!group || app.demo || app.actor !== group.owner) return;
    let alive = true;
    getInvitation(group.id)
      .then((value) => {
        if (alive) setInvitation(value);
      })
      .catch(app.report);
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, app.actor, app.demo]);

  async function renew() {
    if (!group) return;
    setWorking(true);
    try {
      setInvitation(await getInvitation(group.id, true));
      setCopied(false);
      await app.refresh();
    } catch (error) {
      app.report(error);
    } finally {
      setWorking(false);
    }
  }

  if (!group) return null;
  if (app.demo || app.actor !== group.owner) {
    return (
      <Page title={app.t('Compartir grupo', 'Share group')}>
        <Txt>
          {app.t(
            'Solo quien creó un grupo real puede compartir su invitación.',
            'Only the creator of a real group can share its invitation.',
          )}
        </Txt>
        <Button label={app.t('Volver', 'Back')} onPress={() => router.replace('/(tabs)/home')} />
      </Page>
    );
  }
  const readableCode = invitation?.code.toUpperCase().match(/.{1,4}/g)?.join('-') ?? '';
  return (
    <Page
      title={app.t('Compartir grupo', 'Share group')}
      subtitle={group.name}
    >
      <Card style={{ backgroundColor: colors.mint }}>
        <Txt style={s.subtitle}>
          {app.t('Invita a tu gente', 'Invite your people')}
        </Txt>
        <Txt>
          {app.t(
            'Mándales el código. Al entrar, elegirán «Unirme al grupo» y lo pegarán allí.',
            'Send them the code. After signing in, they can choose “Join group” and enter it there.',
          )}
        </Txt>
      </Card>
      <Card style={{ alignItems: 'center', gap: 16 }}>
        <Txt style={s.muted}>{app.t('CÓDIGO DEL GRUPO', 'GROUP CODE')}</Txt>
        {invitation ? (
          <>
            <Txt
              selectable
              accessibilityLabel={app.t('Código del grupo', 'Group code')}
              style={{ fontSize: 26, lineHeight: 36, fontWeight: '800', letterSpacing: 2, textAlign: 'center' }}
            >
              {readableCode}
            </Txt>
            <Txt style={s.muted}>
              {app.t('Válido hasta ', 'Valid until ')}
              {new Date(invitation.expires).toLocaleString(app.language)}
            </Txt>
          </>
        ) : (
          <Txt style={s.muted}>
            {working
              ? app.t('Buscando el código…', 'Finding your code…')
              : app.t('No se pudo cargar el código. Inténtalo otra vez.', 'Could not load the code. Try again.')}
          </Txt>
        )}
        <View style={{ width: '100%', gap: 10 }}>
          <Button
            label={app.t('Copiar código', 'Copy code')}
            icon="copy-outline"
            variant="secondary"
            disabled={!invitation || working}
            onPress={() => {
              if (!invitation) return;
              Clipboard.setStringAsync(invitation.code)
                .then(() => setCopied(true))
                .catch(app.report);
            }}
          />
          {copied && (
            <Txt accessibilityLiveRegion="polite" style={{ textAlign: 'center', color: colors.green }}>
              {app.t('Código copiado. Ya puedes enviarlo.', 'Code copied. Ready to send.')}
            </Txt>
          )}
          <Button
            label={app.t('Compartir código', 'Share code')}
            icon="share-social-outline"
            disabled={!invitation || working}
            onPress={() => {
              if (!invitation) return;
              const link = Linking.createURL('join', {
                scheme: 'familypoints',
                queryParams: { code: invitation.code },
              });
              Share.share({
                message: app.t(
                  `Únete a ${group.name} en Family Points. Código: ${readableCode}\n${link}`,
                  `Join ${group.name} on Family Points. Code: ${readableCode}\n${link}`,
                ),
              }).catch(app.report);
            }}
          />
          <Button
            label={app.t('Renovar código', 'Renew code')}
            variant="ghost"
            disabled={working}
            onPress={renew}
          />
        </View>
      </Card>
      <Txt style={s.muted}>
        {app.t(
          'Si renuevas el código, el anterior dejará de funcionar.',
          'Renewing the code invalidates the previous one.',
        )}
      </Txt>
      <Button label={app.t('Volver al grupo', 'Back to group')} variant="secondary" onPress={() => router.replace('/(tabs)/home')} />
    </Page>
  );
}
