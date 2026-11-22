import plotImg from "../../assets/cards/plot.png";
import type { Plot } from "../../types/models";
import CardShell from "./CardShell";

// One plot: click opens its equipment page
export default function PlotCard({
  plot,
  onOpen,
  onEdit,
  onDelete,
}: {
  plot: Plot;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <CardShell
      image={plotImg}
      title={plot.name}
      subtitle={plot.description ?? undefined}
      onClick={onOpen}
      actions={
        <>
          <button className="btn" onClick={onEdit}>
            تعديل
          </button>
          <button className="btn btn--danger" onClick={onDelete}>
            حذف
          </button>
        </>
      }
    >
      <p className="muted">
        الصمامات: {plot.valveCount ?? 0} · الحساسات: {plot.sensorCount ?? 0}
      </p>
    </CardShell>
  );
}
