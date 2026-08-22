import { safeId } from "../lib/safeId";
import { useEffect, useState } from "react";
import { Lock, Plus } from "lucide-react";
import { Bird, COUNTRIES, CountryCode, MigrationSeason, MigrationWindow } from "../types";
import { deleteBird, listBirds, upsertBird, isSupabaseConfigured, listRooms, Room, deleteRoom } from "../lib/store";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { EmptyState } from "../components/StateViews";
import { BottomSheet } from "../components/BottomSheet";

type Tab = "birds" | "rooms";

function emptyBird(): Bird {
  return {
    id: safeId(),
    name_ar: "",
    name_en: "",
    description: "",
    image_url: null,
    season: "autumn",
    route: [],
    windows: [],
  };
}

export default function Admin() {
  const { show } = useToast();
  const { user, isAdmin, loading } = useAuth();
  const { palette } = useTheme();
  const [tab, setTab] = useState<Tab>("birds");
  const [birds, setBirds] = useState<Bird[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editing, setEditing] = useState<Bird | null>(null);

  const load = () => {
    listBirds().then(setBirds);
    listRooms().then(setRooms);
  };
  useEffect(load, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.name_ar.trim()) {
      show("اسم الطائر بالعربي مطلوب", "warning");
      return;
    }
    await upsertBird(editing);
    show("تم الحفظ", "success");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    await deleteBird(id);
    show("تم حذف الطائر", "success");
    load();
  };

  const removeRoom = async (id: string) => {
    await deleteRoom(id);
    show("تم حذف الغرفة", "success");
    load();
  };

  const addWindow = () => {
    if (!editing) return;
    const usedCountries = editing.windows.map((w) => w.country);
    const nextCountry = COUNTRIES.find((c) => !usedCountries.includes(c.code))?.code ?? "kw";
    setEditing({
      ...editing,
      windows: [...editing.windows, { country: nextCountry, start_date: "", end_date: "", places: [] }],
    });
  };

  const updateWindow = (idx: number, patch: Partial<MigrationWindow>) => {
    if (!editing) return;
    const windows = editing.windows.slice();
    windows[idx] = { ...windows[idx], ...patch };
    setEditing({ ...editing, windows });
  };

  const removeWindow = (idx: number) => {
    if (!editing) return;
    setEditing({ ...editing, windows: editing.windows.filter((_, i) => i !== idx) });
  };

  if (isSupabaseConfigured && loading) {
    return <div className="pt-10 px-4 text-sm" style={{ color: palette.inkMuted }} dir="rtl">جارِ التحقق من الصلاحيات...</div>;
  }

  if (isSupabaseConfigured && (!user || !isAdmin)) {
    return (
      <div className="pt-16 px-6 text-center space-y-2" dir="rtl">
        <span className="w-14 h-14 rounded-full border border-white/5 flex items-center justify-center mx-auto" style={{ backgroundColor: palette.surfaceCard, color: palette.accent }}>
          <Lock size={24} strokeWidth={1.75} />
        </span>
        <p className="text-sm" style={{ color: palette.inkSecondary }}>
          هذه الصفحة مخصصة للأدمن فقط. {!user ? "سجّل الدخول أولًا." : "حسابك ليس لديه صلاحية أدمن."}
        </p>
        <p className="text-xs" style={{ color: palette.inkMuted }}>
          لمنح صلاحية أدمن: افتح Supabase → Table editor → profiles → عدّل عمود is_admin إلى true لصفّك.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 space-y-5 page-enter" dir="rtl">
      <h1 className="font-display font-black text-2xl">لوحة التحكم</h1>

      {!isSupabaseConfigured && (
        <div className="border border-white/5 rounded-card p-3 text-xs leading-relaxed" style={{ backgroundColor: palette.surfaceCard, color: palette.inkMuted }}>
          ⚠️ التعديلات هنا تُحفظ محليًا على هذا الجهاز حاليًا (لا يوجد Supabase مرتبط بعد)، وستنتقل
          تلقائيًا للعمل كقاعدة بيانات مركزية بمجرد ربط المفاتيح.
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setTab("birds")}
          className="press px-4 py-2 rounded-pill text-sm border"
          style={tab === "birds" ? { borderColor: palette.accent, color: palette.accent } : { borderColor: "rgba(128,128,128,0.2)", color: palette.inkSecondary }}
        >
          الطيور ({birds.length})
        </button>
        <button
          onClick={() => setTab("rooms")}
          className="press px-4 py-2 rounded-pill text-sm border"
          style={tab === "rooms" ? { borderColor: palette.accent, color: palette.accent } : { borderColor: "rgba(128,128,128,0.2)", color: palette.inkSecondary }}
        >
          الرومات ({rooms.length})
        </button>
      </div>

      {tab === "birds" && (
        <div className="space-y-3">
          <button
            onClick={() => setEditing(emptyBird())}
            className="press w-full font-semibold py-2.5 rounded-pill text-sm flex items-center justify-center gap-1.5 shadow-md"
            style={{ backgroundColor: palette.accent, color: "#000" }}
          >
            <Plus size={16} strokeWidth={2.5} />
            إضافة طائر جديد
          </button>

          {birds.length === 0 && <EmptyState title="لا توجد طيور بعد" />}

          {birds.map((b) => (
            <div key={b.id} className="border border-white/5 rounded-card p-3 flex items-center gap-3" style={{ backgroundColor: palette.surfaceCard }}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: palette.inkPrimary }}>{b.name_ar || "بدون اسم"}</p>
                <p className="text-xs" style={{ color: palette.inkMuted }}>{b.windows.length} مواعيد هجرة مضبوطة</p>
              </div>
              <button onClick={() => setEditing(b)} className="press text-sm" style={{ color: palette.accent }}>تعديل</button>
              <button onClick={() => remove(b.id)} className="press text-red-400 text-sm">حذف</button>
            </div>
          ))}
        </div>
      )}

      {tab === "rooms" && (
        <div className="space-y-3">
          {rooms.length === 0 && <EmptyState title="لا توجد غرف حاليًا" />}
          {rooms.map((r) => (
            <div key={r.id} className="border border-white/5 rounded-card p-3 flex items-center gap-3" style={{ backgroundColor: palette.surfaceCard }}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: palette.inkPrimary }}>{r.name}</p>
                <p className="text-xs" style={{ color: palette.inkMuted }}>Room ID: {r.id} · المضيف: {r.hostName}</p>
              </div>
              <button onClick={() => removeRoom(r.id)} className="press text-red-400 text-sm">حذف</button>
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={Boolean(editing)} onClose={() => setEditing(null)} zIndex={90} maxHeight="90vh">
        {editing && (
          <>
            <h2 className="font-display font-bold text-lg">بيانات الطائر</h2>

            <input value={editing.name_ar} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} placeholder="الاسم بالعربي" className="w-full border border-white/10 rounded-pill px-4 py-2.5 text-sm focus:outline-none" style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }} />
            <input value={editing.name_en} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} placeholder="الاسم بالإنجليزي" className="w-full border border-white/10 rounded-pill px-4 py-2.5 text-sm focus:outline-none" style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }} />
            <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="الوصف" rows={3} className="w-full border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none" style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }} />
            <input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value || null })} placeholder="رابط صورة حقيقية (اختياري الآن)" className="w-full border border-white/10 rounded-pill px-4 py-2.5 text-sm focus:outline-none" style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }} />

            <div className="flex gap-2">
              {(["autumn", "spring"] as MigrationSeason[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setEditing({ ...editing, season: s })}
                  className="press flex-1 py-2 rounded-pill text-sm border"
                  style={editing.season === s ? { borderColor: palette.accent, color: palette.accent } : { borderColor: "rgba(128,128,128,0.2)", color: palette.inkSecondary }}
                >
                  {s === "autumn" ? "الخريف" : "الربيع"}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: palette.inkSecondary }}>مواعيد الهجرة حسب الدولة</p>
                <button onClick={addWindow} className="press flex items-center gap-0.5 text-xs" style={{ color: palette.accent }}>
                  <Plus size={13} strokeWidth={2.5} /> إضافة
                </button>
              </div>
              {editing.windows.map((w, idx) => (
                <div key={idx} className="rounded-2xl p-3 space-y-2" style={{ backgroundColor: palette.surfaceCard }}>
                  <div className="flex items-center justify-between">
                    <select
                      value={w.country}
                      onChange={(e) => updateWindow(idx, { country: e.target.value as CountryCode })}
                      className="border border-white/10 rounded-pill px-3 py-1.5 text-xs"
                      style={{ backgroundColor: palette.surfaceRaised, color: palette.inkPrimary }}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name_ar}</option>
                      ))}
                    </select>
                    <button onClick={() => removeWindow(idx)} className="press text-red-400 text-xs">حذف</button>
                  </div>
                  <div className="flex gap-2">
                    <input type="date" value={w.start_date} onChange={(e) => updateWindow(idx, { start_date: e.target.value })} className="flex-1 border border-white/10 rounded-pill px-3 py-1.5 text-xs" style={{ backgroundColor: palette.surfaceRaised, color: palette.inkPrimary }} />
                    <input type="date" value={w.end_date} onChange={(e) => updateWindow(idx, { end_date: e.target.value })} className="flex-1 border border-white/10 rounded-pill px-3 py-1.5 text-xs" style={{ backgroundColor: palette.surfaceRaised, color: palette.inkPrimary }} />
                  </div>
                  <input
                    value={w.places.join("، ")}
                    onChange={(e) => updateWindow(idx, { places: e.target.value.split("،").map((p) => p.trim()).filter(Boolean) })}
                    placeholder="أماكن المشاهدة (افصل بفاصلة)"
                    className="w-full border border-white/10 rounded-pill px-3 py-1.5 text-xs"
                    style={{ backgroundColor: palette.surfaceRaised, color: palette.inkPrimary }}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="press flex-1 border border-white/10 py-2.5 rounded-pill text-sm" style={{ color: palette.inkSecondary }}>إلغاء</button>
              <button onClick={save} className="press flex-1 font-bold py-2.5 rounded-pill text-sm" style={{ backgroundColor: palette.accent, color: "#000" }}>حفظ</button>
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
