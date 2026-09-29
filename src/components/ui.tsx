import React from 'react';
import {
  ActivityIndicator,
  ColorValue,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { themes, Theme } from '../theme/themes';
export function useUi() {
  const { themeId } = useApp();
  const theme = themes[themeId];
  return { colors: theme.colors, s: themeStyles[themeId], theme };
}
export function Txt({ children, style, ...props }: React.ComponentProps<typeof Text>) {
  const { s } = useUi();
  return (
    <Text {...props} style={[s.text, style]}>
      {children}
    </Text>
  );
}
export function Icon({
  name,
  size = 22,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: ColorValue;
}) {
  const { colors } = useUi();
  return <Ionicons name={name} size={size} color={color ?? colors.ink} />;
}
export function Button({
  label,
  accessibilityLabel,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  loading = false,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
}) {
  const { colors, s } = useUi();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        variant === 'primary'
          ? { backgroundColor: colors.green }
          : variant === 'danger'
            ? { backgroundColor: colors.peach }
            : variant === 'secondary'
              ? { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }
              : { backgroundColor: 'transparent' },
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.green} />
      ) : icon ? (
        <Icon
          name={icon}
          size={19}
          color={variant === 'primary' ? colors.onPrimary : colors.green}
        />
      ) : null}
      <Txt
        style={{
          fontWeight: '700',
          color:
            variant === 'primary'
              ? colors.onPrimary
              : variant === 'danger'
                ? colors.red
                : colors.ink,
          textAlign: 'center',
        }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { colors, s } = useUi();
  return (
    <View style={{ gap: 7 }}>
      <Txt style={s.label}>{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 90, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { s } = useUi();
  return <View style={[s.card, style]}>{children}</View>;
}
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { colors, s } = useUi();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.chip, selected && { backgroundColor: colors.green, borderColor: colors.green }]}
    >
      <Txt
        style={{ fontSize: 13, fontWeight: '600', color: selected ? colors.onPrimary : colors.ink }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}
export function Empty({
  title,
  body,
  icon = 'leaf-outline',
}: {
  title: string;
  body: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const { colors, s } = useUi();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 36, gap: 12 }}>
      <View style={s.iconCircle}>
        <Icon name={icon} size={30} />
      </View>
      <Txt style={s.subtitle}>{title}</Txt>
      <Txt style={{ color: colors.muted, textAlign: 'center', maxWidth: 360 }}>{body}</Txt>
    </Card>
  );
}
export function Page({
  children,
  title,
  subtitle,
  action,
  scrollRef,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  scrollRef?: React.Ref<ScrollView>;
}) {
  const app = useApp();
  const { colors, s } = useUi();
  const [refreshing, setRefreshing] = React.useState(false);
  const focused = useIsFocused();
  if (!focused) return null;
  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: colors.bg }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[s.page, !app.group && { paddingBottom: 40 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            app
              .refresh()
              .catch(app.report)
              .finally(() => setRefreshing(false));
          }}
          tintColor={colors.green}
        />
      }
    >
      <View style={s.heading}>
        <View style={{ flex: 1, gap: 5 }}>
          <Txt style={s.eyebrow}>FAMILY POINTS</Txt>
          <Txt accessibilityRole="header" style={s.title}>
            {title}
          </Txt>
          {subtitle && <Txt style={{ color: colors.muted }}>{subtitle}</Txt>}
        </View>
        {action}
      </View>
      {children}
    </ScrollView>
  );
}
function createStyles(theme: Theme) {
  const colors = theme.colors;
  return StyleSheet.create({
    text: { fontSize: 15, lineHeight: 22, color: colors.ink },
    page: {
      padding: 22,
      paddingBottom: 118,
      gap: 22,
      width: '100%',
      maxWidth: 960,
      alignSelf: 'center',
    },
    heading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 12,
      paddingBottom: 4,
    },
    eyebrow: { fontSize: 11, letterSpacing: 2, fontWeight: '800', color: colors.muted },
    title: {
      fontSize: theme.titleSize,
      lineHeight: theme.titleSize + 6,
      fontWeight: '800',
      letterSpacing: -1,
    },
    subtitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.3 },
    card: {
      backgroundColor: colors.white,
      borderRadius: theme.radius,
      padding: 20,
      gap: 12,
      borderWidth: theme.borderWidth,
      borderColor: colors.line,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    between: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    button: {
      minHeight: 48,
      paddingVertical: 12,
      paddingHorizontal: 17,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    input: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 16,
      color: colors.ink,
      minHeight: 48,
    },
    label: { fontSize: 13, fontWeight: '600', color: colors.muted },
    chip: {
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.white,
    },
    iconCircle: {
      height: 54,
      width: 54,
      borderRadius: 18,
      backgroundColor: colors.mint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    muted: { color: colors.muted, fontSize: 13 },
  });
}
const themeStyles = {
  pop: createStyles(themes.pop),
  calm: createStyles(themes.calm),
  night: createStyles(themes.night),
  cool: createStyles(themes.cool),
};
