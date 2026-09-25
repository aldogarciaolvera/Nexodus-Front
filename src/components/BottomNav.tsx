import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../utils/ThemeContext';
import { ThemeColors } from '../utils/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const ICONS = {
  Dashboard: (active: boolean, colors: ThemeColors) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? colors.neonCyan : "currentColor"} color={colors.mutedText} strokeWidth={active ? 1.8 : 1.6}>
      <Path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </Svg>
  ),
  Tasks: (active: boolean, colors: ThemeColors) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? colors.neonCyan : "currentColor"} color={colors.mutedText} strokeWidth={active ? 1.8 : 1.6}>
      <Path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Svg>
  ),
  Gym: (active: boolean, colors: ThemeColors) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? colors.neonCyan : "currentColor"} color={colors.mutedText} strokeWidth={active ? 1.8 : 1.6}>
      <Path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9v6m3-8.25v10.5m0-10.5h1.5a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-1.5m10.5-10.5v10.5m0-10.5h-1.5a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h1.5m3-8.25v6" />
    </Svg>
  ),
  Meals: (active: boolean, colors: ThemeColors) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? colors.neonCyan : "currentColor"} color={colors.mutedText} strokeWidth={active ? 1.8 : 1.6}>
      <Path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </Svg>
  ),
  Money: (active: boolean, colors: ThemeColors) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? colors.neonCyan : "currentColor"} color={colors.mutedText} strokeWidth={active ? 1.8 : 1.6}>
      <Rect width="20" height="12" x="2" y="6" rx="2" />
      <Circle cx="12" cy="12" r="2" />
      <Path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.01M18 12h.01" />
    </Svg>
  ),
  Journal: (active: boolean, colors: ThemeColors) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? colors.neonCyan : "currentColor"} color={colors.mutedText} strokeWidth={active ? 1.8 : 1.6}>
      <Path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </Svg>
  ),
};

const LABELS = {
  Dashboard: 'Home',
  Tasks: 'Tasks',
  Gym: 'Gym',
  Meals: 'Meals',
  Money: 'Money',
  Journal: 'Journal',
};

export const BottomNav = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const theme = useTheme();
  const { isDarkMode } = theme;
  const styles = createStyles(theme.colors, isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity 
              key={route.key}
              style={styles.tabItem} 
              activeOpacity={0.7}
              onPress={onPress}
            >
              <View style={styles.iconContainer}>
                {ICONS[route.name as keyof typeof ICONS](isFocused, theme.colors)}
                {isFocused && <View style={styles.iconGlow} />}
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {LABELS[route.name as keyof typeof LABELS]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24, // Account for safe area roughly
    paddingTop: 10,
    backgroundColor: isDarkMode ? 'rgba(16, 19, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? 'rgba(34, 40, 54, 0.8)' : 'rgba(226, 232, 240, 0.8)',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: 12,
    zIndex: -1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.mutedText,
    letterSpacing: 0.5,
    fontFamily: 'Geist_400Regular',
  },
  tabLabelActive: {
    fontWeight: '600',
    color: colors.neonCyan,
  },
});
