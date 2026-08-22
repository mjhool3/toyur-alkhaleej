import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Share2, Star, Bird as BirdIcon, CalendarDays, Hourglass, MapPin, Map as MapIcon } from "lucide-react";
import { Bird, COUNTRIES } from "../types";
import { getBird, getFavoriteIds, toggleFavorite } from "../lib/store";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/ThemeContext";
import { ErrorState } from "../components/StateViews";

function daysRemaining(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function statusLabel(start: string, end: string): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (now < s) return "قادمة";
  if (now >= s && now <= e) return "جارية الآن";
  return "انتهت";
}

export default function BirdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const { palette } = useTheme();
  const [bird, setBird] = useState<Bird | null | undefined>(undefined);
  const [isFav, setIsFav] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setError(false);
    Promise.all([getBird(id), getFavoriteIds()])
      .then(([b, favs]) => {
        setBird(b);
        setIsFav(favs.includes(id));
      })
      .catch(() => setError(true));
  }, [id]);

  const handleFavorite = async () => {
    if (!id) return;
    setPressed(true);
    setTimeout(() => setPressed(false), 200);
    const favs = await toggleFavorite(id);
    const nowFav = favs.includes(id);
    setIsFav(nowFav);
    show(nowFav ? "تمت الإضافة للمفضلة" : "تمت إزالة الطائر من المفضلة", "success");
  };

  const handleShare = async () => {
    if (!bird) return;
    const text = `${bird.name_ar} — تابع مواعيد هجرته في تطبيق مكشات`;
    if (navigator.share) {
      try {
        await navigator.share({ title: bird.name_ar, text });
      } catch {
        /* المستخدم أغلق نافذة المشاركة — لا حاجة لأي إجراء */
      }
    } else {
      show("المشاركة غير مدعومة على هذا الجهاز", "warning");
    }
  };

  if (error) return <div className="pt-10 px-4"><ErrorState message="تعذّر تحميل بيانات الطائر." /></div>;
  if (bird === undefined) {
    return (
      <div className="pb-24 pt-6 px-4 space-y-4 animate-pulse" dir="rtl">
        <div className="aspect-[4/3] rounded-card" style={{ backgroundColor: palette.surfaceCard }} />
        <div className="h-6 rounded w-1/2" style={{ backgroundColor: palette.surfaceCard }} />
        <div className="h-4 rounded w-full" style={{ backgroundColor: palette.surfaceCard }} />
      </div>
    );
  }
  if (bird === null) {
    return (
      <div className="pt-10 px-4 text-center" dir="rtl">
        <p style={{ color: palette.inkSecondary }}>لم يتم العثور على هذا الطائر.</p>
        <button onClick={() => navigate(-1)} className="press mt-4 text-sm" style={{ color: palette.accent }}>رجوع</button>
      </div>
    );
  }

  const primaryWindow = bird.windows[0];
  const remaining = primaryWindow ? daysRemaining(primaryWindow.start_date) : null;
  const places = Array.from(new Set(bird.windows.flatMap((w) => w.places)));

  return (
    <div className="pb-32 page-enter" dir="rtl">
      <div className="relative aspect-[4/3] flex items-center justify-center overflow-hidden" style={{ backgroundColor: palette.surfaceCard }}>
        {bird.image_url ? (
          <img src={bird.image_url} className="w-full h-full object-cover" alt={bird.name_ar} />
        ) : (
          <BirdIcon size={64} style={{ color: palette.inkMuted }} strokeWidth={1.25} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="press absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
        >
          <ChevronRight size={20} strokeWidth={2} />
        </button>
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <button
            onClick={handleShare}
            className="press w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
            aria-label="مشاركة"
          >
            <Share2 size={16} strokeWidth={2} />
          </button>
          <button
            onClick={handleFavorite}
            className={`press w-9 h-9 rounded-full backdrop-blur flex items-center justify-center transition-transform ${
              pressed ? "scale-125" : "scale-100"
            }`}
            style={isFav ? { backgroundColor: palette.accent, color: "#000" } : { backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}
            aria-label="المفضلة"
          >
            <Star size={16} strokeWidth={2} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-8 relative space-y-4">
        <div className="rounded-card p-4 space-y-4 border border-white/5 shadow-xl shadow-black/30" style={{ backgroundColor: palette.surfaceRaised }}>
          <div>
            <h1 className="font-display font-black text-xl" style={{ color: palette.inkPrimary }}>{bird.name_ar}</h1>
            <p className="text-sm" style={{ color: palette.inkMuted }}>{bird.name_en}</p>
          </div>

          {/* بطاقة إحصائيات ثلاثية — تاريخ / أيام متبقية / الحالة */}
          {primaryWindow && (
            <div className="grid grid-cols-3 gap-2 rounded-2xl p-3" style={{ backgroundColor: palette.surfaceCard }}>
              <div className="text-center">
                <p className="text-[10px] mb-1 flex items-center justify-center gap-1" style={{ color: palette.inkMuted }}>
                  <CalendarDays size={12} strokeWidth={1.75} /> تاريخ الهجرة
                </p>
                <p className="font-semibold text-sm" style={{ color: palette.inkPrimary }}>
                  {new Date(primaryWindow.start_date).toLocaleDateString("ar-KW", { day: "numeric", month: "long" })}
                </p>
              </div>
              <div className="text-center border-x border-white/10">
                <p className="text-[10px] mb-1 flex items-center justify-center gap-1" style={{ color: palette.inkMuted }}>
                  <Hourglass size={12} strokeWidth={1.75} /> أيام متبقية
                </p>
                <p className="font-display font-black text-lg" style={{ color: palette.accent }}>{remaining !== null && remaining >= 0 ? remaining : "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] mb-1" style={{ color: palette.inkMuted }}>الحالة</p>
                <p className="font-semibold text-sm" style={{ color: palette.inkPrimary }}>{statusLabel(primaryWindow.start_date, primaryWindow.end_date)}</p>
              </div>
            </div>
          )}

          {bird.description && (
            <div className="space-y-1">
              <h2 className="text-xs font-semibold" style={{ color: palette.inkSecondary }}>عن الطائر</h2>
              <p className="text-sm leading-relaxed" style={{ color: palette.inkSecondary }}>{bird.description}</p>
            </div>
          )}

          {places.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold flex items-center gap-1" style={{ color: palette.inkSecondary }}>
                <MapPin size={13} strokeWidth={1.75} /> أفضل أماكن المشاهدة
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {places.map((p) => (
                  <span key={p} className="border border-white/10 text-xs px-3 py-1.5 rounded-pill" style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-xs font-semibold" style={{ color: palette.inkSecondary }}>موعد الهجرة حسب الدولة</h2>
            {bird.windows.length === 0 && (
              <p className="text-sm" style={{ color: palette.inkMuted }}>لم تُضَف مواعيد هجرة لهذا الطائر بعد.</p>
            )}
            {bird.windows.map((w) => {
              const country = COUNTRIES.find((c) => c.code === w.country);
              const rem = daysRemaining(w.start_date);
              return (
                <div key={w.country} className="rounded-2xl p-3 flex items-center justify-between" style={{ backgroundColor: palette.surfaceCard }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: palette.inkPrimary }}>{country?.name_ar}</p>
                    <p className="text-xs" style={{ color: palette.inkMuted }}>
                      {new Date(w.start_date).toLocaleDateString("ar-KW", { day: "numeric", month: "long" })} —{" "}
                      {new Date(w.end_date).toLocaleDateString("ar-KW", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <span className="text-xs font-semibold shrink-0" style={{ color: palette.accent }}>
                    {rem >= 0 ? `باقي ${rem} يوم` : "بدأت"}
                  </span>
                </div>
              );
            })}
          </div>

          {bird.route.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold" style={{ color: palette.inkSecondary }}>مسار الهجرة</h2>
              <div className="flex items-center gap-1 flex-wrap text-xs" style={{ color: palette.inkSecondary }}>
                {bird.route.map((p, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="px-2 py-1 rounded-pill" style={{ backgroundColor: palette.surfaceCard }}>{p.label}</span>
                    {i < bird.route.length - 1 && <span style={{ color: palette.accent }}>←</span>}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navigate(`/map?bird=${bird.id}`)}
                className="press w-full text-center border border-white/10 rounded-pill py-2 text-sm font-semibold flex items-center justify-center gap-1.5"
                style={{ backgroundColor: palette.surfaceCard, color: palette.accent }}
              >
                <MapIcon size={15} strokeWidth={2} />
                عرض المسار على الخريطة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* زر مفضلة ثابت أسفل الشاشة — كما في المرجع */}
      <div
        className="fixed bottom-16 inset-x-0 px-4 pb-3 pt-2"
        style={{ background: `linear-gradient(to top, ${palette.surfaceBase}, ${palette.surfaceBase}, transparent)` }}
      >
        <button
          onClick={handleFavorite}
          className="press w-full py-3 rounded-pill font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
          style={isFav ? { backgroundColor: palette.surfaceCard, color: palette.inkSecondary, border: "1px solid rgba(255,255,255,0.15)" } : { backgroundColor: palette.accent, color: "#000" }}
        >
          <Star size={16} strokeWidth={2} fill={isFav ? "currentColor" : "none"} />
          <span>{isFav ? "تمت الإضافة للمفضلة" : "إضافة إلى المفضلة"}</span>
        </button>
      </div>
    </div>
  );
}
