import { Bird as BirdType, CountryCode } from "../types";
import { useNavigate } from "react-router-dom";
import { Bird as BirdIcon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

function daysRemaining(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function BirdCard({ bird, country }: { bird: BirdType; country: CountryCode }) {
  const navigate = useNavigate();
  const { palette } = useTheme();
  const win = bird.windows.find((w) => w.country === country) ?? bird.windows[0];
  const remaining = win ? daysRemaining(win.start_date) : null;

  return (
    <button
      onClick={() => navigate(`/birds/${bird.id}`)}
      className="press w-full text-right rounded-card border border-white/5 p-3 flex items-center gap-3 shadow-lg shadow-black/10 active:shadow-none transition-shadow"
      style={{ backgroundColor: palette.surfaceCard }}
    >
      {/* رقم الأيام المتبقية البارز — أول ما تقع عليه العين، كما في المرجع */}
      <div className="shrink-0 w-16 text-center">
        <p className="font-display font-black text-2xl leading-none" style={{ color: palette.accent }}>
          {remaining !== null && remaining >= 0 ? remaining : "—"}
        </p>
        <p className="text-[10px] mt-1" style={{ color: palette.inkMuted }}>يوم متبقي</p>
      </div>

      <div className="w-px self-stretch bg-white/10" />

      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-base truncate" style={{ color: palette.inkPrimary }}>{bird.name_ar}</h3>
        {win && (
          <p className="text-xs mt-0.5" style={{ color: palette.inkSecondary }}>
            {new Date(win.start_date).toLocaleDateString("ar-KW", { day: "numeric", month: "long" })}
          </p>
        )}
      </div>

      <div
        className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-white/10"
        style={{ backgroundColor: palette.surfaceRaised }}
      >
        {bird.image_url ? (
          <img
            src={bird.image_url}
            loading="lazy"
            className="w-full h-full object-cover"
            alt={bird.name_ar}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <BirdIcon size={24} style={{ color: palette.inkMuted }} strokeWidth={1.75} />
        )}
      </div>
    </button>
  );
}
