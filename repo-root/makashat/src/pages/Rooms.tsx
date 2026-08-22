import { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { createRoom, getProfile, listRooms, Room, subscribeToRoomsList, isSupabaseConfigured } from "../lib/store";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { EmptyState, SkeletonCard, ErrorState } from "../components/StateViews";
import { BottomSheet } from "../components/BottomSheet";
import { MessageCircle, Plus, Lock, Users } from "lucide-react";

export default function Rooms() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { user } = useAuth();
  const { palette } = useTheme();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // نموذج الإنشاء
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [seatsCount, setSeatsCount] = useState<4 | 6 | 8 | 12>(8);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");

  const load = () => {
    setError(false);
    setRooms(null);
    listRooms().then(setRooms).catch(() => setError(true));
  };
  useEffect(load, []);

  // تحديث حي لقائمة الغرف عند إنشاء/حذف أي غرفة من أي مستخدم (عند تفعيل Supabase)
  useEffect(() => {
    const unsubscribe = subscribeToRoomsList(load);
    return unsubscribe;
  }, []);

  const submitCreate = async () => {
    if (!name.trim()) {
      show("اكتب اسم الغرفة أولًا", "warning");
      return;
    }
    if (isSupabaseConfigured && !user) {
      show("سجّل الدخول أولًا لإنشاء غرفة", "warning");
      navigate("/login");
      return;
    }
    try {
      const profile = await getProfile();
      const room = await createRoom({
        name: name.trim(),
        description: description.trim(),
        hostName: profile.name,
        seatsCount,
        isPrivate,
        password: isPrivate && password.trim() ? password.trim() : null,
      });
      show("تم إنشاء الغرفة", "success");
      setShowCreate(false);
      setName("");
      setDescription("");
      setPassword("");
      navigate(`/rooms/${room.id}`);
    } catch (e) {
      show(e instanceof Error ? e.message : "تعذّر إنشاء الغرفة", "error");
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 space-y-5 page-enter" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-2xl">الغرف</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="press text-sm font-semibold px-4 py-2 rounded-pill flex items-center gap-1.5 shadow-md"
          style={{ backgroundColor: palette.accent, color: "#000" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          إنشاء غرفة
        </button>
      </div>

      {error && <ErrorState message="تعذّر تحميل الغرف." onRetry={load} />}

      {!error && rooms === null && (
        <div className="space-y-3">
          <SkeletonCard />
        </div>
      )}

      {!error && rooms !== null && rooms.length === 0 && (
        <EmptyState icon={MessageCircle} title="لا توجد غرف حاليًا" hint="أنشئ أول غرفة اجتماعية في مكشات." />
      )}

      <div className="space-y-3">
        {rooms?.map((r) => {
          const occupied = r.seats.filter((s) => s.userId).length;
          return (
            <button
              key={r.id}
              onClick={() => navigate(`/rooms/${r.id}`)}
              className="press w-full text-right border border-white/5 rounded-card p-4 flex items-center gap-3 shadow-md shadow-black/10"
              style={{ backgroundColor: palette.surfaceCard }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0" style={{ backgroundColor: `${palette.accent}33`, color: palette.accent }}>
                {r.hostName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold truncate" style={{ color: palette.inkPrimary }}>{r.name}</p>
                  {r.isPrivate && <Lock size={12} className="shrink-0" style={{ color: palette.inkMuted }} strokeWidth={2} />}
                </div>
                <p className="text-xs" style={{ color: palette.inkMuted }}>Room ID: {r.id} · المضيف: {r.hostName}</p>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold shrink-0" style={{ color: palette.accent }}>
                <Users size={14} strokeWidth={2} />
                {occupied}/{r.seatsCount}
              </span>
            </button>
          );
        })}
      </div>

      <BottomSheet open={showCreate} onClose={() => setShowCreate(false)} maxHeight="85vh">
        <h2 className="font-display font-bold text-lg">إنشاء غرفة</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الغرفة"
          className="w-full border border-white/10 rounded-pill px-4 py-2.5 text-sm focus:outline-none"
          style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="الوصف (اختياري)"
          rows={2}
          className="w-full border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none"
          style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }}
        />

        <div>
          <p className="text-xs mb-2" style={{ color: palette.inkSecondary }}>عدد المقاعد</p>
          <div className="flex gap-2">
            {[4, 6, 8, 12].map((n) => (
              <button
                key={n}
                onClick={() => setSeatsCount(n as 4 | 6 | 8 | 12)}
                className="press flex-1 py-2 rounded-pill text-sm border"
                style={seatsCount === n ? { borderColor: palette.accent, color: palette.accent } : { borderColor: "rgba(128,128,128,0.2)", color: palette.inkSecondary }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs mb-2" style={{ color: palette.inkSecondary }}>نوع الغرفة</p>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPrivate(false)}
              className="press flex-1 py-2 rounded-pill text-sm border"
              style={!isPrivate ? { borderColor: palette.accent, color: palette.accent } : { borderColor: "rgba(128,128,128,0.2)", color: palette.inkSecondary }}
            >
              عامة
            </button>
            <button
              onClick={() => setIsPrivate(true)}
              className="press flex-1 py-2 rounded-pill text-sm border"
              style={isPrivate ? { borderColor: palette.accent, color: palette.accent } : { borderColor: "rgba(128,128,128,0.2)", color: palette.inkSecondary }}
            >
              خاصة
            </button>
          </div>
        </div>

        {isPrivate && (
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة مرور (اختياري)"
            className="w-full border border-white/10 rounded-pill px-4 py-2.5 text-sm focus:outline-none"
            style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }}
          />
        )}

        <button onClick={submitCreate} className="press w-full font-bold py-3 rounded-pill" style={{ backgroundColor: palette.accent, color: "#000" }}>
          إنشاء
        </button>
      </BottomSheet>
    </div>
  );
}
