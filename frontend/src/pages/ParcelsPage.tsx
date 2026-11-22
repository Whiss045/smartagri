import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parcelsApi } from "../api/parcels.api";
import AsyncState from "../components/common/AsyncState";
import ParcelCard from "../components/cards/ParcelCard";
import ParcelForm from "../components/forms/ParcelForm";
import { act, useFetch } from "../hooks/useFetch";
import type { Parcel } from "../types/models";

export default function ParcelsPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => parcelsApi.list());
  const [form, setForm] = useState<{ parcel?: Parcel } | null>(null); // null = closed; {} = create

  async function remove(p: Parcel) {
    if (
      window.confirm(
        `حذف "${p.name}"؟ ستُفصل أجهزتها ومعداتها وتُحذف برمجتها، ويبقى سجل الحساسات.`,
      )
    ) {
      await act(() => parcelsApi.remove(p.id), reload);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>الأراضي</h1>
        <button className="btn btn--primary" onClick={() => setForm({})}>
          + أرض جديدة
        </button>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={data?.length === 0}
        emptyText="لا توجد أراضٍ بعد. أضف أول أرض."
      >
        <div className="grid">
          {data?.map((p) => (
            <ParcelCard
              key={p.id}
              parcel={p}
              onOpen={() => navigate(`/parcels/${p.id}/plots`)}
              onEdit={() => setForm({ parcel: p })}
              onDelete={() => void remove(p)}
            />
          ))}
        </div>
      </AsyncState>

      {form && (
        <ParcelForm
          parcel={form.parcel}
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
