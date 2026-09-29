import { Redirect, Tabs } from 'expo-router';
import { useApp } from '../../state/AppProvider';
import { Icon, useUi } from '../../components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function TabLayout() {
  const { colors } = useUi();
  const { group, t } = useApp();
  const insets = useSafeAreaInsets();
  if (!group) return <Redirect href="/" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          height: 68 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarItemStyle: { paddingHorizontal: 0 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('Inicio', 'Home'),
          tabBarIcon: ({ color }) => <Icon name="grid-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="pending"
        options={{
          title: t('Pendientes', 'Pending'),
          tabBarIcon: ({ color }) => <Icon name="checkmark-circle-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: t('Canjes', 'Rewards'),
          tabBarIcon: ({ color }) => <Icon name="gift-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('Historial', 'History'),
          tabBarIcon: ({ color }) => <Icon name="time-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('Configuración', 'Settings'),
          tabBarItemStyle: { flex: 1.35, paddingHorizontal: 0 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ color }) => <Icon name="people-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
