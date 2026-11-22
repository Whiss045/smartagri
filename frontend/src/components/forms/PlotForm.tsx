import { useState } from "react";
import { plotsApi } from "../../api/plots.api";
import type { Plot } from "../../types/models";
import Modal from "../common/Modal";
import FormShell, { Field } from "./FormShell";

// Create or edit a plot inside a given parcel (the parcel is fixed by the page, not typed)
export default function PlotForm({
  parcelId,
  plot,
  onDone,
  onClose,
}: {
  parcelId: number;
  plot?: Plot;
  onDone: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(plot?.name ?? "");
  const [description, setDescription] = useState(plot?.description ?? "");

  async function submit() {
    if (plot) await plotsApi.update(plot.id, { name, description });
    else await plotsApi.create({ parcelId, name, description });
    onDone();
  }

  return (
    <Modal title={plot ? "تعديل القطعة" : "قطعة جديدة"} onClose={onClose}>
      <FormShell onSubmit={submit} submitLabel="حفظ" onCancel={onClose}>
        <Field label="الاسم">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </Field>
        <Field label="الوصف">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </Field>
      </FormShell>
    </Modal>
  );
}
