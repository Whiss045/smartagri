import { useState } from "react";
import { sensorsApi } from "../../api/sensors.api";
import { SENSOR_TYPE, SENSOR_TYPES } from "../../constants/labels";
import type { Sensor, SensorType } from "../../types/models";
import Modal from "../common/Modal";
import FormShell, { Field } from "./FormShell";

// Register a sensor (unassigned) or edit name/unit/active.
// The DHT switch registers TWO logical sensors (temperature + humidity) in one request.
export default function SensorForm({
  sensor,
  onDone,
  onClose,
}: {
  sensor?: Sensor;
  onDone: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(sensor?.name ?? "");
  const [dht, setDht] = useState(false);
  const [type, setType] = useState<SensorType>(sensor?.type ?? "soil_moisture");
  const [unit, setUnit] = useState(
    sensor?.unit ?? SENSOR_TYPE.soil_moisture.unit,
  );
  const [active, setActive] = useState(sensor?.active ?? true);

  // Picking a type suggests its usual unit (still editable)
  function pickType(t: SensorType) {
    setType(t);
    setUnit(SENSOR_TYPE[t].unit);
  }

  async function submit() {
    if (sensor) {
      await sensorsApi.update(sensor.id, { name, unit, active });
    } else if (dht) {
      await sensorsApi.create([
        { name: `${name} - حرارة`, type: "air_temperature", unit: "°C" },
        { name: `${name} - رطوبة`, type: "air_humidity", unit: "%" },
      ]);
    } else {
      await sensorsApi.create([{ name, type, unit }]);
    }
    onDone();
  }

  return (
    <Modal title={sensor ? "تعديل الحساس" : "حساس جديد"} onClose={onClose}>
      <FormShell onSubmit={submit} submitLabel="حفظ" onCancel={onClose}>
        <Field label="الاسم">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </Field>

        {!sensor && (
          <label className="check">
            <input
              type="checkbox"
              checked={dht}
              onChange={(e) => setDht(e.target.checked)}
            />
            حساس مزدوج (DHT11 / DHT22: حرارة + رطوبة)
          </label>
        )}

        {!dht && (
          <>
            <Field label="النوع">
              <select
                value={type}
                onChange={(e) => pickType(e.target.value as SensorType)}
                disabled={!!sensor}
              >
                {SENSOR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SENSOR_TYPE[t].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="الوحدة">
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                maxLength={16}
              />
            </Field>
          </>
        )}

        {sensor && (
          <label className="check">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            نشط (يسجّل القراءات)
          </label>
        )}
      </FormShell>
    </Modal>
  );
}
