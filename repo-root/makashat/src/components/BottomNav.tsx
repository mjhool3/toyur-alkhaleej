import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home as HomeIcon, Map, Star, Menu, Bird } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const sideItems = [
  { to: "/", label: "الرئيسية", Icon: HomeIcon },
  { to: "/map", label: "الخرائط", Icon: Map },
];
const trailingItems = [
  { to: "/favorites", label: "المفضلة", Icon: Star },
  { to: "/profile", label: "المزيد", Icon: Menu },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { palette } = useTheme();
  const isBirdsActive = location.pathname.startsWith("/birds");

  return (
    <nav dir="rtl" className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div
        className="relative backdrop-blur-md border-t border-white/5 shadow-[0_-8px_24px_rgba(0,0,0,0.25)]"
        style={{ backgroundColor: palette.surfaceRaised }}
      >
        <ul className="flex justify-between px-2">
          {sideItems.map(({ to, label, Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === "/"}
                className="press flex flex-col items-center gap-1 py-2.5 text-[11px]"
                style={({ isActive }) => ({ color: isActive ? palette.accent : palette.inkMuted })}
              >
                <Icon size={20} strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}

          {/* عنصر فارغ يترك مساحة للزر الدائري البارز فوقه */}
          <li className="flex-1" aria-hidden="true" />

          {trailingItems.map(({ to, label, Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                className="press flex flex-col items-center gap-1 py-2.5 text-[11px]"
                style={({ isActive }) => ({ color: isActive ? palette.accent : palette.inkMuted })}
              >
                <Icon size={20} strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* الزر المركزي الدائري البارز — الطيور، أهم ميزة في التطبيق */}
        <button
          onClick={() => navigate("/birds")}
          aria-label="دليل الطيور"
          className="press absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-black/50 transition-colors"
          style={{
            border: `4px solid ${palette.surfaceBase}`,
            backgroundColor: isBirdsActive ? palette.accent : palette.surfaceCard,
            color: isBirdsActive ? "#000" : palette.accent,
          }}
        >
          <Bird size={26} strokeWidth={2.2} />
        </button>
      </div>
    </nav>
  );
}
