import { safeId } from "../lib/safeId";
import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, LucideIcon } from "lucide-react";
import { useTheme } from "./ThemeContext";

type ToastKind = "success" | "error" | "warning";
interface ToastItem {
  id: string;
  text: string;
  kind: ToastKind;
}

interface ToastContextValue {
  show: (text: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const { palette } = useTheme();

  const show = useCallback((text: string, kind: ToastKind = "success") => {
    const id = safeId();
    setItems((list) => [...list, { id, text, kind }]);
    setTimeout(() => {
      setItems((list) => list.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const iconFor: Record<ToastKind, LucideIcon> = { success: CheckCircle2, error: XCircle, warning: AlertTriangle };
  const iconColorFor: Record<ToastKind, string> = { success: palette.accent, error: "#f87171", warning: "#facc15" };
  const borderColorFor: Record<ToastKind, string> = { success: `${palette.accent}66`, error: "#ef444466", warning: "#eab30866" };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div dir="rtl" className="fixed bottom-24 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {items.map((t) => {
          const Icon = iconFor[t.kind];
          return (
            <div
              key={t.id}
              className="pointer-events-auto max-w-sm w-full border rounded-card px-4 py-3 shadow-xl shadow-black/30 flex items-center gap-2 text-sm animate-[toastIn_180ms_ease-out]"
              style={{ backgroundColor: palette.surfaceRaised, color: palette.inkPrimary, borderColor: borderColorFor[t.kind] }}
            >
              <Icon size={17} className="shrink-0" style={{ color: iconColorFor[t.kind] }} strokeWidth={2} />
              <span>{t.text}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
