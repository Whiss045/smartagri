import { Link } from "react-router-dom";
import { devicesApi } from "../api/devices.api";
import { parcelsApi } from "../api/parcels.api";
import AsyncState from "../components/common/AsyncState";
import { useFetch } from "../hooks/useFetch";

// Overview: key counts, each linking to its section
export default function HomePage() {
  const parcels = useFetch(() => parcelsApi.list(), [], 30000);
  const fresh = useFetch(
    () => devicesApi.list({ unassigned: true }),
    [],
    30000,
  );

  const list = parcels.data ?? [];
  const sum = (pick: (p: (typeof list)[number]) => number) =>
    list.reduce((n, p) => n + pick(p), 0);

  const tiles = [
    { to: "/parcels", label: "الأراضي", value: list.length },
    { to: "/parcels", label: "القطع", value: sum((p) => p.plots?.length ?? 0) },
    {
      to: "/valves",
      label: "الصمامات",
      value: sum((p) => p.valves?.length ?? 0),
    },
    {
      to: "/sensors",
      label: "الحساسات",
      value: sum((p) => p.sensors?.length ?? 0),
    },
    {
      to: "/devices/unassigned",
      label: "أجهزة جديدة غير مدرجة",
      value: fresh.data?.length ?? 0,
    },
  ];

  return (
    <>
      <div className="page-head">
        <h1>الرئيسية</h1>
      </div>
      <AsyncState
        loading={parcels.loading}
        error={parcels.error}
        onRetry={parcels.reload}
      >
        <div className="grid">
          {tiles.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="empty" style={{ borderStyle: "solid" }}>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                  }}
                >
                  {t.value}
                </div>
                {t.label}
              </div>
            </Link>
          ))}
        </div>
      </AsyncState>
    </>
  );
}
