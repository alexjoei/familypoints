import { useEffect, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useApp } from '../../state/AppProvider';
import { Button, Page, Txt } from '../../components/ui';
export default function Callback() {
  const { ready, session, recovery, error, t } = useApp();
  const [waiting, setWaiting] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setWaiting(false), 12000);
    return () => clearTimeout(timer);
  }, []);
  if (recovery) return <Redirect href="/auth/reset" />;
  if (ready && session) return <Redirect href="/" />;
  return (
    <Page title={t('Volviendo a tu grupo', 'Back to your group')}>
      {waiting && !error ? (
        <ActivityIndicator />
      ) : (
        <>
          <Txt>
            {t(
              'No hemos podido completar el acceso. Vuelve a entrar desde este dispositivo.',
              'We could not complete sign-in. Try signing in again from this device.',
            )}
          </Txt>
          <Button
            label={t('Volver al inicio', 'Back to start')}
            onPress={() => router.replace('/')}
          />
        </>
      )}
    </Page>
  );
}
