import deviceImg from "../../assets/cards/device.png";
import { formatDateTime } from "../../constants/labels";
import type { Device } from "../../types/models";
import { OnlineBadge } from "../common/StatusBadge";
import CardShell from "./CardShell";

// One ESP32. "Edit" opens the form (rename, or assign to a parcel while unassigned).
export default function DeviceCard({
  device,
  parcelName,
  onEdit,
  onUnassign,
}: {
  device: Device;
  parcelName?: string;
  onEdit: () => void;
  onUnassign: () => void;
}) {
  return (
    <CardShell
      image={deviceImg}
      title={device.name || device.deviceUid}
      subtitle={device.name ? device.deviceUid : undefined}
      badges={<OnlineBadge online={device.online} />}
      actions={
        <>
          <button className="btn btn--primary" onClick={onEdit}>
            {device.assigned ? "تعديل" : "إدراج في أرض"}
          </button>
          {device.assigned && (
            <button className="btn" onClick={onUnassign}>
              إلغاء الإدراج
            </button>
          )}
        </>
      }
    >
      <p className="muted">
        {device.assigned ? `الأرض: ${parcelName ?? "…"}` : "غير مدرج"}
      </p>
      <p className="muted">البرنامج: {device.firmwareVersion ?? "—"}</p>
      <p className="muted">آخر ظهور: {formatDateTime(device.lastSeenAt)}</p>
    </CardShell>
  );
}
