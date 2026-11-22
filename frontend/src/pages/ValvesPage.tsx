import { useState } from "react";
import { valvesApi } from "../api/valves.api";
import AsyncState from "../components/common/AsyncState";
import ValveCard from "../components/cards/ValveCard";
import AssignEquipmentForm from "../components/forms/AssignEquipmentForm";
import ValveForm from "../components/forms/ValveForm";
import { useEquipmentActions } from "../hooks/useEquipmentActions";
import { useFetch } from "../hooks/useFetch";
import type { Valve } from "../types/models";

// All valves, with a tab for the unassigned ones and the register / assign flows
export default function ValvesPage() {
  const [tab, setTab] = useState<"all" | "unassigned">("all");
  const { data, loading, error, reload } = useFetch(
    () => valvesApi.list({ unassigned: tab === "unassigned" }),
    [tab],
    10000,
  );
  const actions = useEquipmentActions(reload);

  const [form, setForm] = useState<{ valve?: Valve } | null>(null);
  const [assigning, setAssigning] = useState<Valve | null>(null);

  return (
    <>
      <div className="page-head">
        <h1>الصمامات</h1>
        <button className="btn btn--primary" onClick={() => setForm({})}>
          + صمام جديد
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
        emptyText="لا توجد صمامات."
      >
        <div className="grid">
          {data?.map((v) => (
            <ValveCard
              key={v.id}
              valve={v}
              onCommand={(a) => void actions.command(v, a)}
              onAssign={() => setAssigning(v)}
              onUnassign={() => void actions.unassignValve(v)}
              onEdit={() => setForm({ valve: v })}
              onDelete={() => void actions.deleteValve(v)}
            />
          ))}
        </div>
      </AsyncState>

      {form && (
        <ValveForm
          valve={form.valve}
          onClose={() => setForm(null)}
          onDone={() => {
            setForm(null);
            reload();
          }}
        />
      )}
      {assigning && (
        <AssignEquipmentForm
          kind="valve"
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
