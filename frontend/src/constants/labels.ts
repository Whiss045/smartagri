import { ApiError } from "../api/client";
import type { FontSize, Theme } from "../hooks/appearance";
import type {
  ParcelType,
  SensorType,
  SystemType,
  ValveKind,
  ValveState,
} from "../types/models";

export type Tone = "ok" | "off" | "bad" | "warn";

/* ---- Settings page ---- */
export const THEME_LABEL: Record<Theme, string> = {
  light: "☀️ فاتح",
  warm: "🌅 دافئ",
  dark: "🌙 داكن",
};
export const FONT_LABEL: Record<FontSize, string> = {
  small: "صغير",
  medium: "متوسط",
  large: "كبير",
};

/* ---- Display names for every enum the backend uses ---- */
export const PARCEL_TYPE_LABEL: Record<ParcelType, string> = {
  palm_field: "حقل نخيل",
  greenhouse: "بيت مكيف",
};
export const SYSTEM_LABEL: Record<SystemType, string> = {
  irrigation: "ري",
  heating: "تدفئة",
};
export const VALVE_KIND_LABEL: Record<ValveKind, string> = {
  valve: "صمام",
  pump: "مضخة",
};

// Each state = tone + icon + word (never colour alone)
export const VALVE_STATE: Record<
  ValveState,
  { label: string; icon: string; tone: Tone }
> = {
  on: { label: "مفتوح", icon: "💧", tone: "ok" },
  off: { label: "مغلق", icon: "⏹", tone: "off" },
  fault: { label: "عطل", icon: "⚠️", tone: "bad" },
  unknown: { label: "غير معروف", icon: "❔", tone: "warn" },
};

// Default unit is suggested when the farmer picks a sensor type
export const SENSOR_TYPE: Record<SensorType, { label: string; unit: string }> =
  {
    soil_moisture: { label: "رطوبة التربة", unit: "%" },
    soil_temperature: { label: "حرارة التربة", unit: "°C" },
    air_temperature: { label: "حرارة الهواء", unit: "°C" },
    air_humidity: { label: "رطوبة الهواء", unit: "%" },
    water_flow: { label: "تدفق الماء", unit: "L/min" },
    water_pressure: { label: "ضغط الماء", unit: "bar" },
    water_temperature: { label: "حرارة الماء", unit: "°C" },
  };

// Option lists for the <select> elements
export const PARCEL_TYPES = Object.keys(PARCEL_TYPE_LABEL) as ParcelType[];
export const SYSTEMS = Object.keys(SYSTEM_LABEL) as SystemType[];
export const VALVE_KINDS = Object.keys(VALVE_KIND_LABEL) as ValveKind[];
export const SENSOR_TYPES = Object.keys(SENSOR_TYPE) as SensorType[];

export const WEEKDAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
]; // 0 = Sunday

/* ---- Backend error code -> Arabic message ---- */
const ERROR_LABEL: Record<string, string> = {
  VALIDATION: "بيانات غير صالحة، راجع الحقول",
  DUPLICATE: "سجل بنفس القيم موجود مسبقًا",
  INVALID_JSON: "طلب غير صالح",
  ROUTE_NOT_FOUND: "العنوان غير موجود",
  INTERNAL: "خطأ في الخادم، أعد المحاولة",
  NETWORK: "تعذّر الاتصال بالخادم",
  DEVICE_NOT_FOUND: "الجهاز غير موجود",
  PARCEL_NOT_FOUND: "الأرض غير موجودة",
  PLOT_NOT_FOUND: "القطعة غير موجودة",
  VALVE_NOT_FOUND: "الصمام غير موجود",
  SENSOR_NOT_FOUND: "الحساس غير موجود",
  DEVICE_UNASSIGNED: "أدرج الجهاز في أرض أولاً",
  PLOT_PARCEL_MISMATCH: "القطعة لا تنتمي إلى أرض الجهاز",
  PLOT_REQUIRED: "اختيار القطعة إلزامي",
  CHANNEL_IN_USE: "هذه القناة مستعملة من معدّة أخرى",
  DUPLICATE_CHANNEL: "قناتان متطابقتان في نفس الطلب",
  HEATING_NOT_ALLOWED: "التدفئة مسموحة في البيوت المحمية فقط",
  PLOT_NAME_TAKEN: "اسم القطعة مستعمل في هذه الأرض",
  PLOT_NOT_EMPTY: "لا يمكن حذف قطعة تحتوي على معدات",
  VALVE_NOT_ASSIGNED: "الصمام غير مدرج في جهاز",
  VALVE_ALREADY_ASSIGNED: "الصمام مدرج مسبقًا، ألغِ إدراجه أولاً",
  VALVE_STILL_ASSIGNED: "ألغِ إدراج الصمام قبل حذفه",
  VALVE_HAS_SCHEDULES: "احذف برمجة هذا الصمام أولاً",
  VALVE_FAULT: "المعدّة في حالة عطل",
  SENSOR_NOT_ASSIGNED: "الحساس غير مدرج في جهاز",
  SENSOR_ALREADY_ASSIGNED: "الحساس مدرج مسبقًا، ألغِ إدراجه أولاً",
  DEVICE_OFFLINE: "الجهاز غير متصل حاليًا",
  DEVICE_PARCEL_MISMATCH: "الجهاز لا ينتمي لأرض هذه المعدّة",
  BROKER_UNAVAILABLE: "وسيط الرسائل غير متاح",
  SCHEDULE_OVERLAP: "هذه البرمجة تتداخل مع برمجة أخرى على نفس الصمام",
  SCHEDULE_DAYS_REQUIRED: "اختر يومًا واحدًا على الأقل",
};

// Older backend errors have no code, so fall back to the HTTP status
const STATUS_LABEL: Record<number, string> = {
  400: "بيانات غير صالحة",
  401: "انتهت الجلسة، سجّل الدخول من جديد",
  404: "العنصر غير موجود",
  409: "العملية غير ممكنة في الحالة الحالية",
  429: "محاولات كثيرة، أعد المحاولة لاحقًا",
};

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code && ERROR_LABEL[e.code]) return ERROR_LABEL[e.code];
    if (STATUS_LABEL[e.status]) return STATUS_LABEL[e.status];
    if (e.status >= 500) return ERROR_LABEL.INTERNAL;
  }
  return "حدث خطأ غير متوقع";
}

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("ar-TN") : "—";
