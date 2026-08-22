import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bird as BirdIcon, ChevronRight } from "lucide-react";
import { Bird } from "../types";
import { listBirds } from "../lib/store";
import { SkeletonCard, EmptyState, ErrorState } from "../components/StateViews";
import { useTheme } from "../contexts/ThemeContext";

export default function Birds() {
  const navigate = useNavigate();
  const { palette } = useTheme();
  const [birds, setBirds] = useState<Bird[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  const load = () => {
    setError(false);
    setBirds(null);
    listBirds().then(setBirds).catch(() => setError(true));
  };
  useEffect(load, []);

  const results = useMemo(() => {
    if (!birds) return [];
    const q = query.trim().toLowerCase();
    if (!q) return birds;
    return birds.filter((b) => b.name_ar.toLowerCase().includes(q) || b.name_en.toLowerCase().includes(q));
  }, [birds, query]);

  return (
    <div className="pb-24 pt-6 px-4 space-y-5 page-enter" dir="rtl">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/birds")}
          aria-label="رجوع"
          className="press w-9 h-9 rounded-full border border-white/10 flex items-center justify-center shrink-0"
          style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }}
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
        <h1 className="font-display font-black text-2xl">دليل الطيور</h1>
      </div>

      <div className="relative">
        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: palette.inkMuted }} strokeWidth={1.75} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم بالعربي أو الإنجليزي..."
          className="w-full border border-white/10 rounded-pill pr-10 pl-4 py-2.5 text-sm focus:outline-none"
          style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }}
        />
      </div>

      {error && <ErrorState message="تعذّر تحميل قائمة الطيور." onRetry={load} />}

      {!error && birds === null && (
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!error && birds !== null && results.length === 0 && (
        <EmptyState title="لا توجد نتائج" hint="جرّب كلمة بحث أخرى." />
      )}

      <div className="grid grid-cols-2 gap-3">
        {results.map((b) => (
          <button
            key={b.id}
            onClick={() => navigate(`/birds/${b.id}`)}
            className="press border border-white/5 rounded-card overflow-hidden text-right shadow-md shadow-black/10"
            style={{ backgroundColor: palette.surfaceCard }}
          >
            <div className="aspect-square flex items-center justify-center overflow-hidden" style={{ backgroundColor: palette.surfaceRaised }}>
              {b.image_url ? (
                <img src={b.image_url} className="w-full h-full object-cover" alt={b.name_ar} loading="lazy" />
              ) : (
                <BirdIcon size={30} style={{ color: palette.inkMuted }} strokeWidth={1.25} />
              )}
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm truncate" style={{ color: palette.inkPrimary }}>{b.name_ar}</p>
              <p className="text-xs truncate" style={{ color: palette.inkMuted }}>{b.name_en}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
