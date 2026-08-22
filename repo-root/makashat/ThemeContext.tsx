import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "night" | "system";
export type AccentColor = "gold" | "green" | "blue" | "brown" | "red";
export type FontSize = "sm" | "md" | "lg" | "xl";

interface ThemeState {
  mode: ThemeMode;
  color: AccentColor;
  fontSize: FontSize;
  reduceMotion: boolean;
}

export interface Palette {
  surfaceBase: string;
  surfaceRaised: string;
  surfaceCard: string;
  inkPrimary: string;
  inkSecondary: string;
  inkMuted: string;
  accent: string;
}

interface ThemeContextValue extends ThemeState {
  setMode: (m: ThemeMode) => void;
  setColor: (c: AccentColor) => void;
  setFontSize: (s: FontSize) => void;
  setReduceMotion: (v: boolean) => void;
  resolvedMode: Exclude<ThemeMode, "system">; // القيمة الفعلية بعد حل "System"
  palette: Palette; // ألوان فعلية جاهزة (Hex) — تُستخدم عبر style مباشرة في كل مكان حرج
}

const STORAGE_KEY = "makashat.theme.v1";

const defaultState: ThemeState = {
  mode: "dark",
  color: "gold",
  fontSize: "md",
  reduceMotion: false,
};

/**
 * ⚠️ ملاحظة مهمة جدًا لأي تعديل مستقبلي:
 * لا تعتمد على متغيرات CSS (custom properties) لأي لون حرج في هذا المشروع.
 * ثبت عمليًا أن بعض أجهزة Android (WebView قديم/غير محدَّث) لا تطبّق قيم
 * `var(--x)` بشكل موثوق داخل Capacitor WebView، حتى عند استخدامها مباشرة عبر
 * style ولي س فقط عبر كلاسات Tailwind. لذلك كل الألوان هنا نصوص Hex ثابتة
 * تُحسب في JavaScript وتُمرَّر عبر style={{...}} مباشرة في كل مكوّن، بلا أي
 * وسيط CSS. هذا الأسلوب هو الوحيد المؤكد عمله على كل الأجهزة حتى الآن.
 */
const PALETTES: Record<Exclude<ThemeMode, "system">, Omit<Palette, "accent">> = {
  dark: {
    surfaceBase: "#0a0c12",
    surfaceRaised: "#11141d",
    surfaceCard: "#161a25",
    inkPrimary: "#ffffff",
    inkSecondary: "#b0b6c1",
    inkMuted: "#7a818d",
  },
  night: {
    surfaceBase: "#030407",
    surfaceRaised: "#090a0e",
    surfaceCard: "#0d0f14",
    inkPrimary: "#ebecf0",
    inkSecondary: "#969ba5",
    inkMuted: "#5f646e",
  },
  light: {
    surfaceBase: "#f7f7f9",
    surfaceRaised: "#ffffff",
    surfaceCard: "#ffffff",
    inkPrimary: "#14161c",
    inkSecondary: "#5a606b",
    inkMuted: "#8c919b",
  },
};

const ACCENTS: Record<AccentColor, string> = {
  gold: "#d4af37",
  green: "#2ea069",
  blue: "#3b82f6",
  brown: "#a5693c",
  red: "#d64541",
};

const FONT_SIZES: Record<FontSize, string> = { sm: "14px", md: "16px", lg: "18px", xl: "20px" };

function loadState(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function getSystemPrefersDark(): boolean {
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true;
  } catch {
    return true;
  }
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState>(loadState);

  const resolvedMode = useMemo<Exclude<ThemeMode, "system">>(() => {
    if (state.mode !== "system") return state.mode;
    return getSystemPrefersDark() ? "dark" : "light";
  }, [state.mode]);

  const palette: Palette = useMemo(
    () => ({ ...PALETTES[resolvedMode], accent: ACCENTS[state.color] }),
    [resolvedMode, state.color]
  );

  // حفظ فعلي في كل مرة يتغير فيها أي إعداد — يبقى بعد إغلاق التطبيق
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // تجاهل بأمان بدل تعطيل التطبيق
    }
  }, [state]);

  // التطبيق الفعلي: مباشرة على body/html عبر JS، وليس عبر متغيرات CSS
  useEffect(() => {
    document.body.style.backgroundColor = palette.surfaceBase;
    document.body.style.color = palette.inkPrimary;
    document.documentElement.style.fontSize = FONT_SIZES[state.fontSize];
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
    document.documentElement.setAttribute("data-reduce-motion", String(state.reduceMotion));
    // نُبقي data-mode/data-color أيضًا لأي CSS تكميلي قديم، لكنها لم تعد المصدر الوحيد
    document.documentElement.setAttribute("data-mode", resolvedMode);
    document.documentElement.setAttribute("data-color", state.color);
  }, [palette, resolvedMode, state.color, state.fontSize, state.reduceMotion]);

  // متابعة تغيّر إعداد النظام لحظيًا عند اختيار "System"
  useEffect(() => {
    if (state.mode !== "system") return;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    try {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => setState((s) => ({ ...s })); // إعادة حساب resolvedMode
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } catch {
      return;
    }
  }, [state.mode]);

  const value: ThemeContextValue = {
    ...state,
    resolvedMode,
    palette,
    setMode: (m) => setState((s) => ({ ...s, mode: m })),
    setColor: (c) => setState((s) => ({ ...s, color: c })),
    setFontSize: (fs) => setState((s) => ({ ...s, fontSize: fs })),
    setReduceMotion: (v) => setState((s) => ({ ...s, reduceMotion: v })),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
