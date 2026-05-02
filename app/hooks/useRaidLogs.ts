import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { RaidLog, FilterState } from "../types/RaidLog";
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
          raidInstance: "Icecrown Citadel",
        })) as RaidLog[];
      });

      return flattenedLogs;
    },
    enabled: !!filters.date,
  });

  // Filtros locales: instancia, jefe y búsqueda (debounced)
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
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    filters,
    setFilters,
  };
}
