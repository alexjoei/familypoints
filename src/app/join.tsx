import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Card, Field, Page, Txt, useUi } from '../components/ui';
import { useApp } from '../state/AppProvider';
export default function Join() {
  const { code: linkedCode } = useLocalSearchParams<{ code?: string }>();
  const app = useApp();
  const { s } = useUi();
  const defaultName = String(
    app.session?.user.user_metadata?.full_name ||
      app.session?.user.user_metadata?.name ||
      app.session?.user.email?.split('@')[0] ||
      '',
  ).slice(0, 60);
  const [nameInput, setNameInput] = useState<string | null>(null),
    [codeInput, setCodeInput] = useState(linkedCode ?? ''),
    [busy, setBusy] = useState(false);
  const display = nameInput ?? defaultName;
  const code = codeInput.replace(/[\s-]/g, '').toLowerCase();
  useEffect(() => {
    if (linkedCode) return;
    let alive = true;
    AsyncStorage.getItem('fp.pendingInvite')
      .then((saved) => {
        if (alive && saved) setCodeInput(saved);
      })
      .catch(app.report);
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedCode]);
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page
        title={app.t('Unirme al grupo', 'Join group')}
        subtitle={app.t('Con el código que te han pasado.', 'Use the code they sent you.')}
      >
        <Card>
          <Txt style={s.subtitle}>{app.t('Código del grupo', 'Group code')}</Txt>
          <Field
            label={app.t('Pega o escribe el código', 'Paste or enter the code')}
            value={codeInput}
            onChangeText={setCodeInput}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={40}
            placeholder="AB12-CD34-EF56"
          />
          {app.session && !app.demo && (
            <Field
              label={app.t('Tu nombre en el grupo', 'Your name in the group')}
              value={display}
              onChangeText={setNameInput}
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
        </Card>
        <Button label={app.t('Volver', 'Back')} variant="ghost" onPress={() => router.back()} />
      </Page>
    </KeyboardAvoidingView>
  );
}
