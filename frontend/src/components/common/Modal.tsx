import { useEffect, type ReactNode } from "react";
import s from "./common.module.css";

// Dialog used by every form. Closes on Esc, on the X, or on a click outside.
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={s.overlay} onMouseDown={onClose}>
      <div
        className={s.dialog}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={s.head}>
          <h2>{title}</h2>
          <button className={s.close} onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
