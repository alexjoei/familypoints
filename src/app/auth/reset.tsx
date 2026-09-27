import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Button, Field, Page } from '../../components/ui';
import { useApp } from '../../state/AppProvider';
import { supabase } from '../../lib/supabase';
export default function Reset() {
  const app = useApp();
  const [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false);
  if (!app.session) return <Redirect href="/" />;
  return (
    <Page title={app.t('Nueva contraseña', 'New password')}>
      <Field
        label={app.t('Contraseña (mínimo 8 caracteres)', 'Password (at least 8 characters)')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button
        label={app.t('Guardar contraseña', 'Save password')}
        disabled={password.length < 8}
        loading={busy}
        onPress={async () => {
          setBusy(true);
          try {
            const { error } = await supabase!.auth.updateUser({ password });
            if (error) throw error;
            app.setRecovery(false);
            router.replace('/');
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
