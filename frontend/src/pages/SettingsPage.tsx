import { useState } from "react";
import { FONT_LABEL, THEME_LABEL } from "../constants/labels";
import {
  FONT_SIZES,
  THEMES,
  loadAppearance,
  saveAppearance,
  type Appearance,
} from "../hooks/appearance";
import { useAuth } from "../hooks/auth.hook";

// Personal display settings. They only affect this browser and are saved there.
export default function SettingsPage() {
  const { user } = useAuth();
  const [appearance, setAppearance] = useState<Appearance>(loadAppearance);

  // Updates the screen state, saves the choice and applies it right away
  function change(patch: Partial<Appearance>) {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    saveAppearance(next);
  }

  return (
    <>
      <div className="page-head">
        <h1>الإعدادات</h1>
      </div>

      <div className="empty" style={{ textAlign: "start" }}>
        <p className="muted">
          المستخدم: <strong>{user?.username}</strong>
        </p>

        <h2 style={{ marginTop: 16 }}>المظهر</h2>
        <div className="tabs" style={{ marginTop: 8 }}>
          {THEMES.map((t) => (
            <button
              key={t}
              className="btn"
              aria-pressed={appearance.theme === t}
              onClick={() => change({ theme: t })}
            >
              {THEME_LABEL[t]}
            </button>
          ))}
        </div>

        <h2>حجم الخط</h2>
        <div className="tabs" style={{ marginTop: 8 }}>
          {FONT_SIZES.map((f) => (
            <button
              key={f}
              className="btn"
              aria-pressed={appearance.font === f}
              onClick={() => change({ font: f })}
            >
              {FONT_LABEL[f]}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
