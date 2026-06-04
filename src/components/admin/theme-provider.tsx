"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Tiny in-house theme provider — replaces the `next-themes` dependency
 * so we don't render a `<script>` tag inside a React component (which
 * React 19 / Next.js 16 throws a Console Error for). Same surface as
 * before: light/dark switch, useTheme hook, localStorage persistence.
 *
 * Trade-off: one paint flash to "light" before useEffect applies the
 * stored "dark". For an admin panel that's invisible to customers,
 * that's an acceptable cost.
 */

type Theme = "light" | "dark";

const STORAGE_KEY = "app-admin-theme";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({
  theme: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    try {
      const stored =
        (window.localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "light";
      setThemeState(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    } catch {
      // localStorage unavailable (private mode etc.) — stay on light
    }
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
