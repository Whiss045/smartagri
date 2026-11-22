import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sensorsApi } from "../api/sensors.api";
import AsyncState from "../components/common/AsyncState";
import SensorCard from "../components/cards/SensorCard";
import AssignEquipmentForm from "../components/forms/AssignEquipmentForm";
import SensorForm from "../components/forms/SensorForm";
import { useEquipmentActions } from "../hooks/useEquipmentActions";
import { useFetch } from "../hooks/useFetch";
import type { Sensor } from "../types/models";

// All sensors. Sensors are never deleted: they can only be unassigned (history stays).
export default function SensorsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "unassigned">("all");
  const { data, loading, error, reload } = useFetch(
    () => sensorsApi.list({ unassigned: tab === "unassigned" }),
    [tab],
    15000,
  );
  const actions = useEquipmentActions(reload);

  const [form, setForm] = useState<{ sensor?: Sensor } | null>(null);
  const [assigning, setAssigning] = useState<Sensor | null>(null);

  return (
    <>
      <div className="page-head">
        <h1>الحساسات</h1>
        <button className="btn btn--primary" onClick={() => setForm({})}>
          + حساس جديد
        </button>
      </div>

      <div className="tabs">
        <button
          className="btn"
          aria-pressed={tab === "all"}
          onClick={() => setTab("all")}
        >
          الكل
        </button>
        <button
          className="btn"
          aria-pressed={tab === "unassigned"}
          onClick={() => setTab("unassigned")}
        >
          غير مدرجة
        </button>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={data?.length === 0}
        emptyText="لا توجد حساسات."
      >
        <div className="grid">
          {data?.map((s) => (
            <SensorCard
              key={s.id}
              sensor={s}
              onOpen={() => navigate(`/sensors/${s.id}`)}
              onAssign={() => setAssigning(s)}
              onUnassign={() => void actions.unassignSensor(s)}
              onEdit={() => setForm({ sensor: s })}
            />
          ))}
        </div>
      </AsyncState>

      {form && (
        <SensorForm
          sensor={form.sensor}
          onClose={() => setForm(null)}
          onDone={() => {
            setForm(null);
            reload();
          }}
        />
      )}
      {assigning && (
        <AssignEquipmentForm
          kind="sensor"
          item={assigning}
          onClose={() => setAssigning(null)}
          onDone={() => {
            setAssigning(null);
            reload();
          }}
        />
      )}
    </>
  );
}
