import { useEffect, useState } from "react";
import { Bird } from "../types";
import { getFavoriteIds, listBirds, toggleFavorite } from "../lib/store";
import { useToast } from "../contexts/ToastContext";
import { EmptyState, SkeletonCard, ErrorState } from "../components/StateViews";
import { Star, Bird as BirdIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

export default function Favorites() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { palette } = useTheme();
  const [birds, setBirds] = useState<Bird[] | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setBirds(null);
    Promise.all([listBirds(), getFavoriteIds()])
      .then(([all, favIds]) => setBirds(all.filter((b) => favIds.includes(b.id))))
      .catch(() => setError(true));
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    await toggleFavorite(id);
    setBirds((prev) => prev?.filter((b) => b.id !== id) ?? null);
    show("تمت إزالة الطائر من المفضلة", "success");
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-4 page-enter" dir="rtl">
      <h1 className="font-display font-black text-2xl">المفضلة</h1>

      {error && <ErrorState message="تعذّر تحميل المفضلة." onRetry={load} />}

      {!error && birds === null && (
        <div className="space-y-3">
          <SkeletonCard />
        </div>
      )}

      {!error && birds !== null && birds.length === 0 && (
        <EmptyState icon={Star} title="لا توجد طيور في المفضلة بعد" hint="افتح أي طائر واضغط زر الإضافة إلى المفضلة." />
      )}

      <div className="space-y-3">
        {birds?.map((b) => (
          <div key={b.id} className="border border-white/5 rounded-card p-3 flex items-center gap-3 shadow-lg shadow-black/10" style={{ backgroundColor: palette.surfaceCard }}>
            <button onClick={() => navigate(`/birds/${b.id}`)} className="press flex items-center gap-3 flex-1 text-right">
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: palette.surfaceRaised }}>
                {b.image_url ? (
                  <img src={b.image_url} className="w-full h-full object-cover" alt={b.name_ar} />
                ) : (
                  <BirdIcon size={22} style={{ color: palette.inkMuted }} strokeWidth={1.75} />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate" style={{ color: palette.inkPrimary }}>{b.name_ar}</p>
                <p className="text-xs truncate" style={{ color: palette.inkMuted }}>{b.name_en}</p>
              </div>
            </button>
            <button onClick={() => remove(b.id)} className="press px-2" style={{ color: palette.accent }}>
              <Star size={20} fill="currentColor" strokeWidth={0} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
