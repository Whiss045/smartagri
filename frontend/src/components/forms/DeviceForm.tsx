import { useState } from "react";
import { devicesApi } from "../../api/devices.api";
import { parcelsApi } from "../../api/parcels.api";
import { useFetch } from "../../hooks/useFetch";
import type { Device } from "../../types/models";
import Modal from "../common/Modal";
import FormShell, { Field } from "./FormShell";

// Without `device`: pick one of the detected (unassigned) devices.
// With `device`: edit it. Parcel is always chosen from a list; "none" keeps it unassigned.
export default function DeviceForm({
  device,
  onDone,
  onClose,
}: {
  device?: Device;
  onDone: () => void;
  onClose: () => void;
}) {
  const parcels = useFetch(() => parcelsApi.list());
  const detected = useFetch(
    () =>
      device
        ? Promise.resolve([] as Device[])
        : devicesApi.list({ unassigned: true }),
    [device],
  );

  const [deviceId, setDeviceId] = useState(device ? String(device.id) : "");
  const [parcelId, setParcelId] = useState(
    device?.parcelId ? String(device.parcelId) : "",
  );
  const [name, setName] = useState(device?.name ?? "");
  const locked = device?.parcelId != null; // a device must be unassigned before it can change parcel

  async function submit() {
    const id = Number(deviceId);
    if (parcelId && !locked)
      await devicesApi.assign(id, {
        parcelId: Number(parcelId),
        name: name || undefined,
      });
    else await devicesApi.update(id, { name });
    onDone();
  }

  return (
    <Modal
      title={device ? "تعديل الجهاز" : "إدراج جهاز مكتشف"}
      onClose={onClose}
    >
      <FormShell onSubmit={submit} submitLabel="حفظ" onCancel={onClose}>
        {!device && (
          <Field label="الجهاز المكتشف">
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              required
            >
              <option value="">— اختر جهازًا —</option>
              {detected.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || d.deviceUid}
                </option>
              ))}
            </select>
          </Field>
        )}
        {!device && detected.data?.length === 0 && (
          <p className="muted">
            لا توجد أجهزة جديدة. شغّل الـESP32 وانتظر ظهوره.
          </p>
        )}

        <Field label="الاسم (اختياري)">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </Field>

        <Field label="الأرض">
          <select
            value={parcelId}
            onChange={(e) => setParcelId(e.target.value)}
            disabled={locked}
          >
            <option value="">بدون أرض (إبقاؤه غير مدرج)</option>
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
        {locked && (
          <p className="muted">لتغيير الأرض ألغِ إدراج الجهاز أولاً.</p>
        )}
      </FormShell>
    </Modal>
  );
}
