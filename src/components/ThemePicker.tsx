import { Pressable, View } from 'react-native';
import { themes, ThemeId } from '../theme/themes';
import { useApp } from '../state/AppProvider';
import { Card, Icon, Txt, useUi } from './ui';
export function ThemePicker() {
  const { themeId, setThemeId, t } = useApp();
  const { colors, s } = useUi();
  return (
    <Card>
      <Txt style={s.subtitle}>{t('Tu rollo, tu look.', 'Your vibe, your look.')}</Txt>
      <Txt style={s.muted}>
        {t('Elige cómo quieres ver tus puntos.', 'Choose how you want to see your points.')}
      </Txt>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('Estilo visual', 'Visual style')}
        style={{ flexDirection: 'row', gap: 8 }}
      >
        {(Object.keys(themes) as ThemeId[]).map((id) => {
          const item = themes[id],
            selected = themeId === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityLabel={t(...item.name)}
              accessibilityState={{ checked: selected }}
              aria-checked={selected}
              onPress={() => setThemeId(id)}
              style={{
                flex: 1,
                minHeight: 126,
                padding: 10,
                gap: 12,
                borderRadius: item.radius / 1.4,
                backgroundColor: item.colors.bg,
                borderWidth: 2,
                borderColor: selected ? colors.green : colors.line,
              }}
            >
              <View
                style={{ backgroundColor: item.colors.white, borderRadius: 8, padding: 8, gap: 5 }}
              >
                <View
                  style={{
                    backgroundColor: item.colors.green,
                    width: 22,
                    height: 22,
                    borderRadius: id === 'night' ? 5 : 11,
                  }}
                />
                <View
                  style={{
                    height: 4,
                    width: '85%',
                    backgroundColor: item.colors.ink,
                    borderRadius: 2,
                  }}
                />
                <View
                  style={{
                    height: 4,
                    width: '55%',
                    backgroundColor: item.colors.line,
                    borderRadius: 2,
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Txt style={{ fontSize: 13, fontWeight: '700', color: item.colors.ink }}>
                  {t(...item.name)}
                </Txt>
                {selected && <Icon name="checkmark-circle" size={18} color={item.colors.green} />}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Txt style={s.muted}>{t(...themes[themeId].description)}</Txt>
    </Card>
  );
}
