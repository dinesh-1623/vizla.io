import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('vizla-theme', newTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  useEffect(() => {
    // Read from localStorage first
    const savedTheme = localStorage.getItem('vizla-theme') as Theme;
    
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setThemeState(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
    } else {
      // If no saved theme, check system preference
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      const systemTheme: Theme = prefersLight ? 'light' : 'dark';
      
      setThemeState(systemTheme);
      document.documentElement.dataset.theme = systemTheme;
      localStorage.setItem('vizla-theme', systemTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};



