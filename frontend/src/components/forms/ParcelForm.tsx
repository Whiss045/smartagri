import { useState } from "react";
import { parcelsApi } from "../../api/parcels.api";
import { PARCEL_TYPES, PARCEL_TYPE_LABEL } from "../../constants/labels";
import type { Parcel, ParcelType } from "../../types/models";
import Modal from "../common/Modal";
import FormShell, { Field } from "./FormShell";

// Create or edit a parcel. The type is chosen once and then locked (backend rule).
export default function ParcelForm({
  parcel,
  onDone,
  onClose,
}: {
  parcel?: Parcel;
  onDone: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(parcel?.name ?? "");
  const [type, setType] = useState<ParcelType>(parcel?.type ?? "palm_field");
  const [location, setLocation] = useState(parcel?.location ?? "");
  const [notes, setNotes] = useState(parcel?.notes ?? "");

  async function submit() {
    if (parcel) await parcelsApi.update(parcel.id, { name, location, notes });
    else await parcelsApi.create({ name, type, location, notes });
    onDone();
  }

  return (
    <Modal title={parcel ? "تعديل الأرض" : "أرض جديدة"} onClose={onClose}>
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
            value={type}
            onChange={(e) => setType(e.target.value as ParcelType)}
            disabled={!!parcel}
          >
            {PARCEL_TYPES.map((t) => (
              <option key={t} value={t}>
                {PARCEL_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="الموقع">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Field>
        <Field label="ملاحظات">
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </FormShell>
    </Modal>
  );
}
