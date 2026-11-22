import type { ReactNode } from "react";
import { errorMessage } from "../../constants/labels";
import s from "./common.module.css";

// Wraps a list: loading text, error with retry, empty message, or the real content
export default function AsyncState({
  loading,
  error,
  empty,
  emptyText,
  onRetry,
  children,
}: {
  loading: boolean;
  error: unknown;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) return <div className={s.state}>جارٍ التحميل…</div>;
  if (error) {
    return (
      <div className={`${s.state} ${s.stateError}`}>
        {errorMessage(error)}{" "}
        {onRetry && (
          <button className="btn" onClick={onRetry}>
            إعادة المحاولة
          </button>
        )}
      </div>
    );
  }
  if (empty) return <div className="empty">{emptyText ?? "لا توجد عناصر"}</div>;
  return <>{children}</>;
}
