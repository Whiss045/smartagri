import { useState } from "react";
import { devicesApi } from "../../api/devices.api";
import { parcelsApi } from "../../api/parcels.api";
import { plotsApi } from "../../api/plots.api";
import { sensorsApi } from "../../api/sensors.api";
import { valvesApi } from "../../api/valves.api";
import { useFetch } from "../../hooks/useFetch";
import type { Device, Plot } from "../../types/models";
import Modal from "../common/Modal";
import FormShell, { Field } from "./FormShell";

// Assign a valve or sensor: parcel -> plot -> device (only that parcel's) -> channel number.
// Everything except the channel is a dropdown, so no invalid reference can be typed.
export default function AssignEquipmentForm({
  kind,
  item,
  onDone,
  onClose,
}: {
  kind: "valve" | "sensor";
  item: { id: number; name: string };
  onDone: () => void;
  onClose: () => void;
}) {
  const [parcelId, setParcelId] = useState("");
  const [plotId, setPlotId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [channel, setChannel] = useState("");

  const parcels = useFetch(() => parcelsApi.list());
  const plots = useFetch(
    () =>
      parcelId
        ? plotsApi.list(Number(parcelId))
        : Promise.resolve([] as Plot[]),
    [parcelId],
  );
  const devices = useFetch(
    () =>
      parcelId
        ? devicesApi.list({ parcelId: Number(parcelId) })
        : Promise.resolve([] as Device[]),
    [parcelId],
  );

  // Changing the parcel invalidates the plot and device chosen before
  function pickParcel(id: string) {
    setParcelId(id);
    setPlotId("");
    setDeviceId("");
  }

  async function submit() {
    const body = {
      deviceId: Number(deviceId),
      channel: Number(channel),
      plotId: Number(plotId),
    };
    if (kind === "valve") await valvesApi.assign(item.id, body);
    else await sensorsApi.assign(item.id, body);
    onDone();
  }

  return (
    <Modal title={`إدراج "${item.name}"`} onClose={onClose}>
      <FormShell onSubmit={submit} submitLabel="إدراج" onCancel={onClose}>
        <Field label="الأرض">
          <select
            value={parcelId}
            onChange={(e) => pickParcel(e.target.value)}
            required
          >
            <option value="">— اختر أرضًا —</option>
            {parcels.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        {parcels.data?.length === 0 && (
          <p className="muted">لا توجد أراضٍ بعد، أضف أرضًا أولاً.</p>
        )}

        <Field label="القطعة">
          <select
            value={plotId}
            onChange={(e) => setPlotId(e.target.value)}
            required
            disabled={!parcelId}
          >
            <option value="">— اختر قطعة —</option>
            {plots.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        {parcelId && plots.data?.length === 0 && (
          <p className="muted">لا توجد قطع في هذه الأرض، أضف قطعة أولاً.</p>
        )}

        <Field label="الجهاز">
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            required
            disabled={!parcelId}
          >
            <option value="">— اختر جهازًا —</option>
            {devices.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || d.deviceUid}
              </option>
            ))}
          </select>
        </Field>
        {parcelId && devices.data?.length === 0 && (
          <p className="muted">لا توجد أجهزة مدرجة في هذه الأرض.</p>
        )}

        <Field label="رقم القناة على الجهاز">
          <input
            type="number"
            min={0}
            max={255}
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            required
          />
        </Field>
      </FormShell>
    </Modal>
  );
}
