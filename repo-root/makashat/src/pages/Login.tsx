import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { show } = useToast();
  const { palette } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      show("أدخل البريد وكلمة المرور", "warning");
      return;
    }
    setBusy(true);
    const result =
      mode === "signin" ? await signInWithEmail(email.trim(), password) : await signUpWithEmail(email.trim(), password, name.trim() || "مستخدم");
    setBusy(false);
    if (result.error) {
      show(result.error, "error");
    } else {
      show(mode === "signin" ? "تم تسجيل الدخول" : "تم إنشاء الحساب، تحقق من بريدك للتأكيد إن لزم", "success");
      navigate("/profile");
    }
  };

  const inputStyle = { backgroundColor: palette.surfaceCard, color: palette.inkPrimary };

  return (
    <div className="pb-24 pt-10 px-5 space-y-6 page-enter" dir="rtl">
      <div className="text-center space-y-1">
        <h1 className="font-display font-black text-2xl">مرحبًا بك في مكشات</h1>
        <p className="text-sm" style={{ color: palette.inkSecondary }}>سجّل دخولك لمزامنة مفضلتك وغرفك بين أجهزتك</p>
      </div>

      <button
        onClick={signInWithGoogle}
        className="press w-full border border-white/10 rounded-pill py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-black/10"
        style={inputStyle}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6c-2 1.4-4.6 2.3-7.7 2.3-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.2 5.6l6.6 5.6C41.4 36.3 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z" />
        </svg>
        المتابعة عبر Google
      </button>

      <div className="flex items-center gap-3 text-xs" style={{ color: palette.inkMuted }}>
        <div className="flex-1 h-px bg-white/10" />
        أو
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <div className="space-y-3">
        {mode === "signup" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="w-full border border-white/10 rounded-pill px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="البريد الإلكتروني" className="w-full border border-white/10 rounded-pill px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} dir="ltr" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="كلمة المرور" className="w-full border border-white/10 rounded-pill px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} dir="ltr" />
        <button
          onClick={submit}
          disabled={busy}
          className="press w-full font-bold py-3 rounded-pill disabled:opacity-60"
          style={{ backgroundColor: palette.accent, color: "#000" }}
        >
          {busy ? "جارٍ التنفيذ..." : mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
        </button>
      </div>

      <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="press w-full text-center text-sm" style={{ color: palette.accent }}>
        {mode === "signin" ? "ليس لديك حساب؟ أنشئ واحدًا" : "لديك حساب بالفعل؟ سجّل الدخول"}
      </button>

      <p className="text-center text-xs" style={{ color: palette.inkMuted }}>
        رقم الهاتف: يتطلب تفعيل مزوّد SMS من إعدادات Supabase (Auth → Providers → Phone).
      </p>
    </div>
  );
}
