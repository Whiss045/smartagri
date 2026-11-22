import { useState } from "react";
import { schedulesApi } from "../../api/schedules.api";
import { valvesApi } from "../../api/valves.api";
import { SYSTEM_LABEL, WEEKDAYS } from "../../constants/labels";
import { useFetch } from "../../hooks/useFetch";
import type { Schedule } from "../../types/models";
import Modal from "../common/Modal";
import FormShell, { Field } from "./FormShell";
import { ApiError } from "../../api/client";

// Create or edit a schedule. The valve is picked from assigned valves only
// and can't be changed afterwards (backend rule).
export default function ScheduleForm({
  schedule,
  onDone,
  onClose,
}: {
  schedule?: Schedule;
  onDone: () => void;
  onClose: () => void;
}) {
  const valves = useFetch(() => valvesApi.list());
  const [valveId, setValveId] = useState(
    schedule ? String(schedule.valveId) : "",
  );
  const [name, setName] = useState(schedule?.name ?? "");
  const [startTime, setStartTime] = useState(
    schedule?.startTime.slice(0, 5) ?? "06:00",
  );
  const [duration, setDuration] = useState(
    String(schedule?.durationMinutes ?? 30),
  );
  const [days, setDays] = useState<number[]>(schedule?.daysOfWeek ?? []);
  const [enabled, setEnabled] = useState(schedule?.enabled ?? true);

  const assigned = valves.data?.filter((v) => v.deviceId !== null) ?? [];
  const toggleDay = (d: number) =>
    setDays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort(),
    );

  async function submit() {
    // Checked in the browser, before calling the backend. The code maps to the Arabic text in labels.ts.
    if (days.length === 0)
      throw new ApiError(400, "No days selected", "SCHEDULE_DAYS_REQUIRED");
    const body = {
      name,
      startTime,
      durationMinutes: Number(duration),
      daysOfWeek: days,
      enabled,
    };
    if (schedule) await schedulesApi.update(schedule.id, body);
    else await schedulesApi.create({ valveId: Number(valveId), ...body });
    onDone();
  }

  return (
    <Modal title={schedule ? "تعديل البرمجة" : "برمجة جديدة"} onClose={onClose}>
      <FormShell onSubmit={submit} submitLabel="حفظ" onCancel={onClose}>
        <Field label="الصمام">
          <select
            value={valveId}
            onChange={(e) => setValveId(e.target.value)}
            required
            disabled={!!schedule}
          >
            <option value="">— اختر صمامًا —</option>
            {assigned.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({SYSTEM_LABEL[v.system]})
              </option>
            ))}
          </select>
        </Field>
        {valves.data && assigned.length === 0 && (
          <p className="muted">لا توجد صمامات مدرجة. أدرج صمامًا أولاً.</p>
        )}

        <Field label="الاسم">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </Field>
        <Field label="وقت البدء">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </Field>
        <Field label="المدة (دقائق)">
          <input
            type="number"
            min={1}
            max={1440}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </Field>

        <Field label="الأيام (اختر يومًا على الأقل)">
          <div className="days">
            {WEEKDAYS.map((label, d) => (
              <label key={d}>
                <input
                  type="checkbox"
                  checked={days.includes(d)}
                  onChange={() => toggleDay(d)}
                />
                {label}
              </label>
            ))}
          </div>
        </Field>

        <label className="days">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          مفعّلة
        </label>
      </FormShell>
    </Modal>
  );
}
