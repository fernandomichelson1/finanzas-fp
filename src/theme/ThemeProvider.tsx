import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ThemeMode } from '@/types/domain';

const STORAGE_KEY = 'finanzas-fp:theme';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitial(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* SSR / storage bloqueado */
  }
  return 'dark'; // default del README
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.colorScheme = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* noop */
    }
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggle = useCallback(() => setModeState((m) => (m === 'dark' ? 'light' : 'dark')), []);

  return <ThemeContext.Provider value={{ mode, setMode, toggle }}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
