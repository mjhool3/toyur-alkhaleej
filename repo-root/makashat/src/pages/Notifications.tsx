import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft } from "lucide-react";
import { Bird } from "../types";
import { getFavoriteIds, getNotificationSettings, listBirds, setNotificationSettings, NotificationSettings } from "../lib/store";
import { useToast } from "../contexts/ToastContext";
import { EmptyState, SkeletonCard } from "../components/StateViews";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

function daysRemaining(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Notifications() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { palette } = useTheme();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [birds, setBirds] = useState<Bird[] | null>(null);
  const [favIds, setFavIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([getNotificationSettings(), listBirds(), getFavoriteIds()]).then(([s, b, f]) => {
      setSettings(s);
      setBirds(b);
      setFavIds(f);
    });
  }, []);

  const alerts = useMemo(() => {
    if (!birds || !settings) return [];
    const source = favIds.length > 0 ? birds.filter((b) => favIds.includes(b.id)) : birds;
    const list: { bird: Bird; country: string; days: number }[] = [];
    source.forEach((b) => {
      b.windows.forEach((w) => {
        const d = daysRemaining(w.start_date);
        if (d >= 0 && d <= settings.daysBefore) {
          list.push({ bird: b, country: w.country, days: d });
        }
      });
    });
    return list.sort((a, b) => a.days - b.days);
  }, [birds, settings, favIds]);

  const toggleEnabled = async () => {
    if (!settings) return;
    const next = { ...settings, enabled: !settings.enabled };
    setSettings(next);
    await setNotificationSettings(next);
    show(next.enabled ? "تم تفعيل التنبيهات" : "تم إيقاف التنبيهات", "success");
  };

  const setDays = async (days: number) => {
    if (!settings) return;
    const next = { ...settings, daysBefore: days };
    setSettings(next);
    await setNotificationSettings(next);
  };

  const testNotification = async () => {
    if (!("Notification" in window)) {
      show("المتصفح الحالي لا يدعم الإشعارات.", "warning");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      new Notification("مكشات", { body: "هذا تنبيه تجريبي — التنبيهات الفعلية تعمل بنفس الطريقة." });
      show("تم إرسال تنبيه تجريبي", "success");
    } else {
      show("لم يتم منح إذن الإشعارات", "warning");
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-5 page-enter" dir="rtl">
      <h1 className="font-display font-black text-2xl">التنبيهات</h1>

      <div className="border border-white/5 rounded-card p-4 flex items-center justify-between" style={{ backgroundColor: palette.surfaceCard }}>
        <div>
          <p className="font-semibold" style={{ color: palette.inkPrimary }}>تفعيل التنبيهات</p>
          <p className="text-xs" style={{ color: palette.inkMuted }}>تنبيه قبل موعد الهجرة</p>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={!settings}
          className="press w-12 h-7 rounded-pill relative transition-colors"
          style={{ backgroundColor: settings?.enabled ? palette.accent : "rgba(128,128,128,0.25)" }}
        >
          <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${settings?.enabled ? "right-0.5" : "right-6"}`} />
        </button>
      </div>

      {settings?.enabled && (
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: palette.inkSecondary }}>التنبيه قبل:</span>
          {[3, 7, 14].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="press px-3 py-1.5 rounded-pill text-xs border"
              style={
                settings.daysBefore === d
                  ? { borderColor: palette.accent, color: palette.accent }
                  : { borderColor: "rgba(128,128,128,0.2)", color: palette.inkSecondary }
              }
            >
              {d} أيام
            </button>
          ))}
        </div>
      )}

      <button
        onClick={testNotification}
        className="press w-full border border-white/10 rounded-pill py-2.5 text-sm font-semibold"
        style={{ backgroundColor: palette.surfaceCard, color: palette.accent }}
      >
        تجربة إشعار الآن
      </button>

      <div className="space-y-2">
        <h2 className="text-xs font-semibold" style={{ color: palette.inkSecondary }}>تنبيهات قادمة {favIds.length > 0 ? "(للمفضلة)" : ""}</h2>

        {(birds === null || settings === null) && <SkeletonCard />}

        {birds !== null && settings !== null && (!settings.enabled || alerts.length === 0) && (
          <EmptyState
            icon={Bell}
            title={!settings.enabled ? "التنبيهات متوقفة حاليًا" : "لا توجد هجرات قريبة ضمن المدة المحددة"}
          />
        )}

        {settings?.enabled &&
          alerts.map(({ bird, country, days }) => (
            <button
              key={bird.id + country}
              onClick={() => navigate(`/birds/${bird.id}`)}
              className="press w-full text-right border border-white/5 rounded-card p-3 flex items-center justify-between shadow-md shadow-black/10"
              style={{ backgroundColor: palette.surfaceCard }}
            >
              <span className="text-sm" style={{ color: palette.inkPrimary }}>
                باقي {days} {days === 1 ? "يوم" : "أيام"} على موعد هجرة <b>{bird.name_ar}</b>
              </span>
              <ChevronLeft size={16} className="shrink-0" style={{ color: palette.accent }} strokeWidth={2} />
            </button>
          ))}
      </div>
    </div>
  );
}
