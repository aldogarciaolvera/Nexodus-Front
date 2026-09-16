export type ThemeColors = {
  obsidian: string;
  surface: string;
  surfaceLight: string;
  borderGlow: string;
  neonCyan: string;
  neonIce: string;
  mutedText: string;
  white: string;
  slate200: string;
  slate300: string;
  slate400: string;
  slate500: string;
  slate600: string;
  slate700: string;
  text: string;
  error: string;
};

export const darkColors: ThemeColors = {
  obsidian: '#0B0D11',
  surface: '#14171F',
  surfaceLight: '#1B202A',
  borderGlow: '#222836',
  neonCyan: '#38BDF8',
  neonIce: '#00F0FF',
  mutedText: '#8E95A5',
  white: '#FFFFFF', // Keep this as white for some accents
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  text: '#FFFFFF',
  error: '#FF3366', // vivid coral/pink-red for dark mode
};

export const lightColors: ThemeColors = {
  obsidian: '#F8FAFC', // Very light background
  surface: '#FFFFFF', // White cards
  surfaceLight: '#F1F5F9', // Slightly darker surface
  borderGlow: '#E2E8F0', // Light border
  neonCyan: '#0EA5E9', 
  neonIce: '#0284C7',
  mutedText: '#64748B',
  white: '#000000', // Inverse for text that was forced to white
  slate200: '#334155', // Inverted slate
  slate300: '#475569',
  slate400: '#64748B',
  slate500: '#94A3B8',
  slate600: '#CBD5E1',
  slate700: '#E2E8F0',
  text: '#0B0D11',
  error: '#E11D48', // deep rose for light mode
};

export const typography = {
  fontFamily: 'Geist_400Regular',
  fontFamilyMedium: 'Geist_500Medium',
  fontFamilyBold: 'Geist_700Bold',
  fontMono: 'JetBrainsMono_400Regular',
  fontMonoMedium: 'JetBrainsMono_500Medium',
};

export const metrics = {
  borderRadiusCard: 16,
  borderRadiusBadge: 9999,
  marginHorizontal: 20, 
};

// Default export for backward compatibility during transition
export const theme = {
  colors: darkColors,
  typography,
  metrics,
};
