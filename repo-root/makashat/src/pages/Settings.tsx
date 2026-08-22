import { AccentColor, FontSize, ThemeMode, useTheme } from "../contexts/ThemeContext";

const modes: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "فاتح" },
  { value: "dark", label: "داكن" },
  { value: "night", label: "ليلي" },
  { value: "system", label: "حسب الجهاز" },
];

const colors: { value: AccentColor; label: string; hex: string }[] = [
  { value: "gold", label: "ذهبي", hex: "#d4af37" },
  { value: "green", label: "أخضر", hex: "#2ea069" },
  { value: "blue", label: "أزرق", hex: "#3b82f6" },
  { value: "brown", label: "بني", hex: "#a5693c" },
  { value: "red", label: "أحمر", hex: "#d64541" },
];

const fontSizes: { value: FontSize; label: string }[] = [
  { value: "sm", label: "صغير" },
  { value: "md", label: "متوسط" },
  { value: "lg", label: "كبير" },
  { value: "xl", label: "كبير جدًا" },
];

export default function Settings() {
  const { mode, color, fontSize, reduceMotion, setMode, setColor, setFontSize, setReduceMotion, palette } = useTheme();

  return (
    <div className="pb-24 pt-6 px-4 space-y-8" dir="rtl">
      <h1 className="font-display font-black text-2xl">الإعدادات</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: palette.inkSecondary }}>المظهر</h2>
        <div className="grid grid-cols-2 gap-3">
          {modes.map((m) => {
            const selected = mode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className="press rounded-card py-3 text-sm font-semibold border"
                style={
                  selected
                    ? { borderColor: palette.accent, color: palette.accent, backgroundColor: `${palette.accent}1a` }
                    : { borderColor: "rgba(128,128,128,0.25)", backgroundColor: palette.surfaceCard, color: palette.inkSecondary }
                }
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: palette.inkSecondary }}>لون التطبيق</h2>
        <div className="flex gap-3">
          {colors.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              aria-label={c.label}
              className="press w-11 h-11 rounded-full border-2"
              style={{ backgroundColor: c.hex, borderColor: color === c.value ? palette.inkPrimary : "transparent" }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: palette.inkSecondary }}>حجم الخط</h2>
        <div className="grid grid-cols-4 gap-2">
          {fontSizes.map((f) => {
            const selected = fontSize === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFontSize(f.value)}
                className="press rounded-card py-2 text-xs font-semibold border"
                style={
                  selected
                    ? { borderColor: palette.accent, color: palette.accent }
                    : { borderColor: "rgba(128,128,128,0.25)", backgroundColor: palette.surfaceCard, color: palette.inkSecondary }
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      <section
        className="flex items-center justify-between rounded-card p-4 shadow-md shadow-black/10 border"
        style={{ backgroundColor: palette.surfaceCard, borderColor: "rgba(128,128,128,0.15)" }}
      >
        <div>
          <p className="font-semibold" style={{ color: palette.inkPrimary }}>تقليل الحركات</p>
          <p className="text-xs" style={{ color: palette.inkMuted }}>لتخفيف التأثيرات الحركية داخل التطبيق</p>
        </div>
        <button
          onClick={() => setReduceMotion(!reduceMotion)}
          className="press w-12 h-7 rounded-pill relative transition-colors"
          style={{ backgroundColor: reduceMotion ? palette.accent : "rgba(128,128,128,0.25)" }}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${
              reduceMotion ? "right-0.5" : "right-6"
            }`}
          />
        </button>
      </section>

      <p className="text-xs" style={{ color: palette.inkMuted }}>
        كل هذه الإعدادات تُحفظ فعليًا على جهازك (localStorage) وتبقى كما هي بعد إغلاق التطبيق وإعادة فتحه.
      </p>
    </div>
  );
}
