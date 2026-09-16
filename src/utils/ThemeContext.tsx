import React, { createContext, useContext, useState } from 'react';
import { darkColors, lightColors, typography, metrics, ThemeColors } from './theme';

type Theme = {
  colors: ThemeColors;
  typography: typeof typography;
  metrics: typeof metrics;
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const defaultTheme: Theme = {
  colors: darkColors,
  typography,
  metrics,
  isDarkMode: true,
  toggleTheme: () => {},
};

export const ThemeContext = createContext<Theme>(defaultTheme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const currentTheme: Theme = {
    colors: isDarkMode ? darkColors : lightColors,
    typography,
    metrics,
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={currentTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
