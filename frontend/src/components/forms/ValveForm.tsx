import { useState } from "react";
import { plotsApi } from "../../api/plots.api";
import { valvesApi } from "../../api/valves.api";
import {
  SYSTEMS,
  SYSTEM_LABEL,
  VALVE_KINDS,
  VALVE_KIND_LABEL,
} from "../../constants/labels";
import { useFetch } from "../../hooks/useFetch";
import type { SystemType, Valve, ValveKind } from "../../types/models";
import Modal from "../common/Modal";
import FormShell, { Field } from "./FormShell";

// Register a new (unassigned) valve, or edit name/plot of an existing one.
// Kind and system are fixed after creation. The plot list only offers plots of the valve's own parcel.
export default function ValveForm({
  valve,
  onDone,
  onClose,
}: {
  valve?: Valve;
  onDone: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(valve?.name ?? "");
  const [kind, setKind] = useState<ValveKind>(valve?.kind ?? "valve");
  const [system, setSystem] = useState<SystemType>(
    valve?.system ?? "irrigation",
  );
  const [plotId, setPlotId] = useState(
    valve?.plotId ? String(valve.plotId) : "",
  );
  const plots = useFetch(
    () =>
      valve?.parcelId ? plotsApi.list(valve.parcelId) : Promise.resolve([]),
    [valve?.parcelId],
  );

  async function submit() {
    if (valve)
      await valvesApi.update(valve.id, {
        name,
        plotId: plotId ? Number(plotId) : undefined,
      });
    else await valvesApi.create({ name, kind, system });
    onDone();
  }

  return (
    <Modal title={valve ? "تعديل الصمام" : "صمام جديد"} onClose={onClose}>
      <FormShell onSubmit={submit} submitLabel="حفظ" onCancel={onClose}>
        <Field label="الاسم">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </Field>
        <Field label="النوع">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ValveKind)}
            disabled={!!valve}
          >
            {VALVE_KINDS.map((k) => (
              <option key={k} value={k}>
                {VALVE_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="النظام">
          <select
            value={system}
            onChange={(e) => setSystem(e.target.value as SystemType)}
            disabled={!!valve}
          >
            {SYSTEMS.map((s) => (
              <option key={s} value={s}>
                {SYSTEM_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        {valve?.parcelId && (
          <Field label="القطعة">
            <select value={plotId} onChange={(e) => setPlotId(e.target.value)}>
              {plots.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </FormShell>
    </Modal>
  );
}
