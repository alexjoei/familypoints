import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { Button, Card, Chip, Field, Icon, Page, Txt, useUi } from '../components/ui';
import { authRedirect, configured, googleLogin, supabase } from '../lib/supabase';
export default function Welcome() {
  const { colors, s } = useUi();
  const app = useApp(),
    { t } = app;
  const params = useLocalSearchParams<{ code?: string }>();
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  const [name, setName] = useState(''),
    [display, setDisplay] = useState(''),
    [code, setCode] = useState(params.code ?? '');
  useEffect(() => {
    AsyncStorage.getItem('fp.pendingInvite')
      .then((saved) => {
        if (saved) setCode(saved);
      })
      .catch(app.report);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    app.clearError();
    try {
      await fn();
    } catch (e) {
      app.report(e);
    } finally {
      setBusy(false);
    }
  };
  if (!app.ready) return <ActivityIndicator style={{ flex: 1 }} color={colors.green} />;
  if (app.recovery) return <Redirect href="/auth/reset" />;
  if (app.group) return <Redirect href="/(tabs)/home" />;
  if (app.session)
    return (
      <Page
        title={t('Tu gente, tu grupo.', 'Your people, your group.')}
        subtitle={t(
          'Un espacio para reconocer lo que hacemos.',
          'A space to recognize what we do.',
        )}
      >
        {app.groups.map((g) => (
          <Button
            key={g.id}
            label={g.name}
            variant="secondary"
            onPress={() => run(() => app.selectGroup(g.id))}
            disabled={busy}
          />
        ))}
        <Field
          label={t('Tu nombre en el grupo', 'Your name in the group')}
          value={display}
          onChangeText={setDisplay}
          maxLength={60}
        />
        <Card>
          <Txt style={s.subtitle}>{t('Empezar un grupo', 'Start a group')}</Txt>
          <Field
            label={t('Nombre del grupo', 'Group name')}
            value={name}
            onChangeText={setName}
            maxLength={100}
            placeholder={t('La buena compañía', 'Good company')}
          />
          <Button
            label={t('Crear grupo', 'Create group')}
            onPress={() => run(() => app.createGroup(name, display))}
            disabled={!name.trim() || !display.trim() || busy}
          />
        </Card>
        <Card>
          <Txt style={s.subtitle}>{t('Ya me están esperando', 'They are waiting for me')}</Txt>
          <Field
            label={t('Código de invitación', 'Invitation code')}
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
          />
          <Button
            label={t('Unirme al grupo', 'Join group')}
            onPress={() => run(() => app.joinGroup(code, display))}
            disabled={!code.trim() || !display.trim() || busy}
          />
        </Card>
        <Button
          label={t('Cerrar sesión', 'Sign out')}
          variant="ghost"
          onPress={() => run(app.exit)}
        />
      </Page>
    );
  return (
    <Page
      title="Family Points"
      action={
        <Chip
          label={app.language === 'es' ? 'EN' : 'ES'}
          onPress={() => app.setLanguage(app.language === 'es' ? 'en' : 'es')}
        />
      }
    >
      <View
        style={{
          backgroundColor: colors.mint,
          borderRadius: 30,
          padding: 28,
          gap: 20,
          overflow: 'hidden',
        }}
      >
        <View style={s.row}>
          <View
            style={[
              s.iconCircle,
              { backgroundColor: colors.white, transform: [{ rotate: '-8deg' }] },
            ]}
          >
            <Icon name="heart-outline" size={32} />
          </View>
          <View
            style={[
              s.iconCircle,
              { backgroundColor: colors.peach, transform: [{ rotate: '9deg' }] },
            ]}
          >
            <Icon name="sparkles-outline" size={32} />
          </View>
        </View>
        <Txt
          style={{
            fontSize: 40,
            lineHeight: 45,
            fontWeight: '800',
            letterSpacing: -1.5,
            maxWidth: 580,
          }}
        >
          {t('Suma puntos.\nCanjea planes.', 'Add points.\nEnjoy rewards.')}
        </Txt>
        <Txt style={{ fontSize: 17, lineHeight: 26, maxWidth: 490 }}>
          {t(
            'Cuenta qué has hecho y pide puntos. Tu pareja o el grupo los acepta. Después, canjéalos por algo que hayáis acordado.',
            'Say what you did and request points. Your partner or group accepts them. Then redeem them for something you have agreed on.',
          )}
        </Txt>
        <View style={s.wrap}>
          {[
            t('Sumar puntos', 'Add points'),
            t('Aceptar puntos', 'Accept points'),
            t('Canjear puntos', 'Redeem points'),
          ].map((x, i) => (
            <Chip key={x} label={`${i + 1}  ${x}`} />
          ))}
        </View>
      </View>
      <Card>
        <Txt style={s.subtitle}>
          {signup
            ? t('Tu grupo empieza contigo', 'Your group starts with you')
            : t('Qué bien verte por aquí', 'Good to see you here')}
        </Txt>
        <Button
          label={t('Continuar con Google', 'Continue with Google')}
          icon="logo-google"
          variant="secondary"
          onPress={() => run(googleLogin)}
          loading={busy}
          disabled={!configured}
        />
        <Txt style={{ textAlign: 'center', color: colors.muted }}>
          {t('o con tu correo', 'or with your email')}
        </Txt>
        <Field
          label={t('Correo electrónico', 'Email address')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          label={t('Contraseña', 'Password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={signup ? 'new-password' : 'current-password'}
        />
        {signup && (
          <Txt style={s.muted}>{t('Al menos 8 caracteres.', 'At least 8 characters.')}</Txt>
        )}
        <Button
          label={signup ? t('Crear cuenta', 'Create account') : t('Entrar', 'Sign in')}
          disabled={!configured || !email || password.length < (signup ? 8 : 1)}
          loading={busy}
          onPress={() =>
            run(async () => {
              if (!supabase) throw new Error('not_configured');
              const result = signup
                ? await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: { emailRedirectTo: authRedirect() },
                  })
                : await supabase.auth.signInWithPassword({ email: email.trim(), password });
              if (result.error) throw result.error;
              if (signup && !result.data.session)
                setNotice(
                  t(
                    'Mira tu correo para confirmar la cuenta. Abre el enlace en este dispositivo.',
                    'Check your email to confirm your account. Open the link on this device.',
                  ),
                );
            })
          }
        />
        {notice && (
          <Txt accessibilityLiveRegion="polite" style={{ color: colors.green }}>
            {notice}
          </Txt>
        )}
        <Button
          label={
            signup
              ? t('Ya tengo cuenta', 'I already have an account')
              : t('Soy nuevo por aquí', 'I am new here')
          }
          variant="ghost"
          onPress={() => {
            setSignup(!signup);
            setNotice('');
          }}
        />
        {!signup && (
          <Button
            label={t('He olvidado la contraseña', 'Forgot password')}
            variant="ghost"
            disabled={!configured || !email || busy}
            onPress={() =>
              run(async () => {
                const { error } = await supabase!.auth.resetPasswordForEmail(email.trim(), {
                  redirectTo: authRedirect(),
                });
                if (error) throw error;
                setNotice(
                  t(
                    'Si existe la cuenta, recibirás un enlace. Ábrelo en este dispositivo.',
                    'If the account exists, you will receive a link. Open it on this device.',
                  ),
                );
              })
            }
          />
        )}
      </Card>
      {!configured && (
        <Txt style={s.muted}>
          {t(
            'El acceso con cuenta estará disponible al conectar el servicio. Puedes explorar la demo ahora.',
            'Account sign-in will be available when the service is connected. You can explore the demo now.',
          )}
        </Txt>
      )}
      <Button
        label={t('Probar con un grupo de ejemplo', 'Try an example group')}
        icon="play-outline"
        variant="secondary"
        onPress={() => run(app.startDemo)}
        disabled={busy}
      />
      <Txt style={{ textAlign: 'center', color: colors.muted, fontSize: 12 }}>
        {app.humor
          ? t(
              'Sin competición. Sin dramas. Bueno, esa es la idea.',
              'No competition. No drama. Well, that is the idea.',
            )
          : t(
              'Un espacio para reconocer vuestras aportaciones.',
              'A space to recognize your contributions.',
            )}
      </Txt>
    </Page>
  );
}
