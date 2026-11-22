import { SYSTEM_LABEL, WEEKDAYS } from "../../constants/labels";
import valveImg from "../../assets/cards/valve.png";
import type { Schedule } from "../../types/models";
import StatusBadge from "../common/StatusBadge";
import CardShell from "./CardShell";

// One schedule with an enable/disable toggle (the backend stops it if it is running)
export default function ScheduleCard({
  schedule,
  onToggle,
  onEdit,
  onDelete,
}: {
  schedule: Schedule;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <CardShell
      image={valveImg}
      title={schedule.name}
      subtitle={`${SYSTEM_LABEL[schedule.system]} · ${schedule.valve?.name ?? ""}`}
      badges={
        schedule.enabled ? (
          <StatusBadge tone="ok" icon="✅" label="مفعّلة" />
        ) : (
          <StatusBadge tone="off" icon="⏸" label="معطّلة" />
        )
      }
      actions={
        <>
          <button className="btn" onClick={onToggle}>
            {schedule.enabled ? "تعطيل" : "تفعيل"}
          </button>
          <button className="btn" onClick={onEdit}>
            تعديل
          </button>
          <button className="btn btn--danger" onClick={onDelete}>
            حذف
          </button>
        </>
      }
    >
      <p>
        ⏰ {schedule.startTime} · {schedule.durationMinutes} دقيقة
      </p>
      <p className="muted">
        {schedule.daysOfWeek.map((d) => WEEKDAYS[d]).join("، ")}
      </p>
    </CardShell>
  );
}
