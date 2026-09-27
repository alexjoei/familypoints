import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Field, Page, Txt } from '../components/ui';
import { useApp } from '../state/AppProvider';
export default function Join() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const app = useApp();
  const [display, setDisplay] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Page title={app.t('Te están esperando.', 'They are waiting for you.')}>
      <Txt>
        {app.t(
          'Una invitación a compartir aportaciones y buenos acuerdos.',
          'An invitation to share contributions and good agreements.',
        )}
      </Txt>
      {app.session && !app.demo && (
        <Field
          label={app.t('Tu nombre en el grupo', 'Your name in the group')}
          value={display}
          onChangeText={setDisplay}
          maxLength={60}
        />
      )}
      <Button
        label={
          app.session && !app.demo
            ? app.t('Unirme al grupo', 'Join group')
            : app.t('Entrar para unirme', 'Sign in to join')
        }
        loading={busy}
        disabled={!code || (!!app.session && !app.demo && !display.trim())}
        onPress={async () => {
          setBusy(true);
          try {
            if (app.session && !app.demo) {
              await app.joinGroup(code, display);
              router.replace('/(tabs)/home');
            } else {
              await AsyncStorage.setItem('fp.pendingInvite', code);
              if (app.demo) await app.exit();
              router.replace('/');
            }
          } catch (e) {
            app.report(e);
          } finally {
            setBusy(false);
          }
        }}
      />
    </Page>
  );
}
