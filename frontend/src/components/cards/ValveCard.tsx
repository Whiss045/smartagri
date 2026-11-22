import valveImg from "../../assets/cards/valve.png";
import pumpImg from "../../assets/cards/pump.png";
import {
  SYSTEM_LABEL,
  VALVE_KIND_LABEL,
  VALVE_STATE,
} from "../../constants/labels";
import type { Valve, ValveKind } from "../../types/models";
import StatusBadge, { OnlineBadge } from "../common/StatusBadge";
import CardShell from "./CardShell";

// The kind of equipment picks the icon: a valve or a pump
const KIND_IMAGE: Record<ValveKind, string> = {
  valve: valveImg,
  pump: pumpImg,
};

// Assigned valve: manual open/close + unassign. Unassigned valve: assign + delete.
export default function ValveCard({
  valve,
  onCommand,
  onAssign,
  onUnassign,
  onEdit,
  onDelete,
}: {
  valve: Valve;
  onCommand: (a: "on" | "off") => void;
  onAssign: () => void;
  onUnassign: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const st = VALVE_STATE[valve.state];
  const assigned = valve.deviceId !== null;

  return (
    <CardShell
      image={KIND_IMAGE[valve.kind]}
      title={valve.name}
      subtitle={`${VALVE_KIND_LABEL[valve.kind]} · ${SYSTEM_LABEL[valve.system]}`}
      badges={
        assigned ? (
          <>
            <StatusBadge tone={st.tone} icon={st.icon} label={st.label} />
            <OnlineBadge online={valve.deviceOnline} />
          </>
        ) : (
          <StatusBadge tone="off" icon="🆕" label="غير مدرج" />
        )
      }
      actions={
        assigned ? (
          <>
            {/* Control is disabled while the device is silent: the command could not reach it */}
            <button
              className="btn btn--primary"
              disabled={!valve.deviceOnline}
              onClick={() => onCommand("on")}
            >
              فتح
            </button>
            <button
              className="btn"
              disabled={!valve.deviceOnline}
              onClick={() => onCommand("off")}
            >
              إغلاق
            </button>
            <button className="btn" onClick={onEdit}>
              تعديل
            </button>
            <button className="btn" onClick={onUnassign}>
              إلغاء الإدراج
            </button>
          </>
        ) : (
          <>
            <button className="btn btn--primary" onClick={onAssign}>
              إدراج
            </button>
            <button className="btn" onClick={onEdit}>
              تعديل
            </button>
            <button className="btn btn--danger" onClick={onDelete}>
              حذف
            </button>
          </>
        )
      }
    >
      {assigned && <p className="muted">القناة {valve.channel}</p>}
    </CardShell>
  );
}
