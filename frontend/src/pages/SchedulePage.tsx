import { useState } from "react";
import { schedulesApi } from "../api/schedules.api";
import AsyncState from "../components/common/AsyncState";
import ScheduleCard from "../components/cards/ScheduleCard";
import ScheduleForm from "../components/forms/ScheduleForm";
import { SYSTEMS, SYSTEM_LABEL } from "../constants/labels";
import { act, useFetch } from "../hooks/useFetch";
import type { Schedule, SystemType } from "../types/models";

// Irrigation / heating schedules with filter tabs, toggle, edit and delete
export default function SchedulePage() {
  const [system, setSystem] = useState<SystemType | "">("");
  const { data, loading, error, reload } = useFetch(
    () => schedulesApi.list({ system: system || undefined }),
    [system],
  );
  const [form, setForm] = useState<{ schedule?: Schedule } | null>(null);

  async function remove(s: Schedule) {
    if (window.confirm(`حذف البرمجة "${s.name}"؟`))
      await act(() => schedulesApi.remove(s.id), reload);
  }

  return (
    <>
      <div className="page-head">
        <h1>البرمجة</h1>
        <button className="btn btn--primary" onClick={() => setForm({})}>
          + برمجة جديدة
        </button>
      </div>

      <div className="tabs">
        <button
          className="btn"
          aria-pressed={system === ""}
          onClick={() => setSystem("")}
        >
          الكل
        </button>
        {SYSTEMS.map((s) => (
          <button
            key={s}
            className="btn"
            aria-pressed={system === s}
            onClick={() => setSystem(s)}
          >
            {SYSTEM_LABEL[s]}
          </button>
        ))}
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={data?.length === 0}
        emptyText="لا توجد برمجة بعد."
      >
        <div className="grid">
          {data?.map((s) => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              onToggle={() =>
                void act(
                  () => schedulesApi.update(s.id, { enabled: !s.enabled }),
                  reload,
                )
              }
              onEdit={() => setForm({ schedule: s })}
              onDelete={() => void remove(s)}
            />
          ))}
        </div>
      </AsyncState>

      {form && (
        <ScheduleForm
          schedule={form.schedule}
          onClose={() => setForm(null)}
          onDone={() => {
            setForm(null);
            reload();
          }}
        />
      )}
    </>
  );
}
