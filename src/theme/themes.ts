export type ThemeId = 'pop' | 'calm' | 'night' | 'cool';
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
  cool: {
    id: 'cool',
    name: ['Cool', 'Cool'],
    description: ['Azul eléctrico, violeta y un toque de sol.', 'Electric blue, violet and a little sunshine.'],
    dark: false,
    radius: 20,
    titleSize: 35,
    borderWidth: 1.5,
    colors: {
      bg: '#EAF3FF', ink: '#132A68', muted: '#5A6C99', green: '#2456F5',
      mint: '#D8E7FF', line: '#B9CCFF', white: '#FFFFFF', orange: '#A96700',
      peach: '#FFF2C7', red: '#BD3659', onPrimary: '#FFFFFF', heroMuted: '#C9DEFF',
      placeholder: '#6577A3', positive: '#156A56', negative: '#B52E56',
      waiting: '#886100', positiveBg: '#D6F6E9', negativeBg: '#FFE1E9', waitingBg: '#FFF2C2',
    },
  },
};
export function isThemeId(value: unknown): value is ThemeId {
  return value === 'pop' || value === 'calm' || value === 'night' || value === 'cool';
}
