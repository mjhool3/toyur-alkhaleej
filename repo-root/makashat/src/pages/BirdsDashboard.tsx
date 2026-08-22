import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, MapPin, Bird as BirdIcon, Hourglass, Target, Star, ChevronLeft } from "lucide-react";
import { COUNTRIES, CountryCode, Bird } from "../types";
import { listBirds, getFavoriteIds, isSupabaseConfigured } from "../lib/store";
import { BirdCard } from "../components/BirdCard";
import { SkeletonCard, EmptyState, ErrorState } from "../components/StateViews";
import { useTheme, Palette } from "../contexts/ThemeContext";

function daysRemaining(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function BirdsDashboard() {
  const navigate = useNavigate();
  const { palette } = useTheme();
  const [country, setCountry] = useState<CountryCode>("kw");
  const [birds, setBirds] = useState<Bird[] | null>(null);
  const [favCount, setFavCount] = useState(0);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  const load = () => {
    setError(false);
    setBirds(null);
    Promise.all([listBirds(), getFavoriteIds()])
      .then(([b, favs]) => {
        setBirds(b);
        setFavCount(favs.length);
      })
      .catch(() => setError(true));
  };

  useEffect(load, []);

  const upcoming = useMemo(
    () =>
      (birds ?? [])
        .filter((b) => b.windows.some((w) => w.country === country))
        .map((b) => ({ bird: b, win: b.windows.find((w) => w.country === country)! }))
        .filter(({ win }) => daysRemaining(win.start_date) >= 0)
        .sort((a, b) => a.win.start_date.localeCompare(b.win.start_date)),
    [birds, country]
  );

  const todayEntry = upcoming[0];
  const nextRemaining = todayEntry ? daysRemaining(todayEntry.win.start_date) : null;
  const speciesCount = new Set((birds ?? []).filter((b) => b.windows.some((w) => w.country === country)).map((b) => b.id)).size;
  const placesCount = new Set(
    (birds ?? [])
      .flatMap((b) => b.windows.filter((w) => w.country === country))
      .flatMap((w) => w.places)
  ).size;

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !birds) return [];
    return birds.filter((b) => b.name_ar.toLowerCase().includes(q) || b.name_en.toLowerCase().includes(q)).slice(0, 6);
  }, [query, birds]);

  return (
    <div className="pb-24 page-enter" dir="rtl">
      {/* رأس الصفحة */}
      <div className="px-4 pt-6 space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-display font-black text-2xl">مواعيد هجرة الطيور</h1>
            <p className="text-sm" style={{ color: palette.inkSecondary }}>تابع مواسم هجرة الطيور في الخليج بلحظتك</p>
          </div>
          <button
            onClick={() => navigate("/notifications")}
            aria-label="التنبيهات"
            className="press w-10 h-10 rounded-full border border-white/10 flex items-center justify-center shrink-0 shadow-md shadow-black/10"
            style={{ backgroundColor: palette.surfaceCard, color: palette.inkSecondary }}
          >
            <Bell size={18} strokeWidth={1.75} />
          </button>
        </header>

        {/* شريط بحث + اختيار الدولة */}
        <div className="relative">
          <div className="flex items-center gap-2 border border-white/10 rounded-pill px-4 py-2.5 shadow-md shadow-black/10" style={{ backgroundColor: palette.surfaceCard }}>
            <Search size={16} className="shrink-0" style={{ color: palette.inkMuted }} strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن طائر..."
              className="flex-1 bg-transparent text-sm focus:outline-none"
              style={{ color: palette.inkPrimary }}
            />
            <span className="flex items-center gap-1 text-xs border-r border-white/10 pr-2 mr-1 shrink-0" style={{ color: palette.inkMuted }}>
              <MapPin size={13} strokeWidth={1.75} />
              {COUNTRIES.find((c) => c.code === country)?.name_ar}
            </span>
          </div>
          {searchResults.length > 0 && (
            <div className="absolute z-20 mt-2 w-full border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/40" style={{ backgroundColor: palette.surfaceRaised }}>
              {searchResults.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setQuery("");
                    navigate(`/birds/${b.id}`);
                  }}
                  className="press w-full text-right px-4 py-2.5 text-sm border-b border-white/5 last:border-0"
                  style={{ color: palette.inkPrimary }}
                >
                  {b.name_ar} <span className="text-xs" style={{ color: palette.inkMuted }}>{b.name_en}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCountry(c.code)}
              className="press shrink-0 px-4 py-2 rounded-pill text-sm border transition-colors"
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
      </div>

      {error && (
        <div className="px-4 mt-6">
          <ErrorState message="تعذّر تحميل بيانات الطيور." onRetry={load} />
        </div>
      )}

      {!error && birds === null && (
        <div className="px-4 mt-6 space-y-3">
          <SkeletonCard />
        </div>
      )}

      {!error && birds !== null && (
        <>
          {/* بطاقة طائر اليوم البارزة */}
          {todayEntry ? (
            <button
              onClick={() => navigate(`/birds/${todayEntry.bird.id}`)}
              className="press block w-full mt-5 px-4"
            >
              <div className="relative rounded-card overflow-hidden aspect-[16/10] border border-white/10 shadow-xl shadow-black/30">
                {todayEntry.bird.image_url ? (
                  <img src={todayEntry.bird.image_url} className="w-full h-full object-cover" alt={todayEntry.bird.name_ar} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: palette.surfaceCard }}>
                    <BirdIcon size={56} style={{ color: palette.inkMuted }} strokeWidth={1.25} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span className="absolute top-3 right-3 text-[11px] font-bold px-3 py-1 rounded-pill shadow-md" style={{ backgroundColor: palette.accent, color: "#000" }}>
                  الطائر البارز اليوم
                </span>
                <div className="absolute bottom-0 inset-x-0 p-4 text-right">
                  <p className="text-white font-display font-black text-xl">{todayEntry.bird.name_ar}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-white/80 text-xs">
                      موعد المرور: {new Date(todayEntry.win.start_date).toLocaleDateString("ar-KW", { day: "numeric", month: "long" })}
                    </p>
                    <span className="text-sm font-bold" style={{ color: palette.accent }}>باقي {nextRemaining} يوم</span>
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <div className="px-4 mt-5">
              <EmptyState title="لا توجد بيانات هجرة لهذه الدولة بعد" hint="أضِف مواعيد الهجرة من لوحة التحكم." />
            </div>
          )}

          {/* شريط الإحصائيات */}
          <div className="grid grid-cols-4 gap-2 px-4 mt-5">
            <StatCard icon={Hourglass} label="أيام متبقية" value={nextRemaining ?? "—"} onClick={() => navigate("/migration")} palette={palette} />
            <StatCard
              icon={Target}
              label="أقرب هجرة"
              value={todayEntry ? new Date(todayEntry.win.start_date).toLocaleDateString("ar-KW", { day: "numeric", month: "short" }) : "—"}
              onClick={() => navigate("/migration")}
              palette={palette}
            />
            <StatCard icon={BirdIcon} label="الأنواع" value={speciesCount} onClick={() => navigate("/birds/all")} palette={palette} />
            <StatCard icon={Star} label="مفضلتي" value={favCount} onClick={() => navigate("/favorites")} palette={palette} />
          </div>

          {/* قائمة الهجرات القادمة */}
          {upcoming.length > 0 && (
            <section className="px-4 mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg">أبرز الهجرات القادمة</h2>
                <button onClick={() => navigate("/migration")} className="press flex items-center gap-0.5 text-xs font-semibold" style={{ color: palette.accent }}>
                  عرض الكل <ChevronLeft size={14} strokeWidth={2} />
                </button>
              </div>
              <div className="space-y-3">
                {upcoming.slice(0, 4).map(({ bird }) => (
                  <BirdCard key={bird.id} bird={bird} country={country} />
                ))}
              </div>
            </section>
          )}

          <div className="px-4 mt-4">
            <button
              onClick={() => navigate("/birds/all")}
              className="press w-full border border-white/5 rounded-card p-3 flex items-center justify-between shadow-md shadow-black/10"
              style={{ backgroundColor: palette.surfaceCard }}
            >
              <span className="font-semibold text-sm" style={{ color: palette.inkPrimary }}>عرض دليل الطيور الكامل</span>
              <ChevronLeft size={16} style={{ color: palette.inkMuted }} strokeWidth={2} />
            </button>
          </div>

          {placesCount > 0 && (
            <p className="px-4 mt-4 text-xs flex items-center gap-1" style={{ color: palette.inkMuted }}>
              <MapPin size={13} strokeWidth={1.75} />
              {placesCount} أماكن مشاهدة مسجّلة في {COUNTRIES.find((c) => c.code === country)?.name_ar}
            </p>
          )}

          {!isSupabaseConfigured && (
            <p className="mx-4 mt-4 text-xs leading-relaxed border border-white/5 rounded-card p-3" style={{ backgroundColor: palette.surfaceCard, color: palette.inkMuted }}>
              ⚠️ التطبيق يعمل حاليًا ببيانات محلية على جهازك (لم يتم ربط Supabase بعد). يمكنك تعديل
              الطيور ومواعيد الهجرة فعليًا من لوحة التحكم، وستبقى محفوظة على هذا الجهاز.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  onClick,
  palette,
}: {
  icon: typeof Bell;
  label: string;
  value: string | number;
  onClick: () => void;
  palette: Palette;
}) {
  return (
    <button
      onClick={onClick}
      className="press border border-white/5 rounded-2xl py-3 px-1 flex flex-col items-center gap-1.5 shadow-md shadow-black/10"
      style={{ backgroundColor: palette.surfaceCard }}
    >
      <Icon size={16} style={{ color: palette.accent }} strokeWidth={1.75} />
      <span className="font-display font-black text-sm" style={{ color: palette.inkPrimary }}>{value}</span>
      <span className="text-[10px] text-center leading-tight" style={{ color: palette.inkMuted }}>{label}</span>
    </button>
  );
}
