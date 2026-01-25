import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  isEnabled: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "point-my-story-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "light"; // Default to light for consistency
}

interface ThemeProviderProps {
  children: React.ReactNode;
  isSignedIn?: boolean;
}

export function ThemeProvider({ children, isSignedIn = false }: ThemeProviderProps) {
  // Always start with light theme for SSR consistency
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Dark mode is only enabled for signed-in users
  const isEnabled = isSignedIn;

  // Initialize theme from localStorage on mount (only if signed in)
  useEffect(() => {
    setMounted(true);
    if (isEnabled) {
      const stored = getStoredTheme();
      setThemeState(stored);
    }
  }, [isEnabled]);

  // Update resolved theme and apply to document
  useEffect(() => {
    if (!mounted) return;

    // Non-signed-in users always get light mode
    if (!isEnabled) {
      setResolvedTheme("light");
      document.documentElement.classList.remove("dark");
      return;
    }

    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    // Apply theme to document
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, mounted, isEnabled]);

  // Listen for system theme changes (only if signed in and using system theme)
  useEffect(() => {
    if (!mounted || !isEnabled || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? "dark" : "light");
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted, isEnabled]);

  const setTheme = (newTheme: Theme) => {
    if (!isEnabled) return; // Ignore if not signed in
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, isEnabled }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
