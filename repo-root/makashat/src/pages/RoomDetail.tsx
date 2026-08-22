import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Room,
  RoomMessage,
  getProfile,
  getMySeatId,
  getRoom,
  getRoomMessages,
  joinRoom,
  leaveRoom,
  sendRoomMessage,
  setSeatMuted,
  deleteRoom,
  subscribeToRoom,
  isSupabaseConfigured,
} from "../lib/store";
import { VoiceSession, VoiceConnectionState, isVoiceConfigured } from "../lib/liveVoice";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/ThemeContext";
import { Mic, MicOff, MessageCircle, LogOut, Lock, Send, X, Headphones } from "lucide-react";

const voiceStateLabel: Record<VoiceConnectionState, string> = {
  idle: "",
  connecting: "جارٍ الاتصال بالصوت...",
  connected: "متصل بالصوت",
  reconnecting: "إعادة الاتصال بالصوت...",
  disconnected: "انقطع الاتصال بالصوت",
  error: "تعذّر الاتصال بالصوت",
};

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const { palette } = useTheme();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [myName, setMyName] = useState("");
  const [myId, setMyId] = useState("local-user");
  const [error, setError] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceConnectionState>("idle");
  const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const voiceRef = useRef<VoiceSession | null>(null);

  const refresh = async () => {
    if (!id) return;
    const [r, msgs, profile] = await Promise.all([getRoom(id), getRoomMessages(id), getProfile()]);
    setRoom(r);
    setMessages(msgs);
    setMyName(profile.name);
  };

  useEffect(() => {
    if (!id) return;
    setError(null);
    (async () => {
      try {
        const profile = await getProfile();
        await joinRoom(id, profile.name);
        setMyId(await getMySeatId());
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر تحميل الغرفة.");
      }
    })();
    // eslم-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // اشتراك حي حقيقي: يُحدّث المقاعد/الرسائل فورًا عند أي تغيير من أي مستخدم آخر (عند تفعيل Supabase)
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToRoom(id, refresh);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // الاتصال الصوتي الحقيقي عبر LiveKit — يبدأ فور دخول الروم، وينتهي فعليًا عند الخروج
  useEffect(() => {
    if (!id || !isVoiceConfigured) return;
    const session = new VoiceSession({
      onStateChange: setVoiceState,
      onSpeakingChange: setSpeakingIds,
      onError: (msg) => show(msg, "error"),
    });
    voiceRef.current = session;
    session.connect(id).catch(() => {
      /* الخطأ مُعالَج بالفعل عبر onError/onStateChange */
    });
    return () => {
      session.disconnect();
      voiceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showChat]);

  const mySeat = room?.seats.find((s) => s.userId === myId);
  const isHost = room?.seats[0]?.userId === myId;

  const toggleMic = async () => {
    if (!id || !mySeat) return;
    const next = !mySeat.muted; // next = هل سيصبح مفتوحًا؟ (muted الحالية true تعني مغلق)
    try {
      if (isVoiceConfigured && voiceRef.current) {
        await voiceRef.current.setMicEnabled(next);
      }
      await setSeatMuted(id, !next);
      if (!isSupabaseConfigured) await refresh();
      show(next ? "تم فتح المايك" : "تم كتم المايك", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "تعذّر تغيير حالة المايك", "error");
    }
  };

  const send = async () => {
    if (!id || !messageText.trim()) return;
    const text = messageText.trim();
    setMessageText("");
    try {
      await sendRoomMessage(id, myName, text);
      if (!isSupabaseConfigured) await refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "تعذّر إرسال الرسالة", "error");
    }
  };

  const exit = async () => {
    if (!id) return;
    voiceRef.current?.disconnect();
    await leaveRoom(id);
    navigate("/rooms");
  };

  const closeRoom = async () => {
    if (!id) return;
    voiceRef.current?.disconnect();
    await deleteRoom(id);
    show("تم إغلاق الغرفة", "success");
    navigate("/rooms");
  };

  if (error) {
    const needsLogin = error.includes("تسجيل الدخول");
    return (
      <div className="pt-16 px-6 text-center space-y-3" dir="rtl">
        <div className="w-14 h-14 rounded-full border border-white/5 flex items-center justify-center mx-auto" style={{ backgroundColor: palette.surfaceCard, color: palette.accent }}>
          {needsLogin ? <Lock size={24} strokeWidth={1.75} /> : <MessageCircle size={24} strokeWidth={1.75} />}
        </div>
        <p className="text-sm" style={{ color: palette.inkSecondary }}>{error}</p>
        {needsLogin ? (
          <button onClick={() => navigate("/login")} className="press font-semibold text-sm px-5 py-2 rounded-pill" style={{ backgroundColor: palette.accent, color: "#000" }}>
            تسجيل الدخول
          </button>
        ) : (
          <button onClick={() => navigate("/rooms")} className="press text-sm" style={{ color: palette.accent }}>العودة للغرف</button>
        )}
      </div>
    );
  }
  if (room === undefined) return <div className="pt-10 px-4 text-sm" style={{ color: palette.inkMuted }} dir="rtl">جارِ التحميل...</div>;
  if (room === null) {
    return (
      <div className="pt-10 px-4 text-center" dir="rtl">
        <p style={{ color: palette.inkSecondary }}>لم يتم العثور على هذه الغرفة (ربما أُغلقت).</p>
        <button onClick={() => navigate("/rooms")} className="press mt-4 text-sm" style={{ color: palette.accent }}>العودة للغرف</button>
      </div>
    );
  }

  return (
    <div className="pb-40 pt-6 px-4 space-y-5 page-enter" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-lg">{room.name}</h1>
          <p className="text-xs" style={{ color: palette.inkMuted }}>Room ID: {room.id} · المضيف: {room.hostName}</p>
          {isVoiceConfigured && voiceState !== "idle" && (
            <p className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: palette.accent }}>
              <Headphones size={12} strokeWidth={2} /> {voiceStateLabel[voiceState]}
            </p>
          )}
        </div>
        <button onClick={exit} className="press flex items-center gap-1 text-sm" style={{ color: palette.inkMuted }}>
          خروج <LogOut size={15} strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {room.seats.map((seat) => (
          <div key={seat.index} className="flex flex-col items-center gap-1">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-bold border-2"
              style={
                seat.userId
                  ? seat.muted
                    ? { backgroundColor: palette.surfaceCard, borderColor: "rgba(128,128,128,0.2)", color: palette.inkSecondary }
                    : { backgroundColor: `${palette.accent}33`, borderColor: palette.accent, color: palette.accent }
                  : { backgroundColor: palette.surfaceCard, borderStyle: "dashed", borderColor: "rgba(128,128,128,0.2)", color: palette.inkMuted }
              }
            >
              {seat.userId ? seat.userName?.[0] : "+"}
            </div>
            <p className="flex justify-center" style={{ color: palette.inkMuted }}>
              {seat.userId ? (
                seat.muted ? (
                  <MicOff size={11} strokeWidth={2} />
                ) : (
                  <Mic size={11} style={{ color: palette.accent }} strokeWidth={2} />
                )
              ) : (
                <span className="text-[10px]">فارغ</span>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="border border-white/5 rounded-card p-3 text-xs leading-relaxed" style={{ backgroundColor: palette.surfaceCard, color: palette.inkMuted }}>
        {isVoiceConfigured ? (
          "🎙️ الصوت الحقيقي مُفعَّل — افتح المايك وستسمعك بقية المستخدمين في نفس الغرفة فعليًا."
        ) : (
          <>⚠️ الصوت الحقيقي بين الأجهزة المختلفة يحتاج ربط خدمة LiveKit (راجع README). حاليًا يظهر
          فتح/كتم المايك كحالة على هذا الجهاز فقط تمهيدًا لتفعيل الصوت الفعلي بينك وبين بقية
          المستخدمين في نفس الغرفة.</>
        )}
      </div>

      {isHost && (
        <div className="border border-white/5 rounded-card p-4 space-y-2" style={{ backgroundColor: palette.surfaceCard }}>
          <p className="text-xs font-semibold" style={{ color: palette.inkSecondary }}>أدوات المضيف</p>
          <button onClick={closeRoom} className="press w-full bg-red-500/10 text-red-400 text-sm font-semibold py-2 rounded-pill">
            إغلاق الغرفة
          </button>
        </div>
      )}

      {/* شريط الأزرار السفلي */}
      <div className="fixed bottom-16 inset-x-0 px-4 z-40">
        <div className="border border-white/10 rounded-pill px-4 py-3 flex items-center justify-around shadow-xl shadow-black/30" style={{ backgroundColor: palette.surfaceRaised }}>
          <button
            onClick={toggleMic}
            className="press w-11 h-11 rounded-full flex items-center justify-center"
            style={mySeat?.muted === false ? { backgroundColor: palette.accent, color: "#000" } : { backgroundColor: palette.surfaceCard, color: palette.inkSecondary }}
          >
            {mySeat?.muted === false ? <Mic size={18} strokeWidth={2} /> : <MicOff size={18} strokeWidth={2} />}
          </button>
          <button onClick={() => setShowChat(true)} className="press w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: palette.surfaceCard, color: palette.inkSecondary }}>
            <MessageCircle size={18} strokeWidth={2} />
          </button>
          <button onClick={exit} className="press w-11 h-11 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
            <LogOut size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {showChat && (
        <div
          dir="rtl"
          onClick={() => setShowChat(false)}
          style={{ position: "fixed", inset: 0, zIndex: 85, backgroundColor: "rgba(0,0,0,0.65)", display: "flex", alignItems: "flex-end" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full h-[70vh] rounded-t-[28px] flex flex-col page-enter"
            style={{ backgroundColor: palette.surfaceRaised }}
          >
            <div className="w-10 h-1.5 bg-white/15 rounded-pill mx-auto mt-3" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <p className="font-semibold" style={{ color: palette.inkPrimary }}>شات الغرفة</p>
              <button onClick={() => setShowChat(false)} className="press" style={{ color: palette.inkMuted }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-center pt-6" style={{ color: palette.inkMuted }}>لا توجد رسائل بعد، كن أول من يكتب!</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className="animate-[fadeSlideUp_180ms_ease-out]">
                  <p className="text-xs">
                    <b style={{ color: palette.accent }}>{m.userName}</b>{" "}
                    <span style={{ color: palette.inkMuted }}>{new Date(m.time).toLocaleTimeString("ar-KW", { hour: "2-digit", minute: "2-digit" })}</span>
                  </p>
                  <p className="text-sm rounded-2xl px-3 py-2 mt-1 inline-block max-w-[85%]" style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }}>{m.text}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-white/5 flex gap-2">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="اكتب رسالة..."
                className="flex-1 border border-white/10 rounded-pill px-4 py-2 text-sm focus:outline-none"
                style={{ backgroundColor: palette.surfaceCard, color: palette.inkPrimary }}
              />
              <button onClick={send} className="press w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: palette.accent, color: "#000" }}>
                <Send size={16} strokeWidth={2} />
              </button>
            </div>
            <p className="text-[10px] text-center pb-3" style={{ color: palette.inkMuted }}>
              {isSupabaseConfigured
                ? "الرسائل والمقاعد تتزامن فورًا مع كل المستخدمين في الغرفة عبر Supabase Realtime."
                : "الرسائل محفوظة على هذا الجهاز حاليًا. المزامنة اللحظية بين الأجهزة تحتاج ربط Supabase أولًا."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
