import { useState } from "react";
import { devicesApi } from "../api/devices.api";
import { parcelsApi } from "../api/parcels.api";
import AsyncState from "../components/common/AsyncState";
import DeviceCard from "../components/cards/DeviceCard";
import DeviceForm from "../components/forms/DeviceForm";
import { act, useFetch } from "../hooks/useFetch";
import type { Device } from "../types/models";

// All devices, or only newly detected ones (the "unassigned devices" menu entry)
export default function DevicesPage({
  unassignedOnly = false,
}: {
  unassignedOnly?: boolean;
}) {
  const devices = useFetch(
    () => devicesApi.list({ unassigned: unassignedOnly }),
    [unassignedOnly],
    15000,
  );
  const parcels = useFetch(() => parcelsApi.list());
  const [form, setForm] = useState<{ device?: Device } | null>(null);

  const parcelName = (id: number | null) =>
    parcels.data?.find((p) => p.id === id)?.name;

  async function unassign(d: Device) {
    if (window.confirm("إلغاء إدراج الجهاز؟ ستُفصل معداته وتُحذف برمجتها.")) {
      await act(() => devicesApi.unassign(d.id), devices.reload);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>{unassignedOnly ? "الأجهزة غير المدرجة" : "الأجهزة"}</h1>
        <button className="btn btn--primary" onClick={() => setForm({})}>
          + إدراج جهاز مكتشف
        </button>
      </div>

      <AsyncState
        loading={devices.loading}
        error={devices.error}
        onRetry={devices.reload}
        empty={devices.data?.length === 0}
        emptyText={
          unassignedOnly
            ? "لا توجد أجهزة جديدة. شغّل الـESP32 وانتظر ظهوره."
            : "لا توجد أجهزة بعد."
        }
      >
        <div className="grid">
          {devices.data?.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              parcelName={parcelName(d.parcelId)}
              onEdit={() => setForm({ device: d })}
              onUnassign={() => void unassign(d)}
            />
          ))}
        </div>
      </AsyncState>

      {form && (
        <DeviceForm
          device={form.device}
          onClose={() => setForm(null)}
          onDone={() => {
            setForm(null);
            devices.reload();
          }}
        />
      )}
    </>
  );
}
