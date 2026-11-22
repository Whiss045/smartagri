import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { devicesApi } from "../api/devices.api";
import { parcelsApi } from "../api/parcels.api";
import { plotsApi } from "../api/plots.api";
import AsyncState from "../components/common/AsyncState";
import DeviceCard from "../components/cards/DeviceCard";
import PlotCard from "../components/cards/PlotCard";
import DeviceForm from "../components/forms/DeviceForm";
import PlotForm from "../components/forms/PlotForm";
import { PARCEL_TYPE_LABEL } from "../constants/labels";
import { act, useFetch } from "../hooks/useFetch";
import type { Device, Plot } from "../types/models";

// One parcel: its plots and the devices assigned to it
export default function PlotsPage() {
  const parcelId = Number(useParams().parcelId);
  const navigate = useNavigate();
  const parcel = useFetch(() => parcelsApi.get(parcelId), [parcelId]);
  const plots = useFetch(() => plotsApi.list(parcelId), [parcelId]);
  const devices = useFetch(
    () => devicesApi.list({ parcelId }),
    [parcelId],
    15000,
  );

  const [plotForm, setPlotForm] = useState<{ plot?: Plot } | null>(null);
  const [deviceForm, setDeviceForm] = useState<Device | null>(null);

  async function removePlot(p: Plot) {
    if (window.confirm(`حذف القطعة "${p.name}"؟`))
      await act(() => plotsApi.remove(p.id), plots.reload); // refused while it has equipment
  }
  async function unassign(d: Device) {
    if (window.confirm("إلغاء إدراج الجهاز؟ ستُفصل معداته وتُحذف برمجتها.")) {
      await act(
        () => devicesApi.unassign(d.id),
        () => {
          devices.reload();
          plots.reload();
        },
      );
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/parcels">← الأراضي</Link>
          <h1>{parcel.data?.name ?? "…"}</h1>
          {parcel.data && (
            <p className="muted">{PARCEL_TYPE_LABEL[parcel.data.type]}</p>
          )}
        </div>
        <button className="btn btn--primary" onClick={() => setPlotForm({})}>
          + قطعة جديدة
        </button>
      </div>

      <AsyncState
        loading={plots.loading}
        error={plots.error}
        onRetry={plots.reload}
        empty={plots.data?.length === 0}
        emptyText="لا توجد قطع في هذه الأرض."
      >
        <div className="grid">
          {plots.data?.map((p) => (
            <PlotCard
              key={p.id}
              plot={p}
              onOpen={() => navigate(`/parcels/${parcelId}/plots/${p.id}`)}
              onEdit={() => setPlotForm({ plot: p })}
              onDelete={() => void removePlot(p)}
            />
          ))}
        </div>
      </AsyncState>

      <div className="section">
        <div className="page-head">
          <h2>أجهزة هذه الأرض</h2>
        </div>
        <AsyncState
          loading={devices.loading}
          error={devices.error}
          onRetry={devices.reload}
          empty={devices.data?.length === 0}
          emptyText="لا توجد أجهزة مدرجة في هذه الأرض."
        >
          <div className="grid">
            {devices.data?.map((d) => (
              <DeviceCard
                key={d.id}
                device={d}
                parcelName={parcel.data?.name}
                onEdit={() => setDeviceForm(d)}
                onUnassign={() => void unassign(d)}
              />
            ))}
          </div>
        </AsyncState>
      </div>

      {plotForm && (
        <PlotForm
          parcelId={parcelId}
          plot={plotForm.plot}
          onClose={() => setPlotForm(null)}
          onDone={() => {
            setPlotForm(null);
            plots.reload();
          }}
        />
      )}
      {deviceForm && (
        <DeviceForm
          device={deviceForm}
          onClose={() => setDeviceForm(null)}
          onDone={() => {
            setDeviceForm(null);
            devices.reload();
          }}
        />
      )}
    </>
  );
}
