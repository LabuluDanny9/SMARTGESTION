import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('smart-gestion-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute('data-bs-theme', 'dark');
      root.classList.add('dark');
      localStorage.setItem('smart-gestion-theme', 'dark');
    } else {
      root.setAttribute('data-bs-theme', 'light');
      root.classList.remove('dark');
      localStorage.setItem('smart-gestion-theme', 'light');
    }
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme: () => setDark((d) => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { dark: false, toggleTheme: () => {} };
  return ctx;
}
