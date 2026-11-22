import { useAuth } from "../../hooks/auth.hook";
import s from "./layout.module.css";

// Top bar: menu button (phones), app name, current user, logout
export default function Header({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  return (
    <header className={s.header}>
      <button
        className={`btn ${s.menuBtn}`}
        onClick={onMenu}
        aria-label="القائمة"
      >
        ☰
      </button>
      <span className={s.brand}>🌴 SmartAgri</span>
      <span className={s.user}>{user?.username}</span>
      <button className="btn" onClick={() => void logout()}>
        خروج
      </button>
    </header>
  );
}
