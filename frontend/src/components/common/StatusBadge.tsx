import type { Tone } from "../../constants/labels";

// Pill with icon + word, so state is readable without relying on colour
export default function StatusBadge({
  tone,
  icon,
  label,
}: {
  tone: Tone;
  icon: string;
  label: string;
}) {
  return (
    <span className={`badge badge--${tone}`}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

// Device connectivity badge, reused by device, valve and sensor cards
export function OnlineBadge({ online }: { online: boolean }) {
  return online ? (
    <StatusBadge tone="ok" icon="📶" label="متصل" />
  ) : (
    <StatusBadge tone="bad" icon="🚫" label="غير متصل" />
  );
}
