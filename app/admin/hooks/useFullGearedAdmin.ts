"use client";

import { confirmDialog } from "@/components/confirm-dialog";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FullGearedCharacter } from "@/src/domain/entities/FullGeared";
import { adminJson } from "../lib/api";
import { AdminStatus, FullGearedForm } from "../types";

export const EMPTY_FULL_GEAR_FORM: FullGearedForm = {
  id: null,
  name: "",
  class: "",
  icc: false,
  rs: false,
  gs: 0,
  main: "",
};

interface FullGearedPage {
  data: FullGearedCharacter[];
  total: number;
}

/** Lista completa de Full Gear (son pocos) y sus altas, cambios y bajas. */
export function useFullGearedAdmin(onStatus: (status: AdminStatus) => void) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const query = useQuery({
    queryKey: ["adminFullGear"],
    queryFn: async () => {
      const res = await fetch("/api/full-geared?page=1&limit=500&fresh=1");
      if (!res.ok) throw new Error("Error al obtener personajes");
      return (await res.json()) as FullGearedPage;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["adminFullGear"] });
    queryClient.invalidateQueries({ queryKey: ["adminActivity"] });
    queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
  };

  const fail = (error: unknown, fallback: string) =>
    onStatus({ type: "error", message: error instanceof Error ? error.message : fallback });

  const saveCharacter = async (form: FullGearedForm, message?: string) => {
    setIsSaving(true);
    try {
      await adminJson("/api/full-geared", {
        method: form.id ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onStatus({ type: "success", message: message ?? `${form.name} guardado` });
      await adminJson("/api/admin/overview?fresh=1").catch(() => null);
      refresh();
      return true;
    } catch (error) {
      fail(error, "Error al guardar");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRaid = (char: FullGearedCharacter, raid: "icc" | "rs") => {
    const next = !char[raid];
    // Actualización optimista: el interruptor responde al momento.
    queryClient.setQueryData<FullGearedPage>(["adminFullGear"], (prev) =>
      prev
        ? {
            ...prev,
            data: prev.data.map((c) =>
              c.id === char.id
                ? { ...c, [raid]: next, updated_at: new Date().toISOString() }
                : c,
            ),
          }
        : prev,
    );
    return saveCharacter(
      {
        id: char.id ?? null,
        name: char.name,
        class: char.class,
        main: char.main,
        gs: char.gs,
        icc: raid === "icc" ? next : !!char.icc,
        rs: raid === "rs" ? next : !!char.rs,
      },
      `${char.name}: ${raid.toUpperCase()} ${next ? "marcada" : "desmarcada"}`,
    );
  };

  const deleteCharacter = async (char: FullGearedCharacter) => {
    const ok = await confirmDialog({
      title: `¿Quitar a ${char.name} de Full Gear?`,
      description: "Volverá a competir por el botín de todas las raids.",
      confirmLabel: "Quitar",
      destructive: true,
    });
    if (!ok || !char.id) return;
    try {
      await adminJson(`/api/full-geared?id=${char.id}`, { method: "DELETE" });
      onStatus({ type: "success", message: `${char.name} quitado de Full Gear` });
      await adminJson("/api/admin/overview?fresh=1").catch(() => null);
      refresh();
    } catch (error) {
      fail(error, "Error al eliminar");
    }
  };

  return {
    characters: query.data?.data ?? [],
    isLoading: query.isLoading,
    isSaving,
    saveCharacter,
    toggleRaid,
    deleteCharacter,
  };
}
