import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { RaidLog, FilterState, getRaidInstanceForBoss, formatSessionTime } from "../types/RaidLog";
import { LogsResponseSchema } from "@/src/domain/schemas/schemas";

export function useRaidLogs() {
  const now = new Date();
  const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; // "YYYY-MM-DD" en TZ local

  const [filters, setFilters] = useState<FilterState>({
    date: todayDate,
    raidInstance: "Icecrown Citadel",
    boss: "Lord Marrowgar",
    metric: "Damage",
    search: "",
    session: null,
  });

  // Debounce the search input by 300ms
  const [debouncedSearch] = useDebounce(filters.search, 300);

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["raidLogs", filters.date, filters.metric],
    queryFn: async () => {
      if (!filters.date) return [];

      const response = await fetch(`/api/logs?date=${filters.date}`);
      if (!response.ok) throw new Error("Failed to fetch logs");

      const rawData = await response.json();
      
      // Validar datos con Zod
      const parsedData = LogsResponseSchema.parse(rawData);

      // Flatten encounters → rows por jugador
      const flattenedLogs: RaidLog[] = parsedData.flatMap((encounter) => {
        const listToMap = (filters.metric === "Healing" ? encounter.Healing : encounter.Damage) || [];
        return listToMap.map((entry) => ({
          ...entry,
          Amount: String(entry.Amount),
          DPS: entry.DPS != null ? String(entry.DPS) : undefined,
          Talent: entry.Talent ?? undefined,
          Icon: entry.Icon ?? undefined,
          date: encounter.date,
          boss: encounter.name,
          endtime: encounter.endtime,
          raidInstance: getRaidInstanceForBoss(encounter.name),
        })) as RaidLog[];
      });

      return flattenedLogs;
    },
    enabled: !!filters.date,
  });

  // Logs del jefe/instancia elegidos, sin filtrar aún por sesión ni búsqueda
  // (varias sesiones del mismo jefe pueden caer el mismo día, ver features.md)
  const logsForSelectedBoss = logs.filter((log) => {
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

  // Sesiones distintas (por endtime) disponibles para el jefe/instancia/fecha actuales
  const sessions = useMemo(() => {
    const uniqueEndtimes = [...new Set(logsForSelectedBoss.map((l) => l.endtime))].sort(
      (a, b) => a - b,
    );
    return uniqueEndtimes.map((endtime) => ({ endtime, label: formatSessionTime(endtime) }));
  }, [logsForSelectedBoss]);

  // Si la sesión elegida ya no está disponible (cambió el jefe/fecha), recaer en la primera
  useEffect(() => {
    const stillValid = filters.session != null && sessions.some((s) => s.endtime === filters.session);
    const fallback = sessions[0]?.endtime ?? null;
    if (!stillValid && fallback !== filters.session) {
      setFilters((prev) => ({ ...prev, session: fallback }));
    }
  }, [sessions, filters.session]);

  const filteredLogs = logsForSelectedBoss.filter((log) => {
    if (filters.session != null && log.endtime !== filters.session) {
      return false;
    }
    if (
      debouncedSearch &&
      !log.Character.toLowerCase().includes(debouncedSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return {
    logs: filteredLogs,
    sessions,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    filters,
    setFilters,
  };
}
