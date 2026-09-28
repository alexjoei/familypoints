export type ThemeId = 'pop' | 'calm' | 'night' | 'club';
export type Palette = {
  bg: string;
  ink: string;
  muted: string;
  green: string;
  mint: string;
  line: string;
  white: string;
  orange: string;
  peach: string;
  red: string;
  onPrimary: string;
  heroMuted: string;
  placeholder: string;
  positive: string;
  negative: string;
  waiting: string;
  positiveBg: string;
  negativeBg: string;
  waitingBg: string;
};
export type Theme = {
  id: ThemeId;
  name: [string, string];
  description: [string, string];
  dark: boolean;
  radius: number;
  titleSize: number;
  borderWidth: number;
  colors: Palette;
};
export const themes: Record<ThemeId, Theme> = {
  pop: {
    id: 'pop',
    name: ['Pop', 'Pop'],
    description: ['Lila, energía y cero solemnidad.', 'Lilac, energy, zero ceremony.'],
    dark: false,
    radius: 26,
    titleSize: 34,
    borderWidth: 1.5,
    colors: {
      bg: '#F5F1FF',
      ink: '#302541',
      muted: '#71637F',
      green: '#6541C9',
      mint: '#EAE0FF',
      line: '#DCD0EC',
      white: '#FFFFFF',
      orange: '#985426',
      peach: '#FFF0D9',
      red: '#AD3348',
      onPrimary: '#FFFFFF',
      heroMuted: '#EEE6FF',
      placeholder: '#80718D',
      positive: '#187442',
      negative: '#B73549',
      waiting: '#80611A',
      positiveBg: '#E0F5E6',
      negativeBg: '#FFE4E9',
      waitingBg: '#FFF2CF',
    },
  },
  calm: {
    id: 'calm',
    name: ['Calma', 'Calm'],
    description: ['Verde, crema y buen rollo.', 'Green, cream, good vibes.'],
    dark: false,
    radius: 22,
    titleSize: 32,
    borderWidth: 1,
    colors: {
      bg: '#F7F5EF',
      ink: '#243C35',
      muted: '#68756D',
      green: '#235846',
      mint: '#E2EBDC',
      line: '#DFE3D8',
      white: '#FFFFFF',
      orange: '#B14F32',
      peach: '#F8E6D9',
      red: '#AB3535',
      onPrimary: '#FFFFFF',
      heroMuted: '#DDE9D8',
      placeholder: '#78867C',
      positive: '#187442',
      negative: '#AD3535',
      waiting: '#80611A',
      positiveBg: '#E0F5E6',
      negativeBg: '#FFE4E9',
      waitingBg: '#FFF2CF',
    },
  },
  night: {
    id: 'night',
    name: ['Noche', 'Night'],
    description: ['Oscuro con un toque de lima.', 'After dark, with a twist of lime.'],
    dark: true,
    radius: 18,
    titleSize: 34,
    borderWidth: 1,
    colors: {
      bg: '#15191E',
      ink: '#F0F3E9',
      muted: '#AFBBB9',
      green: '#C2F474',
      mint: '#29372C',
      line: '#414B50',
      white: '#232B32',
      orange: '#FFBE85',
      peach: '#3F322A',
      red: '#FFACB4',
      onPrimary: '#1A2A18',
      heroMuted: '#354C24',
      placeholder: '#A2AFB0',
      positive: '#94E5B1',
      negative: '#FFACB4',
      waiting: '#F4D47F',
      positiveBg: '#213E2E',
      negativeBg: '#482B34',
      waitingBg: '#413B25',
    },
  },
  club: {
    id: 'club',
    name: ['Club', 'Club'],
    description: ['Rosa eléctrico, azul noche y actitud.', 'Electric pink, midnight blue, and attitude.'],
    dark: true,
    radius: 16,
    titleSize: 36,
    borderWidth: 1.5,
    colors: {
      bg: '#141329', ink: '#FFF8FE', muted: '#C3B7CE', green: '#FF5C9A',
      mint: '#332244', line: '#574663', white: '#211D38', orange: '#FFD16C',
      peach: '#403046', red: '#FF8A9C', onPrimary: '#211327', heroMuted: '#39264F',
      placeholder: '#B4A8BE', positive: '#A8F5C3', negative: '#FF9FAF',
      waiting: '#FFE092', positiveBg: '#254839', negativeBg: '#542E46', waitingBg: '#51442A',
    },
  },
};
export function isThemeId(value: unknown): value is ThemeId {
  return value === 'pop' || value === 'calm' || value === 'night' || value === 'club';
}
