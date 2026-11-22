import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { plotsApi } from "../api/plots.api";
import { sensorsApi } from "../api/sensors.api";
import { valvesApi } from "../api/valves.api";
import AsyncState from "../components/common/AsyncState";
import SensorCard from "../components/cards/SensorCard";
import ValveCard from "../components/cards/ValveCard";
import SensorForm from "../components/forms/SensorForm";
import ValveForm from "../components/forms/ValveForm";
import { useEquipmentActions } from "../hooks/useEquipmentActions";
import { useFetch } from "../hooks/useFetch";
import type { Sensor, Valve } from "../types/models";

// One plot: its valves (live control) and sensors (latest readings)
export default function PlotPage() {
  const { parcelId, plotId } = useParams();
  const id = Number(plotId);
  const navigate = useNavigate();

  const plot = useFetch(() => plotsApi.get(id), [id]);
  const valves = useFetch(() => valvesApi.list({ plotId: id }), [id], 10000); // polling shows state changes
  const sensors = useFetch(() => sensorsApi.list({ plotId: id }), [id], 15000);
  const actions = useEquipmentActions(() => {
    valves.reload();
    sensors.reload();
  });

  const [editValve, setEditValve] = useState<Valve | null>(null);
  const [editSensor, setEditSensor] = useState<Sensor | null>(null);

  return (
    <>
      <div className="page-head">
        <div>
          <Link to={`/parcels/${parcelId}/plots`}>← القطع</Link>
          <h1>{plot.data?.name ?? "…"}</h1>
          {plot.data?.description && (
            <p className="muted">{plot.data.description}</p>
          )}
        </div>
      </div>

      <h2>الصمامات</h2>
      <AsyncState
        loading={valves.loading}
        error={valves.error}
        onRetry={valves.reload}
        empty={valves.data?.length === 0}
        emptyText="لا توجد صمامات في هذه القطعة. أدرجها من صفحة الصمامات."
      >
        <div className="grid">
          {valves.data?.map((v) => (
            <ValveCard
              key={v.id}
              valve={v}
              onCommand={(a) => void actions.command(v, a)}
              onAssign={() => undefined}
              onUnassign={() => void actions.unassignValve(v)}
              onEdit={() => setEditValve(v)}
              onDelete={() => void actions.deleteValve(v)}
            />
          ))}
        </div>
      </AsyncState>

      <div className="section">
        <h2>الحساسات</h2>
        <AsyncState
          loading={sensors.loading}
          error={sensors.error}
          onRetry={sensors.reload}
          empty={sensors.data?.length === 0}
          emptyText="لا توجد حساسات في هذه القطعة."
        >
          <div className="grid">
            {sensors.data?.map((s) => (
              <SensorCard
                key={s.id}
                sensor={s}
                onOpen={() => navigate(`/sensors/${s.id}`)}
                onAssign={() => undefined}
                onUnassign={() => void actions.unassignSensor(s)}
                onEdit={() => setEditSensor(s)}
              />
            ))}
          </div>
        </AsyncState>
      </div>

      {editValve && (
        <ValveForm
          valve={editValve}
          onClose={() => setEditValve(null)}
          onDone={() => {
            setEditValve(null);
            valves.reload();
          }}
        />
      )}
      {editSensor && (
        <SensorForm
          sensor={editSensor}
          onClose={() => setEditSensor(null)}
          onDone={() => {
            setEditSensor(null);
            sensors.reload();
          }}
        />
      )}
    </>
  );
}
