import palmImg from "../../assets/cards/palm_field.png";
import greenhouseImg from "../../assets/cards/greenhouse.png";
import { PARCEL_TYPE_LABEL } from "../../constants/labels";
import type { Parcel, ParcelType } from "../../types/models";
import CardShell from "./CardShell";

// One icon per parcel type. The backend type value picks the image.
const PARCEL_IMAGE: Record<ParcelType, string> = {
  palm_field: palmImg,
  greenhouse: greenhouseImg,
};

// One parcel: click opens its plots; buttons edit or delete it
export default function ParcelCard({
  parcel,
  onOpen,
  onEdit,
  onDelete,
}: {
  parcel: Parcel;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <CardShell
      image={PARCEL_IMAGE[parcel.type]}
      title={parcel.name}
      subtitle={PARCEL_TYPE_LABEL[parcel.type]}
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
      {parcel.location && <p className="muted">📍 {parcel.location}</p>}
      <p className="muted">
        القطع: {parcel.plots?.length ?? 0} · الأجهزة:{" "}
        {parcel.devices?.length ?? 0}
      </p>
    </CardShell>
  );
}
