import { useState, useEffect } from "react";
import { RaidLog, FilterState, RaidEncounterPayload } from "../types/RaidLog";

export function useRaidLogs() {
  const [logs, setLogs] = useState<RaidLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const [filters, setFilters] = useState<FilterState>({
    date: todayDate,
    raidInstance: "",
    boss: "",
  });

  useEffect(() => {
    // No cargar nada hasta que se seleccione una fecha
    if (!filters.date) {
      setLogs([]);
      return;
    }

    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/logs?date=${filters.date}`);
        if (!response.ok) throw new Error("Failed to fetch logs");

        const data: RaidEncounterPayload[] = await response.json();

        // Flatten encounters → rows por jugador
        const flattenedLogs: RaidLog[] = data.flatMap((encounter) =>
          encounter.Damage.map((dmg) => ({
            ...dmg,
            date: encounter.date,
            boss: encounter.name,
            raidInstance: "Icecrown Citadel",
          })),
        );

        setLogs(flattenedLogs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [filters.date]);

  // Filtros locales: instancia y jefe (la fecha ya va directo a la API)
  const filteredLogs = logs.filter((log) => {
    if (
      filters.raidInstance &&
      filters.raidInstance !== "all" &&
      log.raidInstance !== filters.raidInstance
    ) {
      return false;
    }
    if (filters.boss && filters.boss !== "all" && log.boss !== filters.boss) {
      return false;
    }
    return true;
  });

  return {
    logs: filteredLogs,
    loading,
    error,
    filters,
    setFilters,
  };
}
