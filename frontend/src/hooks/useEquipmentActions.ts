import { valvesApi } from "../api/valves.api";
import { sensorsApi } from "../api/sensors.api";
import type { Sensor, Valve } from "../types/models";
import { act } from "./useFetch";

// Valve/sensor actions shared by several pages (confirmation + error display included)
export function useEquipmentActions(reload: () => void) {
  // The backend answers 202 "sent"; the device reports its new state a moment later
  const refreshSoon = () => {
    window.setTimeout(reload, 2000);
    window.setTimeout(reload, 6000);
  };

  return {
    command: (v: Valve, action: "on" | "off") =>
      act(() => valvesApi.command(v.id, action), refreshSoon),

    unassignValve: async (v: Valve) => {
      if (
        window.confirm(`إلغاء إدراج "${v.name}"؟ سيُغلق أولاً إن كان مفتوحًا.`)
      ) {
        await act(() => valvesApi.unassign(v.id), reload);
      }
    },
    deleteValve: async (v: Valve) => {
      if (window.confirm(`حذف "${v.name}" نهائيًا؟`))
        await act(() => valvesApi.remove(v.id), reload);
    },
    unassignSensor: async (s: Sensor) => {
      if (
        window.confirm(`إلغاء إدراج "${s.name}"؟ يبقى سجل قياساته محفوظًا.`)
      ) {
        await act(() => sensorsApi.unassign(s.id), reload);
      }
    },
  };
}
