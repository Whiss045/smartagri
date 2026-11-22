import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { sensorsApi } from "../api/sensors.api";
import AsyncState from "../components/common/AsyncState";
import { SENSOR_TYPE, formatDateTime } from "../constants/labels";
import { useFetch } from "../hooks/useFetch";

// Minimal line chart drawn with SVG (no library needed yet). Values go oldest -> newest.
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * 600},${110 - ((v - min) / span) * 100}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 600 120"
      preserveAspectRatio="none"
      style={{
        width: "100%",
        height: 140,
        color: "var(--primary)",
        background: "#fff",
        borderRadius: 12,
      }}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Read-only history of one sensor (the backend has no way to edit or delete readings)
export default function SensorPage() {
  const id = Number(useParams().sensorId);
  const [limit, setLimit] = useState(100);
  const sensor = useFetch(() => sensorsApi.get(id), [id]);
  const readings = useFetch(
    () => sensorsApi.readings(id, limit),
    [id, limit],
    30000,
  );

  const rows = readings.data ?? [];
  const values = [...rows].reverse().map((r) => Number(r.value)); // API returns newest first

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/sensors">← الحساسات</Link>
          <h1>{sensor.data?.name ?? "…"}</h1>
          {sensor.data && (
            <p className="muted">
              {SENSOR_TYPE[sensor.data.type].label} · {sensor.data.unit}
            </p>
          )}
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{ width: "auto" }}
        >
          {[50, 100, 200, 500].map((n) => (
            <option key={n} value={n}>
              آخر {n} قراءة
            </option>
          ))}
        </select>
      </div>

      <AsyncState
        loading={readings.loading}
        error={readings.error}
        onRetry={readings.reload}
        empty={rows.length === 0}
        emptyText="لا توجد قراءات بعد."
      >
        <Sparkline values={values} />
        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>الوقت</th>
              <th>القيمة</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((r) => (
              <tr key={r.recordedAt}>
                <td>{formatDateTime(r.recordedAt)}</td>
                <td>
                  {Number(r.value)} {sensor.data?.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AsyncState>
    </>
  );
}
