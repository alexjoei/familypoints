import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Txt, useUi } from './ui';
import { useApp } from '../state/AppProvider';

function localDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function DatePicker({ value, onChange, disabled = false }: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { colors, s } = useUi();
  const { language, t } = useApp();
  const chosen = new Date(`${value}T12:00:00`);
  const [visible, setVisible] = useState(false);
  const [month, setMonth] = useState(() => new Date(chosen.getFullYear(), chosen.getMonth(), 1));
  const now = new Date();
  const today = localDate(now.getFullYear(), now.getMonth(), now.getDate());
  const first = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const selectedLabel = value === today
    ? t('Hoy', 'Today')
    : chosen.toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <View style={{ gap: 8 }}>
      <Txt style={s.label}>{t('Fecha', 'Date')}</Txt>
      <Button
        label={`${selectedLabel}  ·  ${t('Cambiar fecha', 'Change date')}`}
        icon="calendar-outline"
        variant="secondary"
        disabled={disabled}
        onPress={() => setVisible(!visible)}
      />
      {visible && (
        <View style={{ padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 16, gap: 12 }}>
          <View style={s.between}>
            <Button label="‹" variant="ghost" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} />
            <Txt style={{ fontWeight: '700' }}>{month.toLocaleDateString(language, { month: 'long', year: 'numeric' })}</Txt>
            <Button label="›" variant="ghost" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} />
          </View>
          <View style={{ flexDirection: 'row' }}>
            {(language === 'es' ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']).map((day, index) => (
              <Txt key={index} style={{ width: '14.28%', textAlign: 'center', color: colors.muted }}>{day}</Txt>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: first }, (_, index) => <View key={`blank-${index}`} style={{ width: '14.28%', height: 42 }} />)}
            {Array.from({ length: days }, (_, index) => {
              const day = index + 1;
              const iso = localDate(month.getFullYear(), month.getMonth(), day);
              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  accessibilityLabel={iso}
                  onPress={() => { onChange(iso); setVisible(false); }}
                  style={{ width: '14.28%', height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: iso === value ? colors.green : 'transparent' }}
                >
                  <Txt style={{ color: iso === value ? colors.onPrimary : colors.ink, fontWeight: iso === value ? '800' : '500' }}>{day}</Txt>
                </Pressable>
              );
            })}
          </View>
          <Button label={t('Hoy', 'Today')} variant="secondary" onPress={() => { onChange(today); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setVisible(false); }} />
        </View>
      )}
    </View>
  );
}
