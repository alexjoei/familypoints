import React from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, View } from 'react-native';
import { AppProvider, useApp } from '../state/AppProvider';
import { Txt, useUi } from '../components/ui';
import { AddPointsButton } from '../components/AddPointsButton';
function Layout() {
  const { colors, theme } = useUi();
  const { error, clearError, notice, dismissNotice, t } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      {error && (
        <View
          style={{ padding: 14, backgroundColor: colors.peach }}
          accessibilityLiveRegion="polite"
        >
          <Pressable onPress={clearError} accessibilityRole="button">
            <Txt style={{ color: colors.red }}>{error} ×</Txt>
          </Pressable>
        </View>
      )}
      {notice && (
        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 4, backgroundColor: colors.mint }}
          accessibilityLiveRegion="polite"
        >
          <Pressable
            accessibilityRole="button"
            style={{ flex: 1, gap: 3 }}
            onPress={() => {
              const id = notice.proposalId;
              dismissNotice();
              if (id) router.push({ pathname: '/proposal', params: { id } });
            }}
          >
            <Txt style={{ fontWeight: '700' }}>{notice.title}</Txt>
            <Txt>{notice.body}</Txt>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Cerrar aviso', 'Dismiss alert')}
            onPress={dismissNotice}
            hitSlop={12}
            style={{ padding: 8, margin: -8 }}
          >
            <Txt style={{ fontSize: 18, fontWeight: '700' }}>×</Txt>
          </Pressable>
        </View>
      )}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="contribute" options={{ presentation: 'card' }} />
      </Stack>
      <AddPointsButton />
    </SafeAreaView>
  );
}
export default function Root() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Layout />
      </AppProvider>
    </SafeAreaProvider>
  );
}
