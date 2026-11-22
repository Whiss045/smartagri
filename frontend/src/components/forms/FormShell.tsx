import { useState, type SyntheticEvent, type ReactNode } from "react";
import { errorMessage } from "../../constants/labels";

// Label + control wrapper used by every form
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

// Shared form behaviour: busy state, Arabic error banner, submit/cancel buttons.
// `onSubmit` throws on failure; on success the caller closes the modal.
export default function FormShell({
  onSubmit,
  submitLabel,
  onCancel,
  children,
}: {
  onSubmit: () => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handle(e: SyntheticEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false); // on success the modal unmounts, so nothing to reset
    }
  }

  return (
    <form onSubmit={handle}>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {children}
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          إلغاء
        </button>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
