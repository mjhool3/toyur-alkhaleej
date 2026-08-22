import { ReactNode } from "react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * جميع النوافذ المنبثقة السفلية (bottom sheets) في التطبيق تمر من هنا.
 * الخلفيات هنا تُطبَّق عبر ألوان Hex فعلية قادمة من useTheme().palette، وليس عبر
 * متغيرات CSS (var(--x)) — ثبت أن الأخيرة لا تُطبَّق بشكل موثوق على بعض أجهزة
 * Android داخل Capacitor WebView. هذا الأسلوب هو المؤكد عمله على كل الأجهزة.
 */
export function BottomSheet({
  open,
  onClose,
  children,
  zIndex = 80,
  maxHeight,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  maxHeight?: string;
}) {
  const { palette } = useTheme();
  if (!open) return null;
  return (
    <div
      dir="rtl"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[28px] p-5 space-y-4 overflow-y-auto page-enter"
        style={{
          backgroundColor: palette.surfaceRaised,
          color: palette.inkPrimary,
          maxHeight: maxHeight ?? "88vh",
        }}
      >
        <div className="w-10 h-1.5 bg-white/15 rounded-pill mx-auto" />
        {children}
      </div>
    </div>
  );
}
