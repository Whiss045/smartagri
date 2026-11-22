import { NavLink } from "react-router-dom";
import s from "./layout.module.css";

// `end` makes "/" and "/devices" active only on their exact path
const ITEMS = [
  { to: "/", label: "🏠 الرئيسية", end: true },
  { to: "/parcels", label: "🌴 الأراضي", end: false },
  { to: "/valves", label: "🚰 الصمامات", end: false },
  { to: "/sensors", label: "🌡️ الحساسات", end: false },
  { to: "/devices", label: "📟 الأجهزة", end: true },
  { to: "/devices/unassigned", label: "🆕 أجهزة غير مدرجة", end: false },
  { to: "/schedules", label: "⏰ البرمجة", end: false },
  { to: "/settings", label: "⚙️ الإعدادات", end: false },
  { to: "/about", label: "ℹ️ حول", end: false },
];

export default function SideMenu({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  return (
    <nav className={`${s.side} ${open ? s.sideOpen : ""}`}>
      {ITEMS.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          onClick={onNavigate}
          className={({ isActive }) => `${s.link} ${isActive ? s.active : ""}`}
        >
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
