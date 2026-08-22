import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bird, Bell, Settings, Crown, ChevronLeft, CheckCircle2 } from "lucide-react";
import { getProfile, getFavoriteIds, listRooms, LocalProfile, isSupabaseConfigured, updateProfile } from "../lib/store";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useTheme, Palette } from "../contexts/ThemeContext";

export default function Profile() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { user, isAdmin, signOut } = useAuth();
  const { palette } = useTheme();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [favCount, setFavCount] = useState(0);
  const [roomsCount, setRoomsCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    Promise.all([getProfile(), getFavoriteIds(), listRooms()]).then(([p, favs, rooms]) => {
      setProfile(p);
      setNameDraft(p.name);
      setFavCount(favs.length);
      setRoomsCount(rooms.filter((r) => r.hostName === p.name).length);
    });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    show("تم تسجيل الخروج", "success");
  };

  const saveName = async () => {
    if (!profile || !nameDraft.trim()) return;
    const next = { ...profile, name: nameDraft.trim() };
    setProfile(next);
    await updateProfile(next);
    setEditing(false);
    show("تم تحديث الاسم", "success");
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 page-enter" dir="rtl">
      <h1 className="font-display font-black text-2xl">الملف الشخصي</h1>

      <div className="border border-white/5 rounded-card p-5 flex items-center gap-4 shadow-md shadow-black/10" style={{ backgroundColor: palette.surfaceCard }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
          style={{ backgroundColor: `${palette.accent}33`, color: palette.accent }}
        >
          {profile?.name?.[0] ?? "؟"}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="flex-1 border border-white/10 rounded-pill px-3 py-1.5 text-sm focus:outline-none"
                style={{ backgroundColor: palette.surfaceRaised, color: palette.inkPrimary }}
              />
              <button onClick={saveName} className="press text-sm font-semibold" style={{ color: palette.accent }}>حفظ</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="press text-right">
              <p className="font-bold text-lg" style={{ color: palette.inkPrimary }}>{profile?.name ?? "..."}</p>
              <p className="text-xs" style={{ color: palette.inkMuted }}>اضغط لتعديل الاسم</p>
            </button>
          )}
          <p className="text-xs mt-1" style={{ color: palette.inkMuted }}>المعرّف: {profile?.userId}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate("/favorites")} className="press border border-white/5 rounded-card p-4 text-center" style={{ backgroundColor: palette.surfaceCard }}>
          <p className="text-2xl font-black" style={{ color: palette.accent }}>{favCount}</p>
          <p className="text-xs mt-1" style={{ color: palette.inkSecondary }}>طائر في المفضلة</p>
        </button>
        <button onClick={() => navigate("/rooms")} className="press border border-white/5 rounded-card p-4 text-center" style={{ backgroundColor: palette.surfaceCard }}>
          <p className="text-2xl font-black" style={{ color: palette.accent }}>{roomsCount}</p>
          <p className="text-xs mt-1" style={{ color: palette.inkSecondary }}>غرفة أنشأتها</p>
        </button>
      </div>

      <div className="space-y-2">
        <NavRow icon={Bird} label="دليل الطيور" onClick={() => navigate("/birds")} palette={palette} />
        <NavRow icon={Bell} label="التنبيهات" onClick={() => navigate("/notifications")} palette={palette} />
        <NavRow icon={Settings} label="الإعدادات والمظهر" onClick={() => navigate("/settings")} palette={palette} />
        <NavRow icon={Crown} label="لوحة التحكم" onClick={() => navigate("/admin")} palette={palette} />
      </div>

      <div className="border border-white/5 rounded-card p-4 text-sm leading-relaxed space-y-3" style={{ backgroundColor: palette.surfaceCard, color: palette.inkSecondary }}>
        {isSupabaseConfigured && user ? (
          <>
            <p className="flex items-center gap-1.5 flex-wrap">
              مسجّل دخولك بحساب حقيقي عبر Supabase
              {isAdmin && (
                <span className="inline-flex items-center gap-1 font-semibold" style={{ color: palette.accent }}>
                  <CheckCircle2 size={14} strokeWidth={2} /> صلاحيات أدمن
                </span>
              )}
              .
            </p>
            <p className="text-xs" style={{ color: palette.inkMuted }} dir="ltr">{user.email}</p>
            <button onClick={handleSignOut} className="press w-full bg-red-500/10 text-red-400 font-semibold py-2.5 rounded-pill text-sm">
              تسجيل الخروج
            </button>
          </>
        ) : isSupabaseConfigured ? (
          <>
            <p>
              أنت تستخدم حاليًا حساب <b>ضيف محلي</b> محفوظ على هذا الجهاز فقط. سجّل الدخول لمزامنة
              مفضلتك وغرفك بين أجهزتك.
            </p>
            <button onClick={() => navigate("/login")} className="press w-full font-bold py-2.5 rounded-pill text-sm" style={{ backgroundColor: palette.accent, color: "#000" }}>
              تسجيل الدخول / إنشاء حساب
            </button>
          </>
        ) : (
          <p>
            أنت تستخدم حاليًا حساب <b>ضيف محلي</b> محفوظ على هذا الجهاز فقط. لتفعيل تسجيل دخول حقيقي
            (Google / Email / Phone) ومزامنة بياناتك بين الأجهزة، يجب ربط مشروع Supabase أولًا.
          </p>
        )}
      </div>
    </div>
  );
}

function NavRow({ icon: Icon, label, onClick, palette }: { icon: typeof Bird; label: string; onClick: () => void; palette: Palette }) {
  return (
    <button onClick={onClick} className="press w-full border border-white/5 rounded-card p-4 flex items-center justify-between shadow-md shadow-black/10" style={{ backgroundColor: palette.surfaceCard }}>
      <span className="flex items-center gap-2.5 font-semibold text-sm" style={{ color: palette.inkPrimary }}>
        <Icon size={17} style={{ color: palette.accent }} strokeWidth={1.75} />
        {label}
      </span>
      <ChevronLeft size={16} style={{ color: palette.inkMuted }} strokeWidth={2} />
    </button>
  );
}
