import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bird as BirdIcon } from "lucide-react";
import { COUNTRIES, CountryCode, MigrationSeason, Bird } from "../types";
import { listBirds } from "../lib/store";
import { SkeletonCard, EmptyState, ErrorState } from "../components/StateViews";
import { useTheme, Palette } from "../contexts/ThemeContext";

function daysRemaining(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function statusOf(start: string, end: string, palette: Palette): { label: string; color: string; key: "upcoming" | "active" | "ended" } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (now < s) return { label: "قادمة", color: palette.accent, key: "upcoming" };
  if (now >= s && now <= e) return { label: "جارية الآن", color: "#4ade80", key: "active" };
  return { label: "انتهت", color: palette.inkMuted, key: "ended" };
}

export default function Migration() {
  const navigate = useNavigate();
  const { palette } = useTheme();
  const [country, setCountry] = useState<CountryCode>("kw");
  const [season, setSeason] = useState<MigrationSeason | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "ended">("all");
  const [query, setQuery] = useState("");
  const [birds, setBirds] = useState<Bird[] | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setBirds(null);
    listBirds().then(setBirds).catch(() => setError(true));
  };
  useEffect(load, []);

  const rows = useMemo(() => {
    if (!birds) return [];
    return birds
      .filter((b) => b.windows.some((w) => w.country === country))
      .filter((b) => season === "all" || b.season === season)
      .filter(
        (b) =>
          query.trim() === "" ||
          b.name_ar.includes(query.trim()) ||
          b.name_en.toLowerCase().includes(query.trim().toLowerCase())
      )
      .map((b) => ({ bird: b, win: b.windows.find((w) => w.country === country)! }))
      .filter(({ win }) => {
        if (statusFilter === "all") return true;
        const st = statusOf(win.start_date, win.end_date, palette);
        if (statusFilter === "upcoming") return st.key === "upcoming" || st.key === "active";
        return st.key === "ended";
      })
      .sort((a, b) => a.win.start_date.localeCompare(b.win.start_date));
  }, [birds, country, season, query, statusFilter, palette]);

  return (
    <div className="pb-24 pt-6 px-4 space-y-5 page-enter" dir="rtl">
      <h1 className="font-display font-black text-2xl">مواعيد هجرة الطيور</h1>

      {/* تبويبات الحالة — الكل / القادمة / منتهية، بنفس أسلوب المرجع */}
      <div className="flex gap-2 border border-white/5 rounded-pill p-1" style={{ backgroundColor: palette.surfaceCard }}>
        {(["all", "ended", "upcoming"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="press flex-1 py-2 rounded-pill text-sm font-semibold transition-colors"
            style={
              statusFilter === s
                ? { backgroundColor: palette.accent, color: "#000" }
                : { color: palette.inkSecondary }
            }
          >
            {s === "all" ? "الكل" : s === "upcoming" ? "القادمة" : "منتهية"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => setCountry(c.code)}
            className="press shrink-0 px-4 py-2 rounded-pill text-sm border"
            style={
              country === c.code
                ? { backgroundColor: palette.accent, color: "#000", borderColor: palette.accent, fontWeight: 600 }
                : { backgroundColor: palette.surfaceCard, color: palette.inkSecondary, borderColor: "rgba(128,128,128,0.2)" }
            }
          >
            {c.name_ar}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(["all", "autumn", "spring"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeason(s)}
            className="press px-3 py-1.5 rounded-pill text-xs border"
            style={
              season === s
                ? { borderColor: palette.accent, color: palette.accent }
                : { borderColor: "rgba(128,128,128,0.2)", color: palette.inkSecondary }
            }
          >
            {s === "all" ? "كل المواسم" : s === "autumn" ? "الخريف" : "الربيع"}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: palette.inkMuted }} strokeWidth={1.75} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن طائر..."
          className="w-full border border-white/10 rounded-pill pr-10 pl-4 py-2.5 text-sm focus:outline-none"
          style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }}
        />
      </div>

      {error && <ErrorState message="تعذّر تحميل مواعيد الهجرة." onRetry={load} />}

      {!error && birds === null && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!error && birds !== null && rows.length === 0 && (
        <EmptyState title="لا توجد نتائج مطابقة" hint="جرّب دولة أو موسمًا مختلفًا، أو أضف مواعيد جديدة من لوحة التحكم." />
      )}

      <div className="space-y-3">
        {rows.map(({ bird, win }) => {
          const remaining = daysRemaining(win.start_date);
          const st = statusOf(win.start_date, win.end_date, palette);
          return (
            <button
              key={bird.id}
              onClick={() => navigate(`/birds/${bird.id}`)}
              className="press w-full text-right border border-white/5 rounded-card p-3 flex items-center gap-3 shadow-md shadow-black/10"
              style={{ backgroundColor: palette.surfaceCard }}
            >
              <div className="shrink-0 w-14 text-center">
                <p className="font-display font-black text-xl leading-none" style={{ color: palette.accent }}>
                  {remaining >= 0 ? remaining : "—"}
                </p>
                <p className="text-[9px] mt-1" style={{ color: palette.inkMuted }}>يوم</p>
              </div>
              <div className="w-px self-stretch bg-white/10" />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold truncate" style={{ color: palette.inkPrimary }}>{bird.name_ar}</h3>
                  <span className="text-[11px] font-semibold shrink-0" style={{ color: st.color }}>{st.label}</span>
                </div>
                <p className="text-xs" style={{ color: palette.inkSecondary }}>
                  {new Date(win.start_date).toLocaleDateString("ar-KW", { day: "numeric", month: "long" })}
                  {" — "}
                  {new Date(win.end_date).toLocaleDateString("ar-KW", { day: "numeric", month: "long" })}
                </p>
                {win.places.length > 0 && (
                  <p className="text-[11px] truncate" style={{ color: palette.inkMuted }}>أماكن المشاهدة: {win.places.join("، ")}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-white/10" style={{ backgroundColor: palette.surfaceRaised }}>
                {bird.image_url ? (
                  <img src={bird.image_url} className="w-full h-full object-cover" alt={bird.name_ar} loading="lazy" />
                ) : (
                  <BirdIcon size={18} style={{ color: palette.inkMuted }} strokeWidth={1.75} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
