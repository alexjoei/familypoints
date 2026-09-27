import { Keyboard, Pressable, View } from 'react-native';
import { router, usePathname, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../state/AppProvider';
import { Icon, useUi } from './ui';
export function AddPointsButton() {
  const { group, t } = useApp();
  const { colors, theme } = useUi();
  const insets = useSafeAreaInsets();
  const segments = useSegments(),
    pathname = usePathname();
  if (!group) return null;
  const inTabs = segments[0] === '(tabs)';
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + (inTabs ? 82 : 18),
        alignItems: 'center',
        zIndex: 20,
      }}
    >
      <Pressable
        testID="add-family-points"
        accessibilityRole="button"
        accessibilityLabel={t('Sumar puntos', 'Add points')}
        accessibilityHint={t(
          'Cuenta qué has hecho y pide al grupo aceptar tus puntos.',
          'Say what you did and ask your group to accept your points.',
        )}
        onPress={() => {
          Keyboard.dismiss();
          if (pathname !== '/contribute') router.navigate('/contribute');
        }}
        style={({ pressed }) => ({
          width: 64,
          height: 64,
          borderRadius: theme.id === 'night' ? 22 : 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.green,
          borderWidth: 3,
          borderColor: colors.bg,
          boxShadow: `0px 4px 14px ${theme.dark ? '#00000066' : '#30254133'}`,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <Icon name="add" size={34} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}
