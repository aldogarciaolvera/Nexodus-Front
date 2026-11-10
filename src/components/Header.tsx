import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { ThemeColors } from '../utils/theme';
import { DropdownMenu } from './DropdownMenu';
import { AppNavigationProp } from '../utils/navigation';

export interface HeaderDotsConfig {
  total: number;
  active: number; // 0-based
  onPressDot?: (index: number) => void;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  dots?: HeaderDotsConfig;
}

export const Header = ({ title = "Nexodus", dots }: HeaderProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<AppNavigationProp>();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuOptions = [
    {
      label: 'Configuración',
      onPress: () => navigation.navigate('Settings'),
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.colors.mutedText} strokeWidth={1.5}>
          <Path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <Path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </Svg>
      )
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithDots}>
          <Text style={styles.welcomeText} numberOfLines={1}>{title}</Text>
          {dots && dots.total > 1 && (
            <View style={styles.dotsRow}>
              {Array.from({ length: dots.total }).map((_, idx) => {
                const isActive = idx === dots.active;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    disabled={!dots.onPressDot}
                    onPress={() => dots.onPressDot?.(idx)}
                    hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Cambiar a vista ${idx + 1}`}
                  >
                    <View
                      style={[
                        styles.dot,
                        isActive
                          ? { backgroundColor: theme.colors.neonCyan, width: 14 }
                          : { backgroundColor: theme.colors.surfaceLight, width: 6 },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity 
            style={styles.profileButton} 
            activeOpacity={0.8}
            onPress={() => setMenuVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de configuración y perfil"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.colors.mutedText} strokeWidth={1.5}>
              <Path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <DropdownMenu 
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        options={menuOptions}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleWithDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.text,
    fontFamily: 'Geist_500Medium',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.mutedText,
    fontFamily: 'Geist_400Regular',
    letterSpacing: 0.5,
  },
});
