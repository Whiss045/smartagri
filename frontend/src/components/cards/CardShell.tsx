import type { ReactNode } from "react";
import s from "./cards.module.css";

// Common card skeleton: image + title + badges on top (clickable), details, then action buttons.
// Actions sit outside the clickable area, so pressing a button never triggers the card click.
export default function CardShell({
  image,
  title,
  subtitle,
  badges,
  onClick,
  actions,
  children,
}: {
  image: string;
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  onClick?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className={s.card}>
      <div
        className={`${s.top} ${onClick ? s.clickable : ""}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => onClick && e.key === "Enter" && onClick()}
      >
        <img className={s.img} src={image} alt="" />
        <div>
          <h3 className={s.title}>{title}</h3>
          {subtitle && <p className="muted">{subtitle}</p>}
          {badges && <div className={s.badges}>{badges}</div>}
        </div>
      </div>
      {children && <div className={s.body}>{children}</div>}
      {actions && <div className={s.actions}>{actions}</div>}
    </article>
  );
}
