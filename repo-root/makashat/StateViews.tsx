import { Bird, AlertTriangle, LucideIcon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export function SkeletonCard() {
  const { palette } = useTheme();
  return (
    <div className="rounded-card overflow-hidden border border-white/5 shadow-lg shadow-black/10 animate-pulse" style={{ backgroundColor: palette.surfaceCard }}>
      <div className="aspect-[16/9]" style={{ backgroundColor: palette.surfaceRaised }} />
      <div className="p-4 space-y-2">
        <div className="h-4 rounded w-2/3" style={{ backgroundColor: palette.surfaceRaised }} />
        <div className="h-3 rounded w-1/3" style={{ backgroundColor: palette.surfaceRaised }} />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Bird, title, hint }: { icon?: LucideIcon; title: string; hint?: string }) {
  const { palette } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 gap-3" style={{ color: palette.inkMuted }}>
      <div className="w-14 h-14 rounded-full border border-white/5 flex items-center justify-center" style={{ backgroundColor: palette.surfaceCard, color: palette.accent }}>
        <Icon size={26} strokeWidth={1.75} />
      </div>
      <p className="font-semibold" style={{ color: palette.inkSecondary }}>{title}</p>
      {hint && <p className="text-xs max-w-xs">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { palette } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 gap-3">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
        <AlertTriangle size={24} strokeWidth={1.75} />
      </div>
      <p className="text-sm max-w-xs" style={{ color: palette.inkSecondary }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="press font-semibold text-sm px-5 py-2 rounded-pill shadow-lg"
          style={{ backgroundColor: palette.accent, color: "#000" }}
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
