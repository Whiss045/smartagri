import sensorImg from "../../assets/cards/sensor.png";
import { SENSOR_TYPE, formatDateTime } from "../../constants/labels";
import type { Sensor } from "../../types/models";
import StatusBadge, { OnlineBadge } from "../common/StatusBadge";
import CardShell from "./CardShell";

// Click opens the history page. Shows the latest reading and online status.
export default function SensorCard({
  sensor,
  onOpen,
  onAssign,
  onUnassign,
  onEdit,
}: {
  sensor: Sensor;
  onOpen: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  onEdit: () => void;
}) {
  const assigned = sensor.deviceId !== null;
  const r = sensor.latestReading;

  return (
    <CardShell
      image={sensorImg}
      title={sensor.name}
      subtitle={SENSOR_TYPE[sensor.type].label}
      onClick={onOpen}
      badges={
        assigned ? (
          <OnlineBadge online={sensor.online} />
        ) : (
          <StatusBadge tone="off" icon="🆕" label="غير مدرج" />
        )
      }
      actions={
        <>
          {assigned ? (
            <button className="btn" onClick={onUnassign}>
              إلغاء الإدراج
            </button>
          ) : (
            <button className="btn btn--primary" onClick={onAssign}>
              إدراج
            </button>
          )}
          <button className="btn" onClick={onEdit}>
            تعديل
          </button>
        </>
      }
    >
      <p>{r ? `${Number(r.value)} ${sensor.unit}` : "لا توجد قراءات بعد"}</p>
      {r && <p className="muted">{formatDateTime(r.recordedAt)}</p>}
    </CardShell>
  );
}
